/**
 * Strict, staging-only importer for VocaBloom's read-only Cloud snapshot.
 * NEVER targets the production study-api Worker and NEVER deploys anything.
 *
 * Dry run:
 *   node experiments/study-sync-cas/import-staging.mjs --file ./snapshot.json
 *
 * Staging import (ONLY after a separate test Worker has been configured):
 *   STAGING_SYNC_KEY=<test-only-secret> node experiments/study-sync-cas/import-staging.mjs \
 *     --file ./snapshot.json \
 *     --staging-url https://study-api-cas-staging-only.<account>.workers.dev \
 *     --apply --acknowledge-staging-only
 */
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const SUBJECTS=Object.freeze(['acc','eco','math','eng','zh']);
const MAX_SUBJECT_BYTES=350_000;
const MAX_INPUT_BYTES=5_000_000;
const REVISION=/^"[0-9]+"$/;
const isRecord=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const clone=x=>JSON.parse(JSON.stringify(x));
const empty=()=>({study:{ans:{},ats:{},known:[],rst:0},srs:{s:{},m:{day:0,newDone:0}}});
const bytes=value=>Buffer.byteLength(JSON.stringify(value),'utf8');

function canonical(value){
 if(Array.isArray(value))return value.map(canonical);
 if(!isRecord(value))return value;
 const out={};
 for(const key of Object.keys(value).sort())out[key]=canonical(value[key]);
 return out;
}
export function fingerprint(value){
 return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
}
export function validateProgress(subject,raw){
 if(!isRecord(raw))throw Error('Invalid '+subject+': expected JSON object');
 // Legacy KV may have an absent subject represented as {}. Preserve this as
 // a logically empty subject, but never normalize a partially shaped record.
 if(Object.keys(raw).length===0)return empty();
 if(!isRecord(raw.study)||!isRecord(raw.srs)||
    !isRecord(raw.study.ans)||!isRecord(raw.study.ats)||
    !isRecord(raw.srs.s)||!isRecord(raw.srs.m))
   throw Error('Incomplete '+subject+' study/srs structure; refusing to import');
 if(raw.study.known!==undefined&&!Array.isArray(raw.study.known))
   throw Error('Invalid '+subject+' known list');
 if(bytes(raw)>MAX_SUBJECT_BYTES)
   throw Error('Subject '+subject+' exceeds staging Worker size limit');
 return clone(raw);
}
export function inspectSnapshot(doc){
 if(!isRecord(doc)||doc.format!=='vocabloom-cloud-readonly-snapshot'||doc.version!==1)
   throw Error('Not a VocaBloom read-only Cloud snapshot (format/version mismatch)');
 if(!isRecord(doc.subjects))
   throw Error('Cloud snapshot is missing its subject map');
 const given=Object.keys(doc.subjects).sort();
 if(JSON.stringify(given)!==JSON.stringify([...SUBJECTS].sort()))
   throw Error('A complete snapshot must contain exactly acc, eco, math, eng and zh');
 if(Object.hasOwn(doc,'SYNC_KEY')||Object.hasOwn(doc,'syncKey')||Object.hasOwn(doc,'headers'))
   throw Error('Unexpected credentials or headers in snapshot');
 const normalized={},audit={};
 for(const subject of SUBJECTS){
  const state=validateProgress(subject,doc.subjects[subject]);
  normalized[subject]=state;
  audit[subject]={
   quizAnswers:Object.keys(state.study.ans).length,
   cards:Object.keys(state.srs.s).filter(k=>!k.startsWith('vb/v1/')).length,
   activityShadows:Object.keys(state.srs.s).filter(k=>k.startsWith('vb/v1/')).length,
   bytes:bytes(state),sha256:fingerprint(state)
  };
 }
 return {normalized,audit,sourceCapturedAt:typeof doc.capturedAt==='string'?doc.capturedAt:null};
}
export function ensureStagingUrl(baseUrl){
 let url;
 try{url=new URL(baseUrl)}catch{throw Error('Invalid staging URL');}
 const testOnlyHost=/^study-api-cas-staging-only\.[a-z0-9.-]+\.workers\.dev$/i.test(url.hostname);
 const localhost=/^(localhost|127\.0\.0\.1)$/.test(url.hostname);
 if(!testOnlyHost&&!localhost)
   throw Error('Refusing non-staging host. Only study-api-cas-staging-only.*.workers.dev or localhost is allowed');
 if((!localhost&&url.protocol!=='https:')||(localhost&&!['http:','https:'].includes(url.protocol))||
    url.username||url.password||url.search||url.hash||url.pathname!=='/'&&url.pathname!==''||
    (!localhost&&url.port))
   throw Error('Unsafe staging URL components or non-HTTPS URL');
 return url.origin;
}
function isEmptyRemote(value){
 const state=validateProgress('existing staging',value);
 return Object.keys(state.study.ans).length===0 &&
  Object.keys(state.study.ats).length===0 &&
  (state.study.known||[]).length===0 &&
  Number(state.study.rst||0)===0 &&
  Object.keys(state.srs.s).length===0 &&
  Number(state.srs.m?.newDone||0)===0;
}
function resolveRevision(response){
 const etag=response.headers?.get?.('ETag');
 if(!REVISION.test(etag||''))
   throw Error('Staging Worker missing quoted numeric ETag; refusing to write');
 return etag;
}
async function readRemote(fetchImpl,url,key){
 const res=await fetchImpl(url,{method:'GET',headers:{'X-Sync-Key':key},cache:'no-store',redirect:'error'});
 if(!res.ok)throw Error('Staging GET failed ('+res.status+')');
 const revision=resolveRevision(res);
 const text=await res.text();
 if(Buffer.byteLength(text,'utf8')>MAX_SUBJECT_BYTES*2)throw Error('Staging response too large');
 let doc;
 try{doc=JSON.parse(text)}catch{throw Error('Staging returned malformed JSON');}
 return {revision,data:validateProgress('existing staging',doc)};
}
export async function importIntoStaging(snapshot,{baseUrl,key,fetchImpl=fetch}={}){
 const target=ensureStagingUrl(baseUrl);
 if(typeof key!=='string'||!key.trim())throw Error('Missing staging-only sync key');
 const {normalized,audit}=inspectSnapshot(snapshot);
 const headers={'X-Sync-Key':key,'Content-Type':'application/json'};
 const plan=[];
 // Preflight *ALL FIVE* before writing any subject to avoid overwriting an
 // unexpected staging dataset or silently importing only a subset.
 for(const subject of SUBJECTS){
  const url=target+'/progress/'+subject;
  const current=await readRemote(fetchImpl,url,key);
  const same=fingerprint(current.data)===fingerprint(normalized[subject]);
  if(same){
   plan.push({subject,url,status:'already-identical',revision:current.revision});
  }else if(current.revision==='"0"'&&isEmptyRemote(current.data)){
   plan.push({subject,url,status:'empty',revision:current.revision});
  }else{
   throw Error('Staging '+subject+' contains unexpected data or revision: no writes performed');
  }
 }
 const done=[];
 for(const item of plan){
  if(item.status==='already-identical'){
   done.push({subject:item.subject,status:'already-identical',sha256:audit[item.subject].sha256});
   continue;
  }
  const response=await fetchImpl(item.url,{
   method:'PUT',
   headers:{...headers,'If-Match':item.revision},
   body:JSON.stringify(normalized[item.subject]),
   redirect:'error'
  });
  if(!response.ok){
   throw Error('Staging PUT '+item.subject+' rejected ('+response.status+') after '+done.length+
    ' subject(s); rerun the SAME snapshot to resume safely. Do not reset staging.');
  }
  const verified=await readRemote(fetchImpl,item.url,key);
  if(fingerprint(verified.data)!==audit[item.subject].sha256)
   throw Error('Staging readback mismatch for '+item.subject+'; STOP and inspect staging');
  done.push({subject:item.subject,status:'imported-and-verified',
    revision:verified.revision,sha256:audit[item.subject].sha256});
 }
 return {target,subjects:done};
}

