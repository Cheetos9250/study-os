'use strict';
/* No network or credentials; run node --test vocabloom/tests/regression.test.cjs */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const {test}=require('node:test');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('vocabloom/index.html');
const ui=read('vocabloom/study-integration.js');
const cloud=read('vocabloom/unified-progress.js');
const decks=JSON.parse(read('vocabloom/study-decks.json'));
const cards=JSON.parse(read('data/cards.json'));
const quizzes=JSON.parse(read('data/quiz.json'));
function extract(code,first,second){
 const a=code.indexOf(first),b=code.indexOf(second,a+first.length);
 assert.ok(a>=0&&b>a,'Missing function anchor: '+first);
 return code.slice(a,b);
}
test('Scripts parse without JavaScript syntax errors',()=>{
 const m=html.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(m,'Main app script missing');
 new vm.Script(m[1],{filename:'index.html'});
 new vm.Script(ui,{filename:'study-integration.js'});
 new vm.Script(cloud,{filename:'unified-progress.js'});
});
test('UI fixes and all required resources are present',()=>{
 assert.ok(html.includes('href="./favicon.svg"'));
 assert.ok(read('vocabloom/favicon.svg').includes('<svg'));
 assert.ok(!html.includes('WEDNESDAY OR ANY DAY'));
 assert.ok(html.includes('src="./study-integration.js"'));
 assert.ok(html.includes('src="./unified-progress.js"'));
 assert.ok(html.includes('background:linear-gradient(to right,var(--white)'));
 assert.ok(cloud.includes("CLOUD.enabled=cSafeGet(CLOUD_AUTO)==='1'"));
 assert.ok(cloud.includes('function cForgetKey()'));
 assert.ok(cloud.includes('function cFullBackup()'));
 assert.ok(cloud.includes("data-action=\"cloud-forget\""));
});
test('Original five subject decks and identity keys retained',()=>{
 assert.deepEqual(new Set(decks.decks.map(d=>d.key)),new Set(['acc','eco','math','eng','zh']));
 const ids=decks.decks.flatMap(d=>d.cards.map(c=>d.key+':'+c[4]));
 assert.equal(ids.length,757);
 assert.equal(new Set(ids).size,ids.length);
 assert.deepEqual(decks.decks.map(d=>d.markKey),[
 'acc-flashcards-v1','econ-flashcards-v1','math-flashcards-v1','eng-vocab-v1','zh-vocab-v1'
 ]);
 assert.ok(cards.rows.length>=400,'Missing Notion export cards');
 assert.ok(quizzes.rows.length>=200,'Missing verified quiz export');
});
test('Cross-device merge keeps newer quiz answers and card schedules',()=>{
 const mergeCode=extract(cloud,'function cMergeState(a,b){','function cApplySubject(d,merged){');
 const merge=new Function(mergeCode+';return cMergeState;')();
 const a={study:{ans:{0:1},ats:{0:200}},srs:{s:{card:{ts:10,due:1000}},m:{day:123,newDone:2}}};
 const b={study:{ans:{0:2,1:3},ats:{0:100,1:150}},srs:{s:{card:{ts:20,due:2000},newcard:{ts:5}},m:{day:123,newDone:3}}};
 const m=merge(a,b);
 assert.equal(m.study.ans[0],1);
 assert.equal(m.study.ans[1],3);
 assert.equal(m.srs.s.card.due,2000);
 assert.ok(m.srs.s.newcard);
 assert.equal(m.srs.m.newDone,3);
});
test('SRS supports all four review ratings and preserves previous state',()=>{
 const code=extract(ui,'function uStartDay(t){','function uRate(d,r){');
 const make=new Function(code+';return {uSchedule,uStartDay};');
 const {uSchedule}=make();
 const base={st:'rev',step:0,ease:2.5,ivl:5,lapses:0,due:1,ts:1};
 for(const rating of [1,2,3,4]){
  const next=uSchedule(base,rating);
  assert.ok(next.ts>0);
  assert.ok(next.due>0);
  assert.ok(next.ivl>=0);
  assert.equal(base.ivl,5,'Rating mutated shared input');
 }
 const again=uSchedule(base,1);
 const easy=uSchedule(base,4);
 assert.equal(again.st,'learn');
 assert.equal(easy.st,'rev');
 assert.ok(easy.ivl>base.ivl);
});
