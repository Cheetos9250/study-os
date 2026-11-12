import {test} from 'node:test';
import assert from 'node:assert/strict';
import entry,{StudyProgressDO} from './worker.mjs';
import {mergeProgress,syncOneSubject,CloudSyncError} from './client.mjs';

const ORIGIN='https://cheetos9250.github.io';
const STAGING_KEY='TEST_ONLY_LOCAL_NOT_A_REAL_SECRET';
function fixture(){
 const buckets=new Map();
 const objects=new Map();
 let revisionConflicts=0;
 const env={SYNC_KEY:STAGING_KEY,ALLOWED_ORIGIN:ORIGIN,STAGING_ONLY:'true',
  PROGRESS_DO:{
   idFromName:name=>name,
   get(id){
    if(!objects.has(id)){
     const data=new Map();buckets.set(id,data);
     const ctx={storage:{kv:{get:k=>data.get(k),put:(k,v)=>data.set(k,structuredClone(v))}}};
     objects.set(id,new StudyProgressDO(ctx));
    }
    return objects.get(id);
   }
  }
 };
 const url=subject=>'https://study-api-cas-staging-only.local-test.workers.dev/progress/'+subject;
 async function request(method,subject,{body,etag,key=STAGING_KEY,origin=ORIGIN}={}){
  const headers={'X-Sync-Key':key,'Origin':origin};
  if(method==='PUT'){headers['Content-Type']='application/json';if(etag)headers['If-Match']=etag}
  const request=new Request(url(subject),{method,headers,body:body?JSON.stringify(body):undefined});
  const response=await entry.fetch(request,env);
  if(response.status===409)revisionConflicts++;
  return response;
 }
 async function mockFetch(uri,opts={}){
  const req=new Request(uri,{...opts,headers:{...opts.headers,Origin:ORIGIN}});
  const res=await entry.fetch(req,env);
  if(res.status===409)revisionConflicts++;
  return res;
 }
 return {request,mockFetch,env,buckets,objects,getConflicts:()=>revisionConflicts,url};
}
const empty=()=>({study:{ans:{},ats:{},known:[],rst:0},srs:{s:{},m:{day:0,newDone:0}}});

test('Unauthenticated and wrong-origin requests are rejected; preflight is scoped',async()=>{
 const f=fixture();
 const denied=await f.request('GET','acc',{key:'wrong'});
 assert.equal(denied.status,401);
 assert.ok(!(await denied.text()).includes(STAGING_KEY));
 assert.equal((await f.request('GET','acc',{origin:'https://attacker.example'})).status,403);
 const req=new Request(f.url('acc'),{method:'OPTIONS',headers:{Origin:ORIGIN,'Access-Control-Request-Headers':'if-match,x-sync-key'}});
 const opt=await entry.fetch(req,f.env);
 assert.equal(opt.status,204);
 assert.equal(opt.headers.get('Access-Control-Expose-Headers'),'ETag');
 assert.ok(opt.headers.get('Access-Control-Allow-Headers').includes('If-Match'));
 assert.equal((await f.request('GET','random')).status,404);
});

test('Initial GET exposes version 0; unconditioned legacy writes fail closed',async()=>{
 const f=fixture();
 const first=await f.request('GET','acc');
 assert.equal(first.status,200);
 assert.equal(first.headers.get('ETag'),'"0"');
 assert.deepEqual(await first.json(),empty());
 assert.equal((await f.request('PUT','acc',{body:empty()})).status,428);
 assert.equal((await f.request('PUT','acc',{etag:'"0"',body:{invalid:true}})).status,400);
 assert.equal((await f.request('GET','acc')).headers.get('ETag'),'"0"');
});

test('CAS allows only one writer for the same revision; no silent overwrite',async()=>{
 const f=fixture();
 const left=empty();left.srs.s['card-left']={ts:100,due:1000};
 const right=empty();right.srs.s['card-right']={ts:200,due:2000};
 const [a,b]=await Promise.all([
  f.request('PUT','eng',{etag:'"0"',body:left}),
  f.request('PUT','eng',{etag:'"0"',body:right})
 ]);
 assert.deepEqual([a.status,b.status].sort(),[200,409]);
 const now=await f.request('GET','eng');
 assert.equal(now.headers.get('ETag'),'"1"');
 const first=await now.json();
 assert.equal(Object.keys(first.srs.s).length,1);
 const merged=mergeProgress(first,first.srs.s['card-left']?right:left);
 const accepted=await f.request('PUT','eng',{etag:'"1"',body:merged});
 assert.equal(accepted.status,200);
 const outcome=await (await f.request('GET','eng')).json();
 assert.ok(outcome.srs.s['card-left']);
 assert.ok(outcome.srs.s['card-right']);
});

