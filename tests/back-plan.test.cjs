"use strict";
const test=require('node:test'),assert=require('node:assert/strict');
const T=require('../scripts/study-today.js');
const at=d=>Date.parse(d+'T03:00:00Z');
const ch=(id,quiz,answered,correct)=>({id,label:id,cards:0,seen:0,due:0,unseen:0,quiz,answered,correct});
const sum=per=>({reviewNow:0,per});
const ex=(id,course,date,cats)=>({id,course,title:id,date,cats,confirmed:true});
test('back plan spreads each exam over the study days before it, final review the day before, exam on its date',()=>{
  const s={acc:sum({a:ch('a',60,0,0),b:ch('b',60,0,0)})};
  const r=T.backPlan([ex('f','acc','2026-11-21',['a','b'])],s,at('2026-11-16'));
  assert.equal(r.days.length,6);                       // 16..21
  assert.equal(r.days[5].exam.examId,'f');
  assert.equal(r.days[4].items.some(x=>x.kind==='final'),true);
  const total=r.days.reduce((n,d)=>n+d.qs,0);
  assert.equal(total,120);                              // nothing lost
  for(let i=0;i<4;i++)assert.equal(r.days[i].qs,30);   // 120 over 4 study days
  assert.equal(r.days[4].qs,0);
});
test('weakest chapter comes first and a big chapter is split over days',()=>{
  const s={acc:sum({a:ch('a',40,40,38),b:ch('b',40,10,2)})};   // b is weaker with more left
  const r=T.backPlan([ex('f','acc','2026-11-19',['a','b'])],s,at('2026-11-16'));
  assert.equal(r.days[0].items[0].cat,'b');
  assert.ok(r.days[0].items.filter(x=>x.kind==='chapter')[0].qs<38);
});
test('several subjects share the calendar and show review due per day from rv',()=>{
  const now=at('2026-11-16'),DAY=86400000;
  const s={acc:sum({a:ch('a',10,0,0)}),eco:sum({g:ch('g',10,0,0)})};
  const rb={acc:T.reviewByDay(JSON.stringify({rv:{1:[0,now-DAY],2:[1,now+DAY],3:[1,now+DAY+5e6],4:[2,now+100*DAY]}}),now,4),eco:[0,0,0,0]};
  assert.deepEqual(rb.acc,[1,2,0,0]);
  const r=T.backPlan([ex('f','acc','2026-11-19',['a']),ex('e','eco','2026-11-20',['g'])],s,now,rb);
  assert.equal(r.exams,2);
  assert.equal(r.days.length,5);
  assert.deepEqual(r.days.map(d=>d.review).slice(0,3),[1,2,0]);
  assert.equal(r.days[3].exam.examId,'f');assert.equal(r.days[4].exam.examId,'e');
});
test('back plan ignores past exams, exam day, unknown courses and empty scopes',()=>{
  const s={acc:sum({a:ch('a',10,0,0)})};const now=at('2026-11-16');
  assert.equal(T.backPlan([ex('x','acc','2026-11-16',['a']),ex('y','acc','2026-11-10',['a']),ex('z','eco','2026-11-20',['g']),ex('w','acc','2026-11-20',[])],s,now).days.length,0);
  assert.equal(T.backPlan(null,s,now).days.length,0);
});
test('a far exam is capped at 22 days; reviewByDay tolerates junk',()=>{
  const s={acc:sum({a:ch('a',100,0,0)})};
  assert.equal(T.backPlan([ex('f','acc','2027-03-01',['a'])],s,at('2026-11-16')).days.length,22);
  assert.deepEqual(T.reviewByDay('nope',0,3),[0,0,0]);
  assert.deepEqual(T.reviewByDay(JSON.stringify({rv:{a:'x',b:[1,'y']}}),0,2),[0,0]);
});
