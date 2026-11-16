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
test('home subject stores tasks, images and grades with its larger limit, and keeps its own schema',async()=>{
 const req=fixture();
 const g=await req('GET','/progress/home');assert.equal(g.status,200);assert.deepEqual(await g.json(),{home:{},grades:{}});
 const img='data:image/jpeg;base64,'+'A'.repeat(900_000);
 const v={home:{tasks:[{id:'t1',title:'SYNTHETIC',date:'2026-11-20',pri:'Low'}],cover:img},grades:{courses:[]}};
 assert.equal((await req('PUT','/progress/home',{headers:{'If-Match':'"0"'},body:v})).status,200);
 assert.equal((await req('PUT','/progress/today',{headers:{'If-Match':'"0"'},body:{today:{x:img}}})).status,413,'other subjects keep 350 KB');
 assert.equal((await req('PUT','/progress/home',{headers:{'If-Match':'"1"'},body:{home:{cover:'data:image/jpeg;base64,'+'A'.repeat(2_000_000)},grades:{}}})).status,413);
 assert.equal((await req('PUT','/progress/home',{headers:{'If-Match':'"1"'},body:{today:{}}})).status,400);
 assert.equal((await req('PUT','/progress/acc',{headers:{'If-Match':'"0"'},body:{home:{},grades:{}}})).status,400);
});
