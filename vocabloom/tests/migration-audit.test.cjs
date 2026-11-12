'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const html=readFileSync(join(__dirname,'..','migration-audit.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const SUBJECTS=['acc','eco','math','eng','zh'];
const KEYS=['study-acc','acc-flashcards-v1-srs','study-eco','econ-flashcards-v1-srs','study-math',
 'math-flashcards-v1-srs','study-eng','eng-vocab-v1-srs','study-zh','zh-vocab-v1-srs'];
function fixture(){
 const el={addEventListener(){},disabled:false,files:[],textContent:''};
 const ctx={document:{getElementById:()=>el},TextEncoder,crypto:require('node:crypto').webcrypto,
  Blob,URL:{createObjectURL:()=>'',revokeObjectURL:()=>{}},setTimeout:()=>{}};
 const expose=script.replace(/\}\)\(\);\s*$/, 'globalThis.__unit={checkLocal,checkRemote,checkAdmin,prepareStagingPreview};})();');
 new vm.Script(expose,{filename:'migration-audit.html'}).runInNewContext(ctx);
 return ctx.__unit;
}
const local=()=>({
 type:'vocabloom-unified-study-backup',version:1,createdAt:'2026-11-12T11:14:59Z',
 vocabloom:{notion:[{id:'one'},{id:'two'}],progress:{},days:{}},
 subjects:Object.fromEntries(KEYS.map(k=>[k,{}]))
});
const cloud=()=>({
 format:'vocabloom-cloud-readonly-snapshot',version:1,capturedAt:'2026-11-12T11:16:00Z',
 subjects:Object.fromEntries(SUBJECTS.map(k=>[k,{}])),
 revisions:Object.fromEntries(SUBJECTS.map(k=>[k,null]))
});
test('Offline auditor parses and uses restrictive zero-network CSP',()=>{
 assert.ok(script);
 assert.doesNotThrow(()=>new vm.Script(script));
 assert.match(html,/connect-src 'none'/);
 assert.match(html,/form-action 'none'/);
 assert.doesNotMatch(script,/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bsendBeacon\b|\blocalStorage\b|\bsessionStorage\b|\bdocument\.cookie\b/);
 assert.doesNotMatch(html,/study-api\.kasidit09022550\.workers\.dev/);
 assert.match(script,/status:'BLOCKED_FOR_PRODUCTION_MIGRATION'/);
 assert.match(script,/networkRequests:0,serverWrites:0/);
});
test('Accepts complete exported local backup and checks all 10 subject slots',()=>{
 const {checkLocal}=fixture();
 const out=checkLocal(local());
 assert.equal(out.notionVocabulary,2);
 assert.equal(Object.keys(out.subjectStorage).length,10);
});
test('Refuses malformed local backup or duplicate Notion word IDs',()=>{
 const {checkLocal}=fixture();
 const doc=local();doc.vocabloom.notion[1].id='one';
 assert.throws(()=>checkLocal(doc),/ซ้ำ/);
 const doc2=local();delete doc2.subjects['study-eng'];
 assert.throws(()=>checkLocal(doc2),/10 ช่อง/);
});
test('Accepts complete cloud export with legacy empty subjects but not incomplete subject records',()=>{
 const {checkRemote}=fixture();
 const result=checkRemote(cloud());
 assert.equal(Object.keys(result.subjects).length,5);
 assert.equal(result.subjects.acc.shape,'empty-object');
 const partial=cloud();
 partial.subjects.acc={study:{ans:{}}};
 assert.throws(()=>checkRemote(partial),/ไม่ครบ/);
});
test('Rejects snapshots containing credentials, invalid revisions or missing subjects',()=>{
 const {checkRemote}=fixture();
 const c=cloud();c.SYNC_KEY='forbidden';
 assert.throws(()=>checkRemote(c),/รหัส/);
 const c2=cloud();c2.revisions.eng='W/"0"';
 assert.throws(()=>checkRemote(c2),/revision/);
 const c3=cloud();delete c3.subjects.zh;
 assert.throws(()=>checkRemote(c3),/5 วิชา/);
});
test('Count summary only, never serializes raw data or identifiers into report',()=>{
 assert.match(script,/local:\{sha256:local.sha256,bytes:local.bytes,\.\.\.localInfo\}/);
 assert.match(script,/cloud:remote\?\{sha256:remote.sha256,bytes:remote.bytes,\.\.\.remoteInfo\}:null/);
 assert.doesNotMatch(script,/lastReport\s*=\s*(?:remote\.value|local\.value|cloudFile|local\.value)/);
 assert.match(script,/no keys, no vocabulary, no individual answers, no device ID/);
});

test('Legacy updated=0 records are preserved as metadata-only, never assumed empty progress',()=>{
 const {checkRemote}=fixture();
 const c=cloud();
 for(const subject of ['eco','math','eng','zh'])c.subjects[subject]={updated:0};
 c.subjects.acc={study:{ans:{'32':0},ats:{'32':0},known:[],rst:0},
  srs:{s:{},m:{day:1,newDone:0}},updated:1234};
 const report=checkRemote(c);
 assert.equal(report.subjects.acc.shape,'complete-progress');
 assert.equal(report.subjects.acc.quizAnswers,1);
 for(const subject of ['eco','math','eng','zh']){
  assert.equal(report.subjects[subject].shape,'legacy-metadata-only');
  assert.equal(report.subjects[subject].quizAnswers,null);
 }
});
test('Audit rejects unsafe partial legacy metadata instead of guessing state',()=>{
 const {checkRemote}=fixture();
 for(const bad of [{updated:123}, {updated:0,ans:{}}, {updated:'0'}, {study:{},updated:0}]){
  const c=cloud();c.subjects.eco=bad;
  assert.throws(()=>checkRemote(c),/ไม่ครบ/);
 }
});