test('100 concurrent A/B client sync rounds preserve both device updates',async()=>{
 const f=fixture();
 let clientA=empty(),clientB=empty();
 const opts=(local,saveLocal)=>({baseUrl:'https://study-api-cas-staging-only.local-test.workers.dev',subject:'eng',syncKey:STAGING_KEY,
  loadLocal:()=>local(),saveLocal,fetchImpl:f.mockFetch,maxAttempts:10});
 for(let i=0;i<100;i++){
  clientA.srs.s['A-'+i]={ts:1000+i,due:2000+i};
  clientB.srs.s['B-'+i]={ts:3000+i,due:4000+i};
  const [a,b]=await Promise.all([
   syncOneSubject(opts(()=>clientA,v=>{clientA=v})),
   syncOneSubject(opts(()=>clientB,v=>{clientB=v}))
  ]);
  assert.ok(a.attempts<=10&&b.attempts<=10);
 }
 const state=await (await f.request('GET','eng')).json();
 assert.equal(Object.keys(state.srs.s).filter(k=>/^A-/.test(k)).length,100);
 assert.equal(Object.keys(state.srs.s).filter(k=>/^B-/.test(k)).length,100);
 assert.ok(Object.keys(clientA.srs.s).length>=199);
 assert.ok(f.getConflicts()>=1,'Test must exercise conflict and retry, not just serial calls');
});

test('Client retains local progress on outage and bounded conflicts',async()=>{
 const f=fixture();
 const local=empty();local.srs.s['my-note']={ts:555,due:999};
 let saved=0;
 const opts={baseUrl:'https://study-api-cas-staging-only.local-test.workers.dev',subject:'math',syncKey:STAGING_KEY,
  loadLocal:()=>local,saveLocal:()=>saved++,
  fetchImpl:async(url,init)=>init.method==='GET'?
     new Response(JSON.stringify(empty()),{status:200,headers:{ETag:'"0"'}}):
     new Response(JSON.stringify({error:'conflict'}),{status:409}),
  maxAttempts:3};
 await assert.rejects(syncOneSubject(opts),e=>e instanceof CloudSyncError&&e.status===409);
 assert.equal(saved,0);
 assert.ok(local.srs.s['my-note']);
 await assert.rejects(syncOneSubject({...opts,fetchImpl:async()=>new Response('down',{status:500})}),e=>e.status===500);
 assert.equal(saved,0);
 assert.equal((await f.request('GET','math')).headers.get('ETag'),'"0"');
});

test('Revisions persist across Durable Object restart with shared storage',async()=>{
 const f=fixture();
 await f.request('PUT','zh',{etag:'"0"',body:empty()});
 const key='study-os-staging:zh';
 const stored=f.buckets.get(key),ctx={storage:{kv:{get:k=>stored.get(k),put:(k,v)=>stored.set(k,structuredClone(v))}}};
 const restarted=new StudyProgressDO(ctx);
 const response=await restarted.fetch(new Request(f.url('zh'),{method:'GET'}));
 assert.equal(response.headers.get('ETag'),'"1"');
});

test('Staging deployment guard blocks wrong hostname and missing explicit flag',async()=>{
 const f=fixture();
 const valid=await f.request('GET','eng');
 assert.equal(valid.status,200);
 const withoutFlag=await entry.fetch(new Request(f.url('eng'),{headers:{'X-Sync-Key':STAGING_KEY}}),
  {...f.env,STAGING_ONLY:'false'});
 assert.equal(withoutFlag.status,503);
 const nonStaging=await entry.fetch(new Request('https://study-api.kasidit09022550.workers.dev/progress/eng',
  {headers:{'X-Sync-Key':STAGING_KEY}}),f.env);
 assert.equal(nonStaging.status,503);
});

test('Authenticated health marker identifies staging protocol, without data writes',async()=>{
 const f=fixture();
 const url='https://study-api-cas-staging-only.local-test.workers.dev/__staging/health';
 const withoutKey=await entry.fetch(new Request(url),f.env);
 assert.equal(withoutKey.status,401);
 const withKey=await entry.fetch(new Request(url,{headers:{'X-Sync-Key':STAGING_KEY,Origin:ORIGIN}}),f.env);
 assert.equal(withKey.status,200);
 assert.equal(withKey.headers.get('Access-Control-Allow-Origin'),ORIGIN);
 assert.deepEqual(await withKey.json(),{
  staging:true,protocol:'vocabloom-cas-staging-v1',subjects:['acc','eco','math','eng','zh']
 });
 assert.equal(f.buckets.size,1,'Only preceding GET initializes a bucket; health route never creates a DO');
});
