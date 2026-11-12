import {test} from 'node:test';
import assert from 'node:assert/strict';
import entry,{StudyProgressDO} from './worker.mjs';
import {smokeStaging} from './smoke-staging.mjs';

const HOST='https://study-api-cas-staging-only.test-run.workers.dev';
const ORIGIN='https://cheetos9250.github.io';
const KEY='FAKE_STAGING_SYNC_KEY_TESTS_ONLY';
const PROBE='abcdef0123456789abcdef01';
function fixture(){
 const buckets=new Map(),objects=new Map(),counts={GET:0,PUT:0,OPTIONS:0};
 const env={
  STAGING_ONLY:'true',SYNC_KEY:KEY,ALLOWED_ORIGIN:ORIGIN,
  PROGRESS_DO:{
   idFromName:name=>name,
   get(id){
    if(!objects.has(id)){
     const store=new Map();buckets.set(id,store);
     objects.set(id,new StudyProgressDO({storage:{kv:{
      get:key=>store.get(key),put:(key,value)=>store.set(key,structuredClone(value))
     }}}));
    }
    return objects.get(id);
   }
  }
 };
 async function fetchImpl(uri,opts={}){
  counts[opts.method||'GET']++;
  const req=new Request(uri,opts);
  return entry.fetch(req,env);
 }
 return {buckets,counts,env,fetchImpl};
}
test('Staging smoke validates guard and concurrency without modifying any of the five subject stores',async()=>{
 const f=fixture();
 const result=await smokeStaging({baseUrl:HOST,key:KEY,fetchImpl:f.fetchImpl,probeId:PROBE});
 assert.equal(result.status,'PASS');
 assert.deepEqual(result.subjectsReadOnly,['acc','eco','math','eng','zh']);
 assert.equal(f.counts.PUT,4,'two competing writes + one retry + one rejected legacy PUT');
 for(const subject of ['acc','eco','math','eng','zh']){
  assert.equal(f.buckets.get('study-os-staging:'+subject)?.has('record'),false,
   subject+' must remain read-only');
 }
 const probe=f.buckets.get('study-os-staging:probe:'+PROBE)?.get('record');
 assert.equal(probe?.revision,2);
 assert.deepEqual(Object.keys(probe.value.srs.s).sort(),['probe-device-a','probe-device-b']);
});
test('Refuses unsafe or production URL before performing any request',async()=>{
 const f=fixture();
 for(const url of ['https://study-api.kasidit09022550.workers.dev',
  'https://study-api-cas-staging-only.example.com','http://study-api-cas-staging-only.test-run.workers.dev']){
  await assert.rejects(smokeStaging({baseUrl:url,key:KEY,fetchImpl:f.fetchImpl,probeId:PROBE}));
 }
 assert.equal(f.counts.GET,0);
 assert.equal(f.counts.PUT,0);
});
test('Wrong credentials, missing staging guard, or invalid identity abort before any writes',async()=>{
 for(const scenario of ['wrong-key','missing-guard','wrong-marker']){
  const f=fixture();
  if(scenario==='missing-guard')f.env.STAGING_ONLY='false';
  const fetchImpl=async(uri,opts={})=>{
   if(scenario==='wrong-marker'&&new URL(uri).pathname==='/__staging/health')
    return new Response(JSON.stringify({staging:false,protocol:'not-staging'}),{status:200});
   return f.fetchImpl(uri,opts);
  };
  await assert.rejects(smokeStaging({baseUrl:HOST,key:scenario==='wrong-key'?'WRONG_TEST_KEY':KEY,
   fetchImpl,probeId:PROBE}),/staging|HTTP 401/i);
  assert.equal(f.counts.PUT,0);
  assert.equal(f.buckets.size,0);
 }
});
test('Never overwrites existing probe data',async()=>{
 const f=fixture();
 const target=HOST+'/__staging/probe/'+PROBE;
 const initial=await f.fetchImpl(target,{method:'GET',headers:{'X-Sync-Key':KEY}});
 assert.equal(initial.headers.get('ETag'),'"0"');
 const content={study:{ans:{},ats:{},known:[],rst:0},srs:{s:{existing:{ts:3}},m:{day:0,newDone:0}}};
 const put=await f.fetchImpl(target,{method:'PUT',headers:{
  'X-Sync-Key':KEY,'Content-Type':'application/json','If-Match':'"0"'
 },body:JSON.stringify(content)});
 assert.equal(put.status,200);
 const before=f.counts.PUT;
 await assert.rejects(smokeStaging({baseUrl:HOST,key:KEY,fetchImpl:f.fetchImpl,probeId:PROBE}),
  /probe unexpectedly exists/);
 assert.equal(f.counts.PUT,before);
 assert.deepEqual(f.buckets.get('study-os-staging:probe:'+PROBE).get('record').value,content);
});
