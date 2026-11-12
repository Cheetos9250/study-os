import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import entry,{ProductionProgressDO} from './worker.mjs';

const ORIGIN='https://cheetos9250.github.io';
const KEY='FAKE_PROD_KEY_TEST_ONLY_0123456789';
const HOST='https://vocabloom-progress-cas-prod.kasidit09022550.workers.dev';
const BLANK=()=>({study:{ans:{},ats:{},known:[],rst:0},srs:{s:{},m:{day:0,newDone:0}}});
function fixture(flags={}){
 const buckets=new Map(),objects=new Map();
 const env={
  PROGRESS_CAS_ENABLED:'true',
  PROGRESS_WRITES_ENABLED:'false',
  PROGRESS_MIGRATION_VERIFIED:'false',
  PROGRESS_SYNC_KEY:KEY,
  PROD_PROGRESS_DO:{
   idFromName:s=>s,
   get(id){
    if(!objects.has(id)){
     const data=new Map();buckets.set(id,data);
     objects.set(id,new ProductionProgressDO({
      storage:{kv:{get:k=>data.get(k),put:(k,v)=>{data.set(k,structuredClone(v))}}}
     }));
    }
    return objects.get(id);
   }
  },
  ...flags
 };
 async function req(method,path,{headers={},body,origin=ORIGIN,host=HOST}={}){
  const allHeaders={'Origin':origin,'X-Sync-Key':KEY,...headers};
  if(method==='PUT'&&!('Content-Type' in allHeaders))allHeaders['Content-Type']='application/json';
  const request=new Request(host+path,{
   method,headers:allHeaders,
   body:body===undefined?undefined:typeof body==='string'?body:JSON.stringify(body)
  });
  return entry.fetch(request,env);
 }
 return {env,req,buckets,objects};
}
test('Candidate has NO deployment config and cannot change currently published site routes',()=>{
 const root=dirname(fileURLToPath(import.meta.url));
 const source=readFileSync(resolve(root,'worker.mjs'),'utf8');
 assert.equal(existsSync(resolve(root,'wrangler.jsonc')),false);
 assert.equal(existsSync(resolve(root,'wrangler.toml')),false);
 assert.equal(existsSync(resolve(root,'wrangler.json')),false);
 assert.doesNotMatch(source,/study-api-cas-staging-only\.kasidit09022550\.workers\.dev/);
 assert.doesNotMatch(source,/'study-api'\s*:/);
 assert.match(source,/PROD_PROGRESS_DO/);
 assert.match(source,/PROGRESS_CAS_ENABLED/);
 assert.match(source,/PROGRESS_MIGRATION_VERIFIED/);
});
test('No secret or incomplete configuration fails closed before any DO access',async()=>{
 for(const opts of [
  {PROGRESS_CAS_ENABLED:undefined},
  {PROGRESS_CAS_ENABLED:'false'}
 ]){
  const f=fixture(opts),r=await f.req('GET','/progress/acc');
  assert.equal(r.status,503);
  assert.equal(f.objects.size,0);
 }
 for(const secret of [undefined,'', 'short']){
  const f=fixture({PROGRESS_SYNC_KEY:secret});
  const r=await f.req('GET','/progress/acc');
  assert.equal(r.status,401);
  assert.equal(f.objects.size,0);
 }
 const f=fixture();
 const no=await f.req('GET','/progress/acc',{headers:{'X-Sync-Key':'WRONG_KEY_LONG_LONG_LONG_123'}});
 assert.equal(no.status,401);
 assert.ok(!(await no.text()).includes(KEY));
 assert.equal(f.objects.size,0);
});
test('Wrong hostname, including old Notion Worker and staging, never reach this DO',async()=>{
 const f=fixture();
 for(const host of [
  'https://study-api.kasidit09022550.workers.dev',
  'https://study-api-cas-staging-only.kasidit09022550.workers.dev',
  'https://vocabloom-progress-cas-prod.attacker.workers.dev'
 ]){
  const r=await f.req('GET','/progress/acc',{host});
  assert.equal(r.status,503,host);
 }
 assert.equal(f.objects.size,0);
});
test('Wrong Origin is blocked, trusted OPTIONS never needs an auth secret',async()=>{
 const f=fixture();
 assert.equal((await f.req('GET','/progress/acc',{origin:'https://attacker.invalid'})).status,403);
 const opt=await f.req('OPTIONS','/progress/acc',{headers:{'X-Sync-Key':''}});
 assert.equal(opt.status,204);
 assert.equal(opt.headers.get('Access-Control-Allow-Origin'),ORIGIN);
 assert.match(opt.headers.get('Access-Control-Allow-Headers'),/If-Match/);
 assert.match(opt.headers.get('Access-Control-Expose-Headers'),/X-Sync-Revision/);
 const other=await f.req('OPTIONS','/progress/acc',{origin:'https://attacker.invalid'});
 assert.equal(other.status,403);
 assert.equal(f.objects.size,0);
});
test('Production identity marker requires credentials and is read-only by default',async()=>{
 const f=fixture();
 const r=await f.req('GET','/__prod/health');
 assert.equal(r.status,200);
 const body=await r.json();
 assert.deepEqual(body,{
  productionCandidate:true,protocol:'vocabloom-cas-prod-candidate-v1',
  state:'read-only',subjects:['acc','eco','math','eng','zh']
 });
 assert.equal(f.objects.size,0);
 assert.equal((await f.req('GET','/__prod/health',{headers:{'X-Sync-Key':''}})).status,401);
 assert.equal((await f.req('PUT','/__prod/health',{body:BLANK()})).status,404);
});
test('Default deployment policy refuses all writes even with valid key and strong revision',async()=>{
 const f=fixture();
 const read=await f.req('GET','/progress/acc');
 assert.equal(read.status,200);
 assert.deepEqual(await read.json(),BLANK());
 assert.equal(read.headers.get('X-Sync-Revision'),'"0"');
 const put=await f.req('PUT','/progress/acc',{headers:{'If-Match':'"0"'},body:BLANK()});
 assert.equal(put.status,423);
 assert.equal(f.buckets.size,1,'GET alone may read/init DO; PUT must never write');
 const again=await f.req('GET','/progress/acc');
 assert.equal(again.headers.get('X-Sync-Revision'),'"0"');
});
test('Both explicit write and migration gates are mandatory',async()=>{
 for(const [writes,migrated,status] of [
  ['true','false',423],
  ['false','true',423],
  ['true','true',200]
 ]){
  const f=fixture({PROGRESS_WRITES_ENABLED:writes,PROGRESS_MIGRATION_VERIFIED:migrated});
  const r=await f.req('PUT','/progress/acc',{headers:{'If-Match':'"0"'},body:BLANK()});
  assert.equal(r.status,status);
  const health=await f.req('GET','/__prod/health');
  assert.equal((await health.json()).state,status===200?'writes-enabled':'read-only');
  const read=await f.req('GET','/progress/acc');
  assert.equal(read.headers.get('X-Sync-Revision'),status===200?'"1"':'"0"');
 }
});
test('CAS preserves exactly one of two simultaneous writes and supports an explicit merge retry',async()=>{
 const f=fixture({PROGRESS_WRITES_ENABLED:'true',PROGRESS_MIGRATION_VERIFIED:'true'});
 const a=BLANK(),b=BLANK();
 a.study.ans['32']=0;
 b.study.ans['54']=1;
 const [left,right]=await Promise.all([
  f.req('PUT','/progress/acc',{headers:{'If-Match':'"0"'},body:a}),
  f.req('PUT','/progress/acc',{headers:{'If-Match':'"0"'},body:b})
 ]);
 assert.deepEqual([left.status,right.status].sort(),[200,409]);
 let read=await f.req('GET','/progress/acc');
 assert.equal(read.headers.get('X-Sync-Revision'),'"1"');
 const stored=await read.json();
 assert.equal(Object.keys(stored.study.ans).length,1);
 const other=stored.study.ans['32']!==undefined?b:a;
 const merged=structuredClone(stored);
 Object.assign(merged.study.ans,other.study.ans);
 const retry=await f.req('PUT','/progress/acc',{headers:{'If-Match':'"1"'},body:merged});
 assert.equal(retry.status,200);
 assert.equal(retry.headers.get('X-Sync-Revision'),'"2"');
 read=await f.req('GET','/progress/acc');
 const final=await read.json();
 assert.equal(final.study.ans['32'],0);
 assert.equal(final.study.ans['54'],1);
 assert.equal(read.headers.get('Cache-Control'),'no-store');
});
test('Malformed/unsafe writes fail without mutation or revision changes',async()=>{
 const f=fixture({PROGRESS_WRITES_ENABLED:'true',PROGRESS_MIGRATION_VERIFIED:'true'});
 const attempts=[
  await f.req('PUT','/progress/acc',{body:BLANK()}),
  await f.req('PUT','/progress/acc',{headers:{'If-Match':'W/"0"'},body:BLANK()}),
  await f.req('PUT','/progress/acc',{headers:{'If-Match':'"0"','Content-Type':'text/plain'},body:'{}'}),
  await f.req('PUT','/progress/acc',{headers:{'If-Match':'"0"'},body:'{broken'}),
  await f.req('PUT','/progress/acc',{headers:{'If-Match':'"0"'},body:{study:{ans:{}},srs:{}}}),
  await f.req('PUT','/progress/acc',{headers:{'If-Match':'"0"'},body:{...BLANK(),junk:'x'.repeat(360000)}})
 ];
 assert.deepEqual(attempts.map(x=>x.status),[428,428,415,400,400,413]);
 const r=await f.req('GET','/progress/acc');
 assert.equal(r.headers.get('X-Sync-Revision'),'"0"');
});
test('Only five progress routes exist; the original Notion endpoints remain untouched',async()=>{
 const f=fixture({PROGRESS_WRITES_ENABLED:'true',PROGRESS_MIGRATION_VERIFIED:'true'});
 for(const path of ['/quiz','/cards','/review','/progress/unknown','/progress/acc/delete']){
  const r=await f.req('GET',path);
  assert.equal(r.status,404,path);
 }
 const forbidden=await f.req('DELETE','/progress/acc');
 assert.equal(forbidden.status,405);
 const allowed=await f.req('GET','/progress/zh');
 assert.equal(allowed.status,200);
 assert.ok([...f.buckets.keys()].every(x=>x.startsWith('vocabloom:production-progress:v1:')));
});
test('Dedicated binding absence returns controlled error without falling back to staging binding',async()=>{
 const f=fixture({PROD_PROGRESS_DO:undefined,PROGRESS_DO:{}});
 const r=await f.req('GET','/progress/acc');
 assert.equal(r.status,503);
 assert.equal(f.buckets.size,0);
});
