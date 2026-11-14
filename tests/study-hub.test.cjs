const test=require('node:test'),assert=require('node:assert'),fs=require('fs');
test('hub page is read-only and links courses, chapters and VocaBloom',()=>{
  const s=fs.readFileSync('hub.html','utf8');
  assert.ok(!/localStorage\.setItem|removeItem|\.clear\(/.test(s),'hub must not write to storage');
  assert.match(s,/scripts\/study-today\.js/);
  assert.match(s,/vocabloom\/index\.html/);
  assert.match(s,/accounting-textbook\.html\?ch=/);
  assert.match(s,/link\(c,'prac'/);
});
test('homepage links to the hub',()=>{
  assert.match(fs.readFileSync('index.html','utf8'),/href="hub\.html"/);
});
