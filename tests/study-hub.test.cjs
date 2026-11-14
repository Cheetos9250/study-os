const test=require('node:test'),assert=require('node:assert'),fs=require('fs');
test('hub page is read-only and links courses, chapters and VocaBloom',()=>{
  const s=fs.readFileSync('hub.html','utf8');
  assert.deepEqual([...s.matchAll(/localStorage\.setItem\(([^,]+),/g)].map(m=>m[1]),['NOTES_KEY'],'hub writes only lesson notes');
  assert.ok(!/removeItem|\.clear\(/.test(s));
  assert.match(s,/NOTES_KEY='studyos\.notes\.v1'/);
  assert.match(s,/scripts\/study-today\.js/);
  assert.match(s,/vocabloom\/index\.html/);
  assert.match(s,/accounting-textbook\.html\?ch=/);
  assert.match(s,/link\(c,'prac'/);
});
test('homepage reaches the hub through the shared navigation',()=>{
  assert.match(fs.readFileSync('index.html','utf8'),/scripts\/study-nav\.js/);
  assert.match(fs.readFileSync('scripts/study-nav.js','utf8'),/href:'hub\.html'/);
});
