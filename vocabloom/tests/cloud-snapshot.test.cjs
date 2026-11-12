'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const code=fs.readFileSync(path.resolve(__dirname,'../unified-progress.js'),'utf8');
function extract(){
 const a=code.indexOf('async function cRemoteSnapshot(){');
 const b=code.indexOf('function cFullBackup(){',a);
 assert.ok(a>=0&&b>a,'Remote snapshot function missing');
 return code.slice(a,b);
}
function fixture({allow=true,missingKey=false,busy=false,unauthorized=false,invalid=false,tooLarge=false}={}){
 const requests=[],all=['acc','eco','math','eng','zh'],CLOUD={busy},USTATE={ready:true,decks:all.map(key=>({key}))};
 let message='',download=null,renderCount=0,clicked=false,confirmCount=0;
 const source={
  CLOUD,USTATE,TextEncoder,Blob,
  ui:{page:'settings'},window:{confirm:()=>{confirmCount++;return allow}},
  cCloudKey:()=>missingKey?'':'TEST_SECRET_0123',
  cApiUrl:async()=> 'https://fake-worker.invalid',
  cCloudRevision:response=>response.headers.get('ETag')||'',
  cDate:()=> '2026-11-12',
  cCloudNotice:(text)=>{message=text},
  setTimeout:()=>0,
  URL:{createObjectURL:blob=>{download=blob;return 'blob:mock'},revokeObjectURL:()=>{}},
  document:{
   createElement:tag=>{
    assert.equal(tag,'a');
    return {href:'',download:'',click(){clicked=true},remove(){}};
   },
   body:{append(){}}
  },
  render:()=>{renderCount++},
  fetch:async(url,opts={})=>{
   requests.push({url,opts});
   const subject=url.split('/progress/')[1];
   if(!all.includes(subject))return {ok:false,status:404};
   if(unauthorized&&subject==='acc')return {ok:false,status:401};
   if(invalid&&subject==='eco')return {ok:true,status:200,headers:{get:()=>null},text:async()=>'{bad json'};
   if(tooLarge&&subject==='eng')return {ok:true,status:200,headers:{get:()=>null},text:async()=>JSON.stringify({huge:'x'.repeat(500001)})};
   const body=JSON.stringify({study:{ans:{[subject]:1},ats:{},known:[]},srs:{s:{},m:{day:0,newDone:0}}});
   return {ok:true,status:200,headers:{get:()=>'"7"'},text:async()=>body};
  }
 };
 vm.createContext(source);
 new vm.Script(extract()+'\nthis.runSnapshot=cRemoteSnapshot;').runInContext(source);
 return {run:()=>source.runSnapshot(),CLOUD,requests,snapshot:()=>download,clicked:()=>clicked,message:()=>message,confirmCount:()=>confirmCount,rendered:()=>renderCount};
}
test('Read-only Cloud snapshot GETs all five subjects and never sends PUT',async()=>{
 const f=fixture();await f.run();
 assert.equal(f.clicked(),true);
 assert.equal(f.requests.length,5);
 assert.ok(f.requests.every(r=>!r.opts.method||r.opts.method==='GET'));
 const json=JSON.parse(await f.snapshot().text());
 assert.equal(json.format,'vocabloom-cloud-readonly-snapshot');
 assert.deepEqual(Object.keys(json.subjects),['acc','eco','math','eng','zh']);
 assert.ok(Object.values(json.revisions).every(x=>x==='"7"'));
 assert.ok(!(await f.snapshot().text()).includes('TEST_SECRET_0123'));
 assert.ok(f.message().includes('5 GET / 0 PUT'));
 assert.equal(f.CLOUD.busy,false);
});
test('Canceling read-only snapshot makes no requests or file',async()=>{
 const f=fixture({allow:false});await f.run();
 assert.equal(f.confirmCount(),1);
 assert.equal(f.requests.length,0);
 assert.equal(f.clicked(),false);
});
test('Snapshot without key cannot read Worker',async()=>{
 const f=fixture({missingKey:true});await f.run();
 assert.equal(f.requests.length,0);
 assert.equal(f.clicked(),false);
});
test('401 aborts without file download',async()=>{
 const f=fixture({unauthorized:true});await f.run();
 assert.equal(f.clicked(),false);
 assert.equal(f.requests.length,1);
 assert.equal(f.CLOUD.busy,false);
});
test('Malformed response in one subject aborts whole snapshot',async()=>{
 const f=fixture({invalid:true});await f.run();
 assert.equal(f.clicked(),false);
 assert.equal(f.requests.length,2);
});
test('Oversized server response does not create a snapshot file',async()=>{
 const f=fixture({tooLarge:true});await f.run();
 assert.equal(f.clicked(),false);
 assert.equal(f.requests.length,4);
});
test('Busy in-progress sync cannot be interrupted by snapshot',async()=>{
 const f=fixture({busy:true});await f.run();
 assert.equal(f.requests.length,0);
 assert.equal(f.clicked(),false);
 assert.equal(f.CLOUD.busy,true);
});
