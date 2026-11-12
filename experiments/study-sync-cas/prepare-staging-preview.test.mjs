import {test} from 'node:test';
import assert from 'node:assert/strict';
import {writeFile,readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';
import {prepareStagingPreview} from './prepare-staging-preview.mjs';
import {inspectSnapshot,fingerprint} from './import-staging.mjs';

const SUBJECTS=['acc','eco','math','eng','zh'];
const empty=()=>({study:{ans:{},ats:{},known:[],rst:0},srs:{s:{},m:{day:0,newDone:0}}});
function fixtures(){
 const snapshot={
  format:'vocabloom-cloud-readonly-snapshot',version:1,
  capturedAt:'2026-11-12T11:50:55.017Z',
  subjects:Object.fromEntries(SUBJECTS.map(s=>[s,{updated:0}])),
  revisions:Object.fromEntries(SUBJECTS.map(s=>[s,null]))
 };
 const manifest={
  format:'vocabloom-production-kv-capture-v1',version:1,
  capturedAt:'2026-11-12T13:35:56.164Z',
  source:'owner-manual-dashboard-kv-pairs-read-only',
  namespaceId:'0123456789abcdef0123456789abcdef',
  entries:Object.fromEntries(SUBJECTS.map(s=>['progress:'+s,null]))
 };
 return {snapshot,manifest};
}
function withAcc({snapshot,manifest}){
 const raw={...empty(),updated:1794467041811};
 raw.study.ans['32']=0;
 raw.study.ats['32']=0;
 raw.srs.m.day=1794330000000;
 snapshot.subjects.acc=raw;
 manifest.entries['progress:acc']=JSON.stringify(raw);
 return raw;
}
test('Independently verified present/absent keys create complete staging-only data, preserving 0 answers',()=>{
 const fixture=fixtures();const original=withAcc(fixture);
 const {output,summary}=prepareStagingPreview(fixture.snapshot,fixture.manifest);
 assert.equal(summary.status,'STAGING_PREVIEW_READY_NOT_DEPLOYED');
 assert.equal(summary.productionMigration,'BLOCKED');
 assert.equal(summary.stagingWrites,0);
 assert.equal(summary.productionWrites,0);
 assert.equal(output.intendedDestination,'STAGING_ONLY_NO_PRODUCTION');
 assert.equal(output.format,'vocabloom-cloud-readonly-snapshot');
 assert.equal(Object.keys(output.subjects).length,5);
 assert.equal(summary.audit.acc.quizAnswers,1);
 assert.equal(output.subjects.acc.study.ans['32'],0);
 assert.equal(fingerprint(output.subjects.acc),fingerprint(original));
 for(const s of SUBJECTS.slice(1)){
  assert.deepEqual(output.subjects[s],empty());
  assert.equal(summary.sourceStatus[s],'admin-confirmed-missing-key');
 }
 assert.equal(inspectSnapshot(output).audit.acc.sha256,fingerprint(original));
});
test('No admin capture means no preview, even with all synthetic placeholders',()=>{
 const {snapshot}=fixtures();
 assert.throws(()=>prepareStagingPreview(snapshot,null),/manually verified/);
});
test('Wrong KV source provenance, namespace ID or timestamp fails closed',()=>{
 const f=fixtures();
 f.manifest.source='copy-from-cloud-snapshot';
 assert.throws(()=>prepareStagingPreview(f.snapshot,f.manifest),/manually verified/);
 f.manifest.source='owner-manual-dashboard-kv-pairs-read-only';
 f.manifest.namespaceId='unknown';
 assert.throws(()=>prepareStagingPreview(f.snapshot,f.manifest),/manually verified/);
 f.manifest.namespaceId='0123456789abcdef0123456789abcdef';
 f.manifest.capturedAt='not a timestamp';
 assert.throws(()=>prepareStagingPreview(f.snapshot,f.manifest),/invalid ISO timestamp/);
});
test('A mismatch or stale source cannot be transformed and cannot overwrite legitimate answers',()=>{
 const f=fixtures();withAcc(f);
 f.manifest.entries['progress:acc']=JSON.stringify({...empty(),updated:1794467041812});
 assert.throws(()=>prepareStagingPreview(f.snapshot,f.manifest),/differs from Cloud snapshot/);
 const f2=fixtures();withAcc(f2);
 f2.manifest.entries['progress:acc']=null;
 assert.throws(()=>prepareStagingPreview(f2.snapshot,f2.manifest),/differs from Cloud snapshot/);
});
test('Stored metadata-only values are forbidden even if the API returns the same placeholder',()=>{
 const f=fixtures();f.manifest.entries['progress:eco']='{"updated":0}';
 assert.throws(()=>prepareStagingPreview(f.snapshot,f.manifest),/Incomplete stored KV progress eco/);
});
test('Incomplete study/SRS data, malformed raw JSON, secrets, oversized source all refuse preview',()=>{
 const partial=fixtures();partial.snapshot.subjects.acc={updated:1,study:{ans:{}}};
 partial.manifest.entries['progress:acc']=JSON.stringify(partial.snapshot.subjects.acc);
 assert.throws(()=>prepareStagingPreview(partial.snapshot,partial.manifest),/Invalid or incomplete/);
 const bad=fixtures();bad.manifest.entries['progress:acc']='{malformed';
 assert.throws(()=>prepareStagingPreview(bad.snapshot,bad.manifest),/Malformed admin KV JSON/);
 const creds=fixtures();creds.manifest.NOTION_TOKEN='do-not-include';
 assert.throws(()=>prepareStagingPreview(creds.snapshot,creds.manifest),/credential-like fields/);
 const huge=fixtures();huge.snapshot.subjects.acc={...empty(),blob:'x'.repeat(360000)};
 huge.manifest.entries['progress:acc']=JSON.stringify(huge.snapshot.subjects.acc);
 assert.throws(()=>prepareStagingPreview(huge.snapshot,huge.manifest),/exceeds staging limit|size limit/);
});
test('CLI creates private file and existing output is never overwritten',async()=>{
 const f=fixtures();withAcc(f);
 const dir=await mkdtemp(join(tmpdir(),'vocabloom-private-preview-'));
 const script=fileURLToPath(new URL('./prepare-staging-preview.mjs',import.meta.url));
 try{
  const cloud=join(dir,'cloud.json'),kv=join(dir,'manifest.json'),dest=join(dir,'staging.json');
  await writeFile(cloud,JSON.stringify(f.snapshot));
  await writeFile(kv,JSON.stringify(f.manifest));
  const output=execFileSync(process.execPath,[script,
   '--cloud',cloud,'--kv-manifest',kv,'--output',dest],{encoding:'utf8'});
  const actual=JSON.parse(await readFile(dest,'utf8'));
  assert.equal(actual.subjects.acc.study.ans['32'],0);
  assert.equal(inspectSnapshot(actual).audit.acc.quizAnswers,1);
  assert.match(output,/STAGING_PREVIEW_READY_NOT_DEPLOYED/);
  assert.doesNotMatch(output,/"32"|"ans"\s*:/);
  assert.throws(()=>execFileSync(process.execPath,[script,
   '--cloud',cloud,'--kv-manifest',kv,'--output',dest],
   {encoding:'utf8',stdio:'pipe'}));
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('Offline converter never uses network, secrets or production Worker targets',()=>{
 const code=readFileSync(fileURLToPath(new URL('./prepare-staging-preview.mjs',import.meta.url)),'utf8');
 assert.doesNotMatch(code,/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bprocess\.env\b/);
 assert.doesNotMatch(code,/https:\/\/study-api\.kasidit09022550\.workers\.dev/);
 assert.match(code,/flag:'wx',mode:0o600/);
 assert.match(code,/BLOCKED/);
});
