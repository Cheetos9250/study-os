/**
 * CAS CLIENT PROTOTYPE ONLY; not wired into Study OS production.
 * Legacy subject pages and VocaBloom must be migrated together before rollout.
 */
const isObject=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
export function mergeProgress(local={},remote={}){
 const a=isObject(local.study)?local.study:{},b=isObject(remote.study)?remote.study:{};
 const x=isObject(local.srs)?local.srs:{},y=isObject(remote.srs)?remote.srs:{};
 const result={
  study:{ans:{},ats:{},known:[...new Set([...(a.known||[]),...(b.known||[])])],rst:Math.max(Number(a.rst)||0,Number(b.rst)||0)},
  srs:{s:{},m:{day:0,newDone:0}}
 };
 for(const id of new Set([...Object.keys(a.ans||{}),...Object.keys(b.ans||{})])){
  const aHas=Object.hasOwn(a.ans||{},id),bHas=Object.hasOwn(b.ans||{},id);
  const at=Number(a.ats?.[id])||0,bt=Number(b.ats?.[id])||0;
  const useA=aHas&&(!bHas||at>=bt);
  const candidate=useA?a:b,stamp=useA?at:bt;
  if(result.study.rst&&stamp<result.study.rst)continue;
  result.study.ans[id]=candidate.ans[id];
  result.study.ats[id]=stamp;
 }
 for(const id of new Set([...Object.keys(x.s||{}),...Object.keys(y.s||{})])){
  const va=x.s?.[id],vb=y.s?.[id];
  result.srs.s[id]=!va?vb:!vb?va:(Number(va.ts)||0)>=(Number(vb.ts)||0)?va:vb;
 }
 const ma=x.m||{},mb=y.m||{};
 result.srs.m=Number(ma.day)>Number(mb.day)?ma:Number(mb.day)>Number(ma.day)?mb:
 {day:Number(ma.day)||0,newDone:Math.max(Number(ma.newDone)||0,Number(mb.newDone)||0)};
 return result;
}
export class CloudSyncError extends Error{
 constructor(message,status){super(message);this.status=status;this.name='CloudSyncError';}
}
/**
 * Fetch + optimistic compare-and-swap. GET returns ETag; PUT requires If-Match.
 * On 409, refetch and merge with the still-intact local record (bounded retries).
 */
export async function syncOneSubject({baseUrl,subject,syncKey,loadLocal,saveLocal,fetchImpl=fetch,maxAttempts=8}){
 if(!/^(acc|eco|math|eng|zh)$/.test(subject))throw new Error('Unsupported Study OS subject');
 if(!/^https:\/\//.test(baseUrl))throw new Error('HTTPS endpoint required');
 if(!syncKey||typeof loadLocal!=='function'||typeof saveLocal!=='function')
  throw new Error('Missing sync key or storage callbacks');
 const url=baseUrl.replace(/\/+$/,'')+'/progress/'+encodeURIComponent(subject);
 const headers={'X-Sync-Key':syncKey,'Content-Type':'application/json'};
 for(let attempt=1;attempt<=maxAttempts;attempt++){
  const got=await fetchImpl(url,{method:'GET',headers,cache:'no-store'});
  if(got.status!==200)throw new CloudSyncError('Cloud GET failed: '+got.status,got.status);
  const etag=got.headers.get('ETag');
  if(!/^"[0-9]+"$/.test(etag||''))throw new CloudSyncError('Server did not expose an ETag revision',0);
  const remote=await got.json(),local=await loadLocal();
  const merged=mergeProgress(local,remote);
  // Snapshot the live local record before the network write. A quiz answer or SRS
  // rating made during the PUT must not be replaced by this older merged state.
  const localSnapshot=JSON.stringify(local);
  const submitted=await fetchImpl(url,{method:'PUT',headers:{...headers,'If-Match':etag},body:JSON.stringify(merged)});
  if(submitted.status===409||submitted.status===412)continue;
  if(submitted.status!==200)throw new CloudSyncError('Cloud PUT failed: '+submitted.status,submitted.status);
  // A successful server write does not mean the local snapshot is still current.
  // Retry against the new server revision using the newer local state. If retries
  // run out, the local record remains untouched and the caller sees an error.
  if(JSON.stringify(await loadLocal())!==localSnapshot)continue;
  await saveLocal(merged);
  return {subject,attempts:attempt,revision:submitted.headers.get('ETag'),state:merged};
 }
 throw new CloudSyncError('Conflict retry limit exceeded: local data remains unchanged',409);
}
