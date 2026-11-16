"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const T=require('../scripts/study-today.js');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const at=d=>Date.parse(d+'T03:00:00Z');
test('on an exam day the plan still schedules a chapter for the next exam, with how many days are left',()=>{
  const D=T.parseCourseData(read('acc.html'));const now=at('2026-11-16'),sum={acc:T.summarize(D,null,null,now)};
  const cats=D.cats.slice(4,6).map(c=>c[0]);
  const exams=[{id:'q',course:'acc',title:'Quiz',date:'2026-11-16',cats:[],confirmed:true},{id:'f',course:'acc',title:'Final',date:'2026-11-26',cats,confirmed:true}];
  const t=T.buildPlan(exams,sum,T.loadSettings(null),now).tasks;
  assert.equal(t[0].kind,'exam');const ch=t.filter(x=>x.examId==='f');
  assert.equal(ch.length,1);assert.equal(ch[0].days,10);assert.equal(ch[0].exam,'Final');
  const before=T.buildPlan(exams.map(e=>e.id==='q'?{...e,date:'2026-11-18'}:e),sum,T.loadSettings(null),now).tasks;
  assert.equal(before.filter(x=>x.examId==='f').length,0,'1–3 days before an exam it still gets full focus');
});
test('Today puts due quiz reviews first and explains each plan item in one line',()=>{
  const s=read('index.html');
  assert.match(s,/plan\.tasks\.unshift\(\{id:'quiz-review',kind:'quiz'/);
  assert.match(s,/link\(t\.top,'prac'\)\+'&review=1">Start review/);
  assert.match(s,/const sub=t=>t\.kind==='chapter'\?'For '\+t\.exam/);
  assert.match(s,/\.plan li\.stack\{/);
});
