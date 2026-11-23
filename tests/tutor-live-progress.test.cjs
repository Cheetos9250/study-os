// AI tutor reads live progress (exams, chapter accuracy, wrong questions) into the system prompt; on by default, can be turned off.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const A=require('../scripts/study-tutor.js');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('live progress setting defaults on and can be turned off',()=>{
 assert.equal(A.normalize({}).live,true);assert.equal(A.normalize({live:false}).live,false);
});
test('system prompt includes the progress block only when given',()=>{
 assert.doesNotMatch(A.system({course:'Accounting'}),/live Study OS progress/);
 const s=A.system({course:'Accounting',progress:'## Accounting\n10 of 20 answered'});
 assert.match(s,/live Study OS progress[\s\S]*10 of 20 answered/);
 assert.ok(A.system({progress:'x'.repeat(20000)}).length<14000);
});
test('tutor page has the toggle, reads progress read-only and loads the summary helper',()=>{
 const h=read('tutor.html');
 assert.match(h,/id="live"/);assert.match(h,/scripts\/study-gemini\.js/);
 assert.match(h,/progress:cfg\.live\?await liveProgress\(\):''/);
 const fn=h.slice(h.indexOf('async function liveProgress'),h.indexOf('/* ---------- chat ---------- */'));
 assert.doesNotMatch(fn,/setItem|removeItem/);
});
