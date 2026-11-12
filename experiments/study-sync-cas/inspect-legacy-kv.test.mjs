import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {inspectLegacySnapshot,compareAdminManifest,SUBJECTS} from './inspect-legacy-kv.mjs';

const here=dirname(fileURLToPath(import.meta.url));
const script=readFileSync(join(here,'inspect-legacy-kv.mjs'),'utf8');
const empty=()=>({study:{ans:{},ats:{},known:[],rst:0},srs:{s:{},m:{day:0,newDone:0}}});
const cloud=()=>({
 format:'vocabloom-cloud-readonly-snapshot',version:1,
 capturedAt:'2026-11-12T11:50:55.017Z',
 subjects:Object.fromEntries(SUBJECTS.map(k=>[k,{updated:0}])),
 revisions:Object.fromEntries(SUBJECTS.map(k=>[k,null]))
});
const admin=()=>({
 format:'vocabloom-production-kv-capture-v1',version:1,
 capturedAt:'2026-11-12T11:55:00.000Z',
 entries:Object.fromEntries(SUBJECTS.map(k=>['progress:'+k,null]))
});
test('All legacy placeholders remain unknown, never interpreted as confirmed empty',()=>{
 const result=inspectLegacySnapshot(cloud());
 assert.equal(result.status,'BLOCKED_FOR_PRODUCTION_MIGRATION');
 assert.equal(result.allVersionsMissing,true);
 for(const s of SUBJECTS){
  assert.equal(result.subjects[s].shape,'legacy-metadata-only');
  assert.equal(result.subjects[s].quizAnswers,null);
  assert.equal(result.subjects[s].reviewCards,null);
 }
});
test('Populated Accounting survives a source snapshot audit without writing',()=>{
 const s=cloud();
 s.subjects.acc={...empty(),updated:1794467041811};
 s.subjects.acc.study.ans['32']=0;
 const v=inspectLegacySnapshot(s);
 assert.equal(v.subjects.acc.shape,'complete-progress');
 assert.equal(v.subjects.acc.quizAnswers,1);
 assert.equal(v.subjects.eco.shape,'legacy-metadata-only');
 const a=admin();a.entries['progress:acc']=JSON.stringify(s.subjects.acc);
 const compare=compareAdminManifest(s,a);
 assert.equal(compare.sourceComparison,'MATCHED_INDEPENDENT_EXPORT');
 assert.equal(compare.status,'BLOCKED_FOR_PRODUCTION_MIGRATION');
});
test('A missing KV key cannot be silently matched to real cloud answers',()=>{
 const s=cloud();s.subjects.acc={...empty(),updated:1};
 const result=compareAdminManifest(s,admin());
 assert.equal(result.sourceComparison,'MISMATCH_OR_STALE_READ');
 assert.equal(result.checks.acc.apiMatch,false);
});
test('A present KV key and empty placeholder are not equivalent',()=>{
 const s=cloud();const a=admin();
 a.entries['progress:math']=JSON.stringify(empty());
 const result=compareAdminManifest(s,a);
 assert.equal(result.checks.math.apiMatch,false);
});
test('Mismatched or malformed manifests fail closed',()=>{
 const s=cloud();const a=admin();
 delete a.entries['progress:zh'];
 assert.throws(()=>compareAdminManifest(s,a),/exact 5 KV keys/);
 const b=admin();b.entries['progress:acc']='not json';
 assert.throws(()=>compareAdminManifest(s,b),/Malformed admin KV JSON/);
 const c=admin();c.SYNC_KEY='secret';
 assert.throws(()=>compareAdminManifest(s,c),/Credentials forbidden/);
});
test('Rejects malformed or over-broad source snapshots',()=>{
 const s=cloud();s.subjects.zh={updated:0,study:{}};
 assert.throws(()=>inspectLegacySnapshot(s),/Invalid or incomplete/);
 const t=cloud();t.revisions.acc='W/"0"';
 assert.throws(()=>inspectLegacySnapshot(t),/Invalid acc revision/);
 const u=cloud();u.subjects.not_a_real_subject={updated:0};
 assert.throws(()=>inspectLegacySnapshot(u),/exact subject coverage/);
});
test('Inspector contains no network calls, writes or hardcoded account secrets',()=>{
 assert.doesNotMatch(script,/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bprocess\.env\b/);
 assert.doesNotMatch(script,/\b(?:writeFile|unlink|rmSync|appendFile|PUT|PATCH|DELETE)\s*\(/);
 assert.match(script,/BLOCKED_FOR_PRODUCTION_MIGRATION/);
 assert.match(script,/readFile/);
});
