/**
 * ISOLATED PROTOTYPE — NOT DEPLOYED.
 * Atomic, versioned Study OS progress storage backed by one SQLite Durable Object
 * per subject. No production KV migration, users, or credentials.
 */
const SUBJECTS=new Set(['acc','eco','math','eng','zh']);
const MAX_BYTES=350_000;
const JSON_HEADERS={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
const isObject=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const defaultState=()=>({study:{ans:{},ats:{},known:[],rst:0},srs:{s:{},m:{day:0,newDone:0}}});
function response(payload,status=200,revision){
 const headers=new Headers(JSON_HEADERS);
 if(revision!==undefined)headers.set('ETag','"'+String(revision)+'"');
 return new Response(JSON.stringify(payload),{status,headers});
}
function isValidState(x){
 if(!isObject(x)||!isObject(x.study)||!isObject(x.srs))return false;
 if(!isObject(x.study.ans)||!isObject(x.study.ats))return false;
 if(!isObject(x.srs.s)||!isObject(x.srs.m))return false;
 if(x.study.known!==undefined&&!Array.isArray(x.study.known))return false;
 if(x.study.rst!==undefined&&!Number.isFinite(Number(x.study.rst)))return false;
 return true;
}
export class StudyProgressDO {
 constructor(ctx){this.ctx=ctx;}
 async fetch(request){
  if(request.method==='GET'){
   const state=this.ctx.storage.kv.get('record')??{revision:0,value:defaultState()};
   return response(state.value,200,state.revision);
  }
  if(request.method!=='PUT')return response({error:'Method not allowed'},405);
  const expected=request.headers.get('If-Match');
  if(!expected||!/^"[0-9]+"$/.test(expected))
   return response({error:'If-Match revision required'},428);
  const content=await request.text();
  const length=new TextEncoder().encode(content).byteLength;
  if(length>MAX_BYTES)return response({error:'Payload exceeds safe limit'},413);
  let submitted;
  try{submitted=JSON.parse(content)}catch{return response({error:'Invalid JSON'},400);}
  if(!isValidState(submitted))return response({error:'Invalid Study OS progress schema'},400);
  // Crucial: synchronous storage operations with no await between reading revision
  // and writing next revision. SQLite-backed DO storage serializes this critical section.
  const current=this.ctx.storage.kv.get('record')??{revision:0,value:defaultState()};
  if(expected!=='"'+current.revision+'"')
   return response({error:'Revision conflict',revision:current.revision},409,current.revision);
  const next={revision:current.revision+1,value:submitted};
  this.ctx.storage.kv.put('record',next);
  return response({ok:true,revision:next.revision},200,next.revision);
 }
}
function withCors(responseObj,origin,allowedOrigin){
 const r=new Response(responseObj.body,{status:responseObj.status,headers:responseObj.headers});
 if(origin&&origin===allowedOrigin){
  r.headers.set('Access-Control-Allow-Origin',origin);
  r.headers.set('Access-Control-Allow-Methods','GET, PUT, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers','X-Sync-Key, Content-Type, If-Match');
  r.headers.set('Access-Control-Expose-Headers','ETag');
  r.headers.set('Vary','Origin');
 }
 return r;
}
export default {
 async fetch(request,env){
  const origin=request.headers.get('Origin');
  const allowed=String(env.ALLOWED_ORIGIN||'');
  const cors=(r)=>withCors(r,origin,allowed);
  // A browser's origin must be explicitly trusted; the secret alone is still required.
  if(origin&&origin!==allowed)return response({error:'Origin not allowed'},403);
  if(request.method==='OPTIONS'){
   if(!origin||!allowed)return response({error:'Origin required'},403);
   return cors(new Response(null,{status:204,headers:{'Cache-Control':'no-store'}}));
  }
  if(!env.SYNC_KEY||request.headers.get('X-Sync-Key')!==env.SYNC_KEY)
   return cors(response({error:'Unauthorized'},401));
  const parsed=new URL(request.url);
  const match=parsed.pathname.match(/^\/progress\/([a-z]+)$/);
  if(!match||!SUBJECTS.has(match[1]))return cors(response({error:'Unknown progress subject'},404));
  if(request.method!=='GET'&&request.method!=='PUT')
   return cors(response({error:'Method not allowed'},405));
  const id=env.PROGRESS_DO.idFromName('study-os-staging:'+match[1]);
  const stub=env.PROGRESS_DO.get(id);
  return cors(await stub.fetch(request));
 }
};
