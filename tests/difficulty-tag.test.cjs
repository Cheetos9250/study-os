const __cs=require('./course-source.cjs');
const test=require('node:test'),assert=require('node:assert'),path=require('path');
const s=__cs.read(path.join(__dirname,'..','acc.html'),'utf8');
test('difficulty tag is the question\'s own fixed level, shown before answering, and stores nothing (owner, 24 Nov 2026)',()=>{
  assert.match(s,/function diffTag\(q\)/);
  assert.match(s,/StudyQDiff\.level\(q\)/);
  assert.match(s,/\['Hard','#e5484d'\]/);
  assert.match(s,/diffTag\(q\)\+'<\/div>'/);
  const body=s.slice(s.indexOf('function diffTag'),s.indexOf('function diffTag')+900);
  assert.doesNotMatch(body,/store\.ans|store\.rv/,'does not follow my answers any more');
  assert.doesNotMatch(body,/localStorage|sessionStorage|save\(\)/);
});
