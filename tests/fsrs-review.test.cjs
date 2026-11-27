"use strict";
const test=require('node:test'),assert=require('node:assert/strict');
const R=require('../scripts/study-review.js');const DAY=86400000;
const T0=Date.UTC(2026,10,16,5);

test('FSRS maths: 90% retrievability at the scheduled interval, falls with time',()=>{
  assert.ok(Math.abs(R.retrievability(R.interval(5),5)-0.9)<1e-9);
  assert.ok(R.retrievability(1,5)>R.retrievability(10,5));
  assert.equal(R.retrievability(0,5),1);
});
test('first right answer waits ~3 days, first wrong answer comes back tomorrow',()=>{
  const s={ans:{a:1,b:0},ats:{},rv:{}};
  R.record(s,'a',true,T0);R.record(s,'b',false,T0);
  assert.equal(s.rv.a[1],R.sod(T0)+3*DAY);assert.equal(s.rv.a[0],1);
  assert.deepEqual(s.rv.b,[0,R.sod(T0)+DAY]);
  assert.equal(s.fsrs.a.length,4);assert.equal(s.fsrs.a[3],s.rv.a[1]);
});
test('intervals grow with correct answers (capped at a year) and a wrong answer resets to tomorrow',()=>{
  const s={ans:{q:1},ats:{q:T0},rv:{}};let t=T0,prev=0;
  for(let i=0;i<10;i++){R.record(s,'q',true,t);const iv=(s.rv.q[1]-R.sod(t))/DAY;assert.ok(iv>=prev&&iv<=365,'interval '+iv);prev=iv;t=s.rv.q[1];}
  assert.equal(prev,365);
  R.record(s,'q',false,t);assert.deepEqual(s.rv.q,[0,R.sod(t)+DAY]);
  assert.ok(s.fsrs.q[1]>=1&&s.fsrs.q[1]<=10,'difficulty stays 1..10');
});
test('answering late (retrievability lower) grows stability more than answering on time',()=>{
  const mk=()=>({ans:{q:1},ats:{q:T0},rv:{}});
  const a=mk(),b=mk();R.record(a,'q',true,T0);R.record(b,'q',true,T0);
  R.record(a,'q',true,T0+3*DAY);R.record(b,'q',true,T0+30*DAY);
  assert.ok(b.fsrs.q[0]>a.fsrs.q[0]);
});
test('migration: old Leitner state becomes FSRS state without changing rv, ans or ats',()=>{
  const s={ans:{a:1,b:0,c:1},ats:{a:T0-14*DAY,b:T0,c:T0-3*DAY},rv:{a:[3,T0],b:[0,T0],c:[1,T0+DAY]},known:['x']};
  const before=JSON.stringify(s);
  const fa=R.migrate(s,'a',T0),fb=R.migrate(s,'b',T0);
  assert.equal(JSON.stringify(s),before,'migrate is read-only');
  assert.equal(fa[0],14);assert.equal(fa[2],T0-14*DAY);assert.equal(fa[3],T0);
  assert.ok(fb[0]<fa[0],'wrong = shorter memory than a 14-day card');
  assert.equal(R.migrate(s,'zzz',T0),null);assert.equal(R.migrate({rv:{q:'bad'}},'q',T0),null);
  /* the next answer builds on the migrated state: box 3 (14 days) answered on time goes beyond 14 days */
  R.record(s,'a',true,T0);
  assert.ok((s.rv.a[1]-R.sod(T0))/DAY>14);
  assert.equal(JSON.stringify(s.ans),'{"a":1,"b":0,"c":1}');assert.deepEqual(s.known,['x']);
});
test('stale fsrs (rv changed by an older app version) is ignored and re-derived',()=>{
  const s={ans:{q:1},ats:{q:T0},rv:{}};R.record(s,'q',true,T0);
  s.rv.q=[0,T0];                               // an old client answered wrong and rewrote rv only
  assert.notEqual(R.stateOf(s,'q',T0)[3],s.fsrs.q[3]);
  R.record(s,'q',true,T0+DAY);assert.equal(s.fsrs.q[3],s.rv.q[1]);
});
test('rollback drops only fsrs; rv keeps working with the Leitner code path',()=>{
  const s={ans:{q:1},ats:{q:T0},rv:{}};R.record(s,'q',true,T0);const rv=JSON.stringify(s.rv);
  assert.equal(R.rollback(s),true);assert.equal(s.fsrs,undefined);assert.equal(JSON.stringify(s.rv),rv);
  assert.equal(R.rollback(s),false);
  R.record(s,'q',true,T0+3*DAY,{legacy:true});assert.deepEqual(s.rv.q,[2,R.sod(T0+3*DAY)+7*DAY]);
  assert.equal(s.fsrs,undefined,'legacy path does not write fsrs');
});
test('isDue/isOld/dueIds/seed still work on rv written by FSRS',()=>{
  const s={ans:{a:1,b:0},ats:{},rv:{}};R.record(s,'a',true,T0);R.record(s,'b',false,T0);
  assert.equal(R.isOld(s,'a'),true);
  assert.deepEqual(R.dueIds(s,T0+DAY),['b']);
  assert.equal(R.seed(s,[{id:'a',right:1},{id:'b',right:2}],T0),false);
});
test('sync keeps fsrs with the winning answer (engine merge and StudyCloud merge)',()=>{
  const fs=require('fs');
  assert.match(fs.readFileSync(__dirname+'/../scripts/study-cloud.js','utf8'),/out\.study\.fsrs\[id\] = fs/);
  assert.match(fs.readFileSync(__dirname+'/../scripts/study-course-engine.js','utf8'),/out\.study\.fsrs=out\.study\.fsrs\|\|\{\}\)\[id\]=fsx/);
});
