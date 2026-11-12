/**
 * Read-only migration gate for the original Cloudflare Worker using KV binding PROGRESS.
 *
 * Inputs are LOCAL files only. No fetch/network and no KV writes.
 * Do NOT commit either private source file to GitHub.
 *
 * node experiments/study-sync-cas/inspect-legacy-kv.mjs --cloud ./cloud-snapshot.json
 *
 * For comparison AFTER the owner obtains an independently verified admin KV export:
 * node experiments/study-sync-cas/inspect-legacy-kv.mjs \
 *   --cloud ./cloud-snapshot.json --kv-manifest ./private-admin-kv-manifest.json
 *
 * Admin manifest schema:
 * {
 *   "format":"vocabloom-production-kv-capture-v1", "version":1,
 *   "capturedAt":"2026-11-12T11:50:55.000Z",
 *   "entries":{
 *     "progress:acc":"<raw JSON string from KV, not parsed / mutated>",
 *     "progress:eco":null, "progress:math":null,
 *     "progress:eng":null, "progress:zh":null
 *   }
 * }
 * null means an administrator confirmed a missing KV key; not simply an API placeholder.
 */
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const SUBJECTS=Object.freeze(['acc','eco','math','eng','zh']);
const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const keys=o=>Object.keys(o);
function canonical(x){
 if(Array.isArray(x))return x.map(canonical);
 if(!isObject(x))return x;
 return Object.fromEntries(keys(x).sort().map(k=>[k,canonical(x[k])]));
}
const fingerprint=x=>createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex');
const bytes=x=>Buffer.byteLength(JSON.stringify(x),'utf8');
function exactKeys(x,expected){
 return isObject(x)&&JSON.stringify(keys(x).sort())===JSON.stringify([...expected].sort());
}
function progressShape(raw){
 if(exactKeys(raw,['updated'])&&raw.updated===0)
  return 'legacy-metadata-only';
 if(isObject(raw)&&isObject(raw.study)&&isObject(raw.study.ans)&&
    isObject(raw.study.ats)&&isObject(raw.srs)&&isObject(raw.srs.s)&&
    isObject(raw.srs.m)&&
    (raw.study.known===undefined||Array.isArray(raw.study.known)))
  return 'complete-progress';
 return 'invalid-or-incomplete';
}
export function inspectLegacySnapshot(snapshot){
 if(!isObject(snapshot)||snapshot.format!=='vocabloom-cloud-readonly-snapshot'||
    snapshot.version!==1||!exactKeys(snapshot.subjects,SUBJECTS))
  throw Error('Cloud snapshot format or exact subject coverage invalid');
 if(snapshot.SYNC_KEY!==undefined||snapshot.syncKey!==undefined||snapshot.headers!==undefined)
  throw Error('Unexpected secret/header fields in snapshot');
 const report={status:'BLOCKED_FOR_PRODUCTION_MIGRATION',
  note:'Snapshot confirms Worker GET output, not authoritative KV key existence.',
  subjects:{},allVersionsMissing:true};
 for(const subject of SUBJECTS){
  const state=snapshot.subjects[subject];
  const shape=progressShape(state);
  if(shape==='invalid-or-incomplete')throw Error('Invalid or incomplete '+subject+' state; no migration');
  if(bytes(state)>350000)throw Error('Subject '+subject+' exceeds staging limit');
  const rev=snapshot.revisions?.[subject]??null;
  if(rev!==null&&!/^"[0-9]+"$/.test(rev))throw Error('Invalid '+subject+' revision');
  report.allVersionsMissing&&=rev===null;
  report.subjects[subject]={
   shape,
   quizAnswers:shape==='complete-progress'?keys(state.study.ans).length:null,
   reviewCards:shape==='complete-progress'?keys(state.srs.s).length:null,
   bytes:bytes(state),sourceFingerprint:fingerprint(state),
   hasStrongRevision:rev!==null
  };
 }
 return report;
}
export function compareAdminManifest(snapshot,manifest){
 const summary=inspectLegacySnapshot(snapshot);
 if(!isObject(manifest)||manifest.format!=='vocabloom-production-kv-capture-v1'||
    manifest.version!==1||!exactKeys(manifest.entries,SUBJECTS.map(k=>'progress:'+k)))
  throw Error('Invalid admin manifest: exact 5 KV keys or format missing');
 if(manifest.SYNC_KEY!==undefined||manifest.NOTION_TOKEN!==undefined)
  throw Error('Credentials forbidden in admin manifest');
 const checks={};
 for(const subject of SUBJECTS){
  const raw=manifest.entries['progress:'+subject];
  if(raw===null){
   checks[subject]={
    kvStatus:'confirmed-missing-by-admin-export',
    apiMatch:summary.subjects[subject].shape==='legacy-metadata-only'
   };
  }else{
   if(typeof raw!=='string'||raw.length>900*1024)
    throw Error('KV value for '+subject+' must be original raw JSON string');
   let parsed;try{parsed=JSON.parse(raw)}catch{throw Error('Malformed admin KV JSON for '+subject)}
   checks[subject]={
    kvStatus:'present',
    apiMatch:fingerprint(parsed)===fingerprint(snapshot.subjects[subject]),
    bytes:Buffer.byteLength(raw,'utf8'),sourceFingerprint:fingerprint(parsed)
   };
  }
 }
 const matches=SUBJECTS.every(s=>checks[s].apiMatch);
 return {
  status:'BLOCKED_FOR_PRODUCTION_MIGRATION',
  sourceComparison:matches?'MATCHED_INDEPENDENT_EXPORT':'MISMATCH_OR_STALE_READ',
  checks,
  advisory:'Read-only comparison only. No application of data; still require frozen writers, backend code review, backup/restore validation and explicit cutover approval.'
 };
}
async function fromFile(path){
 const b=await readFile(path);
 if(b.length>6_000_000)throw Error('Input too large');
 return JSON.parse(b.toString('utf8'));
}
async function cli(args){
 const parsed={};
 for(let i=0;i<args.length;i++){
  const flag=args[i];
  if(!['--cloud','--kv-manifest'].includes(flag)||!args[i+1])
   throw Error('Usage: --cloud <cloud-snapshot.json> [--kv-manifest <private-kv-manifest.json>]');
  parsed[flag]=args[++i];
 }
 if(!parsed['--cloud'])throw Error('Cloud snapshot path required');
 const snapshot=await fromFile(parsed['--cloud']);
 const result={snapshot:inspectLegacySnapshot(snapshot)};
 if(parsed['--kv-manifest'])
  result.adminComparison=compareAdminManifest(snapshot,await fromFile(parsed['--kv-manifest']));
 console.log(JSON.stringify(result,null,2));
 // Always fail closed for a production cutover even when a read-only comparison matches.
 console.error('Production migration remains BLOCKED: this command never writes data.');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 cli(process.argv.slice(2)).catch(e=>{console.error('Audit failed:',e.message);process.exitCode=1});
