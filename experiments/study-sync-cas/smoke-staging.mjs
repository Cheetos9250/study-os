/**
 * Staging-only end-to-end smoke test.
 * Writes exclusively to a fresh synthetic probe Durable Object. The five real
 * subject objects are read-only during this check. No production targets allowed.
 *
 * Default CLI: NO NETWORK
 * Live staging:
 *  STAGING_BASE_URL=https://study-api-cas-staging-only.<account>.workers.dev
 *  STAGING_SYNC_KEY=<staging-only-key>
 *  node experiments/study-sync-cas/smoke-staging.mjs --execute --acknowledge-staging-only
 */
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {ensureStagingUrl} from './import-staging.mjs';
import {mergeProgress} from './client.mjs';

const SUBJECTS=['acc','eco','math','eng','zh'];
const PROTOCOL='vocabloom-cas-staging-v1';
const REV=/^"[0-9]+"$/;
const PROBE_ID=/^[a-f0-9]{24}$/;
const empty=()=>({study:{ans:{},ats:{},known:[],rst:0},srs:{s:{},m:{day:0,newDone:0}}});
function check(ok,message){if(!ok)throw Error('Staging smoke aborted: '+message);}
function headers(key,extra={}){return {'X-Sync-Key':key,...extra};}
async function json(response,label){
 check(response.status===200,label+' returned HTTP '+response.status);
 return response.json();
}
async function get(fetchImpl,url,key,origin){
 const res=await fetchImpl(url,{method:'GET',headers:headers(key,origin?{Origin:origin}:{}),cache:'no-store',redirect:'error'});
 const doc=await json(res,'GET '+new URL(url).pathname);
 const etag=res.headers.get('X-Sync-Revision')??res.headers.get('ETag');
 return {doc,etag,status:res.status,response:res};
}
async function put(fetchImpl,url,key,etag,body){
 return fetchImpl(url,{method:'PUT',headers:headers(key,{'Content-Type':'application/json',...(etag?{'If-Match':etag}:{})}),
  body:JSON.stringify(body),redirect:'error'});
}
export async function smokeStaging({
 baseUrl,key,fetchImpl=fetch,origin='https://cheetos9250.github.io',probeId=randomBytes(12).toString('hex')
}={}){
 const base=ensureStagingUrl(baseUrl);
 check(/^https:\/\/study-api-cas-staging-only\.[a-z0-9-]+\.workers\.dev$/i.test(base),
  'only the named HTTPS Workers staging hostname is accepted; local dev is not permitted for this live gate');
 check(typeof key==='string'&&key.trim()&&key.length>=8,'a dedicated staging key is required');
 check(PROBE_ID.test(probeId),'probe id must be exactly 24 lowercase hex characters');
 const p=base+'/__staging/probe/'+probeId;

 // Staging-specific authenticated identity MUST be verified before subject GETs or writes.
 const health=await get(fetchImpl,base+'/__staging/health',key);
 check(health.doc?.staging===true&&health.doc?.protocol===PROTOCOL,
  'missing or incorrect authenticated staging identity');
 check(JSON.stringify(health.doc.subjects)===JSON.stringify(SUBJECTS),
  'unexpected subject list in authenticated staging identity');

 const wrongKey='INTENTIONALLY_WRONG_STAGING_TEST_KEY_'+randomBytes(8).toString('hex');
 const denied=await fetchImpl(p,{method:'GET',headers:headers(wrongKey),redirect:'error'});
 check(denied.status===401,'invalid key must be rejected with 401');
 const outside=await fetchImpl(p,{method:'GET',headers:headers(key,{Origin:'https://untrusted.example'}),redirect:'error'});
 check(outside.status===403,'untrusted origin must be rejected with 403');
 const preflight=await fetchImpl(p,{method:'OPTIONS',headers:{
  Origin:origin,'Access-Control-Request-Method':'PUT',
  'Access-Control-Request-Headers':'x-sync-key,content-type,if-match'
 },redirect:'error'});
 check(preflight.status===204,'browser preflight must return 204');
 check(preflight.headers.get('Access-Control-Allow-Origin')===origin,'preflight origin mismatch');
 check((preflight.headers.get('Access-Control-Allow-Headers')||'').toLowerCase().includes('if-match'),
  'preflight does not allow If-Match');
 check((preflight.headers.get('Access-Control-Expose-Headers')||'').toLowerCase().includes('x-sync-revision'),
  'X-Sync-Revision not exposed to browser JavaScript');

 // Read all five subjects but NEVER write to these real subject namespaces.
 const subjectRevisions={};
 for(const subject of SUBJECTS){
  const r=await get(fetchImpl,base+'/progress/'+subject,key,origin);
  check(REV.test(r.etag||''),'missing revision for '+subject);
  check(r.doc&&typeof r.doc==='object'&&!Array.isArray(r.doc)&&r.doc.study&&r.doc.srs,
   'malformed progress payload for '+subject);
  subjectRevisions[subject]=r.etag;
 }
 const current=await get(fetchImpl,p,key);
 check(current.etag==='"0"','probe unexpectedly exists; refuse to overwrite it');
 check(JSON.stringify(current.doc)===JSON.stringify(empty()),'probe must be initially empty');
 const left=empty(),right=empty();
 left.srs.s['probe-device-a']={ts:101,due:1001};
 right.srs.s['probe-device-b']={ts:102,due:1002};
 const outcomes=await Promise.all([
  put(fetchImpl,p,key,current.etag,left),
  put(fetchImpl,p,key,current.etag,right)
 ]);
 check(JSON.stringify(outcomes.map(r=>r.status).sort((a,b)=>a-b))==='[200,409]',
  'concurrent writes must produce precisely one 200 and one 409');
 const winner=await get(fetchImpl,p,key);
 check(winner.etag==='"1"','winner must increment revision exactly once');
 const losing=outcomes[0].status===409?left:right;
 const combined=mergeProgress(winner.doc,losing);
 const retry=await put(fetchImpl,p,key,winner.etag,combined);
 check(retry.status===200,'fresh revision retry failed with HTTP '+retry.status);
 const final=await get(fetchImpl,p,key);
 check(final.etag==='"2"','retry must increment revision');
 check(final.doc?.srs?.s?.['probe-device-a']&&final.doc?.srs?.s?.['probe-device-b'],
  'concurrent device updates were not both preserved');
 const legacy=await put(fetchImpl,p,key,null,empty());
 check(legacy.status===428,'unconditional legacy write must fail with 428');
 const finalAgain=await get(fetchImpl,p,key);
 check(finalAgain.etag===final.etag&&JSON.stringify(finalAgain.doc)===JSON.stringify(final.doc),
  'rejected legacy write changed the saved probe');
 return {
  status:'PASS',protocol:PROTOCOL,stagingHost:new URL(base).hostname,
  subjectsReadOnly:SUBJECTS,subjectRevisions,
  isolatedProbe:true,checks:['authenticated-staging-marker','wrong-key-401','wrong-origin-403',
   'cors-preflight','five-subject-read-only','concurrent-cas-200-409',
   'conflict-retry-preserves-both-devices','legacy-put-428','final-probe-unchanged']
 };
}
async function cli(){
 const args=process.argv.slice(2);
 if(args.length===0||args.includes('--dry-run')){
  console.log('DRY-RUN: 0 network requests and 0 writes. To run: --execute --acknowledge-staging-only with STAGING_BASE_URL and STAGING_SYNC_KEY.');
  return;
 }
 if(args.length!==2||!args.includes('--execute')||!args.includes('--acknowledge-staging-only'))
  throw Error('Explicit --execute --acknowledge-staging-only required');
 const result=await smokeStaging({baseUrl:process.env.STAGING_BASE_URL,key:process.env.STAGING_SYNC_KEY});
 console.log(JSON.stringify(result,null,2));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 cli().catch(err=>{console.error(err.message);process.exitCode=1;});
}
