import {test} from 'node:test';
import assert from 'node:assert/strict';
import entry,{ProductionProgressDO} from './worker.mjs';
const ORIGIN='https://cheetos9250.github.io',KEY='FAKE_PROD_KEY_TEST_ONLY_0123456789';
const HOST='https://vocabloom-progress-cas-prod.kasidit09022550.workers.dev';
function fixture(){
 const objects=new Map();
 const env={PROGRESS_CAS_ENABLED:'true',PROGRESS_WRITES_ENABLED:'true',PROGRESS_MIGRATION_VERIFIED:'true',PROGRESS_SYNC_KEY:KEY,
  PROD_PROGRESS_DO:{idFromName:s=>s,get(id){if(!objects.has(id)){const d=new Map();objects.set(id,new ProductionProgressDO({storage:{kv:{get:k=>d.get(k),put:(k,v)=>d.set(k,structuredClone(v))}}}));}return objects.get(id);}}};
 return (method,path,{headers={},body}={})=>entry.fetch(new Request(HOST+path,{method,headers:{Origin:ORIGIN,'X-Sync-Key':KEY,...(method==='PUT'?{'Content-Type':'application/json'}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body)}),env);
}
test('extra subject: Excel, PDF sets and textbook answers with its own schema and the larger limit',async()=>{
 const req=fixture();
 const g=await req('GET','/progress/extra');assert.equal(g.status,200);assert.deepEqual(await g.json(),{excel:{},pdfsets:{},textbook:{}});
 const v={excel:{done:{a1:true}},pdfsets:{sets:{p1:{name:'SYNTHETIC',n:3,ans:{1:'a'},key:{},notes:{}}}},textbook:{'QS-9-2':{notes:'x'.repeat(500_000)}}};
 assert.equal((await req('PUT','/progress/extra',{headers:{'If-Match':'"0"'},body:v})).status,200);
 assert.equal((await req('PUT','/progress/extra',{headers:{'If-Match':'"0"'},body:v})).status,409,'stale revision');
 assert.equal((await req('PUT','/progress/extra',{headers:{'If-Match':'"1"'},body:{excel:{},pdfsets:{}}})).status,400,'all three parts required');
 assert.equal((await req('PUT','/progress/extra',{headers:{'If-Match':'"1"'},body:{...v,other:{}}})).status,400,'no other keys');
 assert.equal((await req('PUT','/progress/acc',{headers:{'If-Match':'"0"'},body:{excel:{},pdfsets:{},textbook:{}}})).status,400,'course keeps its schema');
 assert.equal((await req('PUT','/progress/extra',{headers:{'If-Match':'"1"','X-Progress-Subject':'course'},body:{study:{ans:{},ats:{}},srs:{s:{},m:{}}}})).status,400,'client cannot switch the schema');
});
