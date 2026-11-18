/* TASKS 24, 25: Ctrl+K and note tags in search; warm paper theme; read aloud on lesson summaries. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('search lists tags written in notes, most used first',()=>{
  const S=require('../scripts/study-search.js');
  const t=S.tags({'acc:c5':{text:'#ออกสอบชัวร์ FOB #สูตรลัด'},'acc:c6':{text:'FIFO #ออกสอบชัวร์, #จุดหลอก #1'},'x':{text:'no tags'}});
  assert.deepEqual(t,[['#ออกสอบชัวร์',2],['#จุดหลอก',1],['#สูตรลัด',1]]);
  const n=R('scripts/study-nav.js');assert.match(n,/\(e\.key==='k'\|\|e\.key==='K'\)&&\(e\.ctrlKey\|\|e\.metaKey\)/);
});
test('warm paper theme is the light theme with .warm tokens',()=>{
  const t=R('scripts/study-theme.js');assert.match(t,/NEXT=\{auto:'dark',dark:'light',light:'warm',warm:'auto'\}/);
  assert.match(t,/root\.classList\.toggle\('warm',m==='warm'\)/);assert.match(t,/setAttribute\('data-theme',m==='warm'\?'light':m\)/);
  assert.match(R('assets/study-world.css'),/:root\.warm\{--bg:/);assert.match(R('assets/study-unify.css'),/:root\.warm\{--paper:/);
});
test('read aloud picks Thai or English per piece and splits long text',()=>{
  const S=require('../scripts/study-speak.js');
  assert.equal(S.lang('ต้นทุนขาย Cost of goods sold คือ'),'th-TH');assert.equal(S.lang('Cost of goods sold'),'en-US');
  const c=S.chunks('A. '.repeat(200),220);assert.ok(c.length>1&&c.every(x=>x.length<=220));
  for(const f of ['acc','eco','math'])assert.match(R(f+'.html'),/scripts\/study-speak\.js/);
  assert.doesNotMatch(R('scripts/study-speak.js'),/localStorage|fetch\(/);
});
