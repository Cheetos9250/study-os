'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');

const html=readFileSync(join(__dirname,'..','staging-exit-check.html'),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const SUBJECTS=['acc','eco','math','eng','zh'];
const BASE='https://study-api-cas-staging-only.kasidit09022550.workers.dev';
const blank=()=>({study:{ans:{},ats:{},known:[],rst:0},srs:{s:{},m:{day:0,newDone:0}}});
const clone=v=>JSON.parse(JSON.stringify(v));
const preview=()=>{
 const subjects=Object.fromEntries(SUBJECTS.map(s=>[s,blank()]));
 subjects.acc.study.ans['32']=0;
 subjects.acc.study.ats['32']=0;
 subjects.acc.updated=1794467041811;
 return {
  format:'vocabloom-cloud-readonly-snapshot',version:1,
  intendedDestination:'STAGING_ONLY_NO_PRODUCTION',
  capturedAt:'2026-11-12T14:37:13.227Z',
  sourceCapturedAt:'2026-11-12T11:50:55.017Z',
  subjects,revisions:Object.fromEntries(SUBJECTS.map(s=>[s,null]))
 };
};
function setup({accRev=1,altered=false,otherRev=0,httpStatus=200,weakTag=false}={}){
 const documentElements=Object.fromEntries(
  ['preview','secret','check','report','clear','result'].map(id=>[id,{
   value:'',disabled:false,textContent:'',files:[],handlers:{},
   addEventListener(type,fn){this.handlers[type]=fn;}
  }])
 );
 const p=preview();
 documentElements.preview.files=[{name:'staging-preview.json',size:1800,text:async()=>JSON.stringify(p)}];
 documentElements.secret.value='PRIVATE_TEST_STAGING_KEY';
 const calls=[],downloaded=[];
 const fetch=async(url,options)=>{
  calls.push({url,options});
  assert.ok(url.startsWith(BASE+'/'));
  assert.equal(options.method,'GET');
  assert.equal(options.credentials,'omit');
  assert.equal(options.redirect,'error');
  assert.equal(options.body,undefined);
  if(url===BASE+'/__staging/health'){
   return {status:httpStatus,headers:{get:()=>null},
    json:async()=>({staging:true,protocol:'vocabloom-cas-staging-v1',subjects:SUBJECTS})};
  }
  const match=url.match(/\/progress\/(acc|eco|math|eng|zh)$/);
  assert.ok(match);
  const s=match[1];
  const value=clone(p.subjects[s]);
  if(altered&&s==='acc')value.study.ans['32']=1;
  const rev=s==='acc'?accRev:otherRev;
  return {status:httpStatus,headers:{get:k=>
   k==='X-Sync-Revision'?(weakTag?'W/"'+rev+'"':'"'+rev+'"'):null},
   json:async()=>value};
 };
 const document={getElementById:id=>documentElements[id],
  createElement:()=>({download:'',href:'',
   click(){downloaded.push(this.download)},remove(){}}),body:{append(){}}};
 const ctx={document,fetch,TextEncoder,Blob,Date,setTimeout(){},
  URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}}};
 vm.runInNewContext(source,ctx,{timeout:1000});
 const click=async id=>{const cb=documentElements[id].handlers.click;
  assert.equal(typeof cb,'function');return await cb();};
 return {p,doc:documentElements,calls,downloaded,click};
}
test('Exit page is fixed to isolated Staging and cannot write, deploy or store tokens',()=>{
 assert.ok(source);
 assert.doesNotThrow(()=>new vm.Script(source));
 assert.match(html,/connect-src https:\/\/study-api-cas-staging-only\.kasidit09022550\.workers\.dev/);
 assert.match(html,/form-action 'none'/);
 assert.doesNotMatch(html,/\bstudy-api\.kasidit09022550\.workers\.dev\b/);
 assert.doesNotMatch(source,/\bmethod\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/);
 assert.doesNotMatch(source,/\b(?:localStorage|sessionStorage|document\.cookie|XMLHttpRequest|WebSocket|sendBeacon)\b/);
 assert.match(source,/^ const response=await fetch\(BASE\+path,\{/m);
 assert.match(source,/method:'GET'/);
});
test('Successful readback after import confirms ACC revision 1, 4 untouched, and creates no-score report',async()=>{
 const m=setup();
 assert.equal(m.doc.report.disabled,true);
 assert.equal(m.calls.length,0);
 await m.click('check');
 assert.equal(m.calls.length,6);
 assert.equal(m.calls.filter(x=>x.options.method!=='GET').length,0);
 assert.match(m.doc.result.textContent,/STAGING POST-IMPORT PERSISTENCE VERIFIED/);
 assert.equal(m.doc.secret.value,'');
 assert.equal(m.doc.report.disabled,false);
 await m.click('report');
 assert.deepEqual(m.downloaded,['vocabloom-staging-post-import-readonly-report.json']);
 assert.doesNotMatch(m.doc.result.textContent,/PRIVATE_TEST_STAGING_KEY|"32"/);
});
test('ACC at zero revision fails despite matching draft data: import not yet proven',async()=>{
 const m=setup({accRev:0});
 await m.click('check');
 assert.match(m.doc.result.textContent,/BLOCKED · ACC/);
 assert.match(m.doc.result.textContent,/BLOCKED · Staging ไม่ตรง/);
 assert.doesNotMatch(m.doc.result.textContent,/PERSISTENCE VERIFIED/);
});
test('ACC with persisted answer differs from private Preview, deny closure',async()=>{
 const m=setup({accRev:1,altered:true});
 await m.click('check');
 assert.match(m.doc.result.textContent,/BLOCKED · ACC/);
});
test('Any unexpected write to other subjects blocks phase exit',async()=>{
 const m=setup({otherRev:1});
 await m.click('check');
 assert.match(m.doc.result.textContent,/BLOCKED · ECO/);
 assert.match(m.doc.result.textContent,/BLOCKED · ZH/);
});
test('Unauthenticated or weak revision yields failure and no report',async()=>{
 for(const opts of [{httpStatus:401},{weakTag:true}]){
  const m=setup(opts);
  await m.click('check');
  assert.match(m.doc.result.textContent,/FAIL/);
  assert.equal(m.doc.report.disabled,true);
  assert.equal(m.doc.secret.value,'');
 }
});
test('Broken or wrong-source Preview cannot initiate even one network request',async()=>{
 const m=setup();
 m.doc.preview.files[0].text=async()=>'{bad json';
 await m.click('check');
 assert.match(m.doc.result.textContent,/FAIL/);
 assert.equal(m.calls.length,0);
 const n=setup();
 n.p.subjects.eco.study.ans['not-empty']=1;
 await n.click('check');
 assert.match(n.doc.result.textContent,/FAIL/);
 assert.equal(n.calls.length,0);
 const q=setup();
 delete q.p.intendedDestination;
 await q.click('check');
 assert.match(q.doc.result.textContent,/FAIL/);
 assert.equal(q.calls.length,0);
});
test('Clearing page invalidates report and input secret',async()=>{
 const m=setup();
 await m.click('check');
 assert.equal(m.doc.report.disabled,false);
 await m.click('clear');
 assert.equal(m.doc.report.disabled,true);
 assert.equal(m.doc.secret.value,'');
 assert.equal(m.doc.preview.value,'');
});
