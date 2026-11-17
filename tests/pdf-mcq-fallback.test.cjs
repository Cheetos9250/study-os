"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const M=require('../scripts/pdf-mcq.js'),s=fs.readFileSync(path.join(__dirname,'..','pdf-sets.html'),'utf8');
test('"Multiple Choice Questions" headings count as a quiz; any mention is found for the whole-book search',()=>{
 const q=M.findQuiz([{p:9,t:'MULTIPLE-CHOICE QUESTIONS'},{p:9,t:'1. One?'},{p:9,t:'a. x b. y c. z d. w'},{p:9,t:'2. Two?'}]);
 assert.equal(q.n,2);
 assert.ok(M.MENTION.test('see the multiple choice quiz online'));assert.ok(!M.MENTION.test('choice of method'));
});
test('My PDF sets searches the whole book when nothing is near the chapter ends, and lists pages to check',()=>{
 assert.match(s,/Searching the whole book… page /);
 assert.match(s,/const near=chs\.find\(c=>c\.pdfStartPage&&p>=c\.pdfStartPage-25&&p<c\.pdfStartPage\)/);
 assert.match(s,/data-pg="'\+p\+'">p\. '\+p\+'<\/button>/);
});
