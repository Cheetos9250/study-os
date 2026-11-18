/* TASKS 32–38: study time per subject, session log, formulas drawer, quick words, shortcuts, exam colours, repeating tasks. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const X=require('../scripts/study-today-extras.js'),R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const NOW=Date.parse('2026-11-18T05:00:00Z');
test('study time this week sums Monday to today per subject',()=>{
  assert.deepEqual(X.weekDays(NOW),['2026-11-16','2026-11-17','2026-11-18']);
  assert.deepEqual(X.weekTime({bySub:{'2026-11-15':{acc:500},'2026-11-16':{acc:25,eco:50},'2026-11-18':{acc:50}}},NOW),[['acc',75],['eco',50]]);
});
test('session log: one entry per session, trimmed, at most 40 a day',()=>{
  let o=X.addLog({days:{}},NOW,'acc','  Ch6 FIFO 1–15  ');o=X.addLog(o,NOW,'acc','again');
  assert.deepEqual(o.logs['2026-11-18'],[{t:NOW,n:'Ch6 FIFO 1–15',s:'acc'}]);assert.deepEqual(o.days,{},'other fields kept');
  for(let i=1;i<50;i++)o=X.addLog(o,NOW+i,'','x');assert.equal(o.logs['2026-11-18'].length,40);
  assert.equal(X.addLog({},NOW,'acc','   ').logs,undefined);
});
test('repeating tasks move to the next day or week, never into the past',()=>{
  assert.equal(X.nextDate('2026-11-18','d','2026-11-18'),'2026-11-19');assert.equal(X.nextDate('2026-11-18','w','2026-11-18'),'2026-11-25');
  assert.equal(X.nextDate('2026-11-01','w','2026-11-18'),'2026-11-22');assert.equal(X.nextDate('2026-11-18','','2026-11-18'),null);
});
test('quick words come from verified English vocab',()=>{
  const rows=[{Subject:'English Vocab',Status:'Verified',Front:'a',Back:'n — one\nx'},{Subject:'Chinese',Status:'Verified',Front:'b',Back:'c'},{Subject:'English Vocab',Status:'Draft',Front:'c',Back:'d'}];
  assert.deepEqual(X.pickWords(rows,5,7),[{w:'a',m:'n — one'}]);
});
test('Today wiring and restore checks',()=>{
  const i=R('index.html');
  for(const s of ['id="txRow"','id="sessionLog"','id="quickWords"','id="studyTime"','id="tRep"','scripts/study-today-extras.js'])assert.ok(i.includes(s),s);
  assert.match(i,/if\(m===25&&window\.StudyTodayX\)StudyTodayX\.sessionDone\(psub,endAt\);/);
  assert.match(i,/'<div class="exam'\+\(e\.d<5\?' urgent':e\.d<14\?' soon':''\)/,'red under 5 days, amber under 14');
  const r=R('scripts/study-progress-restore.js');assert.match(r,/t\.rep !== "d" && t\.rep !== "w"/);assert.match(r,/value\.logs !== undefined/);
  const x=R('scripts/study-today-extras.js');assert.doesNotMatch(x,/localStorage\.setItem\((?!LOGKEY)/,'writes only the Pomodoro log');
});
