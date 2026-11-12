'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../unified-progress.js'),'utf8');
function selected(){
 const a=src.indexOf('const CLOUD_MAX_RETRIES=6;');
 const b=src.indexOf('function cCloudDebounce(){',a);
 assert.ok(a>0&&b>a,'CAS routine not found');
 return src.slice(a,b);
}
function fixture({mode='cas',allowLegacy=true,conflicts=0,editDuringWrite=false,serverFailure=0,disableOnApiResolve=false,disableAfterGet=false,disableAfterPut=false}={}){
 const decks=['acc','eco','math','eng','zh'].map(key=>({key}));
 const USTATE={ready:true,decks},CLOUD={busy:false,enabled:true,last:0,pending:false,remoteStatus:'unknown',error:''};
 const ui={page:'home'},updates=new Map(),remote=new Map(),requests=[],settings=new Map();
 const makeState=()=>({study:{ans:{},ats:{},known:[],rst:0},srs:{s:{},m:{day:0,newDone:0}}});
 const clone=x=>JSON.parse(JSON.stringify(x));
 for(const d of decks){
  updates.set(d.key,makeState());
  updates.get(d.key).srs.s['local-'+d.key]={ts:20,due:1000};
  remote.set(d.key,{revision:0,data:makeState()});
 }
 let confirmCount=0,debounceCount=0,notice='',remaining=conflicts,edited=false;
 const context={
  USTATE,CLOUD,ui,
  CLOUD_AUTO:'vocabloom-auto-sync-v1',CLOUD_LAST:'vocabloom-last-sync-v1',CLOUD_PREFIX:'vb/v1/',
  TextEncoder,cCloudKey:()=> 'TEST_KEY',
  cSafeSet:(key,value)=>{settings.set(key,value);return true},
  cApiUrl:async()=>{if(disableOnApiResolve)CLOUD.enabled=false;return 'https://fake-staging.invalid';},
  window:{confirm:()=>{confirmCount++;return allowLegacy}},
  render:()=>{},cCloudNotice:(message,error)=>{notice=message;CLOUD.error=error?message:''},
  cCloudDebounce:()=>{debounceCount++},
  cLocalSubject:d=>clone(updates.get(d.key)),
  cShadowFromLocal:s=>{s['vb/v1/word/fixture']={kind:'word',ts:1,value:{seen:true}}},
  cMergeState:(a,b)=>({
   study:{...b.study,...a.study,ans:{...b.study.ans,...a.study.ans},ats:{...b.study.ats,...a.study.ats}},
   srs:{s:{...b.srs.s,...a.srs.s},m:a.srs.m}
  }),
  cApplySubject:(d,s)=>{updates.set(d.key,clone(s))},
  fetch:async(url,opts={})=>{
   const subject=url.split('/progress/')[1],method=opts.method||'GET';
   requests.push({subject,method,headers:opts.headers||{},body:opts.body});
   if(!remote.has(subject))return {ok:false,status:404};
   const record=remote.get(subject);
   if(method==='GET'){
    if(disableAfterGet)CLOUD.enabled=false;
    return {ok:true,status:200,headers:{get:key=>{
     const name=key.toLowerCase();
     if(name==='x-sync-revision')
      return mode==='weak'?'"'+record.revision+'"':mode==='broken-custom'?'invalid':null;
     if(name==='etag')
      return mode==='legacy'?null:mode==='weak'||mode==='weak-only'?'W/"'+record.revision+'"':'"'+record.revision+'"';
     return null;
    }},json:async()=>clone(record.data)};
   }
   if(serverFailure)return {ok:false,status:serverFailure};
   if(mode!=='legacy'){
    if(remaining>0){
     remaining--;
     record.revision++;
     record.data.srs.s['external-'+subject]={ts:100,due:3000};
     return {ok:false,status:409};
    }
    if(opts.headers['If-Match']!=='"'+record.revision+'"')return {ok:false,status:409};
   }else if(opts.headers['If-Match'])throw Error('Old backend must not receive If-Match');
   record.data=JSON.parse(opts.body);record.revision++;
   if(disableAfterPut)CLOUD.enabled=false;
   if(editDuringWrite&&!edited&&subject==='acc'){
    edited=true;
    updates.get(subject).srs.s['during-write']={ts:99,due:3000};
   }
   return {ok:true,status:200};
  }
 };
 vm.createContext(context);
 new vm.Script(selected()+'\nthis.sync=cCloudSync;').runInContext(context);
 return {run:manual=>context.sync(manual),CLOUD,remote,requests,settings,updates,
  status:()=>notice,confirmations:()=>confirmCount,debounces:()=>debounceCount};
}
test('CAS sends version headers for five subjects and syncs English shadows',async()=>{
 const f=fixture();await f.run(false);
 assert.equal(f.CLOUD.remoteStatus,'saved',f.status());
 assert.equal(f.requests.filter(x=>x.method==='GET').length,5);
 assert.equal(f.requests.filter(x=>x.method==='PUT').length,5);
 assert.ok(f.requests.filter(x=>x.method==='PUT').every(x=>x.headers['If-Match']==='"0"'));
 assert.equal(f.remote.get('eng').data.srs.s['vb/v1/word/fixture'].kind,'word');
});
test('409 revision conflict retries and keeps both clients cards',async()=>{
 const f=fixture({conflicts:1});await f.run(false);
 assert.equal(f.CLOUD.remoteStatus,'saved',f.status());
 assert.ok(f.requests.filter(x=>x.subject==='acc'&&x.method==='PUT').length>=2);
 assert.ok(f.remote.get('acc').data.srs.s['local-acc']);
 assert.ok(f.remote.get('acc').data.srs.s['external-acc']);
});
test('Local answer during PUT triggers another safe CAS round',async()=>{
 const f=fixture({editDuringWrite:true});await f.run(false);
 assert.equal(f.CLOUD.remoteStatus,'saved',f.status());
 assert.ok(f.remote.get('acc').data.srs.s['during-write']);
 assert.ok(f.updates.get('acc').srs.s['during-write']);
});
test('Auto Sync shuts off for legacy worker without sending PUT',async()=>{
 const f=fixture({mode:'legacy'});await f.run(false);
 assert.equal(f.CLOUD.remoteStatus,'error');
 assert.equal(f.CLOUD.enabled,false);
 assert.equal(f.settings.get('vocabloom-auto-sync-v1'),'0');
 assert.equal(f.requests.filter(x=>x.method==='PUT').length,0);
 assert.ok(f.updates.get('acc').srs.s['local-acc']);
});
test('Canceling manual legacy consent sends no PUT',async()=>{
 const f=fixture({mode:'legacy',allowLegacy:false});await f.run(true);
 assert.equal(f.confirmations(),1);
 assert.equal(f.requests.filter(x=>x.method==='PUT').length,0);
 assert.ok(f.status().includes('ยกเลิก'));
});
test('Manual legacy fallback requires one consent and sends five PUTs',async()=>{
 const f=fixture({mode:'legacy',allowLegacy:true});await f.run(true);
 assert.equal(f.CLOUD.remoteStatus,'saved',f.status());
 assert.equal(f.confirmations(),1);
 assert.equal(f.requests.filter(x=>x.method==='PUT').length,5);
 assert.ok(f.requests.every(x=>!x.headers['If-Match']));
});
test('Server PUT error never overwrites the local card state',async()=>{
 const f=fixture({serverFailure:500}),before=JSON.stringify(f.updates.get('acc'));
 await f.run(true);
 assert.equal(f.CLOUD.remoteStatus,'error');
 assert.equal(JSON.stringify(f.updates.get('acc')),before);
 assert.ok(f.status().includes('500'));
});
test('Six repeated conflict responses fail with local data intact',async()=>{
 const f=fixture({conflicts:10}),before=JSON.stringify(f.updates.get('acc'));
 await f.run(false);
 assert.equal(f.CLOUD.remoteStatus,'error');
 assert.equal(JSON.stringify(f.updates.get('acc')),before);
 assert.equal(f.requests.filter(x=>x.method==='PUT').length,6);
 assert.ok(f.status().includes('6 รอบ'));
});
test('Auto Sync button cannot trigger unsafe manual fallback',()=>{
 const first=src.indexOf("if(el.dataset.action==='cloud-auto')");
 assert.ok(first>=0);
 assert.ok(src.slice(first,first+230).includes('cCloudSync(false)'));
});

