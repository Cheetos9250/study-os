'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const SOURCE=readFileSync(join(__dirname,'..','unified-progress.js'),'utf8');
const ORIGINAL='https://study-api.kasidit09022550.workers.dev';
const FUTURE='https://vocabloom-progress-cas-prod.example.invalid';
const ANOTHER='https://vocabloom-progress-cas-v2.example.invalid';
const OLD='OLD_CONTENT_KEY_FAKE';
const NEW='NEW_PROGRESS_KEY_FAKE';
const KEY='vocabloom-auto-sync-v1';
const CONSENT='vocabloom-auto-sync-endpoint-v1';
const PROGRESS_KEY='study-sync-progress-key-v1';
const BASE={
 'study-sync-key':OLD,
 [PROGRESS_KEY]:NEW,
 [KEY]:'1'
};
const snippet=(start,end)=>{
 const a=SOURCE.indexOf(start),b=SOURCE.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,start+' missing');
 return SOURCE.slice(a,b);
};
const API_SNIPPET=snippet('async function cApiUrl(){','/* ETag/If-Match');
const TOGGLE_SNIPPET=snippet('async function cToggleAuto(){','function cPanelAction(el){');
function session({storage=new Map(Object.entries(BASE)),destination=FUTURE,
 enabled=storage.get(KEY)==='1',confirm=true,storeFail=null}={}){
 const CLOUD={api:'',progressSplit:false,enabled,autoBusy:false};
 const calls={fetch:[],confirm:0,render:0,sync:[],notices:[]};
 const ctx={
  CLOUD,CLOUD_KEY:'study-sync-key',CLOUD_PROGRESS_KEY:PROGRESS_KEY,
  CLOUD_AUTO:KEY,CLOUD_AUTO_ENDPOINT:CONSENT,
  cSafeGet:k=>storage.get(k)||null,
  cSafeSet:(k,v)=>{
   if(storeFail===k)return false;
   storage.set(k,String(v));return true;
  },
  fetch:async url=>{
   calls.fetch.push(url);
   return {ok:true,json:async()=>({api:ORIGINAL,...(destination?{progress_api:destination}:{})})};
  },
  cCloudNotice:(s,err)=>calls.notices.push({text:s,error:err}),
  cCloudSync:manual=>calls.sync.push(manual),
  window:{confirm:()=>{calls.confirm++;return confirm}},
  render:()=>{calls.render++;},
  clearTimeout:()=>{},
  Error
 };
 vm.runInNewContext(API_SNIPPET+'\n'+TOGGLE_SNIPPET+
  '\nthis.ops={url:cApiUrl,key:cCloudKey,toggle:cToggleAuto};',ctx,{timeout:1000});
 return {CLOUD,calls,ops:ctx.ops,storage};
}
test('Previously enabled legacy Auto Sync must not silently carry into a new progress endpoint',async()=>{
 const f=session();
 assert.equal(f.CLOUD.enabled,true);
 assert.equal(await f.ops.url(),FUTURE);
 assert.equal(f.CLOUD.enabled,false);
 assert.equal(f.storage.get(KEY),'0');
 assert.equal(f.storage.get(CONSENT),undefined);
 assert.equal(f.calls.sync.length,0);
 assert.equal(f.ops.key(),NEW);
 assert.equal(f.storage.get('study-sync-key'),OLD);
});
test('Explicit opt-in binds future auto-sync to exactly one hostname and survives a reload',async()=>{
 const storage=new Map(Object.entries(BASE));
 const f=session({storage});
 await f.ops.url();
 await f.ops.toggle();
 assert.equal(f.calls.confirm,1);
 assert.equal(f.CLOUD.enabled,true);
 assert.equal(storage.get(CONSENT),FUTURE);
 assert.equal(storage.get(KEY),'1');
 assert.deepEqual(f.calls.sync,[false]);
 const reloaded=session({storage});
 assert.equal(reloaded.CLOUD.enabled,true);
 await reloaded.ops.url();
 assert.equal(reloaded.CLOUD.enabled,true);
 assert.equal(storage.get(KEY),'1');
 assert.equal(reloaded.calls.confirm,0);
 assert.equal(reloaded.calls.sync.length,0);
});
test('Different future endpoint never inherits a previous explicit endpoint opt-in',async()=>{
 const storage=new Map(Object.entries({...BASE,[CONSENT]:FUTURE}));
 const f=session({storage,destination:ANOTHER});
 assert.equal(await f.ops.url(),ANOTHER);
 assert.equal(f.CLOUD.enabled,false);
 assert.equal(storage.get(KEY),'0');
 assert.equal(storage.get(CONSENT),FUTURE);
 assert.equal(f.calls.sync.length,0);
});
test('Missing new progress key refuses Auto Sync enablement even with old content credential',async()=>{
 const storage=new Map(Object.entries({'study-sync-key':OLD,[KEY]:'0'}));
 const f=session({storage,enabled:false});
 await f.ops.toggle();
 assert.equal(f.CLOUD.enabled,false);
 assert.equal(storage.get(KEY),'0');
 assert.equal(storage.get(CONSENT),undefined);
 assert.equal(f.calls.confirm,0);
 assert.equal(f.calls.sync.length,0);
 assert.match(f.calls.notices[0].text,/Progress Worker ใหม่/);
});
test('Cancelled explicit consent cannot enable progress Auto Sync',async()=>{
 const storage=new Map(Object.entries({...BASE,[KEY]:'0'}));
 const f=session({storage,enabled:false,confirm:false});
 await f.ops.toggle();
 assert.equal(f.calls.confirm,1);
 assert.equal(f.CLOUD.enabled,false);
 assert.equal(storage.get(CONSENT),undefined);
 assert.equal(storage.get(KEY),'0');
 assert.equal(f.calls.sync.length,0);
});
test('Storage failure to persist endpoint consent or auto preference fails closed',async()=>{
 for(const failKey of [CONSENT,KEY]){
  const storage=new Map(Object.entries({...BASE,[KEY]:'0'}));
  const f=session({storage,enabled:false,storeFail:failKey});
  await f.ops.toggle();
  assert.equal(f.CLOUD.enabled,false);
  assert.equal(storage.get(KEY),'0');
  assert.equal(f.calls.sync.length,0);
  assert.match(f.calls.notices.at(-1).text,/ไม่สามารถบันทึก/);
 }
});
test('Turning off explicitly enabled Auto Sync disables and preserves the endpoint binding',async()=>{
 const storage=new Map(Object.entries({...BASE,[CONSENT]:FUTURE}));
 const f=session({storage});
 await f.ops.url();
 assert.equal(f.CLOUD.enabled,true);
 await f.ops.toggle();
 assert.equal(f.CLOUD.enabled,false);
 assert.equal(storage.get(KEY),'0');
 assert.equal(storage.get(CONSENT),FUTURE);
 assert.equal(f.calls.sync.length,0);
});
test('Current original Worker behavior remains the same when progress_api is missing',async()=>{
 const storage=new Map(Object.entries({...BASE,[KEY]:'0'}));
 const f=session({storage,destination:null,enabled:false});
 assert.equal(await f.ops.url(),ORIGINAL);
 assert.equal(f.CLOUD.progressSplit,false);
 await f.ops.toggle();
 assert.equal(f.calls.confirm,0);
 assert.equal(f.CLOUD.enabled,true);
 assert.equal(storage.get(KEY),'1');
 assert.equal(storage.get(CONSENT),undefined);
 assert.deepEqual(f.calls.sync,[false]);
 assert.equal(f.ops.key(),OLD);
});
test('Reentrant opt-in clicks do not start multiple writes',async()=>{
 const storage=new Map(Object.entries({...BASE,[KEY]:'0'}));
 const f=session({storage,enabled:false});
 f.CLOUD.autoBusy=true;
 await f.ops.toggle();
 assert.equal(f.calls.confirm,0);
 assert.equal(f.calls.fetch.length,0);
 assert.equal(f.calls.sync.length,0);
});
