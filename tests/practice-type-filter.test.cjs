const __cs=require('./course-source.cjs');
const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path');
const s=__cs.read(path.join(__dirname,'..','acc.html'),'utf8');
test('accounting practice can show multiple choice and written questions separately',()=>{
  assert.match(s,/\['all','All types'\],\['mcq','Multiple choice'\],\['written','Written'\]/);
  assert.match(s,/deck=QS\.filter\(q=>typeOk\(q\)&&/);
  assert.match(s,/const QTYPE_KEY='studyos\.'\+D\.key\+'\.qtype';/); assert.match(s,/sessionStorage\.setItem\(QTYPE_KEY,qtype\)/); assert.match(s,/if\(OPT\.written&&!SLIM_ROWS\) h\+='<div class=\"row\" role=\"group\" aria-label=\"Question type\"/);
  assert.doesNotMatch(s,/localStorage\.setItem\(QTYPE_KEY/); // session only: no new backed-up key
  assert.match(s,/typeOk=q=>\(!q\.open\|\|\(qJump!==null/); // a ?q= link still finds its written question
});
