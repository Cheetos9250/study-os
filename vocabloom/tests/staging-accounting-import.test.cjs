'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const html=readFileSync(join(__dirname,'..','staging-accounting-import.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const SUBJECTS=['acc','eco','math','eng','zh'];
const BASE='https://study-api-cas-staging-only.kasidit09022550.workers.dev';
const blank=()=>({study:{ans:{},ats:{},known:[],rst:0},srs:{s:{},m:{day:0,newDone:0}}});
const clone=x=>JSON.parse(JSON.stringify(x));
const preview=()=>{
 const subjects=Object.fromEntries(SUBJECTS.map(s=>[s,blank()]));
 subjects.acc.study.ans['32']=0;
 subjects.acc.study.ats['32']=0;
 subjects.acc.updated=1794467041811;
 subjects.acc.srs.m.day=1794330000000;
 return {
  format:'vocabloom-cloud-readonly-snapshot',version:1,
  intendedDestination:'STAGING_ONLY_NO_PRODUCTION',
  capturedAt:'2026-11-12T14:37:13.227Z',
  sourceCapturedAt:'2026-11-12T11:50:55.017Z',
  subjects,revisions:Object.fromEntries(SUBJECTS.map(s=>[s,null]))
 };
};
function mockApp({alreadyImported=false,putStatus=null,alterAfterPut=false,healthStatus=200}={}){
 const p=preview();
 const stage=Object.fromEntries(SUBJECTS.map(s=>[s,blank()]));
 const revision=Object.fromEntries(SUBJECTS.map(s=>[s,0]));
 if(alreadyImported){stage.acc=clone(p.subjects.acc);revision.acc=1;}
 const calls=[];
 const fetch=async(url,options)=>{
  assert.ok(url.startsWith(BASE+'/'),'Non-staging URL blocked');
  const path=url.slice(BASE.length);
  calls.push({path,method:options.method,headers:options.headers,body:options.body});
  assert.equal(options.credentials,'omit');
  assert.equal(options.redirect,'error');
  if(path==='/__staging/health'){
   assert.equal(options.method,'GET');
   return {status:healthStatus,headers:{get:()=>null},
    json:async()=>({staging:true,protocol:'vocabloom-cas-staging-v1',subjects:SUBJECTS})};
  }
  const match=path.match(/^\/progress\/(acc|eco|math|eng|zh)$/);
  assert.ok(match,'Path must be a known subject');
  const name=match[1];
  if(options.method==='GET')
   return {status:200,headers:{get:k=>k==='X-Sync-Revision'?'"'+revision[name]+'"':null},
    json:async()=>clone(stage[name])};
  assert.equal(options.method,'PUT');
  assert.equal(name,'acc');
  assert.equal(options.headers['If-Match'],'"0"');
  if(putStatus!==null)return {status:putStatus};
  if(revision.acc!==0)return {status:409};
  stage.acc=JSON.parse(options.body);
  if(alterAfterPut)stage.acc.study.ans['32']=1;
  revision.acc++;
  return {status:200};
 };
 const ids=['preview','secret','check','backup','apply','agree','report','clear','result'];
 const elements=Object.fromEntries(ids.map(id=>[id,{
  value:'',disabled:false,checked:false,files:[],
  textContent:'',handlers:{},
  addEventListener(name,fn){this.handlers[name]=fn;}
 }]));
 elements.secret.value='FAKE_STAGING_SECRET_EXAMPLE';
 elements.preview.files=[{name:'vocabloom-staging-preview-private-2026-11-12.json',
  size:1763,text:async()=>JSON.stringify(p)}];
 const downloads=[];
 const document={getElementById:id=>elements[id],
  createElement:()=>({href:'',download:'',click(){downloads.push(this.download)},remove(){}}),
  body:{append(){}}};
 const ctx={document,fetch,Blob,TextEncoder,URL:{
  createObjectURL:()=> 'blob:local-test',revokeObjectURL:()=>{}
 },setTimeout(){},Date};
 vm.runInNewContext(script,ctx,{timeout:1000});
 const click=async id=>{
  const fn=elements[id].handlers.click;
  assert.equal(typeof fn,'function');
  return await fn();
 };
 return {p,stage,revision,calls,click,elements,downloads};
}
test('Browser page has fixed staging destination, one PUT target and restrictive CSP',()=>{
 assert.ok(script);
 assert.doesNotThrow(()=>new vm.Script(script));
 assert.match(html,/connect-src https:\/\/study-api-cas-staging-only\.kasidit09022550\.workers\.dev/);
 assert.match(html,/form-action 'none'/);
 assert.doesNotMatch(html,/\bstudy-api\.kasidit09022550\.workers\.dev\b/);
 assert.doesNotMatch(script,/\b(?:localStorage|sessionStorage|document\.cookie|XMLHttpRequest|WebSocket|sendBeacon)\b/);
 assert.match(script,/method==='PUT'&&path==='\/progress\/acc'/);
 assert.match(script,/ensure\(revision==='"0"'/);
 assert.match(script,/response\.status===200/);
 assert.match(script,/exactSameSnapshot\(fresh,active\.staging\)/);
 assert.match(script,/for\(const s of SUBJECTS\.slice\(1\)\)/);
});
test('No staging writes occur without prior preflight and explicit downloaded backup',async()=>{
 const m=mockApp();
 assert.equal(m.elements.apply.disabled,true);
 await m.click('apply');
 assert.equal(m.calls.length,0);
 await m.click('check');
 assert.equal(m.elements.backup.disabled,false);
 assert.equal(m.elements.apply.disabled,true);
 m.elements.agree.checked=true;
 await m.click('apply');
 assert.equal(m.calls.filter(x=>x.method==='PUT').length,0);
 assert.equal(m.elements.apply.disabled,true);
});
test('Happy path: download all five staging subjects, then write acc once with CAS and verify',async()=>{
 const m=mockApp();
 await m.click('check');
 assert.match(m.elements.result.textContent,/PASS · Accounting ยังว่าง revision 0/);
 await m.click('backup');
 assert.deepEqual(m.downloads,['vocabloom-staging-before-import-private.json']);
 assert.equal(m.elements.apply.disabled,true);
 m.elements.agree.checked=true;
 await m.click('apply');
 const put=m.calls.filter(x=>x.method==='PUT');
 assert.equal(put.length,1);
 assert.equal(put[0].path,'/progress/acc');
 assert.equal(put[0].headers['If-Match'],'"0"');
 assert.equal(JSON.parse(put[0].body).study.ans['32'],0);
 assert.equal(m.revision.acc,1);
 assert.deepEqual(m.stage.acc,m.p.subjects.acc);
 assert.equal(m.elements.secret.value,'');
 assert.equal(m.elements.report.disabled,false);
 assert.match(m.elements.result.textContent,/STAGING ACCOUNTING VERIFIED/);
 for(const s of SUBJECTS.slice(1)){
  assert.deepEqual(m.stage[s],blank());
  assert.equal(m.revision[s],0);
 }
});
test('If Accounting already matches the preview, do not write it twice',async()=>{
 const m=mockApp({alreadyImported:true});
 await m.click('check');
 assert.match(m.elements.result.textContent,/ตรงกับ Preview แล้ว/);
 await m.click('backup');
 m.elements.agree.checked=true;
 await m.click('apply');
 assert.equal(m.calls.filter(x=>x.method==='PUT').length,0);
 assert.equal(m.elements.report.disabled,false);
 assert.match(m.elements.result.textContent,/Staging Worker PUT = 0/);
});
test('If any staging record changes after backup, stop without writing anything',async()=>{
 const m=mockApp();
 await m.click('check');
 await m.click('backup');
 m.stage.eco.study.ans['unexpected']=1;
 m.revision.eco=1;
 m.elements.agree.checked=true;
 await m.click('apply');
 assert.equal(m.calls.filter(x=>x.method==='PUT').length,0);
 assert.match(m.elements.result.textContent,/Staging เปลี่ยนไป/);
 assert.equal(m.elements.report.disabled,true);
});
test('If staging Accounting is already occupied by different data, block at preflight',async()=>{
 const m=mockApp();
 m.stage.acc.study.ans['other']=1;
 m.revision.acc=2;
 await m.click('check');
 assert.match(m.elements.result.textContent,/BLOCKED/);
 assert.equal(m.elements.backup.disabled,true);
 assert.equal(m.calls.filter(x=>x.method==='PUT').length,0);
});
test('Selected secret or preview changes invalidate old preflight approval',async()=>{
 const m=mockApp();
 await m.click('check');
 await m.click('backup');
 m.elements.agree.checked=true;
 m.elements.secret.handlers.input();
 assert.equal(m.elements.apply.disabled,true);
 assert.equal(m.elements.backup.disabled,true);
});
test('A preview with multiple Accounting answers or nonempty other subjects is rejected',async()=>{
 const m=mockApp();
 m.p.subjects.acc.study.ans['extra']=1;
 await m.click('check');
 // Preview JSON file was snapshot before mutation in the mock; test pure logic with
 // a fresh load of the mutated file.
 const m2=mockApp();
 m2.elements.preview.files[0].text=async()=>JSON.stringify(m.p);
 await m2.click('check');
 assert.match(m2.elements.result.textContent,/BLOCKED/);
 assert.equal(m2.calls.length,0);
 const m3=mockApp();
 m3.p.subjects.eco.study.ans['extra']=1;
 m3.elements.preview.files[0].text=async()=>JSON.stringify(m3.p);
 await m3.click('check');
 assert.match(m3.elements.result.textContent,/BLOCKED/);
 assert.equal(m3.calls.length,0);
});
test('Public code does not embed private dataset, production secrets, or automatic imports',()=>{
 assert.doesNotMatch(html,/\b(?:309be2ccae364c5ca774f43a316afe17|progress:acc|1794467041811)\b/);
 assert.match(html,/สำรอง Staging ก่อนเขียน/);
 assert.match(html,/Production Worker PUT = 0/);
 assert.match(html,/lastReport=makeReport/);
 assert.match(html,/staging-before-import-private\.json/);
});

test('CAS conflict HTTP 409 refuses retry and never claims success',async()=>{
 const m=mockApp({putStatus:409});
 await m.click('check');
 await m.click('backup');
 m.elements.agree.checked=true;
 await m.click('apply');
 assert.equal(m.calls.filter(x=>x.method==='PUT').length,1);
 assert.equal(m.revision.acc,0);
 assert.equal(m.elements.report.disabled,true);
 assert.match(m.elements.result.textContent,/Accounting PUT HTTP 409/);
 assert.match(m.elements.result.textContent,/ห้ามกดซ้ำทันที/);
});
test('If readback differs after a response 200, stop with no success report',async()=>{
 const m=mockApp({alterAfterPut:true});
 await m.click('check');
 await m.click('backup');
 m.elements.agree.checked=true;
 await m.click('apply');
 assert.equal(m.calls.filter(x=>x.method==='PUT').length,1);
 assert.equal(m.revision.acc,1);
 assert.equal(m.elements.report.disabled,true);
 assert.match(m.elements.result.textContent,/อ่าน Accounting กลับมาไม่ตรงต้นฉบับ/);
});
test('Wrong staging credentials / identity do not reach any progress record',async()=>{
 const m=mockApp({healthStatus:401});
 await m.click('check');
 assert.match(m.elements.result.textContent,/BLOCKED/);
 assert.equal(m.calls.length,1);
 assert.equal(m.calls[0].path,'/__staging/health');
 assert.equal(m.elements.backup.disabled,true);
 assert.equal(m.calls.filter(x=>x.method==='PUT').length,0);
});