function parseArgs(argv){
 const result={};
 for(let i=0;i<argv.length;i++){
  const a=argv[i];
  if(a==='--apply'||a==='--acknowledge-staging-only')result[a.slice(2)]=true;
  else if(a==='--file'||a==='--staging-url'){
   if(!argv[i+1])throw Error(a+' needs a value');
   result[a.slice(2)]=argv[++i];
  }else throw Error('Unknown argument '+a);
 }
 return result;
}
async function cli(){
 const args=parseArgs(process.argv.slice(2));
 if(!args.file)throw Error('Usage: --file <cloud-snapshot.json> [--staging-url URL --apply --acknowledge-staging-only]');
 const file=await readFile(args.file);
 if(file.length>MAX_INPUT_BYTES)throw Error('Snapshot exceeds '+MAX_INPUT_BYTES+' byte limit');
 const snap=JSON.parse(file.toString('utf8'));
 const report=inspectSnapshot(snap);
 // Print only hashes and counts, never the actual questions/answers or key.
 console.log(JSON.stringify({mode:args.apply?'staging-import':'DRY-RUN (no network/no writes)',
  capturedAt:report.sourceCapturedAt,audit:report.audit},null,2));
 if(!args.apply)return;
 if(!args['acknowledge-staging-only'])
   throw Error('Apply requires --acknowledge-staging-only');
 const result=await importIntoStaging(snap,{baseUrl:args['staging-url'],key:process.env.STAGING_SYNC_KEY});
 console.log(JSON.stringify(result,null,2));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 cli().catch(e=>{console.error('Staging import aborted:',e.message);process.exitCode=1;});
}
