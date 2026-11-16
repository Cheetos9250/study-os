const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path');
const R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
delete globalThis.StudySosChecks; require('../scripts/textbook-sos-render.js'); const C=globalThis.StudySosChecks;
test('number parser accepts $, commas, brackets and %',()=>{
  assert.equal(C.parse('$1,234.50'),1234.5); assert.equal(C.parse('(45)'),-45); assert.equal(C.parse('36%'),36); assert.equal(C.parse(' 7980 '),7980);
  assert.equal(C.parse('abc'),null); assert.equal(C.parse(''),null); assert.equal(C.parse('1,2,3x'),null);
});
test('key-answer checks: well formed, and each value appears in its worked solution',()=>{
  let n=0;
  for(const ch of [5,6,7,8,9]){ for(const it of JSON.parse(R(`data/textbook-sos/ch${ch}.json`))){ if(!it.checks) continue; n++;
    for(const c of it.checks){ assert.equal(typeof c[0],'string'); assert.ok(Number.isFinite(c[1]),it.id); if(c.length>2) assert.ok(c[2]>0&&c[2]<=2,it.id);
      const forms=[c[1].toLocaleString('en-US',{maximumFractionDigits:2}),c[1].toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),c[1].toLocaleString('en-US',{minimumFractionDigits:1,maximumFractionDigits:1})];
      assert.ok(forms.some(f=>it.solution.includes(f)),it.id+' '+c[0]); } } }
  assert.ok(n>=140,'at least 140 exercises have number checks: '+n);
});
test('both pages render the check boxes',()=>{
  assert.match(R('acc.html'),/StudySosChecks\.html\(q\.checks\)/); assert.match(R('acc.html'),/id=\\"tbGotQuick\\"|id="tbGotQuick"/);
  assert.match(R('accounting-textbook.html'),/StudySosChecks\.wire\(\$\('sosChecks'\)/);
});
