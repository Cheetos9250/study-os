const __cs=require('./course-source.cjs');
const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const src=__cs.read(path.join(__dirname,'..','acc.html'),'utf8');
test('accounting has 20 English "errors" questions with stable ids and valid answers',()=>{
  const S=__cs.accExtra()['ERR']; assert.ok(S); const Q=S.rows; assert.equal(Q.length,20);
  const cats=new Set(['c1','c2','c3','c4','c5','c6','c7','c8','c9']);
  for(const q of Q){ assert.ok(cats.has(q[0])); assert.equal(q[2].length,4); assert.ok(q[3]>=0&&q[3]<4); assert.ok(q[4]);
    assert.doesNotMatch(JSON.stringify(q),/[฀-๿]/); assert.equal(new Set(q[2]).size,4); }
  assert.equal(S.pre,'err-'); assert.equal(S.from,1); assert.match(src,/id:set\.pre\+\(i\+set\.from\)/);
});
test('accounting practice hides Thai saved questions ',()=>{
  assert.match(src,/if\(OPT\.englishOnlyNotion&&\/\[\\u0E00-\\u0E7F\]\/\.test\(\[r\.Question/); assert.match(src,/window\.StudyCourseOpts=\{englishOnlyNotion:true/);
});