const admin=()=>({
 format:'vocabloom-production-kv-capture-v1',version:1,
 source:'owner-manual-dashboard-kv-pairs-read-only',
 capturedAt:'2026-11-12T12:00:00Z',
 namespaceId:'0123456789abcdef0123456789abcdef',
 entries:Object.fromEntries(SUBJECTS.map(k=>['progress:'+k,null]))
});
const complete=()=>({study:{ans:{},ats:{},known:[],rst:0},
 srs:{s:{},m:{day:0,newDone:0}},updated:123});
test('Offline audit matches independently confirmed absent keys and populated source',()=>{
 const {checkAdmin}=fixture();const c=cloud();const a=admin();
 c.subjects.acc=complete();c.subjects.acc.study.ans['32']=0;
 a.entries['progress:acc']=JSON.stringify(c.subjects.acc);
 for(const k of ['eco','math','eng','zh'])c.subjects[k]={updated:0};
 const result=checkAdmin(a,c);
 assert.equal(result.status,'MATCHED_INDEPENDENT_KV_EXPORT');
 assert.equal(result.stagingPreviewReady,true);
 assert.equal(result.subjects.acc.source,'kv-present');
 assert.equal(result.subjects.acc.apiMatch,true);
 assert.equal(result.subjects.eco.source,'kv-confirmed-absent');
 assert.equal(result.subjects.eco.stagingShapeReady,true);
 assert.ok(!JSON.stringify(result).includes('"32"'));
});
test('KV source mismatch or stale snapshot is caught without exposing answers',()=>{
 const {checkAdmin}=fixture();const c=cloud();const a=admin();
 for(const k of SUBJECTS)c.subjects[k]={updated:0};
 c.subjects.acc=complete();c.subjects.acc.study.ans['32']=0;
 const changed=complete();changed.study.ans['32']=1;
 a.entries['progress:acc']=JSON.stringify(changed);
 const result=checkAdmin(a,c);
 assert.equal(result.status,'MISMATCH_OR_STALE_SOURCE');
 assert.equal(result.stagingPreviewReady,false);
 assert.equal(result.subjects.acc.apiMatch,false);
});
test('An actually stored metadata-only KV record is not safely importable',()=>{
 const {checkAdmin}=fixture();const c=cloud();const a=admin();
 for(const k of SUBJECTS)c.subjects[k]={updated:0};
 a.entries['progress:eco']='{"updated":0}';
 const result=checkAdmin(a,c);
 assert.equal(result.status,'MATCHED_INDEPENDENT_KV_EXPORT');
 assert.equal(result.stagingPreviewReady,false);
 assert.equal(result.subjects.eco.source,'kv-present');
});
test('Never compares invented or incomplete administrative manifests',()=>{
 const {checkAdmin}=fixture();const c=cloud();
 for(const k of SUBJECTS)c.subjects[k]={updated:0};
 const missing=admin();delete missing.entries['progress:zh'];
 assert.throws(()=>checkAdmin(missing,c),/5 คีย์/);
 const extra=admin();extra.entries['progress:unknown']=null;
 assert.throws(()=>checkAdmin(extra,c),/5 คีย์/);
 const fake=admin();fake.source='manual-copy-from-app';
 assert.throws(()=>checkAdmin(fake,c),/Dashboard/);
 const unsafe=admin();unsafe.SYNC_KEY='sensitive';
 assert.throws(()=>checkAdmin(unsafe,c),/รหัส/);
 const malformed=admin();malformed.entries['progress:acc']='{bad json';
 assert.throws(()=>checkAdmin(malformed,c),/JSON/);
});

test('Browser offline staging preview keeps original present KV state intact',()=>{
 const {prepareStagingPreview}=fixture(),c=cloud(),a=admin();
 const acc={study:{ans:{quizA:0},ats:{quizA:0},known:[],rst:0},
  srs:{s:{},m:{day:0,newDone:0}},updated:123};
 c.subjects.acc=acc;a.entries['progress:acc']=JSON.stringify(acc);
 for(const key of ['eco','math','eng','zh'])c.subjects[key]={updated:0};
 const p=prepareStagingPreview(c,a);
 assert.equal(p.intendedDestination,'STAGING_ONLY_NO_PRODUCTION');
 assert.equal(p.subjects.acc.study.ans.quizA,0);
 assert.equal(p.subjects.acc.updated,123);
 assert.equal(Object.keys(p.subjects.eco.study.ans).length,0);
 assert.equal(Object.keys(p.subjects).length,5);
 assert.equal(p.revisions.acc,null);
});
test('Browser preview fails closed on stale data and unverifiable KV source',()=>{
 const {prepareStagingPreview}=fixture(),c=cloud(),a=admin();
 for(const key of SUBJECTS)c.subjects[key]={updated:0};
 a.entries['progress:acc']=JSON.stringify({study:{ans:{x:1}},updated:123});
 assert.throws(()=>prepareStagingPreview(c,a),/Admin KV/);
 a.entries['progress:acc']=null;
 a.source='unverified-source';
 assert.throws(()=>prepareStagingPreview(c,a),/Dashboard/);
 a.source='owner-manual-dashboard-kv-pairs-read-only';
 a.entries['progress:eco']='{"updated":0}';
 assert.throws(()=>prepareStagingPreview(c,a),/Staging/);
});
test('Browser staging preview remains local and requires full verified input',()=>{
 assert.match(html,/id="preview" disabled/);
 assert.match(script,/stagePreview=prepareStagingPreview\(remote\.value,admin\.value\)/);
 assert.match(html,/connect-src 'none'/);
 assert.doesNotMatch(script,/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bsendBeacon\b/);
});
