import {test} from 'node:test';
import assert from 'node:assert/strict';
import entry,{ProductionProgressDO} from './worker.mjs';

const ORIGIN='https://cheetos9250.github.io';
const KEY='FAKE_PROD_KEY_TEST_ONLY_0123456789';
const HOST='https://vocabloom-progress-cas-prod.kasidit09022550.workers.dev';
function fixture(){
 const objects=new Map();
 const env={PROGRESS_CAS_ENABLED:'true',PROGRESS_WRITES_ENABLED:'true',PROGRESS_MIGRATION_VERIFIED:'true',PROGRESS_SYNC_KEY:KEY,
  PROD_PROGRESS_DO:{idFromName:s=>s,get(id){
   if(!objects.has(id)){const data=new Map();objects.set(id,new ProductionProgressDO({storage:{kv:{get:k=>data.get(k),put:(k,v)=>{data.set(k,structuredClone(v))}}}}));}
   return objects.get(id);}}};
 const req=(method,path,{headers={},body}={})=>entry.fetch(new Request(HOST+path,{method,
  headers:{'Origin':ORIGIN,'X-Sync-Key':KEY,...(method==='PUT'?{'Content-Type':'application/json'}:{}),...headers},
  body:body===undefined?undefined:typeof body==='string'?body:JSON.stringify(body)}),env);
 return {req,objects};
}
const doc=(value='{"exams":[]}')=>({v:1,keys:{'studyos.today.v1':{value,ts:1700000000000,dev:'d1'}}});

test('app document: blank on first GET, CAS write, stale write refused',async()=>{
 const f=fixture();
 const g=await f.req('GET','/progress/app');
 assert.equal(g.status,200);assert.equal(g.headers.get('X-Sync-Revision'),'"0"');
 assert.deepEqual(await g.json(),{v:1,keys:{}});
 const p=await f.req('PUT','/progress/app',{headers:{'If-Match':'"0"'},body:doc()});
 assert.equal(p.status,200);assert.equal(p.headers.get('X-Sync-Revision'),'"1"');
 const stale=await f.req('PUT','/progress/app',{headers:{'If-Match':'"0"'},body:doc('{"exams":[1]}')});
 assert.equal(stale.status,409);
 const after=await f.req('GET','/progress/app');
 assert.deepEqual(await after.json(),doc());
 assert.equal((await f.req('PUT','/progress/app',{body:doc()})).status,428);
});
test('app document is separate from course documents and keeps its own schema',async()=>{
 const f=fixture();
 await f.req('PUT','/progress/app',{headers:{'If-Match':'"0"'},body:doc()});
 const acc=await f.req('GET','/progress/acc');
 assert.ok((await acc.json()).study,'course document unaffected');
 // A course-shaped body is rejected for app, and an app-shaped body for a course.
 assert.equal((await f.req('PUT','/progress/app',{headers:{'If-Match':'"1"'},body:{study:{ans:{},ats:{}},srs:{s:{},m:{}}}})).status,400);
 assert.equal((await f.req('PUT','/progress/acc',{headers:{'If-Match':'"0"'},body:doc()})).status,400);
 // A client cannot switch a course document to the app schema with its own header.
 assert.equal((await f.req('PUT','/progress/acc',{headers:{'If-Match':'"0"','X-Study-Subject':'app'},body:doc()})).status,400);
});
test('app document refuses unknown keys, bad entries and oversize bodies',async()=>{
 const f=fixture();
 const put=b=>f.req('PUT','/progress/app',{headers:{'If-Match':'"0"'},body:b});
 assert.equal((await put({v:1,keys:{'study-sync-progress-key-v1':{value:'x',ts:1}}})).status,400);
 assert.equal((await put({v:1,keys:{'studyos.today.v1':{value:{},ts:1}}})).status,400);
 assert.equal((await put({v:1,keys:{'studyos.today.v1':{value:'{}',ts:'1'}}})).status,400);
 assert.equal((await put({v:2,keys:{}})).status,400);
 assert.equal((await put(doc('x'.repeat(1_000_100)))).status,413);
 assert.equal((await put(doc('x'.repeat(400_000)))).status,200,'app allows more than course documents');
});
