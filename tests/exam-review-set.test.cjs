"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const R=require('../scripts/study-review.js'),T=require('../scripts/study-today.js');
const DAY=86400000,NOW=Date.UTC(2026,10,27,5);
const Q=(id,cat)=>({id,cat,right:0});
test('examSet picks wrong and box-0 questions first, per chapter, capped',()=>{
  const qs=[Q('a','c1'),Q('b','c1'),Q('c','c1'),Q('d','c2'),Q('e','c2'),Q('u','c2')];
  const s={ans:{a:1,b:0,c:0,d:1,e:0},ats:{},rv:{}};
  R.record(s,'b',true,NOW-30*DAY);R.record(s,'c',true,NOW);R.record(s,'a',false,NOW-DAY);R.record(s,'d',false,NOW-DAY);R.record(s,'e',true,NOW);
  const ids=R.examSet(s,qs,NOW);
  assert.ok(ids.includes('a')&&ids.includes('d'),'wrong ones in');
  assert.ok(!ids.includes('u'),'unanswered never');
  assert.ok(!ids.includes('c')&&!ids.includes('e'),'freshly right and easy are left out');
  assert.equal(R.examSet(s,qs,NOW,{perCat:1,cats:['c1']}).length,1);
});
test('examSet ranks wrong above forgotten, keeps chapter order, stores nothing',()=>{
  const qs=[Q('x','c2'),Q('y','c1'),Q('z','c1')];
  const s={ans:{x:1,y:1,z:0},ats:{},rv:{}};
  R.record(s,'x',false,NOW-DAY);R.record(s,'y',false,NOW-DAY);R.record(s,'z',true,NOW-200*DAY);
  const before=JSON.stringify(s);
  const ids=R.examSet(s,qs,NOW,{order:['c1','c2']});
  assert.equal(ids[0],'y');assert.equal(ids[ids.length-1],'x');assert.equal(JSON.stringify(s),before);
});
test('engine wires Exam review chip and ?exam=1 without touching storage keys',()=>{
  const e=fs.readFileSync(__dirname+'/../scripts/study-course-engine.js','utf8');
  assert.match(e,/id="examBtn"/);assert.match(e,/\[\?&\]exam=1/);assert.match(e,/StudyReview\.examSet/);
});
test('Today plan adds Exam review within 7 days when something was missed',()=>{
  const now=Date.UTC(2026,10,27,5),sum={acc:{reviewNow:0,per:{c5:{id:'c5',label:'Ch5',quiz:50,answered:20,correct:12}}}};
  const exams=[{id:'e1',course:'acc',title:'Acc final',date:'2026-12-02',cats:['c5']}];
  const plan=T.buildPlan(exams,sum,{done:{}},now);
  const t=plan.tasks.find(x=>x.kind==='examrev');assert.ok(t);assert.deepEqual(t.cats,['c5']);
  const far=T.buildPlan([{...exams[0],date:'2026-12-20'}],sum,{done:{}},now);
  assert.ok(!far.tasks.some(x=>x.kind==='examrev'));
});
