const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path');
const s=fs.readFileSync(path.join(__dirname,'..','acc.html'),'utf8');
test('accounting practice can show multiple choice and written questions separately',()=>{
  assert.match(s,/\['all','All types'\],\['mcq','Multiple choice'\],\['written','Written'\]/);
  assert.match(s,/deck=QS\.filter\(q=>typeOk\(q\)&&/);
  assert.match(s,/sessionStorage\.setItem\('studyos\.acc\.qtype',qtype\)/);
  assert.doesNotMatch(s,/localStorage\.setItem\('studyos\.acc\.qtype'/); // session only: no new backed-up key
  assert.match(s,/u\.get\('q'\)\?'all'/); // deep links always find their question
});
