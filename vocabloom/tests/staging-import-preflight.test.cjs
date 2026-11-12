'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');

const html=readFileSync(join(__dirname,'..','staging-import-preflight.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const SUBJECTS=['acc','eco','math','eng','zh'];
const blank=()=>({study:{ans:{},ats:{},known:[],rst:0},srs:{s:{},m:{day:0,newDone:0}}});
const preview=()=>({
 format:'vocabloom-cloud-readonly-snapshot',version:1,
 intendedDestination:'STAGING_ONLY_NO_PRODUCTION',
 capturedAt:'2026-11-12T14:37:13.227Z',
 sourceCapturedAt:'2026-11-12T11:50:55.017Z',
 subjects:Object.fromEntries(SUBJECTS.map(s=>[s,blank()])),
 revisions:Object.fromEntries(SUBJECTS.map(s=>[s,null]))
});
function functions(fetchMock){
 const st=script.slice(script.indexOf('function canonical('),script.indexOf('let busy=false;'));
 assert.ok(st.includes('async function getJson('));
 const ctx={
  SUBJECTS,TextEncoder,MAX_SUBJECT:350000,MAX_FILE:5000000,
  BASE:'https://study-api-cas-staging-only.kasidit09022550.workers.dev',
  PROTOCOL:'vocabloom-cas-staging-v1',
  isRecord:x=>x!==null&&typeof x==='object'&&!Array.isArray(x),
  bytes:x=>new TextEncoder().encode(JSON.stringify(x)).length,
  exactKeys:(obj,expected)=>obj!==null&&typeof obj==='object'&&!Array.isArray(obj)&&
   JSON.stringify(Object.keys(obj).sort())===JSON.stringify([...expected].sort()),
  fail:s=>{throw new Error(s)},
  ensure:(condition,message)=>{if(!condition)throw new Error(message)},
  blank,fetch:fetchMock
 };
 vm.runInNewContext(st+'\nthis.fn={validatePreview,validateProgress,filePreview,getJson,classifyStaging};',ctx,{timeout:1000});
 return ctx.fn;
}
test('Read-only preflight has immutable staging hostname, restrictive CSP and no PUT/POST or storage',()=>{
 assert.ok(script);
 assert.doesNotThrow(()=>new vm.Script(script));
 assert.match(html,/connect-src https:\/\/study-api-cas-staging-only\.kasidit09022550\.workers\.dev/);
 assert.match(html,/form-action 'none'/);
 assert.match(html,/method:'GET'/);
 assert.doesNotMatch(script,/\bmethod\s*:\s*['"](?:PUT|POST|PATCH|DELETE)['"]/);
 assert.doesNotMatch(script,/\b(?:localStorage|sessionStorage|document\.cookie|XMLHttpRequest|WebSocket)\b/);
 assert.doesNotMatch(html,/\bstudy-api\.kasidit09022550\.workers\.dev\b/);
 assert.match(html,/0 Upload \/ 0 PUT \/ 0 Worker Writes/);
});
test('Only accepts explicit verified staging preview with exactly five complete subjects',()=>{
 const {validatePreview}=functions();
 const p=preview();p.subjects.acc.study.ans['32']=0;
 assert.equal(validatePreview(p).subjects.acc.study.ans['32'],0);
 const old=preview();delete old.intendedDestination;
 assert.throws(()=>validatePreview(old),/Staging Preview/);
 const missing=preview();delete missing.subjects.eng;
 assert.throws(()=>validatePreview(missing),/5 วิชา/);
 const extra=preview();extra.subjects.unknown={};
 assert.throws(()=>validatePreview(extra),/5 วิชา/);
 const bad=preview();bad.subjects.zh={study:{ans:{}},srs:{}};
 assert.throws(()=>validatePreview(bad),/Study\/SRS/);
 const secret=preview();secret.SYNC_KEY='private';
 assert.throws(()=>validatePreview(secret),/รหัส/);
 const revisions=preview();revisions.revisions.acc='"0"';
 assert.throws(()=>validatePreview(revisions),/revisions/);
});
test('Treat identical staging subject as safe no-op regardless of revision',()=>{
 const {classifyStaging}=functions();
 const exp=blank();exp.study.ans['32']=0;
 const stored=JSON.parse(JSON.stringify(exp));
 assert.equal(classifyStaging(exp,stored,'"4"'),'already-identical');
});
test('Only truly empty revision zero may receive future imports; never overwrite occupied data',()=>{
 const {classifyStaging}=functions();
 const exp=blank();exp.study.ans['32']=0;
 assert.equal(classifyStaging(exp,blank(),'"0"'),'empty-revision-0');
 assert.equal(classifyStaging(exp,blank(),'"2"'),'blocked-existing-different-data');
 const other=blank();other.study.ans['wrong']=1;
 assert.equal(classifyStaging(exp,other,'"0"'),'blocked-existing-different-data');
 assert.throws(()=>classifyStaging(exp,blank(),'W/"0"'),/Revision/);
});
test('GET only to exact staging routes and no upload of preview JSON',async()=>{
 const calls=[];
 const fetchMock=async(url,opts)=>{
  calls.push({url,opts});
  return {status:200,headers:{get:name=>name==='X-Sync-Revision'?'"0"':null},
   json:async()=>blank()};
 };
 const {getJson}=functions(fetchMock);
 const info=await getJson('/progress/acc','FAKE_STAGING_KEY');
 assert.equal(info.revision,'"0"');
 assert.equal(calls.length,1);
 assert.equal(calls[0].opts.method,'GET');
 assert.equal(calls[0].opts.credentials,'omit');
 assert.equal(calls[0].opts.headers['X-Sync-Key'],'FAKE_STAGING_KEY');
 assert.equal(calls[0].opts.body,undefined);
 await assert.rejects(getJson('/progress/secret','FAKE_STAGING_KEY'),/เส้นทาง/);
 await assert.rejects(getJson('/__staging/probe/abcd','FAKE_STAGING_KEY'),/เส้นทาง/);
 await assert.rejects(getJson('/review','FAKE_STAGING_KEY'),/เส้นทาง/);
});
test('Weak-only ETag, malformed JSON or unauthorized response fail closed',async()=>{
 const workerResponse=(status,etag,json)=>({status,
  headers:{get:name=>name==='ETag'?etag:null},json});
 const no=functions(async()=>workerResponse(401,null,async()=>({})));
 await assert.rejects(no.getJson('/progress/acc','test-key'),/HTTP 401/);
 const weak=functions(async()=>workerResponse(200,'W/"0"',async()=>blank()));
 await assert.rejects(weak.getJson('/progress/acc','test-key'),/revision/);
 const malformed=functions(async()=>workerResponse(200,'"0"',async()=>{throw Error('bad')}));
 await assert.rejects(malformed.getJson('/progress/acc','test-key'),/JSON/);
});
test('Local file chooser preserves preview contents and rejects unrelated files',async()=>{
 const {filePreview}=functions();
 const p=preview();const file={name:'staging-preview.json',size:1300,text:async()=>JSON.stringify(p)};
 assert.equal((await filePreview(file)).format,'vocabloom-cloud-readonly-snapshot');
 await assert.rejects(filePreview({...file,name:'cloud-original.txt'}),/Preview JSON/);
 await assert.rejects(filePreview({...file,size:6000000}),/Preview JSON/);
 await assert.rejects(filePreview({...file,text:async()=>'{broken'}),/JSON/);
});


function reportBuilder(){
 const start=script.indexOf('function makeReport('),end=script.indexOf('function clearReport(');
 assert.ok(start>=0&&end>start);
 const ctx={SUBJECTS,PROTOCOL:'vocabloom-cas-staging-v1',
  isRecord:x=>x!==null&&typeof x==='object'&&!Array.isArray(x),
  ensure:(condition,message)=>{if(!condition)throw new Error(message)}};
 vm.runInNewContext(script.slice(start,end)+'\nthis.buildReport=makeReport;',ctx,{timeout:1000});
 return ctx.buildReport;
}
test('Metadata-only report lists all five subject statuses but excludes answers and secrets',()=>{
 const rows=SUBJECTS.map(subject=>({subject,state:'empty-revision-0',revision:'"0"'}));
 const report=reportBuilder()(rows,false);
 assert.equal(report.format,'vocabloom-staging-readonly-preflight-report');
 assert.equal(report.status,'READ_ONLY_PREFLIGHT_COMPLETE');
 assert.equal(report.productionMigration,'BLOCKED');
 assert.equal(report.mode,'GET_ONLY_NO_WRITES');
 assert.equal(report.subjects.length,5);
 assert.ok(!('study' in report)&&!('secret' in report)&&!('preview' in report));
 const raw=JSON.stringify(report);
 assert.doesNotMatch(raw,/FAKE_STAGING_KEY|SYNC_KEY|NOTION_TOKEN|study\.ans|quizAnswers|progress\/acc/);
 assert.match(html,/id="report".*disabled/);
 assert.match(script,/lastReport=makeReport\(subjectRows,blocked\)/);
 assert.match(script,/function clearReport\(\)/);
});
test('Blocked staging preflight can export redacted BLOCKED report, not permission to import',()=>{
 const rows=SUBJECTS.map(subject=>({subject,state:'already-identical',revision:'"1"'}));
 rows[2].state='blocked-existing-different-data';
 const report=reportBuilder()(rows,true);
 assert.equal(report.status,'BLOCKED_EXISTING_STAGING_DATA');
 assert.equal(report.productionMigration,'BLOCKED');
 assert.equal(report.subjects[2].state,'blocked-existing-different-data');
});
test('Preflight report builder rejects missing subjects or non-strong revisions',()=>{
 const build=reportBuilder();
 const rows=SUBJECTS.map(subject=>({subject,state:'already-identical',revision:'"1"'}));
 assert.throws(()=>build(rows.slice(1),false),/รายงานไม่ครบ/);
 rows[0].revision='W/"1"';
 assert.throws(()=>build(rows,false),/รายงานไม่ครบ/);
 rows[0].revision='"1"';rows[1].state='imported';
 assert.throws(()=>build(rows,false),/รายงานไม่ครบ/);
});
