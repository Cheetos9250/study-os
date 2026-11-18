"use strict";
// Textbook Exercises was merged into My PDF sets (17 Nov 2026); accounting-textbook.html only redirects old links.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('Today links accounting chapter tasks to that textbook chapter in My PDF sets',()=>{
 assert.match(read('index.html'),/pdf-sets\.html\?book=1&ch='\+t\.cat\.slice\(1\)/);
});
test('the old Textbook Exercises address redirects (with validated ?q= / ?ch=) to My PDF sets',()=>{
 const s=read('accounting-textbook.html');
 assert.match(s,/location\.replace\(u\)/);assert.match(s,/u='pdf-sets\.html\?book=1'/);
 assert.match(s,/\^\[A-Z\]\{1,2\}-\\d\{1,2\}-\\d\{1,3\}\[A-Z\]\?\$/);assert.match(s,/\^\[1-9\]\$/);
 assert.doesNotMatch(s,/localStorage|indexedDB/,'the redirect never touches saved answers or the PDF');
});
test('My PDF sets opens the book from links and keeps the reviewed final-answer checks and MCQ links',()=>{
 const s=read('pdf-sets.html');
 assert.match(s,/const u=new URLSearchParams\(location\.search\); if\(!u\.get\('book'\)\) return;/);
 assert.match(s,/<script src="scripts\/accounting-answer-check\.js\?v=[^"]+"><\/script>/);
 assert.match(s,/StudyAccountingCheck\.check\(exCur\.id,\$\('exAnswer'\)\.value\)/);
 assert.match(s,/\(window\.ACC_TB_MCQ\|\|\[\]\)\.filter\(m=>m\.ref===id\)/);
 assert.match(s,/StudyLast\.mark\(\{href:'pdf-sets\.html\?book=1&q='\+encodeURIComponent\(id\)/);
});
