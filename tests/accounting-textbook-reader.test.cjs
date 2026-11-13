'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const dir=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(dir,'accounting-textbook.html'),'utf8');
const data=JSON.parse(fs.readFileSync(path.join(dir,'data/accounting-textbook-index.json'),'utf8'));
const geo=JSON.parse(fs.readFileSync(path.join(dir,'data/accounting-textbook-geometry.json'),'utf8'));

test('every individually indexed exercise has a render location',()=>{
 const items=data.items.filter(x=>!x.sectionOnly);
 assert.equal(items.length,403);
 assert.deepEqual(data.chapters.map(x=>x.chapter),['1','2','3','4','5','6','7','8','9']);
 assert.ok(items.every(x=>Number(x.chapter)>=1&&Number(x.chapter)<=9));
 assert.equal(geo.meta.pdfPages,1210);
 assert.equal(Object.keys(geo.items).length,items.length);
 for(const q of items){
  const part=geo.items[q.id];
  assert.ok(part,'Missing geometry for '+q.id);
  assert.equal(part.page,q.pdfPage,'Unexpected PDF page for '+q.id);
  assert.ok(part.top>=0&&part.top<part.bottom&&part.bottom<=783,'Invalid crop for '+q.id);
 }
 assert.equal(geo.meta.matched+geo.meta.fallback,items.length,'Geometry coverage dropped');
 assert.equal(geo.meta.matched,401);
 assert.equal(geo.meta.fallback,2);
 assert.ok(Object.values(geo.items).every(x=>x.page>=51&&x.page<=410));
});

test('web reader renders the user-imported source PDF inside the question panel',()=>{
 for(const needle of ['pdfjsLib.getDocument','pdfjsLib.GlobalWorkerOptions.workerSrc','page.render({canvasContext:ctx,viewport})','ctx.drawImage(image','viewer-inner','questionList','questionStatus','answer','questionCode','extraPage','surrounding'])assert.ok(html.includes(needle),'Missing: '+needle);
 assert.match(html,/indexedDB\.open\(IDB,1\)/);
 assert.match(html,/bookPut\(blob\)/);
 assert.match(html,/bookGet\(\)/);
 assert.match(html,/studyos\.accounting\.textbook\.progress\.v1/);
 assert.match(html,/Export answers/);
 assert.match(html,/Import answers/);
 assert.match(html,/bookDelete\(\)/);
 assert.match(html,/requestedPage>=chapterEnd/);
 assert.match(html,/records=catalog\.items\.filter\(x=>!x\.sectionOnly&&/);
 assert.doesNotMatch(html,/fetch\(catalog\.meta\.sourceUrl/);
 assert.doesNotMatch(html,/localStorage\.clear\(/);
});

test('original PDF is not embedded or published as question text',()=>{
 assert.ok(html.length<70000);
 assert.match(html,/The PDF is imported into this browser and is not uploaded to Study OS/);
 assert.match(html,/pdfFile/);
 assert.match(html,/1,210 pages/);
 assert.doesNotMatch(html,/uploadedAt:|uploadPdfToServer|\.post\('/);
});