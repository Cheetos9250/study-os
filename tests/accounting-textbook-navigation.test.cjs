'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'accounting-textbook.html'),'utf8');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/accounting-textbook-index.json'),'utf8'));
const records=catalog.items.filter(x=>!x.sectionOnly);

test('all studied questions are in range and all-type filter covers entire chapter',()=>{
 assert.equal(records.length,403);
 assert.deepEqual([...new Set(records.map(x=>x.chapter))].sort(),['1','2','3','4','5','6','7','8','9']);
 const m=html.match(/function available\(\)\{[^\n]+\}/);
 assert.ok(m,'Missing pure available() filter');
 const controls={chapter:{value:'1'},kind:{value:'all'},search:{value:''}};
 const available=vm.runInNewContext(m[0]+';available',{records,$:id=>controls[id]});
 assert.equal(available().length,62,'Chapter 1 all types');
 controls.kind.value='Problem B';
 assert.equal(available().length,13,'Chapter 1 Problem B');
 controls.kind.value='Quick Study';
 controls.search.value='6-2B';
 const byNumber=available();
 assert.ok(byNumber.some(x=>x.id==='P-6-2B'),'Search must ignore current chapter/type');
 assert.ok(byNumber.every(x=>x.chapter==='6'),'Matching question should be chapter 6');
 controls.search.value='';
 controls.chapter.value='9';
 controls.kind.value='all';
 assert.equal(available().length,39,'Chapter 9 through Receivables');
});

test('reader remembers the most recent question and keeps continuation inside a chapter',()=>{
 assert.match(html,/LAST_KEY='studyos\.accounting\.textbook\.last\.v1'/);
 assert.match(html,/localStorage\.setItem\(LAST_KEY,id\)/);
 assert.match(html,/resumeId=localStorage\.getItem\(LAST_KEY\)/);
 assert.match(html,/const resumed=records\.find\(x=>x\.id===resumeId\)/);
 assert.match(html,/const saved=linkQ\|\|\(linkCh\?null:resumed\)/);
 assert.match(html,/requestedPage>=chapterEnd/);
 assert.match(html,/\$\('sidebar'\)\.classList\.remove\('expanded'\)/);
 assert.match(html,/\$\('workspace'\)\.scrollIntoView/);
 assert.match(html,/\.disabled=at<=0/);
});

test('home and textbook still only advertise chapters 1–9',()=>{
 const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(home,/403 indexed exercises · Chapters 1–9/);
 assert.match(html,/Textbook Exercises · Chapters 1–9/);
 assert.doesNotMatch(html,/1,361 indexed exercises/);
});
