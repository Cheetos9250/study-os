const __cs=require('./course-source.cjs');
const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path');
const R=p=>__cs.read(path.join(__dirname,'..',p),'utf8');
test('accounting practice includes the written textbook exercises, self-marked, sharing working with the textbook page',()=>{
  const s=R('acc.html');
  assert.match(s,/scripts\/textbook-sos-render\.js/); assert.match(s,/\(OPT\.writtenDir\|\|'data\/textbook-sos\/ch'\)\+ch\+'\.json'/);
  assert.match(s,/const id='tbw-'\+it\.id/); assert.match(s,/TBP_KEY='studyos\.accounting\.textbook\.progress\.v1'/);
  assert.match(s,/id="tbShow"/); assert.match(s,/id="tbGot"/); assert.match(s,/id="tbMiss"/);
  assert.match(s,/StudyReview\.record\(store,q\.id,v===q\.right/);
});
test('shared renderer escapes HTML and renders tables',()=>{
  delete globalThis.StudySosMd; require('../scripts/textbook-sos-render.js');
  const h=globalThis.StudySosMd('<b>x</b>\n\n| A | B |\n|---|---|\n| y | 1,200 |');
  assert.doesNotMatch(h,/<b>x<\/b>/); assert.match(h,/&lt;b&gt;/); assert.match(h,/<td class="n">1,200<\/td>/);
});
