const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','acc.html'),'utf8');
test('accounting practice is one merged pool (no separate error/case filters)',()=>{
  assert.doesNotMatch(src,/id="(errBtn|bankErrBtn|brcBtn)"/); assert.doesNotMatch(src,/errOnly|bankErrOnly|brcOnly/);
});
test('near-duplicate questions are hidden by id, also for saved questions loaded later',()=>{
  const m=src.match(/const QHIDE=new Set\((\[.*?\])\);/); assert.ok(m); const H=JSON.parse(m[1]);
  assert.ok(H.length>=80); assert.equal(new Set(H).size,H.length);
  assert.match(src,/if\(QHIDE\.has\(String\(QS\[i\]\.id\)\)\) QS\.splice\(i,1\)/);
  assert.match(src,/QHIDE\.has\(id\)\) return;/);
});
