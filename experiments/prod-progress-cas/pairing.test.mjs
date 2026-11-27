// "Approve from iPad": a computer signs in with a 6-digit code that a device holding the sync key approves.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import entry,{ProductionProgressDO} from './worker.mjs';

const ORIGIN='https://cheetos9250.github.io',KEY='FAKE_PROD_KEY_TEST_ONLY_0123456789';
const HOST='https://vocabloom-progress-cas-prod.kasidit09022550.workers.dev';
function fixture(){
 const objects=new Map(),data=new Map();
 const env={PROGRESS_CAS_ENABLED:'true',PROGRESS_WRITES_ENABLED:'true',PROGRESS_MIGRATION_VERIFIED:'true',PROGRESS_SYNC_KEY:KEY,
  PROD_PROGRESS_DO:{idFromName:s=>s,get(id){if(!objects.has(id)){const d=new Map();data.set(id,d);
   objects.set(id,new ProductionProgressDO({storage:{kv:{get:k=>structuredClone(d.get(k)),put:(k,v)=>{d.set(k,structuredClone(v));}}}}));}return objects.get(id);}}};
 const req=(method,path,{headers={},body,origin=ORIGIN}={})=>entry.fetch(new Request(HOST+path,{method,
  headers:{...(origin?{Origin:origin}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body)}),env);
 return {env,req,data};
}
const realNow=Date.now;
test.afterEach(()=>{Date.now=realNow;});

async function signIn(f){
 const s=await f.req('POST','/pair/start');assert.equal(s.status,201);
 const {code,poll,expires}=await s.json();
 assert.match(code,/^\d{6}$/);assert.match(poll,/^pp_[a-f0-9]{64}$/);assert.ok(expires>Date.now());
 const pend=await f.req('POST','/pair/poll',{headers:{'X-Pair-Poll':poll}});assert.equal(pend.status,202);
 const a=await f.req('POST','/pair/approve',{headers:{'X-Sync-Key':KEY},body:{code}});assert.equal(a.status,200);
 const p=await f.req('POST','/pair/poll',{headers:{'X-Pair-Poll':poll}});assert.equal(p.status,200);
 const {token}=await p.json();assert.match(token,/^pst_[a-f0-9]{64}$/);
 return {code,poll,token};
}

test('computer gets a session token only after the key holder approves its code; the token reads and writes progress',async()=>{
 const f=fixture(),{poll,token}=await signIn(f);
 const g=await f.req('GET','/progress/acc',{headers:{'X-Sync-Key':token}});assert.equal(g.status,200);
 const rev=g.headers.get('X-Sync-Revision');
 const body={study:{ans:{1:2},ats:{1:5},known:[],rst:0},srs:{s:{},m:{day:0,newDone:0}}};
 const put=await f.req('PUT','/progress/acc',{headers:{'X-Sync-Key':token,'If-Match':rev,'Content-Type':'application/json'},body});
 assert.equal(put.status,200);
 assert.equal((await f.req('POST','/pair/poll',{headers:{'X-Pair-Poll':poll}})).status,404,'a token is handed out once');
 const stored=JSON.stringify([...f.data.get('vocabloom:production-progress:v1:pairing')]);
 assert.ok(!stored.includes(token)&&!stored.includes(poll),'only hashes are stored');
});

test('approve and revoke need the real key; a session cannot approve other computers',async()=>{
 const f=fixture(),{token}=await signIn(f);
 const s=await (await f.req('POST','/pair/start')).json();
 assert.equal((await f.req('POST','/pair/approve',{body:{code:s.code}})).status,401);
 assert.equal((await f.req('POST','/pair/approve',{headers:{'X-Sync-Key':token},body:{code:s.code}})).status,403);
 assert.equal((await f.req('POST','/pair/revoke',{headers:{'X-Sync-Key':token}})).status,403);
 assert.equal((await f.req('POST','/pair/approve',{headers:{'X-Sync-Key':KEY},body:{code:'000000'===s.code?'111111':'000000'}})).status,404);
});

test('sessions expire after 12 hours, codes after 5 minutes, and sign out / revoke end them',async()=>{
 const f=fixture(),t0=realNow();
 const {token}=await signIn(f);
 Date.now=()=>t0+11*3600_000;assert.equal((await f.req('GET','/progress/acc',{headers:{'X-Sync-Key':token}})).status,200);
 Date.now=()=>t0+12*3600_000+60_000;assert.equal((await f.req('GET','/progress/acc',{headers:{'X-Sync-Key':token}})).status,401);
 Date.now=realNow;
 const s=await (await f.req('POST','/pair/start')).json();
 Date.now=()=>realNow()+6*60_000;
 assert.equal((await f.req('POST','/pair/approve',{headers:{'X-Sync-Key':KEY},body:{code:s.code}})).status,404,'old code');
 Date.now=realNow;
 const b=await signIn(f);
 assert.equal((await f.req('POST','/pair/logout',{headers:{'X-Sync-Key':b.token}})).status,200);
 assert.equal((await f.req('GET','/progress/acc',{headers:{'X-Sync-Key':b.token}})).status,401);
 const c=await signIn(f),d=await signIn(f);
 const r=await f.req('POST','/pair/revoke',{headers:{'X-Sync-Key':KEY}});assert.equal(r.status,200);assert.equal((await r.json()).revoked,2);
 for(const t of [c.token,d.token])assert.equal((await f.req('GET','/progress/acc',{headers:{'X-Sync-Key':t}})).status,401);
 assert.equal((await f.req('GET','/progress/acc',{headers:{'X-Sync-Key':KEY}})).status,200,'the key itself still works');
});

test('start needs the site origin, is POST only and is capped; guessed tokens are refused',async()=>{
 const f=fixture();
 assert.equal((await f.req('POST','/pair/start',{origin:null})).status,403);
 assert.equal((await f.req('POST','/pair/start',{origin:'https://evil.example'})).status,403);
 assert.equal((await f.req('GET','/pair/start')).status,405);
 for(let i=0;i<20;i++)assert.equal((await f.req('POST','/pair/start')).status,201);
 assert.equal((await f.req('POST','/pair/start')).status,429);
 assert.equal((await f.req('POST','/pair/poll',{headers:{'X-Pair-Poll':'pp_'+'0'.repeat(64)}})).status,404);
 assert.equal((await f.req('GET','/progress/acc',{headers:{'X-Sync-Key':'pst_'+'0'.repeat(64)}})).status,401);
 const opt=await f.req('OPTIONS','/pair/start');assert.match(opt.headers.get('Access-Control-Allow-Methods'),/POST/);
});
