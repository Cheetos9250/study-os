'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const ROOT=join(__dirname,'../..');
const read=path=>readFileSync(join(ROOT,path),'utf8');
const ORIGINAL='https://study-api.kasidit09022550.workers.dev';
const NEW='https://example-progress-worker.invalid';
const SUBJECTS=['acc.html','eco.html','math.html','eng.html','zh.html'];
function extractReview(path){
 const src=read(path);
 const start=src.indexOf('async function syncViaApi(){');
 const end=src.indexOf('async function syncNotion(){',start);
 assert.ok(start>=0&&end>start);
 return {src,review:src.slice(start,end)};
}
async function simulateReview(path,{reviewReady=true}={}){
 const {review}=extractReview(path);
 const panel={disabled:false,textContent:'',className:''};
 const calls=[];
 const ctx={
  syncing:false,fcat:'chapter-1',PASS:0.8,STEPS:[1,3,7,14,30],
  D:{pages:{'chapter-1':'notion-page-0001'}},
  scopeT:()=>({g:9,n:10}),
  $:()=>panel,
  catLabel:()=> 'Chapter 1',
  window:{__xs:{
   api:()=> NEW,
   hdr:()=>({'X-Sync-Key':'PROGRESS_KEY_MUST_NEVER_BE_SENT_TO_NOTION'}),
   reviewApi:async()=>ORIGINAL,
   reviewReady:()=>reviewReady,
   reviewHdr:()=>({'X-Sync-Key':'ORIGINAL_KEY_FOR_NOTION','Content-Type':'application/json'})
  }},
  fetch:async(url,opts)=>{
   calls.push({url,opts});
   return {status:200,ok:true,json:async()=>({ok:true,already:true,step:1})};
  }
 };
 vm.runInNewContext(review+'\nthis.runReview=syncViaApi;',ctx,{timeout:1000});
 await ctx.runReview();
 return {calls,panel,ctx};
}
test('All five Notion review flows send old content key ONLY to original content API',async()=>{
 for(const file of SUBJECTS){
  const {src,review}=extractReview(file);
  assert.match(src,/window\.__xs\.reviewReady\(\)/,file);
  assert.match(src,/contentApi=original; api=next;/,file);
  assert.match(src,/reviewApi:async\(\)=>\{await cfg\(\);return contentApi;\}/,file);
  assert.match(src,/reviewHdr:\(\)=>\(\{'X-Sync-Key':contentKey\(\)/,file);
  assert.doesNotMatch(review,/X\.api\(\)|X\.hdr\(\)/,file);
  const {calls,panel}=await simulateReview(file);
  assert.equal(calls.length,1,file);
  assert.equal(calls[0].url,ORIGINAL+'/review',file);
  assert.equal(calls[0].opts.method,'POST',file);
  assert.equal(calls[0].opts.headers['X-Sync-Key'],'ORIGINAL_KEY_FOR_NOTION',file);
  assert.ok(!JSON.stringify(calls).includes('PROGRESS_KEY_MUST_NEVER_BE_SENT_TO_NOTION'),file);
  const body=JSON.parse(calls[0].opts.body);
  assert.equal(body.page,'notion-page-0001');
  assert.equal(body.pass,true);
  assert.equal(panel.textContent,'บันทึกแล้ว ✓');
 }
});
test('Missing original Notion credential blocks all /review requests, regardless of progress token',async()=>{
 for(const file of SUBJECTS){
  const {calls,panel}=await simulateReview(file,{reviewReady:false});
  assert.equal(calls.length,0,file);
  assert.match(panel.textContent,/ติดต่อเซิร์ฟเวอร์ซิงก์ไม่ได้/);
 }
});
test('Original review API still has a separate host and credential after future split',()=>{
 for(const file of SUBJECTS){
  const src=read(file);
  assert.match(src,/const original=String\(j\.api\|\|''\)/,file);
  assert.match(src,/const next=String\(j\.progress_api\|\|original\)/,file);
  assert.match(src,/progressKeyName=next&&next!==original\?PROGRESS_LSK:LSK/,file);
  assert.match(src,/const contentKey=\(\)=>\{ try\{ return localStorage\.getItem\(LSK\)\|\|''; \}/,file);
  assert.match(src,/reviewReady\(\)\{return !!\(contentApi&&contentKey\(\)\)\}/,file);
 }
});


function extractDispatcher(path){
 const src=read(path);
 const start=src.indexOf('async function syncNotion(){');
 const end=src.indexOf('\n}\n',start);
 assert.ok(start>=0&&end>start,'Notion review dispatcher missing in '+path);
 return src.slice(start,end+2);
}
async function simulateDispatch(path,{reviewReady=false,progressReady=false,owner=false,hasConnector=false}={}){
 let apiCalls=0;const connector=[];
 const outputs={syncBtn:{disabled:false,textContent:''},syncMsg:{className:'',textContent:''}};
 const ctx={
  owner,mcp:hasConnector?{
   callTool:async(not,operation,body)=>{
    connector.push({not,operation,body});
    if(operation==='notion-fetch')return {payload:'{"Review Step":1}'};
    return {ok:true};
   }
  }:null,
  window:{__xs:{ready:()=>progressReady,reviewReady:()=>reviewReady}},
  syncViaApi:async()=>{apiCalls++;return 'api-review'},
  D:{pages:{chapter:'synthetic-notion-page'}},
  fcat:'chapter',syncing:false,scopeT:()=>({g:9,n:10}),PASS:0.8,
  $:id=>outputs[id.replace(/^#/,'')]||{},
  STEPS:[1,3,7,14,30],
  NOTION:'Notion',
  todayBkk:()=> '2026-11-12',catLabel:()=> 'Chapter',
  errText:()=> 'connector failed'
 };
 vm.runInNewContext(extractDispatcher(path)+'\nthis.dispatch=syncNotion;',ctx,{timeout:1000});
 await ctx.dispatch();
 return {apiCalls,connector,outputs};
}
test('Notion action uses original-content readiness even when new Progress credential is absent',async()=>{
 for(const file of SUBJECTS){
  const result=await simulateDispatch(file,{reviewReady:true,progressReady:false});
  assert.equal(result.apiCalls,1,file);
  assert.equal(result.connector.length,0,file);
 }
});
test('Notion action must not use the CAS progress key as fallback when content key is missing',async()=>{
 for(const file of SUBJECTS){
  const result=await simulateDispatch(file,{reviewReady:false,progressReady:true});
  assert.equal(result.apiCalls,0,file);
  assert.equal(result.connector.length,0,file);
 }
});
test('Direct Notion connector retains priority when it is explicitly available',async()=>{
 for(const file of SUBJECTS){
  const result=await simulateDispatch(file,{
   reviewReady:true,progressReady:false,owner:true,hasConnector:true
  });
  assert.equal(result.apiCalls,0,file);
  assert.deepEqual(result.connector.map(x=>x.operation),['notion-fetch','notion-update-page']);
  assert.equal(result.connector[1].body.properties['Review Step'],2);
  assert.equal(result.outputs.syncBtn.textContent,'บันทึกแล้ว ✓');
 }
});
