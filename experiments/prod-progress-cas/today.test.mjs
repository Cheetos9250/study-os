import {test} from 'node:test';
import assert from 'node:assert/strict';
import entry,{ProductionProgressDO} from './worker.mjs';
const ORIGIN='https://cheetos9250.github.io',KEY='FAKE_PROD_KEY_TEST_ONLY_0123456789';
const HOST='https://vocabloom-progress-cas-prod.kasidit09022550.workers.dev';
function fixture(){
 const objects=new Map();
 const env={PROGRESS_CAS_ENABLED:'true',PROGRESS_WRITES_ENABLED:'true',PROGRESS_MIGRATION_VERIFIED:'true',PROGRESS_SYNC_KEY:KEY,
  PROD_PROGRESS_DO:{idFromName:s=>s,get(id){if(!objects.has(id)){const d=new Map();objects.set(id,new ProductionProgressDO({storage:{kv:{get:k=>d.get(k),put:(k,v)=>d.set(k,structuredClone(v))}}}));}return objects.get(id);}}};
 const req=(method,path,{headers={},body}={})=>entry.fetch(new Request(HOST+path,{method,headers:{Origin:ORIGIN,'X-Sync-Key':KEY,...(method==='PUT'?{'Content-Type':'application/json'}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body)}),env);
 return {req};
}
test('today subject starts empty and stores planner settings with compare-and-set',async()=>{
 const {req}=fixture();
 const g=await req('GET','/progress/today');assert.equal(g.status,200);assert.deepEqual(await g.json(),{today:{}});
 assert.equal(g.headers.get('X-Sync-Revision'),'"0"');
 const value={today:{exams:[{id:'x',course:'acc',title:'SYNTHETIC',date:'2026-11-26'}],done:{},tasks:{},timetable:[]}};
 const p=await req('PUT','/progress/today',{headers:{'If-Match':'"0"'},body:value});assert.equal(p.status,200);
 const again=await req('PUT','/progress/today',{headers:{'If-Match':'"0"'},body:value});assert.equal(again.status,409);
 assert.deepEqual(await (await req('GET','/progress/today')).json(),value);
});
test('today and course subjects keep their own schemas; a client header cannot switch them',async()=>{
 const {req}=fixture();
 const course={study:{ans:{},ats:{},known:[],rst:0},srs:{s:{},m:{day:0,newDone:0}}};
 assert.equal((await req('PUT','/progress/today',{headers:{'If-Match':'"0"'},body:course})).status,400);
 assert.equal((await req('PUT','/progress/acc',{headers:{'If-Match':'"0"'},body:{today:{}}})).status,400);
 assert.equal((await req('PUT','/progress/acc',{headers:{'If-Match':'"0"','X-Progress-Subject':'today'},body:{today:{}}})).status,400);
 assert.equal((await req('PUT','/progress/today',{headers:{'If-Match':'"0"'},body:{today:{},extra:1}})).status,400);
 assert.equal((await req('PUT','/progress/acc',{headers:{'If-Match':'"0"'},body:course})).status,200);
});
