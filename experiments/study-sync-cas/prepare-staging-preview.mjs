/**
 * OFFLINE ONLY: prepare a private, staging-schema-ready snapshot from independently
 * captured production KV values. NEVER reads or writes Cloudflare or GitHub.
 *
 * Do not commit the input/output files. Production cutover remains BLOCKED.
 *
 * node experiments/study-sync-cas/prepare-staging-preview.mjs \
 *   --cloud /private/cloud-snapshot.json \
 *   --kv-manifest /private/kv-capture.json \
 *   --output /private/staging-preview.json
 *
 * The output can be dry-run validated with import-staging.mjs --file, but must
 * NOT be applied without a separately approved staging-only verification.
 */
import {readFile,writeFile,realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {SUBJECTS,inspectLegacySnapshot,compareAdminManifest} from './inspect-legacy-kv.mjs';
import {inspectSnapshot,fingerprint} from './import-staging.mjs';

const MAX_FILE_BYTES=6_000_000;
const MAX_KV_BYTES=350_000;
const isRecord=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const blank=()=>({study:{ans:{},ats:{},known:[],rst:0},srs:{s:{},m:{day:0,newDone:0}}});
const bytes=x=>Buffer.byteLength(JSON.stringify(x),'utf8');
function exactKeys(x,keys){
 return isRecord(x)&&JSON.stringify(Object.keys(x).sort())===JSON.stringify([...keys].sort());
}
function validDate(value,label){
 if(typeof value!=='string'||!Number.isFinite(Date.parse(value)))
  throw Error(label+' missing/invalid ISO timestamp');
 return value;
}
function hasCredentials(obj){
 const serialized=JSON.stringify(obj);
 return /"(?:SYNC_KEY|NOTION_TOKEN|syncKey|notionToken)"\s*:/.test(serialized);
}
export function prepareStagingPreview(snapshot,manifest){
 // Nothing below can write to a remote Worker. All checks run in memory.
 const old=inspectLegacySnapshot(snapshot);
 if(old.status!=='BLOCKED_FOR_PRODUCTION_MIGRATION')
  throw Error('Unexpected source migration status');
 if(!isRecord(manifest)||manifest.format!=='vocabloom-production-kv-capture-v1'||
    manifest.version!==1||manifest.source!=='owner-manual-dashboard-kv-pairs-read-only'||
    typeof manifest.namespaceId!=='string'||
    !/^[a-f0-9]{32}$/i.test(manifest.namespaceId))
  throw Error('A manually verified, namespace-scoped admin KV capture is required');
 validDate(snapshot.capturedAt,'Cloud snapshot');
 validDate(manifest.capturedAt,'Admin capture');
 if(hasCredentials(snapshot)||hasCredentials(manifest))
  throw Error('Input contains credential-like fields');
 if(!exactKeys(manifest.entries,SUBJECTS.map(k=>'progress:'+k)))
  throw Error('Admin KV capture requires exactly five keys');
 const compared=compareAdminManifest(snapshot,manifest);
 if(compared.sourceComparison!=='MATCHED_INDEPENDENT_EXPORT')
  throw Error('KV source differs from Cloud snapshot, or source may be stale; refusing preview');
 const normalized={},sourceStatus={};
 for(const subject of SUBJECTS){
  const raw=manifest.entries['progress:'+subject];
  if(raw===null){
   if(old.subjects[subject].shape!=='legacy-metadata-only'||
      !compared.checks[subject].apiMatch)
    throw Error('Missing KV key '+subject+' lacks an exact source fallback match');
   normalized[subject]=blank();
   sourceStatus[subject]='admin-confirmed-missing-key';
  }else{
   if(typeof raw!=='string'||Buffer.byteLength(raw,'utf8')>MAX_KV_BYTES)
    throw Error('KV key '+subject+' exceeds staging size limit');
   let state;
   try{state=JSON.parse(raw)}catch{throw Error('Malformed raw JSON for '+subject)}
   if(!isRecord(state)||!isRecord(state.study)||!isRecord(state.study.ans)||
      !isRecord(state.study.ats)||!isRecord(state.srs)||!isRecord(state.srs.s)||
      !isRecord(state.srs.m)||
      (state.study.known!==undefined&&!Array.isArray(state.study.known)))
    throw Error('Incomplete stored KV progress '+subject+' — refusing normalization');
   if(bytes(state)>MAX_KV_BYTES)
    throw Error('KV key '+subject+' exceeds staging size limit');
   if(fingerprint(state)!==fingerprint(snapshot.subjects[subject]))
    throw Error('KV '+subject+' no longer matches captured Cloud state');
   normalized[subject]=state; // retain original stored metadata/timestamps
   sourceStatus[subject]='admin-verified-present';
  }
 }
 const output={
  format:'vocabloom-cloud-readonly-snapshot',version:1,
  capturedAt:manifest.capturedAt,
  sourceCapturedAt:snapshot.capturedAt,
  intendedDestination:'STAGING_ONLY_NO_PRODUCTION',
  note:'Offline transformed preview; Missing KV values are normalized ONLY if independently confirmed absent by admin KV capture. Not a production migration approval.',
  subjects:normalized,
  revisions:Object.fromEntries(SUBJECTS.map(s=>[s,null]))
 };
 const checked=inspectSnapshot(output);
 for(const subject of SUBJECTS){
  if(fingerprint(checked.normalized[subject])!==fingerprint(normalized[subject]))
   throw Error('Internal normalization mismatch for '+subject);
 }
 const summary={
  status:'STAGING_PREVIEW_READY_NOT_DEPLOYED',
  productionMigration:'BLOCKED',
  noNetworkCalls:true,productionWrites:0,stagingWrites:0,
  sourceStatus,
  audit:checked.audit,
  captureTime:manifest.capturedAt,
  cloudCaptureTime:snapshot.capturedAt
 };
 return {output,summary};
}
function hashRaw(buf){return createHash('sha256').update(buf).digest('hex');}
async function parseFile(file){
 const raw=await readFile(file);
 if(raw.byteLength>MAX_FILE_BYTES)throw Error('Input JSON file exceeds maximum safe size');
 let value;
 try{value=JSON.parse(raw.toString('utf8'))}catch{throw Error('Invalid input JSON: '+file)}
 return {value,digest:hashRaw(raw)};
}
async function cli(args){
 const flags={};
 for(let i=0;i<args.length;i++){
  const flag=args[i];
  if(!['--cloud','--kv-manifest','--output'].includes(flag)||!args[i+1]||flags[flag])
   throw Error('Usage: --cloud <file> --kv-manifest <file> --output <private-file>');
  flags[flag]=args[++i];
 }
 if(!flags['--cloud']||!flags['--kv-manifest']||!flags['--output'])
  throw Error('All three flags are required; no implicit source or target');
 const cloudFile=resolve(flags['--cloud']),kvFile=resolve(flags['--kv-manifest']);
 const outFile=resolve(flags['--output']);
 if([cloudFile,kvFile].includes(outFile))throw Error('Output cannot overwrite input');
 const repoRoot=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
 const realRoot=await realpath(repoRoot);
 const outputDirectory=await realpath(dirname(outFile));
 if(outputDirectory===realRoot||outputDirectory.startsWith(realRoot+sep))
  throw Error('Refusing to write private study data inside public repository');
 const [cloud,admin]=await Promise.all([parseFile(cloudFile),parseFile(kvFile)]);
 const {output,summary}=prepareStagingPreview(cloud.value,admin.value);
 // Exclusive creation, private mode, no modification of existing files.
 await writeFile(outFile,JSON.stringify(output,null,2),{flag:'wx',mode:0o600});
 console.log(JSON.stringify({...summary,
  cloudFileSha256:cloud.digest,kvManifestSha256:admin.digest,
  outputFile:'created in private directory (path hidden)',
  outputBytes:bytes(output)},null,2));
 console.error('No Worker requests were sent. Never run a production import.');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 cli(process.argv.slice(2)).catch(e=>{console.error('Preview blocked:',e.message);process.exitCode=1});
}
