const __cs=require('./course-source.cjs');
"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=require('../scripts/study-review.js');const DAY=86400000;
const read=f=>__cs.read(path.join(__dirname,'..',f),'utf8');
test('wrong answers come back tomorrow; each correct answer waits longer, capped at 90 days',()=>{
  const now=Date.UTC(2026,10,16,5);const sod=R.sod(now);
  assert.deepEqual(R.next(undefined,false,now),[0,sod+DAY]);
  assert.deepEqual(R.next(undefined,true,now),[1,sod+3*DAY]);
  assert.deepEqual(R.next([1,0],true,now),[2,sod+7*DAY]);
  assert.deepEqual(R.next([3,0],true,now),[4,sod+30*DAY]);
  assert.deepEqual(R.next([4,0],true,now),[5,sod+90*DAY]);
  assert.deepEqual(R.next([5,0],true,now),[5,sod+90*DAY]);
  assert.deepEqual(R.next([3,0],false,now),[0,sod+DAY]);
});
test('earlier answers get a schedule without touching answers; only answered, due questions count',()=>{
  const now=Date.UTC(2026,10,16,5);
  const store={known:[],ans:{a:1,b:0},ats:{a:now-10*DAY,b:now}};
  const before=JSON.stringify(store.ans);
  assert.equal(R.seed(store,[{id:'a',right:1},{id:'b',right:2},{id:'c',right:0}],now),true);
  assert.equal(JSON.stringify(store.ans),before);
  assert.deepEqual(R.dueIds(store,now).sort(),['b'],'right answers are old since 25 Nov 2026, so only the wrong one is due');
  assert.equal(R.seed(store,[{id:'a',right:1}],now),false,'seeding twice changes nothing');
  assert.equal(R.countRaw(JSON.stringify(store),now),1);
  assert.equal(R.countRaw('not json',now),0);
  delete store.ans.b;assert.deepEqual(R.dueIds(store,now),[]);
});
test('quiz pages keep review state inside the backed-up study-<course> key and carry it through sync',()=>{
  for(const f of ['acc.html','eco.html','math.html']){const s=read(f);
    assert.match(s,/<script src="scripts\/study-review\.js\?v=\d+"><\/script>\n<script src="scripts\/study-progress-backup\.js/,f);
    assert.match(s,/StudyReview\.record\(store,q\.id,store\.ans\[q\.id\]===q\.right,Date\.now\(\)\); save\(\);/,f);
    assert.match(s,/id="revBtn"/,f);assert.match(s,/\[\?&\]review=1/,f);
    assert.match(s,/store\.ans=\{\}; store\.ats=\{\}; store\.rv=\{\};/,f);
    assert.match(s,/known:store\.known\|\|\[\],rv:store\.rv\|\|\{\},fsrs:store\.fsrs\|\|\{\}\}/,f);
    assert.doesNotMatch(s,/localStorage\.setItem\(['"]studyos\.quiz/,f);}
});
test('Today and Practice show questions due for review',()=>{
  for(const f of ['index.html','practice.html']){const s=read(f);
    assert.match(s,/<script src="scripts\/study-review\.js\?v=\d+"><\/script>/,f);
    assert.match(s,/StudyReview\.countRaw\(read\('study-'\+c\.key\),now\)/,f);
    assert.match(s,/&review=1/,f);}
  assert.match(read('index.html'),/Quiz review/);
});
