const __cs=require('./course-source.cjs');
const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const src=__cs.read(path.join(__dirname,'..','acc.html'),'utf8');
test('bank rec case sets: 48 English questions, case text rendered, filter exists',()=>{
  const S=__cs.accExtra()['BRC']; assert.ok(S); const Q=S.rows; assert.equal(Q.length,48);
  for(const q of Q){ assert.equal(q[0],'c8'); assert.equal(q[2].length,4); assert.equal(new Set(q[2]).size,4); assert.equal(q[3],0); assert.ok(q[4]);
    assert.doesNotMatch(JSON.stringify(q),/[฀-๿]/); }
  assert.ok(Q.filter(q=>q[5]).length>=30);
  assert.equal(S.pre,'brc-'); assert.equal(S.from,1); assert.equal(S.case,true); assert.match(src,/if\(set\.case\) o\.case=q\[5\]\|\|''/); assert.match(src,/id:set\.pre\+\(i\+set\.from\)/); assert.match(src,/if\(q\.case\)/);
});
