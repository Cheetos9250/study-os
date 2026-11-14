'use strict';
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/accounting-textbook-index.json'),'utf8'));
const html=fs.readFileSync(path.join(root,'accounting-textbook.html'),'utf8');
const accounting=fs.readFileSync(path.join(root,'acc.html'),'utf8');
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');

test('source-linked index has nonempty unique stable references',()=>{
  assert.ok(catalog.meta.sourceUrl.startsWith('https://drive.google.com/file/'));
  assert.equal(catalog.items.filter(x=>!x.sectionOnly).length,403);
  assert.equal(catalog.meta.questionCount,403);
  assert.equal(catalog.meta.sectionReferenceCount,36);
  assert.deepEqual(catalog.chapters.map(x=>x.chapter),['1','2','3','4','5','6','7','8','9']);
  assert.equal(catalog.chapters.at(-1).name,'Accounting for Receivables');
  assert.equal(new Set(catalog.items.map(x=>x.id)).size,catalog.items.length);
  assert.equal(new Set(catalog.chapters.map(x=>x.chapter)).size,catalog.chapters.length);
});

test('catalog record counts and source pages reconcile',()=>{
  const individual=catalog.items.filter(x=>!x.sectionOnly);
  const sections=catalog.items.filter(x=>x.sectionOnly);
  assert.equal(individual.length,catalog.meta.questionCount);
  assert.equal(sections.length,catalog.meta.sectionReferenceCount);
  const chapters=new Map(catalog.chapters.map(x=>[x.chapter,x]));
  for(const item of catalog.items){
    assert.ok(chapters.has(item.chapter),'chapter missing for '+item.id);
    assert.ok(Number.isInteger(item.pdfPage)&&item.pdfPage>0&&item.pdfPage<=catalog.meta.pdfPages,'invalid PDF page '+item.id);
    assert.ok(item.title && typeof item.title==='string','title missing for '+item.id);
    const info=chapters.get(item.chapter);
    if(!item.sectionOnly)assert.ok(item.pdfPage>=info.pdfStartPage&&item.pdfPage<=info.pdfEndPage,'page outside chapter for '+item.id);
  }
  for(const ch of catalog.chapters){
    const items=catalog.items.filter(x=>x.chapter===ch.chapter);
    assert.equal(items.filter(x=>!x.sectionOnly).length,ch.count,'chapter count '+ch.chapter);
    assert.equal(items.filter(x=>x.sectionOnly).length,ch.sectionReferences,'section count '+ch.chapter);
  }
});

test('study links use a separate local progress namespace',()=>{
  assert.match(html,/data\/accounting-textbook-index\.json/);
  assert.match(html,/studyos\.accounting\.textbook\.progress\.v1/);
  assert.match(html,/Export answers/);
  assert.match(html,/Import answers/);
  assert.match(html,/The PDF is imported into this browser and is not uploaded to Study OS/);
  assert.match(accounting,/href="accounting-textbook\.html"/);
  assert.match(home,/href="accounting-textbook\.html"/);
  assert.match(home, /403 indexed exercises · Chapters 1–9 \(through Receivables\)/);
  assert.match(html, /Textbook Exercises · Chapters 1–9/);
  assert.ok((home.match(/href="accounting-textbook.html"/g)||[]).length>=1);
  assert.doesNotMatch(html,/localStorage\.clear\(/);
  assert.doesNotMatch(html,/studyos\.acc\./);
});
