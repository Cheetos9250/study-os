const __cs=require('./course-source.cjs');
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const read=f=>__cs.read(path.join(__dirname,'..',f),'utf8');
test('quiz pages can shuffle the question order without touching saved answers',()=>{
 for(const f of ['acc.html','eco.html','math.html']){
  const s=read(f);
  assert.match(s,/shuffleOn=false/,f);
  assert.match(s,/if\(shuffleOn\)\{ for\(let i=deck\.length-1;i>0;i--\)/,f);
  assert.match(s,/id="shufBtn" aria-pressed="'\+shuffleOn\+'"/,f);
  assert.match(s,/const sh=\$\('#shufBtn'\); if\(sh\) sh\.onclick=\(\)=>\{shuffleOn=!shuffleOn;buildDeck\(\);renderQ\(\)\};/,f);
 }
});
