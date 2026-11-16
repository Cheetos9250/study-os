"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=require('../scripts/study-review.js');const DAY=86400000;
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('a question retires after 4 correct answers in a row and comes back only when its 30/90-day review is due',()=>{
  const now=Date.UTC(2026,10,16,5);const store={ans:{q:1},ats:{q:now},rv:{}};
  let t=now;for(let i=0;i<3;i++){R.record(store,'q',true,t);t=store.rv.q[1];}
  assert.equal(store.rv.q[0],3);assert.equal(R.isRetired(store,'q',t-1),false,'3 in a row is not retired yet');
  R.record(store,'q',true,t);assert.equal(store.rv.q[0],4);assert.equal(R.isRetired(store,'q',t+DAY),true);
  assert.equal(R.isRetired(store,'q',store.rv.q[1]+1),false,'due again: back in the deck');
  R.record(store,'q',false,t+DAY);assert.equal(store.rv.q[0],0,'a wrong answer un-retires it');
  assert.equal(R.retiredRaw(JSON.stringify({ans:{a:1,b:1},rv:{a:[4,now+30*DAY],b:[2,now+DAY]}}),now),1);
  assert.equal(R.retiredRaw('bad',now),0);
});
test('quiz pages hide retired questions unless Retired is on, and mark chapters that are fully mastered',()=>{
  for(const f of ['acc.html','eco.html','math.html']){const s=read(f);
    assert.match(s,/\(reviewOnly\|\|showRetired\|\|!retired\(q\)\)&&/,f);
    assert.match(s,/id="retBtn"/,f);assert.match(s,/showRetired=!showRetired/,f);
    assert.match(s,/mastered=inCat\.length&&inCat\.every\(retired\)/,f);}
  assert.match(read('practice.html'),/StudyReview\.retiredRaw\(read\('study-'\+c\.key\),now\)/);
});
