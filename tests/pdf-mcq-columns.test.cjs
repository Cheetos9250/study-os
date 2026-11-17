"use strict";
// Two-column layout as printed in the 24e textbook (Ch 8, pp. 337–338): quiz, answers, then Discussion Questions.
const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../scripts/pdf-mcq.js');
const it=(str,x,y)=>({str,transform:[1,0,0,1,x,y]});
const W=612;
const p337={items:[it('Key Terms',60,520),it('Petty cash (300)',320,520),
 it('Multiple Choice Quiz',60,300),
 it('1.',60,280),it('A company deposits a note collected by the bank. In a bank reconciliation this is',75,280),it('a. Added to the book balance.',75,265),it('c. Deducted from the bank balance.',200,265),
 it('b. Added to the bank balance.',75,250),it('d. Deducted from the book balance.',200,250)]};
const p338={items:[it('312',60,760),it('Chapter 8 Cash, Fraud, and Internal Control',200,760),
 it('2.',60,740),it('Using the information from question 1, what is the reconciled',75,740),it('c. A credit to Petty Cash for $420.',330,740),
 it('a. $2,052',75,715),it('c. $1,742',140,715),it('e. $1,184',210,715),it('d. A credit to Cash Over and Short for $5.',330,725),
 it('b. $1,895',75,700),it('d. $2,201',140,700),it('e. A debit to Cash Over and Short for $5.',330,710),
 it('3.',60,690),it('A company needs to replenish its $500 petty cash fund. Its',75,690),it('4.',320,695),it('A company had net sales of $84,000 and accounts receiv-',335,695),
 it('a. A debit to Cash for $75.',75,650),it('a. 3.2 days.',335,670),it('c. 230.0 days.',400,670),it('e. 12.5 days.',470,670),
 it('b. A credit to Cash for $75.',75,635),it('b. 18.4 days.',335,655),it('d. 29.2 days.',400,655),
 it('ANSWERS TO MULTIPLE CHOICE QUIZ',60,620),
 it('1.',60,600),it('a; recognizes cash collection of note by bank.',75,600),it('3.',380,600),it('c; The entry follows.',395,600),
 it('2.',60,585),it('a; the bank reconciliation follows.',75,585),it('Debits to expenses (or assets) .......... 420',390,585),
 it('Balance per bank statement .... $1,895',70,560),it('Balance per books ....... $1,742',200,560),it('4.',380,540),it('d; ($6,720/$84,000) × 365 = 29.2 days',395,540),
 it('Discussion Questions',70,480),
 it('1.',60,460),it('List the seven broad principles of internal control.',75,460),it('is provided (used) by investing activities?',320,460),
 it('2.',60,445),it('Internal control procedures are important in every busi-',75,445),it('11.',320,445),it('Refer to Google’s financial statements',335,445),
 it('QUICK STUDY',60,200),it('Indicate which statements are true and which are false.',200,200),it('1.',200,185),it('Separation of recordkeeping for assets',215,185)]};
test('reads a two-column quiz with its answers (Ch 8 layout)',()=>{
 const lines=[...M.pageLines(p337,337,W),...M.pageLines(p338,338,W)];
 const q=M.findQuiz(lines);
 assert.equal(q.n,4);
 assert.deepEqual(q.page,{1:337,2:338,3:338,4:338});
 assert.deepEqual(q.key,{1:'a',2:'a',3:'c',4:'d'});
 assert.equal(q.opts[2],5);assert.equal(q.opts[4],5);assert.equal(q.opts[3],5,'q3 options run from the left column into the right');
});
test('columns are kept apart: the right column never joins a left-column line',()=>{
 const ls=M.pageLines(p338,338,W);
 assert.ok(ls.some(l=>l.col===1&&/^4\. A company had net sales/.test(l.t)));
 assert.ok(ls.some(l=>l.col===0&&/^2\. Using the information/.test(l.t)));
 assert.ok(!ls.some(l=>/reconciled c\. A credit/.test(l.t)));
});
