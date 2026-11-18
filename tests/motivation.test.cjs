/* TASKS 19–22: practice goal, heatmap, weekly summary, badges (scripts/study-motivation.js). */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const M=require('../scripts/study-motivation.js'),R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const NOW=Date.parse('2026-11-18T05:00:00Z'); // Wednesday in Bangkok
test('goal: default 10, cycles 5→10→20→30→50, invalid values fall back',()=>{
  assert.equal(M.goal(undefined),10);assert.equal(M.goal('abc'),10);assert.equal(M.goal(500),10);assert.equal(M.goal(20),20);
  assert.deepEqual([5,10,20,30,50].map(M.nextGoal),[10,20,30,50,5]);
});
test('goal streak counts days in a row at or above the goal, today may still be open',()=>{
  const a={'2026-11-15':10,'2026-11-16':12,'2026-11-17':10,'2026-11-18':3};
  assert.equal(M.goalStreak(a,10,NOW),3);a['2026-11-18']=11;assert.equal(M.goalStreak(a,10,NOW),4);assert.equal(M.goalStreak(a,20,NOW),0);
});
test('heatmap: weeks × 7 cells starting Monday, future days empty, levels 0–4',()=>{
  const h=M.heatmap([{'2026-11-18':5,'2026-11-17':1},{'2026-11-17':2}],NOW,4);
  assert.equal(h.cells.length,28);assert.equal(h.cells[0].d,'2026-10-26');assert.equal(new Date(h.cells[0].d+'T00:00:00Z').getUTCDay(),1);
  const t=h.cells.find(c=>c.d==='2026-11-18'),y=h.cells.find(c=>c.d==='2026-11-17');assert.equal(t.n,5);assert.equal(y.n,3);
  assert.ok(t.level>=y.level&&t.level>0);assert.equal(h.cells.find(c=>c.d==='2026-11-19').level,-1);assert.equal(h.active,2);
});
test('weekly: Monday to today against the same days last week',()=>{
  const w=M.weekly({acc:{'2026-11-16':4,'2026-11-18':2,'2026-11-11':5,'2026-11-12':1,'2026-11-13':9}},NOW);
  assert.equal(w.days,3);assert.equal(w.from,'2026-11-16');assert.deepEqual(w.rows[0],{key:'acc',now:6,before:5,activeDays:2});
});
test('badges and best streak',()=>{
  assert.equal(M.bestStreak([{'2026-11-01':1,'2026-11-02':1,'2026-11-04':1},{'2026-11-03':2}]),4);
  const b=M.badges({total:120,byCourse:{acc:100},bestStreak:4,goalDays:2,retired:0,pomoMin:61,words:0});
  const got=b.filter(x=>x.got).map(x=>x.id);assert.deepEqual(got,['first','acc100','s3']);
  assert.ok(b.every(x=>x.have<=x.need&&x.icon&&x.title));
});
test('pages: Today goal card saves qgoal in home data (validated on restore); Stats shows the three panels',()=>{
  const i=R('index.html');assert.match(i,/<div class="wng qg" id="qGoal" hidden><\/div>/);assert.match(i,/st\.qgoal=M\.nextGoal\(g\);save\(\);/);
  assert.match(R('scripts/study-progress-restore.js'),/Invalid daily practice goal/);
  const s=R('stats.html');for(const id of ['heat','week','badges'])assert.match(s,new RegExp('id="'+id+'"'));assert.match(s,/scripts\/study-motivation\.js/);
});
