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
 const expose=script.replace(/\}\)\(\);\s*$/, 'globalThis.__unit={checkLocal,checkRemote};})();');
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
 assert.equal(result.subjects.acc.emptyLegacy,true);
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
