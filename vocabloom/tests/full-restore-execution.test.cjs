'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../unified-progress.js'),'utf8');
const decks=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../study-decks.json'),'utf8')).decks;
function extract(a,b){const i=src.indexOf(a),j=src.indexOf(b,i+a.length);assert.ok(i>=0&&j>i);return src.slice(i,j);}
const restore=extract('async function cFullRestore(file){','async function cForgetKey(){');
const valid=()=>{const subjects={};for(const d of decks){subjects['study-'+d.key]={ans:{},ats:{}};subjects[d.markKey+'-srs']={s:{},m:{day:0,newDone:0}};}return {type:'vocabloom-unified-study-backup',version:1,deviceId:'another-device',vocabloom:{progress:{},days:{},custom:[],settings:{}},subjects,deviceDays:{'2026-11-12':{answered:9}},studyDays:{'2026-11-12':{answered:5}}};};
async function simulate(payload,{confirm=true,failAt=null,busy=false,busyDuringRead=false,fileSize=1000,rawText=null}={}){
 const store=new Map([['study-eng','ORIGINAL_ENG'],['vocabloom_mvp_v1','ORIGINAL_VOCAB']]);
 const original=[...store.entries()],calls={confirm:0,writes:0,network:0,notice:[],render:0};
 const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem(k,v){calls.writes++;if(calls.writes===failAt)throw Error('Quota exceeded');store.set(k,v)},removeItem:k=>store.delete(k)};
 const context={CLOUD:{busy,studyMergedDays:null,remoteStatus:''},CLOCAL:{device:'local-device',days:{old:1},studyDays:{old:2}},USTATE:{decks},STORAGE_KEY:'vocabloom_mvp_v1',CLOUD_LOCAL_DAYS:'local-days',CLOUD_STUDY_DAYS:'study-days',data:{original:true},window:{confirm:()=>{calls.confirm++;return confirm}},localStorage,cSafeGet:k=>localStorage.getItem(k),cSafeSet(k,v){try{localStorage.setItem(k,v);return true}catch{return false}},cCloudNotice:(msg,error)=>calls.notice.push({msg,error}),render:()=>calls.render++,structuredClone,fetch:()=>{calls.network++;throw Error('Unexpected network')}};
 const fn=new Function('ctx','file',`with(ctx){${restore};return cFullRestore(file)}`);
 await fn(context,{size:fileSize,text:async()=>{if(busyDuringRead)context.CLOUD.busy=true;return rawText===null?JSON.stringify(payload):rawText}});
 return {calls,store:Object.fromEntries(store),original:Object.fromEntries(original),data:context.data,days:context.CLOCAL.days};
}
test('Full restore refuses incomplete five-deck backup before prompt and any write',async()=>{
 const p=valid();delete p.subjects['study-zh'];
 const r=await simulate(p);assert.equal(r.calls.confirm,0);assert.equal(r.calls.writes,0);assert.deepEqual(r.store,r.original);assert.equal(r.calls.network,0);
});
test('Full restore cancelled by user leaves all local records intact',async()=>{
 const r=await simulate(valid(),{confirm:false});assert.equal(r.calls.confirm,1);assert.equal(r.calls.writes,0);assert.deepEqual(r.store,r.original);
});
test('Full restore successful on disposable mock store only; cross-device daily counters excluded',async()=>{
 const r=await simulate(valid());assert.equal(r.calls.confirm,1);assert.equal(r.calls.network,0);assert.equal(r.calls.render,1);
 assert.deepEqual(JSON.parse(r.store['local-days']),{});assert.deepEqual(JSON.parse(r.store['study-days']),{});
 assert.ok(r.store['study-acc']);assert.ok(r.store['zh-vocab-v1-srs']);assert.equal(r.data.original,undefined);
});
test('Storage quota failure rolls back all preexisting mock records',async()=>{
 const r=await simulate(valid(),{failAt:4});assert.equal(r.calls.confirm,1);assert.deepEqual(r.store,r.original);
 assert.deepEqual(r.data,{original:true});assert.equal(r.calls.network,0);assert.ok(r.calls.notice.some(x=>x.error));
});
test('Busy cloud sync blocks restore before reading or writing',async()=>{
 const r=await simulate(valid(),{busy:true});assert.equal(r.calls.confirm,0);assert.equal(r.calls.writes,0);assert.equal(r.calls.network,0);
});

