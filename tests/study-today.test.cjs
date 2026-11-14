'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const T=require('../scripts/study-today.js');
const root=path.join(__dirname,'..');
const at=iso=>T.dateStart(iso)+10*3600000; // 10:00 Bangkok
const D={cats:[['c6','06 Inventory'],['c8','08 Cash'],['c9','09 Receivables']],
 cards:[['c6','f','b','','m1'],['c6','f','b','','m2'],['c8','f','b','','m3'],['c9','f','b','','m4']],
 quiz:[['c6','q',['a','b'],0],['c6','q',['a','b'],1],['c8','q',['a','b'],0],['c9','q',['a','b'],0]]};

test('real course pages expose parseable data with the expected progress keys',()=>{
 for(const c of T.COURSES){
  const html=fs.readFileSync(path.join(root,c.page),'utf8'),d=T.parseCourseData(html);
  assert.equal(d.markKey,c.mark);assert.ok(d.cards.length>0&&d.quiz.length>0);
  for(const q of d.quiz)assert.ok(Number.isInteger(q[3]),'quiz answer index');
 }
 for(const e of T.DEFAULT_EXAMS){const d=T.parseCourseData(fs.readFileSync(path.join(root,T.COURSES.find(c=>c.key===e.course).page),'utf8'));
  for(const id of e.cats)assert.ok(d.cats.some(x=>x[0]===id),e.id+' scope '+id);}
});
test('Monday quiz defaults to cost flow (ch6) and bank reconciliation (ch8)',()=>{
 const q=T.DEFAULT_EXAMS.find(e=>e.date==='2026-11-16');assert.deepEqual(q.cats,['c6','c8']);assert.equal(q.confirmed,true);
});
test('days are counted in Bangkok calendar days',()=>{
 assert.equal(T.daysUntil('2026-11-16',at('2026-11-14')),2);
 assert.equal(T.daysUntil('2026-11-16',T.dateStart('2026-11-15')+23.9*3600000),1);
 assert.equal(T.daysUntil('2026-11-16',T.dateStart('2026-11-16')),0);
 assert.equal(T.dayKey(T.dateStart('2026-11-14')+1000),'2026-11-14');
});
test('summary counts due, learning, new quota and quiz accuracy without trusting malformed data',()=>{
 const now=at('2026-11-14');
 const srs=JSON.stringify({s:{m1:{st:'rev',due:now-1},m2:{st:'learn',due:now-1},m3:{st:'rev',due:now+T.sod(0)+86400000*3}},m:{day:T.sod(now),newDone:19},lim:20});
 const s=T.summarize(D,srs,JSON.stringify({ans:{0:0,1:0,2:0}}),now);
 assert.equal(s.due,1);assert.equal(s.learn,1);assert.equal(s.reviewNow,2);assert.equal(s.newToday,1);assert.equal(s.seen,3);
 assert.deepEqual([s.per.c6.correct,s.per.c6.answered],[1,2]);assert.equal(s.per.c9.answered,0);
 const bad=T.summarize(D,'{not json','null',now);assert.equal(bad.reviewNow,0);assert.equal(bad.newToday,4);
 const yesterday=T.summarize(D,JSON.stringify({s:{},m:{day:T.sod(now)-86400000,newDone:20}}),null,now);assert.equal(yesterday.newToday,4);
});
test('plan spreads remaining chapters before the exam and keeps the last day for review',()=>{
 const now=at('2026-11-14'),sum={acc:T.summarize(D,null,JSON.stringify({ans:{2:0}}),now)};
 const exams=[{id:'q',course:'acc',title:'Quiz',date:'2026-11-17',cats:['c6','c8'],confirmed:true}];
 const plan=T.buildPlan(exams,sum,T.loadSettings(null),now),ch=plan.tasks.filter(t=>t.kind==='chapter');
 assert.equal(ch.length,1);assert.equal(ch[0].cat,'c6','unattempted chapter first');
 const dayBefore=T.buildPlan(exams,sum,T.loadSettings(null),at('2026-11-16'));assert.equal(dayBefore.tasks[0].kind,'final');
 assert.equal(T.buildPlan(exams,sum,T.loadSettings(null),at('2026-11-17')).tasks[0].kind,'exam');
 assert.equal(T.buildPlan(exams,sum,T.loadSettings(null),at('2026-11-18')).upcoming.length,0);
});
test('completed chapters stay checked today and drop out on later days',()=>{
 const now=at('2026-11-14'),sum={acc:T.summarize(D,null,null,now)};
 const exams=[{id:'q',course:'acc',title:'Quiz',date:'2026-11-20',cats:['c6','c8'],confirmed:true}];
 let s=T.loadSettings(JSON.stringify({exams}));const first=T.buildPlan(s.exams,sum,s,now).tasks.find(t=>t.kind==='chapter');
 s=T.markChapter(s,first,true,now);
 assert.equal(T.buildPlan(s.exams,sum,s,now).tasks.find(t=>t.cat===first.cat).done,true);
 const tomorrow=T.buildPlan(s.exams,sum,s,at('2026-11-15')).tasks.filter(t=>t.kind==='chapter');
 assert.ok(tomorrow.every(t=>t.cat!==first.cat));
 s=T.markChapter(s,first,false,now);assert.equal(s.done.q[first.cat],undefined);
});
test('later exams add at most one chapter and only within two weeks',()=>{
 const now=at('2026-11-14'),sum={acc:T.summarize(D,null,null,now)};
 const exams=[{id:'a',course:'acc',title:'A',date:'2026-11-18',cats:['c6'],confirmed:true},{id:'b',course:'acc',title:'B',date:'2026-11-20',cats:['c6','c8','c9'],confirmed:true},{id:'c',course:'acc',title:'C',date:'2026-12-20',cats:['c9'],confirmed:true}];
 const t=T.buildPlan(exams,sum,T.loadSettings(null),now).tasks;
 assert.equal(t.filter(x=>x.examId==='b').length,1);assert.equal(t.filter(x=>x.examId==='c').length,0);
 const close=T.buildPlan(exams,sum,T.loadSettings(null),at('2026-11-15')).tasks;
 assert.equal(close.filter(x=>x.examId==='b').length,0,'imminent exam gets full focus');
});
test('settings normalisation rejects unknown courses and invalid dates',()=>{
 const s=T.loadSettings(JSON.stringify({exams:[{id:'x',course:'zz',date:'2026-11-20'},{id:'y',course:'acc',date:'bad'},{id:'z',course:'eco',date:'2026-11-27',title:'<b>',cats:['g',3]}]}));
 assert.deepEqual(s.exams.map(e=>e.id),['z']);assert.deepEqual(s.exams[0].cats,['g']);
 assert.equal(T.loadSettings(null).exams.length,T.DEFAULT_EXAMS.length);
});
test('weak spots require two answers and sort by lowest accuracy',()=>{
 const now=at('2026-11-14'),s=T.summarize(D,null,JSON.stringify({ans:{0:1,1:0,2:1}}),now);
 const w=T.weakSpots({acc:s});assert.equal(w.length,1);assert.equal(w[0].label,'06 Inventory');assert.equal(w[0].acc,0);
});
test('today page is read-only for course progress and linked from home',()=>{
 const html=fs.readFileSync(path.join(root,'today.html'),'utf8');
 assert.match(html,/scripts\/study-today\.js/);assert.doesNotMatch(html,/removeItem|localStorage\.clear/);
 const writes=[...html.matchAll(/localStorage\.setItem\(([^,]+),/g)].map(m=>m[1]);assert.deepEqual(writes,['T.SETTINGS_KEY']);
 assert.doesNotMatch(html,/workers\.dev|notion/i);
 assert.match(fs.readFileSync(path.join(root,'index.html'),'utf8'),/href="today\.html"/);
});
