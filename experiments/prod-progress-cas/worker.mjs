/**
 * REVIEW CANDIDATE ONLY — NO WRANGLER CONFIG, NO DEPLOY, NO LIVE DATA.
 *
 * A new, separately named Production CAS service — NOT a replacement for the
 * existing Notion /quiz, /cards, /review Worker, nor for Staging.
 *
 * Requires a new SQLite-backed Durable Object namespace and a NEW independent
 * secret. Merely committing this file must NEVER activate or deploy it.
 */
const SUBJECTS=['acc','eco','math','eng','zh'];
const SUBJECT_SET=new Set(SUBJECTS);
const MAX_BYTES=350_000;
const PROD_HOST='vocabloom-progress-cas-prod.kasidit09022550.workers.dev';
const ORIGIN='https://cheetos9250.github.io';
const PROTOCOL='vocabloom-cas-prod-candidate-v1';
const JSON_HEADERS={
 'Content-Type':'application/json; charset=utf-8',
 'Cache-Control':'no-store',
 'X-Content-Type-Options':'nosniff'
};
const record=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const initial=()=>({study:{ans:{},ats:{},known:[],rst:0},srs:{s:{},m:{day:0,newDone:0}}});
const validator=x=>record(x)&&record(x.study)&&record(x.study.ans)&&
 record(x.study.ats)&&(x.study.known===undefined||Array.isArray(x.study.known))&&
 (x.study.rst===undefined||Number.isFinite(x.study.rst))&&
 record(x.srs)&&record(x.srs.s)&&record(x.srs.m);
function json(value,status=200,revision){
 const h=new Headers(JSON_HEADERS);
 if(revision!==undefined){
  const tag='"'+String(revision)+'"';
  h.set('ETag',tag);
  // Survives Cloudflare's transformation of strong HTTP ETags to weak ETags.
  h.set('X-Sync-Revision',tag);
 }
 return new Response(JSON.stringify(value),{status,headers:h});
}
function safeEqual(a,b){
 a=String(a||'');b=String(b||'');
 let diff=a.length^b.length;
 for(let i=0;i<Math.max(a.length,b.length);i++)
  diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);
 return diff===0;
}
export class ProductionProgressDO {
 constructor(ctx){this.ctx=ctx;}
 async fetch(request){
  if(request.method==='GET'){
   const stored=this.ctx.storage.kv.get('record')??{revision:0,value:initial()};
   return json(stored.value,200,stored.revision);
  }
  if(request.method!=='PUT')return json({error:'Method not allowed'},405);
  const expected=request.headers.get('If-Match');
  if(!expected||!/^"[0-9]+"$/.test(expected))
   return json({error:'Strong If-Match revision required'},428);
  const type=request.headers.get('Content-Type')||'';
  if(!/^application\/json(?:\s*;|$)/i.test(type))
   return json({error:'JSON content type required'},415);
  const declared=Number(request.headers.get('Content-Length'));
  if(Number.isFinite(declared)&&declared>MAX_BYTES)
   return json({error:'Payload too large'},413);
  const raw=await request.text();
  if(new TextEncoder().encode(raw).byteLength>MAX_BYTES)
   return json({error:'Payload too large'},413);
  let submitted;
  try{submitted=JSON.parse(raw)}catch{return json({error:'Invalid JSON'},400)}
  if(!validator(submitted))return json({error:'Invalid progress schema'},400);
  // Synchronous kv.get + kv.put without await forms an atomic critical section
  // for SQLite-backed Durable Objects. Never insert an await between them.
  const current=this.ctx.storage.kv.get('record')??{revision:0,value:initial()};
  if(expected!=='"'+current.revision+'"')
   return json({error:'Revision conflict',revision:current.revision},409,current.revision);
  const next={revision:current.revision+1,value:submitted};
  this.ctx.storage.kv.put('record',next);
  return json({ok:true,revision:next.revision},200,next.revision);
 }
}
function applyCors(response,origin){
 const r=new Response(response.body,{status:response.status,headers:response.headers});
 if(origin===ORIGIN){
  r.headers.set('Access-Control-Allow-Origin',ORIGIN);
  r.headers.set('Access-Control-Allow-Methods','GET, PUT, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers','X-Sync-Key, Content-Type, If-Match');
  r.headers.set('Access-Control-Expose-Headers','ETag, X-Sync-Revision');
  r.headers.set('Vary','Origin');
 }
 return r;
}
export default {
 async fetch(request,env){
  const origin=request.headers.get('Origin');
  const url=new URL(request.url);
  const cors=r=>applyCors(r,origin);
  // Hard boundary: not the existing study-api Worker and not the staging one.
  if(url.hostname!==PROD_HOST||String(env.PROGRESS_CAS_ENABLED)!=='true')
   return cors(json({error:'Production candidate deployment guard denied'},503));
  if(origin&&origin!==ORIGIN)
   return json({error:'Origin not allowed'},403);
  if(request.method==='OPTIONS'){
   if(origin!==ORIGIN)return json({error:'Origin required'},403);
   return cors(new Response(null,{status:204,headers:{'Cache-Control':'no-store'}}));
  }
  if(typeof env.PROGRESS_SYNC_KEY!=='string'||env.PROGRESS_SYNC_KEY.length<24||
    !safeEqual(request.headers.get('X-Sync-Key'),env.PROGRESS_SYNC_KEY))
   return cors(json({error:'Unauthorized'},401));
  const writesEnabled=String(env.PROGRESS_WRITES_ENABLED)==='true'&&
   String(env.PROGRESS_MIGRATION_VERIFIED)==='true';
  if(url.pathname==='/__prod/health'&&request.method==='GET')
   return cors(json({
    productionCandidate:true,protocol:PROTOCOL,
    state:writesEnabled?'writes-enabled':'read-only',
    subjects:SUBJECTS
   },200));
  const m=url.pathname.match(/^\/progress\/([a-z]+)$/);
  if(!m||!SUBJECT_SET.has(m[1]))return cors(json({error:'Unknown endpoint'},404));
  if(request.method==='PUT'&&!writesEnabled)
   return cors(json({error:'Migration approval and write enablement required'},423));
  if(request.method!=='GET'&&request.method!=='PUT')
   return cors(json({error:'Method not allowed'},405));
  if(!env.PROD_PROGRESS_DO||typeof env.PROD_PROGRESS_DO.idFromName!=='function'||
    typeof env.PROD_PROGRESS_DO.get!=='function')
   return cors(json({error:'Dedicated production Durable Object binding missing'},503));
  const id=env.PROD_PROGRESS_DO.idFromName('vocabloom:production-progress:v1:'+m[1]);
  const stub=env.PROD_PROGRESS_DO.get(id);
  return cors(await stub.fetch(request));
 }
};