/* TASK 28: exam readiness per subject on Stats (StudyMotivation.readiness). */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const M=require('../scripts/study-motivation.js'),R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('coverage, accuracy and days to finish at the last 7 days pace',()=>{
  const r=M.readiness({total:260,answered:120,right:94,last7:70,examDays:8});
  assert.deepEqual([r.pctDone,r.pctRight,r.accuracy,r.left,r.pace,r.daysToFinish,r.needPerDay,r.onTrack],[46,36,78,140,10,14,18,false]);
  assert.equal(M.readiness({total:260,answered:120,right:94,last7:140,examDays:8}).onTrack,true);
});
test('edge cases: no pace, no exam, bank finished, bad numbers',()=>{
  const a=M.readiness({total:50,answered:10,right:5,last7:0,examDays:NaN});
  assert.equal(a.daysToFinish,null);assert.equal(a.examDays,null);assert.equal(a.needPerDay,null);assert.equal(a.onTrack,false);
  const b=M.readiness({total:40,answered:40,right:30,last7:0,examDays:3});assert.equal(b.left,0);assert.equal(b.daysToFinish,0);assert.equal(b.onTrack,true);
  const c=M.readiness({total:10,answered:99,right:-3});assert.equal(c.answered,10);assert.equal(c.right,0);
  assert.equal(M.readiness({total:0}).pctDone,0);
  assert.equal(M.readiness({total:30,answered:0,right:0,last7:7,examDays:0}).needPerDay,30,'exam today: everything left today');
});
test('Stats page shows the readiness panel before the heatmap and links to practice',()=>{
  const s=R('stats.html');assert.ok(s.indexOf('id="ready"')>0&&s.indexOf('id="ready"')<s.indexOf('id="heat"'));
  assert.match(s,/M\.readiness\(\{total:/);assert.match(s,/c\.page\+'\?tab=prac'/);
});
