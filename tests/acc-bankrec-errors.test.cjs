const __cs=require('./course-source.cjs');
const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const src=__cs.read(path.join(__dirname,'..','acc.html'),'utf8');
test('accounting has 20 English bank reconciliation error questions ',()=>{
  const S=__cs.accExtra()['BANKERR']; assert.ok(S); const Q=S.rows; assert.equal(Q.length,20);
  for(const q of Q){ assert.equal(q[0],'c8'); assert.equal(q[2].length,4); assert.equal(new Set(q[2]).size,4); assert.ok(q[4]);
    assert.doesNotMatch(JSON.stringify(q),/[฀-๿]/); }
  assert.equal(S.pre,'err-b'); assert.equal(S.from,1); assert.match(src,/id:set\.pre\+\(i\+set\.from\)/); 
});
