"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const A=require('../scripts/study-tutor.js'),R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('/questions parses a count and notes',()=>{
  assert.deepEqual(A.command('/questions 8 ch5 notes'),{kind:'qfile',n:'8',topic:'ch5 notes'});
  assert.deepEqual(A.command('/questions'),{kind:'qfile',n:'',topic:''});
});
test('the prompt asks for the Drive inbox layout and the same chapter list as docs/gemini-question-prompt.md',()=>{
  const p=A.quick('qfile',{n:'6',subject:'Accounting'});
  assert.match(p,/write 6 new multiple-choice questions/);assert.match(p,/^[\s\S]*Subject: Accounting\nChapter: /m);
  const doc=R('docs/gemini-question-prompt.md');
  const list=s=>/Chapter must be copied exactly from this list\. ([^\n]*?)\n/.exec(s)[1].replace(/–/g,'-');
  assert.equal(list(p+'\n'),list(doc));
  assert.match(A.quick('qfile',{subject:'Physics'}),/Subject: <Accounting, Economics or Math for Life>/);
  assert.match(A.quick('qfile',{topic:'FIFO notes'}),/Extra text from me:\nFIFO notes$/);
});
test('a reply is recognised as a question file only with the inbox layout',()=>{
  assert.equal(A.isQFile('Subject: Accounting\nChapter: 06 Inventory\n\n---\nQuestion: x\nA) a'),true);
  assert.equal(A.isQFile('Here are some questions:\nSubject: Accounting'),false);
});
test('tutor page has the photo button, copy button',()=>{
  const h=R('tutor.html');
  assert.match(h,/data-quick="qfile">Questions from my photo/);assert.match(h,/data-copyq=/);
  assert.match(h,/Add a photo of your notes first/);
});
