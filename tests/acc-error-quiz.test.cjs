const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const src=fs.readFileSync(path.join(__dirname,'..','acc.html'),'utf8');
test('accounting has 20 English "errors" questions with stable ids and valid answers',()=>{
  const m=src.match(/const ERR_QUIZ=(\[[\s\S]*?\n\]);/); assert.ok(m);
  const Q=vm.runInNewContext(m[1]); assert.equal(Q.length,20);
  const cats=new Set(['c1','c2','c3','c4','c5','c6','c7','c8','c9']);
  for(const q of Q){ assert.ok(cats.has(q[0])); assert.equal(q[2].length,4); assert.ok(q[3]>=0&&q[3]<4); assert.ok(q[4]);
    assert.doesNotMatch(JSON.stringify(q),/[฀-๿]/); assert.equal(new Set(q[2]).size,4); }
  assert.match(src,/id:'err-'\+\(i\+1\)/);
});
test('accounting practice hides Thai saved questions and has an Errors set filter',()=>{
  assert.match(src,/if\(\/\[\\u0E00-\\u0E7F\]\/\.test\(\[r\.Question/);
  assert.match(src,/id="errBtn"/); assert.match(src,/set=errors/);
});
