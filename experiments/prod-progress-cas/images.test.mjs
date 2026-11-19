import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import entry,{ProductionProgressDO} from './worker.mjs';
const ORIGIN='https://cheetos9250.github.io',KEY='FAKE_PROD_KEY_TEST_ONLY_0123456789';
const HOST='https://vocabloom-progress-cas-prod.kasidit09022550.workers.dev';
const sha=s=>createHash('sha256').update(s).digest('hex').slice(0,32);
function fixture(flags={}){
 const objects=new Map();
 const env={PROGRESS_CAS_ENABLED:'true',PROGRESS_WRITES_ENABLED:'true',PROGRESS_MIGRATION_VERIFIED:'true',PROGRESS_SYNC_KEY:KEY,
  PROD_PROGRESS_DO:{idFromName:s=>s,get(id){if(!objects.has(id)){const d=new Map();objects.set(id,new ProductionProgressDO({storage:{kv:{get:k=>d.get(k),put:(k,v)=>d.set(k,v)}}}));}return objects.get(id);}},...flags};
 return (method,path,{headers={},body,key=KEY}={})=>entry.fetch(new Request(HOST+path,{method,headers:{Origin:ORIGIN,'X-Sync-Key':key,...(method==='PUT'?{'Content-Type':'text/plain'}:{}),...headers},body}),env);
}
const IMG='data:image/jpeg;base64,'+Buffer.from('SYNTHETIC-IMAGE-BYTES').toString('base64');
test('note images: stored once under their content hash, read back exactly',async()=>{
 const req=fixture(),id=sha(IMG);
 assert.equal((await req('GET','/img/'+id)).status,404);
 assert.equal((await req('PUT','/img/'+id,{body:IMG})).status,201);
 assert.equal((await req('PUT','/img/'+id,{body:IMG})).status,200,'second upload is a no-op');
 const g=await req('GET','/img/'+id);assert.equal(g.status,200);assert.equal(await g.text(),IMG);
});
test('note images: wrong hash, non-images, oversize, bad ids, no key and read-only mode are refused',async()=>{
 const req=fixture();
 assert.equal((await req('PUT','/img/'+'0'.repeat(32),{body:IMG})).status,400);
 const html='data:text/html;base64,PHNjcmlwdD4=';assert.equal((await req('PUT','/img/'+sha(html),{body:html})).status,400);
 const big='data:image/png;base64,'+'A'.repeat(1_600_000);assert.equal((await req('PUT','/img/'+sha(big),{body:big})).status,413);
 assert.equal((await req('GET','/img/xyz')).status,404);
 assert.equal((await req('GET','/img/'+sha(IMG),{key:'wrong-key-wrong-key-wrong-key'})).status,401);
 assert.equal((await fixture({PROGRESS_WRITES_ENABLED:'false'})('PUT','/img/'+sha(IMG),{body:IMG})).status,423);
});
