'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {audit,thaiMeaning,reviewKey}=require('../scripts/audit-thai-distractors.cjs');
const rows=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../data/cards.json'),'utf8')).rows;
test('Read-only English distractor audit surfaces known near-meaning and contrast pairs',()=>{
 const report=audit(rows);
 assert.ok(report.verifiedTerms>=500);
 assert.ok(report.flaggedPairs>=3);
 assert.match(report.warning,/Review candidates only/);
 const has=(a,b)=>report.pairs.some(p=>new Set([p.wordA,p.wordB]).has(a)&&new Set([p.wordA,p.wordB]).has(b));
 assert.ok(has('hinge on','contingent on'),'Exact explicit-sense overlap should be reviewable');
 assert.ok(has('plunge','tumble'),'Similar falling translations should be reviewed');
 assert.ok(has('unsaturated','saturated'),'Opposite meanings must be flagged for review only, not auto-removed');
});
test('Audit is deterministic and does not mutate source rows',()=>{
 const before=JSON.stringify(rows),forward=audit(rows),reverse=audit([...rows].reverse());
 assert.deepEqual(forward,reverse);
 assert.equal(JSON.stringify(rows),before);
});
test('Source reader excludes unverified content and normalizes nonbreaking invisible marks',()=>{
 const fixture=[
  {Status:'Verified',Subject:'English Vocab',Front:'alpha',Back:'n | ความก้าวหน้า',page_id:'1'},
  {Status:'Draft',Subject:'English Vocab',Front:'draft',Back:'n | ความก้าวหน้า',page_id:'2'},
  {Status:'Verified',Subject:'Economics',Front:'other',Back:'n | ความก้าวหน้า',page_id:'3'}
 ];
 assert.equal(audit(fixture).verifiedTerms,1);
 assert.equal(thaiMeaning('v | ขึ้นอยู่กับ; มีเงื่อนไขว่า'),'ขึ้นอยู่กับ; มีเงื่อนไขว่า');
 assert.equal(reviewKey('การ\u200Bเรียน   รู้'),reviewKey('การเรียน รู้'));
});