test('Cloudflare weak ETag with valid custom revision remains CAS safe for five subjects',async()=>{
 const f=fixture({mode:'weak'});await f.run(false);
 assert.equal(f.CLOUD.remoteStatus,'saved',f.status());
 assert.equal(f.requests.filter(x=>x.method==='PUT').length,5);
 assert.ok(f.requests.filter(x=>x.method==='PUT').every(x=>x.headers['If-Match']==='"0"'));
});
test('Weak-only ETag fails closed before manual PUT, without unsafe fallback',async()=>{
 const f=fixture({mode:'weak-only'});await f.run(true);
 assert.equal(f.CLOUD.remoteStatus,'error');
 assert.equal(f.requests.filter(x=>x.method==='PUT').length,0);
 assert.equal(f.confirmations(),0);
});
test('Malformed custom CAS revision fails closed even if the ETag is strong',async()=>{
 const f=fixture({mode:'broken-custom'});await f.run(true);
 assert.equal(f.CLOUD.remoteStatus,'error');
 assert.equal(f.requests.filter(x=>x.method==='PUT').length,0);
 assert.equal(f.confirmations(),0);
});

test('Background sync rechecks permission after async API resolution disables inherited Auto Sync',async()=>{
 const f=fixture({disableOnApiResolve:true});
 const before=[...f.remote.values()].map(x=>x.revision);
 await f.run(false);
 assert.equal(f.CLOUD.enabled,false);
 assert.equal(f.CLOUD.remoteStatus,'error');
 assert.equal(f.requests.length,0,'Must not send even a credentialed GET after disable');
 assert.deepEqual([...f.remote.values()].map(x=>x.revision),before);
 assert.match(f.status(),/Auto Sync ปิดอยู่/);
});
test('Auto Sync OFF during an in-flight GET blocks all subsequent PUT requests',async()=>{
 const f=fixture({disableAfterGet:true});
 await f.run(false);
 assert.equal(f.CLOUD.remoteStatus,'error');
 assert.equal(f.requests.filter(x=>x.method==='GET').length,1);
 assert.equal(f.requests.filter(x=>x.method==='PUT').length,0);
 assert.ok(f.updates.get('acc').srs.s['local-acc']);
});
test('Auto Sync OFF after an acknowledged PUT stops remaining subject writes',async()=>{
 const f=fixture({disableAfterPut:true});
 await f.run(false);
 assert.equal(f.CLOUD.remoteStatus,'error');
 assert.equal(f.requests.filter(x=>x.method==='PUT').length,1);
 assert.equal(f.remote.get('acc').revision,1);
 assert.equal(f.remote.get('eco').revision,0);
 assert.equal(f.remote.get('zh').revision,0);
 assert.match(f.status(),/1\/5 วิชา/);
});
test('An explicitly requested manual sync is not silently mistaken for background consent',async()=>{
 const f=fixture({disableOnApiResolve:true});
 await f.run(true);
 assert.equal(f.CLOUD.remoteStatus,'saved');
 assert.equal(f.requests.filter(x=>x.method==='PUT').length,5);
});
