import {test} from 'node:test';
import assert from 'node:assert/strict';
import {syncOneSubject,CloudSyncError} from './client.mjs';

const state=()=>({study:{ans:{},ats:{},known:[],rst:0},srs:{s:{},m:{day:0,newDone:0}}});
function fakeServer(onWrite){
 let value=state(),revision=0,puts=0;
 return {
  async fetch(url,options){
   if(options.method==='GET')return new Response(JSON.stringify(value),{status:200,headers:{ETag:'"'+revision+'"'}});
   const requested=options.headers['If-Match'];
   if(requested!=='"'+revision+'"')return new Response('{}',{status:409});
   puts++;
   value=structuredClone(JSON.parse(options.body));revision++;
   if(onWrite)await onWrite(puts);
   return new Response(JSON.stringify({ok:true}),{status:200,headers:{ETag:'"'+revision+'"'}});
  },
  snapshot(){return structuredClone(value)},
  writes(){return puts}
 };
}
const options=(server,load,save,maxAttempts=5)=>({
 baseUrl:'https://staging.example',subject:'eng',syncKey:'TEST_ONLY',
 loadLocal:load,saveLocal:save,fetchImpl:server.fetch,maxAttempts
});

test('An answer made during successful PUT survives locally and on the server',async()=>{
 let local=state();local.srs.s.initial={ts:1,due:100};
 let saves=0;
 const server=fakeServer(async write=>{
  if(write===1)local.srs.s['answered-in-flight']={ts:2,due:200};
 });
 const result=await syncOneSubject(options(server,()=>local,v=>{local=v;saves++}));
 assert.equal(result.attempts,2);
 assert.equal(server.writes(),2);
 assert.equal(saves,1);
 assert.ok(local.srs.s.initial);
 assert.ok(local.srs.s['answered-in-flight']);
 assert.deepEqual(server.snapshot().srs.s,local.srs.s);
});

test('Continuous in-flight edits exhaust retries without overwriting local answers',async()=>{
 let local=state(),saves=0;
 const server=fakeServer(async write=>{
  local.srs.s['new-'+write]={ts:write,due:write+100};
 });
 await assert.rejects(
  syncOneSubject(options(server,()=>local,()=>{saves++},3)),
  e=>e instanceof CloudSyncError&&e.status===409
 );
 assert.equal(server.writes(),3);
 assert.equal(saves,0);
 assert.equal(Object.keys(local.srs.s).length,3);
});

test('Network errors leave local data unchanged',async()=>{
 let local=state(),saves=0;
 local.srs.s.local={ts:7};
 await assert.rejects(
  syncOneSubject({...options(fakeServer(),()=>local,()=>{saves++}),
   fetchImpl:async()=>new Response('failure',{status:500})}),
  e=>e instanceof CloudSyncError&&e.status===500
 );
 assert.equal(saves,0);
 assert.ok(local.srs.s.local);
});
