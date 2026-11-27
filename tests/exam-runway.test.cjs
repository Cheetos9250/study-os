"use strict";
const test=require('node:test'),assert=require('node:assert/strict');
const T=require('../scripts/study-today.js');
const at=d=>Date.parse(d+'T03:00:00Z');
const sum=(per)=>({reviewNow:0,per});
const ch=(id,quiz,answered,correct)=>({id,label:id,cards:0,seen:0,due:0,unseen:0,quiz,answered,correct});
test('runway counts unanswered plus wrong questions and spreads them over the days before the last one',()=>{
  const s={acc:sum({c5:ch('c5',100,40,30),c6:ch('c6',50,0,0)})};
  const e=[{id:'f',course:'acc',title:'Final',date:'2026-11-26',cats:['c5','c6'],confirmed:true}];
  const r=T.runway(e,s,at('2026-11-16'));
  assert.equal(r.length,1);
  assert.deepEqual([r[0].fresh,r[0].wrong,r[0].left,r[0].days],[110,10,120,10]);
  assert.equal(r[0].perDay,Math.ceil(120/9));
});
test('runway skips past exams, exam day, unknown courses and empty scopes; tomorrow uses one study day',()=>{
  const s={acc:sum({c5:ch('c5',10,0,0)})};
  const now=at('2026-11-16');
  const mk=(id,date,course,cats)=>({id,course,title:id,date,cats,confirmed:true});
  assert.equal(T.runway([mk('a','2026-11-16','acc',['c5']),mk('b','2026-11-10','acc',['c5']),mk('c','2026-11-20','eco',['x']),mk('d','2026-11-20','acc',[])],s,now).length,0);
  const t=T.runway([mk('e','2026-11-17','acc',['c5'])],s,now);
  assert.equal(t[0].perDay,10);
});
test('buildPlan puts the pace on chapter tasks and a runway list in the result',()=>{
  const s={acc:sum({c5:ch('c5',30,0,0)})};
  const e=[{id:'f',course:'acc',title:'Final',date:'2026-11-26',cats:['c5'],confirmed:true}];
  const p=T.buildPlan(e,s,T.loadSettings(null),at('2026-11-16'));
  const t=p.tasks.find(x=>x.kind==='chapter');
  assert.equal(t.pace,4);assert.equal(p.runway.length,1);
});
test('Today shows the pace after the reason',()=>{
  const fs=require('node:fs'),path=require('node:path');
  assert.match(fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8'),/t\.pace\?' · about '\+t\.pace\+' questions a day to finish'/);
});
