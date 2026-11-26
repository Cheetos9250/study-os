const test=require('node:test'),assert=require('node:assert'),fs=require('fs');
test('eco hides Micro chapters c2/c3 (owner, 26 Nov 2026); data stays',()=>{
  const eco=fs.readFileSync('eco.html','utf8'),eng=fs.readFileSync('scripts/study-course-engine.js','utf8'),hub=fs.readFileSync('hub.html','utf8');
  assert.match(eco,/hideCats:\['c2','c3'\]/);
  assert.match(eng,/HIDE_CATS\.includes\(QS\[i\]\.cat\)/);
  assert.match(eng,/D\.cards\.filter\(c=>!HIDE_CATS/);
  assert.match(hub,/c\.key==='eco'&&\(id==='c2'\|\|id==='c3'\)/);
  assert.match(fs.readFileSync('data/courses/eco.js','utf8'),/Micro · 002/);
});
