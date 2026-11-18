/* TASKS 23, 27, 29, 30, 31: Pomodoro subject/sound, accuracy trend, habits, actionable chapters, time range and weekly target. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const M=require('../scripts/study-motivation.js'),R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const NOW=Date.parse('2026-11-18T05:00:00Z'),DAY=864e5;
const D={cats:[['c1','One'],['c2','Two']],quiz:[['c1','q',['a','b'],0],['c1','q',['a','b'],0],['c1','q',['a','b'],0],['c1','q',['a','b'],0],['c2','q',['a','b'],1]]};
test('chapters: accuracy, last answer, this-week trend and the weak flag',()=>{
  const st={ans:{0:0,1:1,2:1,3:0,4:1},ats:{0:NOW,1:NOW,2:NOW-7*DAY,3:NOW-7*DAY,4:NOW-9*DAY}};
  const [c1,c2]=M.chapters(D,st,NOW);
  assert.deepEqual([c1.answered,c1.correct,c1.pct,c1.idle],[4,2,50,0]);assert.equal(c1.weak,true,'under 70% with 3+ answers');
  assert.deepEqual([c2.pct,c2.idle,c2.weak],[100,9,true],'not practised for 7 days');
  assert.equal(M.sortChapters([c2,c1],'weak')[0].id,'c1');assert.equal(M.sortChapters([c1,c2],'recent')[0].id,'c2');
});
test('weekly accuracy, peak hours and time balance',()=>{
  const st={ans:{0:0,1:0,2:1},ats:{0:NOW,1:NOW-7*DAY,2:NOW-7*DAY}},w=M.weeklyAccuracy(D,st,NOW,3);
  assert.deepEqual(w.map(x=>x.pct),[null,50,100]);
  const many={ans:{},ats:{}};for(let i=0;i<4;i++){many.ans[i]=0;many.ats[i]=Date.parse('2026-11-17T13:30:00Z');}
  const D2={cats:[['c1','x']],quiz:[...Array(12)].map(()=>['c1','q',['a','b'],0])};for(let i=0;i<12;i++){many.ans[i]=0;many.ats[i]=Date.parse('2026-11-17T13:30:00Z');}
  const pk=M.peakHours([{D:D2,study:many}]);assert.equal(pk.best.from,18,'13:30 UTC is 20:30 in Bangkok');assert.equal(pk.best.pct,100);
  assert.deepEqual(M.balance({acc:100,eco:25},{acc:90,eco:60}),{most:'acc',weakest:'eco',share:80,warn:true});
  assert.equal(M.balance({acc:10},{acc:90,eco:60}),null,'needs some Pomodoro time');
});
test('weekly target defaults and limits',()=>{
  assert.deepEqual(M.target(undefined),{q:70,p:300});assert.deepEqual(M.target({q:'120',p:-1}),{q:120,p:300});
  assert.match(R('scripts/study-progress-restore.js'),/Invalid Pomodoro history/);
});
test('pages: range switcher, sort, Practice weakest, habits, Pomodoro subject and generated sound',()=>{
  const s=R('stats.html');for(const x of ['data-tf="7"','data-tf="all"','id="sortCh"','id="habits"','id="wtarget"','Practice weakest'])assert.ok(s.includes(x),x);
  const i=R('index.html');assert.match(i,/<select id="pSub"/);assert.match(i,/<select id="pSound"/);assert.match(i,/createBufferSource\(\)/);
  assert.match(i,/o\.bySub\[d\]=b;/);assert.doesNotMatch(i,/\.mp3|\.ogg|https?:\/\/[^"']*sound/i,'no downloaded audio');
});
