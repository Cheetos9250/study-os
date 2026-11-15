const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const src=fs.readFileSync(path.join(__dirname,'..','acc.html'),'utf8');
test('accounting Ch8 extra set: 16 English questions beyond bank reconciliation',()=>{
  const m=src.match(/const CH8_QUIZ=(\[[\s\S]*?\n\]);/); assert.ok(m);
  const Q=vm.runInNewContext(m[1]); assert.equal(Q.length,16);
  for(const q of Q){ assert.equal(q[0],'c8'); assert.equal(q[2].length,4); assert.equal(new Set(q[2]).size,4); assert.ok(q[4]);
    assert.doesNotMatch(JSON.stringify(q),/[฀-๿]/); assert.doesNotMatch(q[1],/bank reconciliation/i); }
  assert.match(src,/id:'c8x-'\+\(i\+1\)/);
});
