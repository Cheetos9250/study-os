import {test} from 'node:test';
import assert from 'node:assert/strict';
import {writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import worker,{StudyProgressDO} from './worker.mjs';
import {fingerprint,inspectSnapshot,ensureStagingUrl,importIntoStaging} from './import-staging.mjs';

const KEY='TEST_STAGING_ONLY_NOT_A_REAL_SECRET';
const SUBJECTS=['acc','eco','math','eng','zh'];
const blank=()=>({study:{ans:{},ats:{},known:[],rst:0},srs:{s:{},m:{day:0,newDone:0}}});
function snapshot(){
 const subjects=Object.fromEntries(SUBJECTS.map((d,i)=>{
  const s=blank();
  s.study.ans['quiz-'+d]=i;
  s.study.ats['quiz-'+d]=1000+i;
  s.srs.s['legacy-card-'+d]={ts:1000+i,due:3000+i,ivl:i+1,st:'rev'};
  if(d==='eng')s.srs.s['vb/v1/day/deviceA/2026-11-12']={kind:'day',ts:123,value:{answered:2,correct:1,ids:['test']}};
  return [d,s];
 }));
 return {format:'vocabloom-cloud-readonly-snapshot',version:1,
  capturedAt:'2026-11-12T09:00:00.000Z',revisions:{},subjects};
}
function fixture(){
 const buckets=new Map(),stubs=new Map(),requests=[];
 const env={
  SYNC_KEY:KEY,ALLOWED_ORIGIN:'https://cheetos9250.github.io',STAGING_ONLY:'true',
  PROGRESS_DO:{
   idFromName:name=>name,
   get(id){
    if(!stubs.has(id)){
     const data=new Map();buckets.set(id,data);
     const ctx={storage:{kv:{
      get:key=>data.get(key),put:(key,value)=>data.set(key,structuredClone(value))
     }}};
     stubs.set(id,new StudyProgressDO(ctx));
    }
    return stubs.get(id);
   }
  }
 };
 const fetchImpl=async(url,opts={})=>{
  requests.push({url:String(url),method:opts.method||'GET',
   hasRevision:!!opts.headers?.['If-Match']});
  const path=new URL(url).pathname;
  if(!String(url).startsWith('http://127.0.0.1:8787/')||
     (!path.startsWith('/progress/')&&path!=='/__staging/health'))
   throw Error('Unexpected non-test endpoint '+String(url));
  return worker.fetch(new Request(url,opts),env);
 };
 return {fetchImpl,requests,env,buckets,stubs,baseUrl:'http://127.0.0.1:8787'};
}
function opts(f){return {baseUrl:f.baseUrl,key:KEY,fetchImpl:f.fetchImpl};}

test('Dry run validates five real-shape subjects and emits only counts/hashes',async()=>{
 const s=snapshot(),report=inspectSnapshot(s);
 assert.equal(Object.keys(report.audit).length,5);
 assert.equal(report.audit.eng.cards,1);
 assert.equal(report.audit.eng.activityShadows,1);
 assert.equal(report.audit.acc.quizAnswers,1);
 assert.match(report.audit.acc.sha256,/^[0-9a-f]{64}$/);
 assert.equal(fingerprint(s.subjects.eng),fingerprint(report.normalized.eng));
 const dir=await mkdtemp(join(tmpdir(),'vocabl-test-'));
 try{
  const file=join(dir,'snapshot.json');await writeFile(file,JSON.stringify(s));
  const script=fileURLToPath(new URL('./import-staging.mjs',import.meta.url));
  const output=execFileSync(process.execPath,[script,'--file',file],{encoding:'utf8'});
  assert.match(output,/DRY-RUN/);
  assert.doesNotMatch(output,/legacy-card-acc|quiz-acc|TEST_STAGING_ONLY/);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('Importer refuses a production, credential-bearing or otherwise unsafe URL',()=>{
 for(const url of [
  'https://study-api.kasidit09022550.workers.dev',
  'https://example.com',
  'http://study-api-cas-staging-only.myaccount.workers.dev',
  'https://somewhere@study-api-cas-staging-only.myaccount.workers.dev',
  'https://study-api-cas-staging-only.myaccount.workers.dev/progress/acc',
  'https://study-api-cas-staging-only.myaccount.workers.dev?target=prod',
  'https://study-api-cas-staging-only.myaccount.workers.dev:1234'
 ])assert.throws(()=>ensureStagingUrl(url));
 assert.equal(ensureStagingUrl('https://study-api-cas-staging-only.myaccount.workers.dev'),
  'https://study-api-cas-staging-only.myaccount.workers.dev');
 assert.equal(ensureStagingUrl('http://127.0.0.1:8787'),'http://127.0.0.1:8787');
});

test('Partial or malformed snapshot is rejected before any network writes',async()=>{
 const f=fixture(),s=snapshot();delete s.subjects.zh;
 await assert.rejects(importIntoStaging(s,opts(f)),/exactly acc/);
 assert.equal(f.requests.length,0);
 const second=snapshot();second.subjects.zh={study:{ans:{}},srs:{}};
 await assert.rejects(importIntoStaging(second,opts(f)),/Incomplete/);
 assert.equal(f.requests.length,0);
 const third=snapshot();third.subjects.eng.srs.s['x']='☯'.repeat(200000);
 await assert.rejects(importIntoStaging(third,opts(f)),/exceeds staging Worker size limit/);
 assert.equal(f.requests.length,0);
});

test('Staging import preflights all five and checks exact readback hashes',async()=>{
 const f=fixture(),s=snapshot();
 const result=await importIntoStaging(s,opts(f));
 assert.equal(result.subjects.length,5);
 assert.ok(result.subjects.every(x=>x.status==='imported-and-verified'));
 assert.equal(f.requests.filter(x=>x.method==='PUT').length,5);
 assert.equal(f.requests.filter(x=>x.method==='GET').length,11);
 assert.ok(f.requests.filter(x=>x.method==='PUT').every(x=>x.hasRevision));
 for(const d of SUBJECTS){
  const res=await f.fetchImpl(f.baseUrl+'/progress/'+d,{headers:{'X-Sync-Key':KEY}});
  assert.equal(res.headers.get('ETag'),'"1"');
  assert.equal(fingerprint(await res.json()),fingerprint(s.subjects[d]));
 }
});

test('Re-importing identical backup is a read-only no-op with stable revisions',async()=>{
 const f=fixture(),s=snapshot();
 await importIntoStaging(s,opts(f));
 const count=f.requests.filter(x=>x.method==='PUT').length;
 const repeated=await importIntoStaging(s,opts(f));
 assert.ok(repeated.subjects.every(x=>x.status==='already-identical'));
 assert.equal(f.requests.filter(x=>x.method==='PUT').length,count);
});

test('Unexpected existing staging data is detected BEFORE any subject is written',async()=>{
 const f=fixture(),s=snapshot();
 const other=blank();other.srs.s['different-progress']={ts:23,due:25};
 const put=await f.fetchImpl(f.baseUrl+'/progress/zh',{
  method:'PUT',headers:{'X-Sync-Key':KEY,'If-Match':'"0"','Content-Type':'application/json'},
  body:JSON.stringify(other)});
 assert.equal(put.status,200);
 const putBefore=f.requests.filter(x=>x.method==='PUT').length;
 await assert.rejects(importIntoStaging(s,opts(f)),/unexpected data or revision/);
 assert.equal(f.requests.filter(x=>x.method==='PUT').length,putBefore);
});

test('Failed third write can be resumed without overwriting previously imported subjects',async()=>{
 const f=fixture(),s=snapshot();let failOnce=true;
 const fetchImpl=async(url,options={})=>{
  if(failOnce&&options.method==='PUT'&&String(url).endsWith('/math')){
   failOnce=false;return new Response(JSON.stringify({error:'staging outage'}),{status:503});
  }
  return f.fetchImpl(url,options);
 };
 await assert.rejects(importIntoStaging(s,{...opts(f),fetchImpl}),/Staging PUT math rejected/);
 assert.equal(f.requests.filter(x=>x.method==='PUT').length,2);
 const result=await importIntoStaging(s,opts(f));
 assert.deepEqual(result.subjects.map(x=>x.status),[
  'already-identical','already-identical',
  'imported-and-verified','imported-and-verified','imported-and-verified'
 ]);
});

test('Wrong test key aborts staging import with no writes',async()=>{
 const f=fixture(),s=snapshot();
 await assert.rejects(importIntoStaging(s,{...opts(f),key:'BAD_KEY'}),/Staging identity check failed \(401\)/);
 assert.equal(f.requests.filter(x=>x.method==='PUT').length,0);
});

test('Server missing ETag or changing revision cannot be silently overwritten',async()=>{
 const f=fixture(),s=snapshot();
 const noVersion=async(u,opts={})=>{
  const response=await f.fetchImpl(u,opts);
  if((opts.method||'GET')==='GET')return new Response(await response.text(),{status:response.status});
  return response;
 };
 await assert.rejects(importIntoStaging(s,{...opts(f),fetchImpl:noVersion}),/missing quoted numeric ETag/);
 assert.equal(f.requests.filter(x=>x.method==='PUT').length,0);
 const g=fixture();let raced=false;
 const conflict=async(u,init={})=>{
  if(!raced&&init.method==='PUT'&&String(u).endsWith('/acc')){
   raced=true;
   const competing=blank();competing.srs.s.other={ts:5,due:8};
   await g.fetchImpl(u,{method:'PUT',headers:{'X-Sync-Key':KEY,'If-Match':'"0"','Content-Type':'application/json'},body:JSON.stringify(competing)});
  }
  return g.fetchImpl(u,init);
 };
 await assert.rejects(importIntoStaging(s,{...opts(g),fetchImpl:conflict}),/Staging PUT acc rejected \(409\)/);
 assert.equal(g.requests.filter(x=>x.method==='PUT').length,2);
 const remote=await (await g.fetchImpl(g.baseUrl+'/progress/acc',{headers:{'X-Sync-Key':KEY}})).json();
 assert.ok(remote.srs.s.other);
 assert.equal(remote.srs.s['legacy-card-acc'],undefined);
});


test('Canonical hash includes prototype-named keys without mutating prototypes',()=>{
 const dangerous=JSON.parse('{"__proto__":{"card":"should remain a key"},"constructor":{"x":1}}');
 const prior=Object.getPrototypeOf({});
 const hash=fingerprint(dangerous);
 assert.match(hash,/^[a-f0-9]{64}$/);
 assert.notEqual(hash,fingerprint({}));
 assert.equal(Object.getPrototypeOf({}),prior);
 assert.equal(Object.hasOwn(dangerous,'__proto__'),true);
});
test('Staging hostname rejects extra nested subdomain tricks',()=>{
 assert.throws(()=>ensureStagingUrl('https://study-api-cas-staging-only.fake.evil.workers.dev'),/Refusing non-staging/);
});

test('Importer rejects malformed or missing staging identity before any subject operations',async()=>{
 for(const failure of ['missing','wrong-protocol','unauthorized']){
  const f=fixture(),s=snapshot();
  const fetchImpl=async(url,options={})=>{
   if(new URL(url).pathname==='/__staging/health'){
    if(failure==='unauthorized')return new Response(JSON.stringify({error:'no'}),{status:401});
    if(failure==='missing')return new Response('not JSON',{status:200});
    return new Response(JSON.stringify({staging:true,protocol:'unexpected',subjects:SUBJECTS}),{status:200});
   }
   return f.fetchImpl(url,options);
  };
  await assert.rejects(importIntoStaging(s,{...opts(f),fetchImpl}),/identity/i);
  assert.equal(f.requests.filter(x=>new URL(x.url).pathname.startsWith('/progress/')).length,0);
  assert.equal(f.requests.filter(x=>x.method==='PUT').length,0);
 }
});
