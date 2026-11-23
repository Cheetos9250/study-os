/* Old questions (owner, 23 Nov 2026): 2 right answers in a row moves a question out of the normal sets and
   Review due into the "Old questions" view; a wrong answer there sends it back. Counts earlier answers too,
   because the review box already holds the streak. */
const __cs=require('./course-source.cjs');
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const R=require('../scripts/study-review.js');const DAY=86400000;
const read=f=>__cs.read(path.join(__dirname,'..',f),'utf8');
test('a question becomes old after 2 right answers in a row and leaves Review due',()=>{
  const now=Date.UTC(2026,10,23,5);const store={ans:{q:1},ats:{q:now},rv:{}};
  R.record(store,'q',true,now);assert.equal(R.isOld(store,'q'),false,'1 right is not old');
  assert.equal(R.isDue(store,'q',store.rv.q[1]),true,'box 1 still comes back for review');
  R.record(store,'q',true,store.rv.q[1]);assert.equal(store.rv.q[0],2);assert.equal(R.isOld(store,'q'),true);
  assert.equal(R.isDue(store,'q',store.rv.q[1]+90*DAY),false,'old questions never come back in Review due');
  R.record(store,'q',false,now+10*DAY);assert.equal(R.isOld(store,'q'),false,'a wrong answer sends it back');
  assert.equal(R.isDue(store,'q',now+11*DAY),true,'and it is due again tomorrow');
});
test('earlier answers count: any stored streak of 2 or more is old; unanswered or bad data is not',()=>{
  const now=Date.UTC(2026,10,23,5);
  assert.equal(R.oldRaw(JSON.stringify({ans:{a:1,b:1,c:1},rv:{a:[2,now+7*DAY],b:[5,now+90*DAY],c:[1,now]}})),2);
  assert.equal(R.oldRaw(JSON.stringify({ans:{},rv:{a:[3,now]}})),0,'no answer: not old');
  assert.equal(R.oldRaw('bad'),0);
  assert.equal(R.countRaw(JSON.stringify({ans:{a:1,c:1},rv:{a:[2,now-DAY],c:[0,now-DAY]}}),now),1,'Today counts only non-old due questions');
});
test('quiz pages hide old questions from the normal deck and show only them under Old questions',()=>{
  for(const f of ['acc.html','eco.html','math.html']){const s=read(f);
    assert.match(s,/&&\(reviewOnly\|\|\(showOld\?isOldQ\(q\):!isOldQ\(q\)\)\)&&/,f);
    assert.match(s,/>Old questions<span class="n">/,f);assert.match(s,/showOld=!showOld/,f);
    assert.match(s,/StudyReview\.isOld\(store,q\.id\)/,f);}
});
