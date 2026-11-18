/* AI tutor: busy servers are retried, then another model answers; quick-ask buttons send ready prompts. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const A=require('../scripts/study-tutor.js'),R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('backupModel picks a different Flash model, then Flash-Lite, never the busy one',()=>{
  const ids=['gemini-3.8-flash','gemini-3.5-flash','gemini-3.8-flash-lite','gemini-3.5-flash-lite','gemini-4-pro'];
  assert.equal(A.backupModel('gemini',ids,'gemini-3.8-flash'),'gemini-3.5-flash');
  assert.equal(A.backupModel('gemini',['gemini-3.8-flash','gemini-3.8-flash-lite','gemini-3.5-flash-lite'],'gemini-3.8-flash'),'gemini-3.8-flash-lite');
  assert.equal(A.backupModel('gemini',['gemini-3.8-flash'],'gemini-3.8-flash'),'');
  assert.equal(A.backupModel('openai',ids,'x'),'');
});
test('errors explain 429 and 5xx in plain words',()=>{
  assert.throws(()=>A.reply('gemini',503,{error:{message:'high demand'}}),/busy; try again in a minute/);
  assert.throws(()=>A.reply('gemini',429,{error:{message:'quota'}}),/per-minute limit.*daily limit/);
});
test('quick asks are Thai prompts for the chosen chapter; the plan lists exams',()=>{
  const o={course:'Economics',chapter:'Macro · GDP'};
  assert.match(A.quick('explain',o),/^อธิบายบท Macro · GDP วิชา Economics/);
  assert.match(A.quick('quiz',o),/ทีละข้อ รวม 5 ข้อ/);
  assert.match(A.quick('mistakes',o),/มักทำผิด/);
  assert.match(A.quick('plan',{exams:[{name:'Accounting final',date:'2026-11-26',days:8}]}),/- Accounting final: 2026-11-26 \(อีก 8 วัน\)/);
  assert.equal(A.quick('nope',o),'');
});
test('the page retries busy answers twice, then asks another model once, and shows the buttons',()=>{
  const h=R('tutor.html');
  assert.match(h,/for\(const wait of \[2500,6000\]\)\{if\(out\.status<500\)break;/);
  assert.match(h,/A\.backupModel\('gemini',ids,cfg\.gemini\.model\)/);
  assert.match(h,/finally\{cfg\.gemini\.model=keep;\}/,'the backup model is used for one answer only');
  for(const k of ['explain','quiz','mistakes','plan'])assert.match(h,new RegExp('data-quick="'+k+'"'));
  assert.match(h,/scripts\/study-tutor\.js\?v=4/);
});
