'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'vocabloom/study-integration.js'),'utf8');
const {auditExposure,compilePractice}=require('../scripts/audit-practice-exposure.cjs');

test('Exposure audit detects a genuine displayed near-meaning pair without altering learning source',()=>{
 const rows=[
  ['plunge','การร่วงลงอย่างรวดเร็ว'],
  ['tumble','ร่วงลงอย่างรวดเร็ว'],
  ['alpha','ความรู้'],
  ['beta','ความสำเร็จ'],
  ['gamma','การเข้าใจ'],
  ['delta','ความพยายาม']
 ].map(([Front,meaning],i)=>({Front,Back:'n | '+meaning,Chapter:'Fixture chapter',Subject:'English Vocab',Status:'Verified',page_id:String(i)}));
 const deck={key:'eng',cats:[['e1','Fixture chapter']],cards:[]};
 const unchanged=JSON.stringify({rows,deck});
 const result=auditExposure(rows,deck,source,{rounds:2});
 assert.ok(result.questions>=6);
 assert.ok(result.choices>=24);
 assert.ok(result.exposureEvents>0,'Near-synonymous source meanings appear in real generated options');
 assert.ok(result.candidates.some(x=>new Set([x.wordA,x.wordB]).has('plunge')&&new Set([x.wordA,x.wordB]).has('tumble')));
 assert.match(result.warning,/NOT a confirmed wrong answer/);
 assert.equal(JSON.stringify({rows,deck}),unchanged,'Audit must not edit source rows or deck');
 assert.deepEqual(result,auditExposure(rows,deck,source,{rounds:2}),
  'Repeated audit should be deterministic for stable source order');
});

test('Exposure audit rejects invalid source adapters, deck and unbounded work',()=>{
 const deck={key:'eng',cats:[['e1','Fixture chapter']],cards:[]};
 assert.throws(()=>compilePractice('function missing(){}'),/refusing approximate question generation/);
 assert.throws(()=>auditExposure([],deck,source,{rounds:0}),RangeError);
 assert.throws(()=>auditExposure([],deck,source,{rounds:501}),RangeError);
 assert.throws(()=>auditExposure([], {...deck,key:'acc'}, source,{rounds:1}),TypeError);
});

test('Read-only exposure audit can generate actual Verified English Practice questions',()=>{
 const rows=JSON.parse(fs.readFileSync(path.join(root,'data/cards.json'),'utf8')).rows;
 const deck=JSON.parse(fs.readFileSync(path.join(root,'vocabloom/study-decks.json'),'utf8')).decks.find(d=>d.key==='eng');
 const out=auditExposure(rows,deck,source,{rounds:1});
 assert.ok(out.questions>=10);
 assert.equal(out.choices,out.questions*4);
 assert.ok(out.reviewPairCount>=3);
 assert.equal(out.chapters[0],'all');
});
