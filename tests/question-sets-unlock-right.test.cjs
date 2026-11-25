const test=require('node:test'),assert=require('node:assert');
const Q=require('../scripts/study-qsets.js');
const mk=n=>Array.from({length:n},(_,i)=>({id:'q'+i,cat:'c1',q:'question '+i}));
test('next set opens when 90% of the set is answered right (box ≥ 1), mastery not needed',()=>{
  const sets=Q.build(mk(120)).sets.c1,store={rv:{}};
  sets[0].slice(0,44).forEach(id=>store.rv[id]=[1,0]);
  let p=Q.progress(sets,store);assert.equal(p.sets[0].right,44);assert.equal(p.sets[0].done,false);assert.equal(p.sets[1].open,false);
  store.rv[sets[0][44]]=[1,0];p=Q.progress(sets,store);
  assert.equal(p.sets[0].right,45);assert.equal(p.sets[0].mastered,0);assert.equal(p.sets[0].done,true);assert.equal(p.sets[1].open,true);assert.equal(p.current,1);
});
test('wrong answers (box 0) do not count as right',()=>{
  const sets=Q.build(mk(60)).sets.c1,store={rv:{}};sets[0].forEach(id=>store.rv[id]=[0,0]);
  assert.equal(Q.progress(sets,store).sets[0].right,0);
});
