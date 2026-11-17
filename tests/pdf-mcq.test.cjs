"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const M=require('../scripts/pdf-mcq.js'),read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const L=(p,...ts)=>ts.map(t=>({p,t}));
test('finds the quiz, its pages, option count and the printed key',()=>{
 const lines=[...L(300,'Key Terms','Merchandise inventory (180)'),
  ...L(301,'Multiple Choice Quiz','1. A company buys goods for $1,000 on terms 2/10, n/30. The discount is','a. $10 b. $20','c. $30 d. $40','2. Which account is debited?','a. Sales','b. Cash','c. Merchandise Inventory','d. Accounts Payable','e. None of the above'),
  ...L(302,'3. Gross profit equals:','a. Net sales − Cost of goods sold b. Sales − Expenses c. … d. …','ANSWERS TO MULTIPLE CHOICE QUIZ','1. b; $1,000 × 2% = $20','2. c 3. a'),
  ...L(303,'Quick Study','QS 5-1 Applying merchandising terms')];
 const q=M.findQuiz(lines);
 assert.equal(q.n,3);assert.deepEqual(q.page,{1:301,2:301,3:302});
 assert.equal(q.opts[1],4);assert.equal(q.opts[2],5);
 assert.deepEqual(q.key,{1:'b',2:'c',3:'a'});
});
test('no quiz → n=0; numbered lines outside a quiz are ignored',()=>{
 assert.equal(M.findQuiz(L(10,'1. Explain the accounting equation.','2. Define assets.')).n,0);
 const q=M.findQuiz([...L(5,'Multiple Choice Quiz','1. One?','a. x b. y c. z d. w','Discussion Questions','2. Not a quiz question')]);
 assert.equal(q.n,1);assert.deepEqual(q.key,{});
});
test('pageLines groups text items into lines top to bottom',()=>{
 const tc={items:[{str:'b. y',transform:[1,0,0,1,200,700]},{str:'a. x',transform:[1,0,0,1,50,701]},{str:'1. Q',transform:[1,0,0,1,40,720]}]};
 assert.deepEqual(M.pageLines(tc,7).map(l=>l.t),['1. Q','a. x b. y']);
});
test('My PDF sets: written / multiple-choice menus; chapter quizzes reuse the textbook file',()=>{
 const s=read('pdf-sets.html');
 assert.match(s,/<script src="scripts\/pdf-mcq\.js\?v=\d+"><\/script>/);
 assert.match(s,/id="exW"[^>]*>Written<\/button><button class="ps-btn" id="exM"[^>]*>Multiple choice<\/button>/);
 assert.match(s,/const TYPES=\['Quick Study','Exercise','Problem A','Problem B'\];/);
 assert.match(s,/data\.sets\[id\]\.book===BOOK_ID\)\)\{/,'quiz sets read the textbook PDF');
 assert.match(s,/else if\(!s\.book\) await idb\('del',cur\);/,'removing a quiz never deletes the textbook file');
 assert.match(s,/const id='ptbmc'\+c\.chapter/);
 assert.match(s,/\$\('removeSet'\)\.textContent=s\.book\?'Remove this quiz':'Remove PDF';/);
 // the quiz set id fits the backed-up format
 assert.match('ptbmc9',/^p[a-z0-9]{1,12}$/);
});
