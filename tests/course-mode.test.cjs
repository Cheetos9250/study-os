const __cs=require('./course-source.cjs');
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),read=f=>__cs.read(path.join(root,f),'utf8');
const M=require('../scripts/study-course-mode.js');
test('one mode per course page, chosen by ?tab (default Flashcards)',()=>{
 assert.equal(M.pick('?tab=sum'),'sum');assert.equal(M.pick('?tab=prac&cat=c6'),'prac');assert.equal(M.pick(''),'cards');assert.equal(M.pick('?tab=evil'),'cards');
 assert.deepEqual(M.LABEL,{cards:'Flashcards',sum:'Lessons',prac:'Practice'});
});
test('every course page loads the shared look and the mode script, and hides the tab bar',()=>{
 for(const f of ['acc','eco','math','eng','zh']){const s=read(f+'.html');
  assert.match(s,/assets\/study-unify\.css/,f);assert.match(s,/scripts\/study-course-mode\.js/,f);assert.match(s,/<html lang="en">/,f);}
 const css=read('assets/study-unify.css');assert.match(css,/html\.mode-locked \.tabs\{display:none\}/);assert.match(css,/html:root\{/);
 assert.doesNotMatch(read('scripts/study-course-mode.js'),/localStorage|fetch\(/);
});
test('course page study controls are English',()=>{
 for(const f of ['acc','eco','math','eng','zh']){const code=read(f+'.html').split('\n').filter(l=>l.length<20000&&!/^const (D|EMBQ)\b/.test(l)).join('\n');
  for(const s of ['Show answer','>Again<small>','New/day: ','All done for today','Tap to see the answer','Front: term'])assert.ok(code.includes(s),f+' '+s);
  for(const th of ['แสดงคำตอบ','การ์ดใหม่/วัน','วันนี้ทบทวนครบแล้ว','ด้านหน้า: หัวข้อ'])assert.ok(!code.includes(th),f+' '+th);}
});
test('card pages hide the Notion review box; Cloud sync shows only on request',()=>{
 const css=read('assets/study-unify.css'),nav=read('scripts/study-nav.js');
 assert.match(css,/body #sync\{display:none!important\}/);assert.match(css,/html:not\(\.show-sync\) \.cloud-sync-bar\{display:none!important\}/);
 assert.match(nav,/class="sn-sync"/);assert.match(nav,/get\('sync'\)==='1'/);
});
