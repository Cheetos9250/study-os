/* Question sets: repeats hidden, 10–100 questions a set, 3 sets a chapter, next set opens at 90% mastered (box ≥ 2). */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const Q=require('../scripts/study-qsets.js'),R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const mk=(n,cat='c1',pre='q')=>[...Array(n)].map((_,i)=>({id:pre+i,cat,q:'Question number '+pre+i}));
test('repeats are hidden by normalised text within a chapter; written items are ignored',()=>{
  const qs=[{id:1,cat:'c1',q:'What is **COGS**?'},{id:2,cat:'c1',q:'what is cogs'},{id:3,cat:'c2',q:'What is COGS?'},{id:4,cat:'c1',q:'x',open:true}];
  const m=Q.build(qs);assert.deepEqual([...m.hidden],['2']);assert.deepEqual(m.sets,{c1:[['1']],c2:[['3']]});
});
test('set sizes: 3 sets, 10 to 100 each',()=>{
  const size=n=>Q.build(mk(n)).sets.c1.map(s=>s.length);
  assert.deepEqual(size(5),[5]);assert.deepEqual(size(25),[10,10,5]);assert.deepEqual(size(150),[50,50,50]);
  assert.deepEqual(size(228),[76,76,76]);assert.deepEqual(size(330),[100,100,100,30]);
});
test('progress: set 1 open; the next opens when 90% is mastered (right twice in a row)',()=>{
  const m=Q.build(mk(30)),sets=m.sets.c1,store={rv:{}};
  let p=Q.progress(sets,store);assert.deepEqual(p.sets.map(x=>x.open),[true,false,false]);assert.equal(p.current,0);
  sets[0].slice(0,9).forEach(id=>store.rv[id]=[2,0]);p=Q.progress(sets,store);assert.equal(p.sets[0].done,true);assert.equal(p.current,1);assert.deepEqual(p.sets.map(x=>x.open),[true,true,false]);
  store.rv[sets[1][0]]=[1,0];assert.equal(Q.progress(sets,store).sets[1].mastered,0,'box 1 is right once only');
  assert.deepEqual([...Q.allowed(m,store,'auto')],sets[1]);assert.deepEqual([...Q.allowed(m,store,2)],sets[1],'a locked set falls back to the current one');
  assert.equal(Q.allowed(m,store,'all').size,30);
});
test('engine: sets never hide Review due, Missed, deep links or Cram Mode; pages load the script first',()=>{
  const e=R('scripts/study-course-engine.js');
  assert.match(e,/const setsOn=\(\)=>!!window\.StudyQSets&&!reviewOnly&&!missedOnly&&!qJump&&!CRAM;/);
  assert.match(e,/\(!SM\|\|q\.open\|\|\(!SM\.hidden\.has\(String\(q\.id\)\)&&okSet\.has\(String\(q\.id\)\)\)\)/);
  for(const c of ['acc','eco','math'])assert.match(R(c+'.html'),/study-qsets\.js\?v=1"><\/script>\n<script src="scripts\/study-course-engine\.js\?v=3"/);
});
test('deep links never untick a chapter the engine already selected from ?cat=',()=>{
  const src=R('scripts/study-course-nav.js');
  assert.match(src,/if\(chips\[i\+1\]&&chips\[i\+1\]\.getAttribute\('aria-pressed'\)!=='true'\)chips\[i\+1\]\.click\(\);/);
});
