const __cs=require('./course-source.cjs');
const test=require('node:test'),assert=require('node:assert'),path=require('path');
const s=__cs.read(path.join(__dirname,'..','acc.html'),'utf8');
test('difficulty tag comes from my own answers and stores nothing new',()=>{
  assert.match(s,/function diffTag\(q\)/);
  assert.match(s,/\['Hard','#e5484d'\]/); assert.match(s,/box<2\?\['Medium'/);
  assert.match(s,/diffTag\(q\)\+'<\/div>'/);
  assert.match(s,/store\.ans\[q\.id\]===undefined\)return ''/); // unanswered: no tag
  const body=s.slice(s.indexOf('function diffTag'),s.indexOf('function diffTag')+1200);
  assert.doesNotMatch(body,/localStorage|sessionStorage|save\(\)/);
});