test('Malformed top-level backup object types are rejected without writing',async()=>{
 for(const mutate of [
  p=>{p.vocabloom.progress=[]},
  p=>{p.vocabloom.days='invalid'},
  p=>{p.vocabloom.settings=17},
  p=>{p.subjects=[]}
 ]){
  const p=valid();mutate(p);const r=await simulate(p);
  assert.equal(r.calls.confirm,0);assert.equal(r.calls.writes,0);assert.deepEqual(r.store,r.original);
 }
});
test('Cloud sync starting during asynchronous backup read prevents restore',async()=>{
 const r=await simulate(valid(),{busyDuringRead:true});
 assert.equal(r.calls.confirm,0);assert.equal(r.calls.writes,0);assert.deepEqual(r.store,r.original);
 assert.ok(r.calls.notice.some(x=>x.error));
});

test('Same-device daily counters reject arrays, null and scalar values before confirmation',async()=>{
 for(const key of ['deviceDays','studyDays']){
  for(const value of [[],null,17,'invalid']){
   const p=valid();p.deviceId='local-device';p[key]=value;
   const r=await simulate(p);
   assert.equal(r.calls.confirm,0,key+' must fail before confirmation');
   assert.equal(r.calls.writes,0,key+' must not write');
   assert.deepEqual(r.store,r.original);
  }
 }
});
test('Cross-device daily counters are ignored even when source contains malformed values',async()=>{
 const p=valid();p.deviceDays=[];p.studyDays='invalid';
 const r=await simulate(p);
 assert.equal(r.calls.confirm,1);
 assert.deepEqual(JSON.parse(r.store['local-days']),{});
 assert.deepEqual(JSON.parse(r.store['study-days']),{});
});

test('Same-device nested daily rows reject malformed counters and IDs without writes',async()=>{
 for(const key of ['deviceDays','studyDays']){
  for(const row of [[],null,42,{answered:-1},{answered:'3'},{correct:Infinity},{ids:'invalid'},{ids:[3]}]){
   const p=valid();p.deviceId='local-device';p[key]={'2026-11-12':row};
   const r=await simulate(p);
   assert.equal(r.calls.confirm,0,key+' must reject '+JSON.stringify(row));
   assert.equal(r.calls.writes,0);
   assert.deepEqual(r.store,r.original);
  }
 }
});
test('Same-device valid daily rows retain counters and word IDs',async()=>{
 const p=valid();p.deviceId='local-device';
 p.deviceDays={'2026-11-12':{answered:3,correct:2,ids:['w1']}};
 p.studyDays={'2026-11-12':{answered:4,correct:1}};
 const r=await simulate(p);
 assert.equal(r.calls.confirm,1);
 assert.deepEqual(JSON.parse(r.store['local-days']),p.deviceDays);
 assert.deepEqual(JSON.parse(r.store['study-days']),p.studyDays);
});

test('Legacy same-device backups without daily maps restore with empty local counters',async()=>{
 const p=valid();p.deviceId='local-device';delete p.deviceDays;delete p.studyDays;
 const r=await simulate(p);
 assert.equal(r.calls.confirm,1);
 assert.deepEqual(JSON.parse(r.store['local-days']),{});
 assert.deepEqual(JSON.parse(r.store['study-days']),{});
 assert.equal(r.calls.network,0);
});
test('Legacy daily rows without optional counters or IDs remain compatible',async()=>{
 const p=valid();p.deviceId='local-device';
 p.deviceDays={'2026-11-12':{answered:2,correct:1},'2026-11-11':{}};
 p.studyDays={'2026-11-12':{answered:1},'2026-11-11':{}};
 const r=await simulate(p);
 assert.equal(r.calls.confirm,1);
 assert.deepEqual(JSON.parse(r.store['local-days']),p.deviceDays);
 assert.deepEqual(JSON.parse(r.store['study-days']),p.studyDays);
});
test('Malformed daily maps from other devices cannot overwrite local counters',async()=>{
 const p=valid();p.deviceDays={'2026-11-12':{answered:-100,ids:[7]}};
 p.studyDays={'2026-11-12':null};
 const r=await simulate(p);
 assert.equal(r.calls.confirm,1);
 assert.deepEqual(JSON.parse(r.store['local-days']),{});
 assert.deepEqual(JSON.parse(r.store['study-days']),{});
});

test('Oversized backup fails before reading, confirming or writing',async()=>{
 const r=await simulate(valid(),{fileSize:8*1024*1024+1});
 assert.equal(r.calls.confirm,0);assert.equal(r.calls.writes,0);
 assert.deepEqual(r.store,r.original);assert.equal(r.calls.network,0);
 assert.ok(r.calls.notice.some(x=>x.error));
});
test('Invalid JSON backup cannot alter local progress',async()=>{
 const r=await simulate(valid(),{rawText:'{"type":'});
 assert.equal(r.calls.confirm,0);assert.equal(r.calls.writes,0);
 assert.deepEqual(r.store,r.original);assert.equal(r.calls.network,0);
 assert.ok(r.calls.notice.some(x=>x.error));
});
