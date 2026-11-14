'use strict';
// Read-only screening of real generated options against fuzzy Thai review candidates.
// The report does NOT certify mistakes and never changes question selection or learning data.
const fs=require('node:fs');
const path=require('node:path');
const {audit,reviewKey}=require('./audit-thai-distractors.cjs');
function compilePractice(source){
 const cardsStart=source.indexOf('function uCards(d){');
 const cardsEnd=source.indexOf('function uSelected(d){',cardsStart);
 const practiceStart=source.indexOf('function uPracticeMeaning(back){');
 const practiceEnd=source.indexOf('function uHome(){',practiceStart);
 if(cardsStart<0||cardsEnd<=cardsStart||practiceStart<0||practiceEnd<=practiceStart)
  throw new Error('Expected VocaBloom source adapters not found; refusing approximate question generation');
 return new Function('deck','rows','offset','category',
  "const UACTIVE_LANGUAGE='eng',UNAMES={eng:'English Vocab'};" +
  "const USTATE={rows,cat:category,practiceOffset:offset,practiceQuestions:null};" +
  source.slice(cardsStart,cardsEnd)+source.slice(practiceStart,practiceEnd) +
  'return uPracticeQuestions(deck);'
 );
}
function sortedKey(a,b){return [reviewKey(a),reviewKey(b)].sort().join('\u0000');}
function auditExposure(rows,deck,source,options={}){
 const rounds=options.rounds===undefined?60:options.rounds;
 if(!Number.isInteger(rounds)||rounds<1||rounds>500)throw new RangeError('rounds must be 1..500');
 if(!Array.isArray(rows)||!deck||deck.key!=='eng'||!Array.isArray(deck.cats)||!Array.isArray(deck.cards))
  throw new TypeError('Expected English deck and source rows');
 const flagged=audit(rows).pairs,generate=compilePractice(source);
 const indexed=new Map();
 for(const pair of flagged){
  const key=sortedKey(pair.meaningA,pair.meaningB);
  if(!indexed.has(key))indexed.set(key,[]);
  indexed.get(key).push(pair);
 }
 const findings=new Map(),chapters=['all',...deck.cats.map(x=>x[0])];
 let questions=0,choices=0,exposures=0;
 for(const chapter of chapters)for(let round=0;round<rounds;round++){
  const qs=generate(deck,rows,round*10,chapter);
  for(const q of qs){
   questions++;choices+=q.opts.length;
   const correct=q.opts[q.right];
   for(let i=0;i<q.opts.length;i++){
    if(i===q.right)continue;
    for(const pair of indexed.get(sortedKey(correct,q.opts[i]))||[]){
     const id=[pair.wordA,pair.wordB].sort().join('\u0000');
     let found=findings.get(id);
     if(!found){
      found={wordA:pair.wordA,wordB:pair.wordB,meaningA:pair.meaningA,meaningB:pair.meaningB,
       appearances:0,firstEncounter:{chapter,round,headword:q.q,correct,distractor:q.opts[i]}};
      findings.set(id,found);
     }
     found.appearances++;exposures++;
    }
   }
  }
 }
 const candidates=[...findings.values()].sort((a,b)=>b.appearances-a.appearances||
  a.wordA.localeCompare(b.wordA,'en')||a.wordB.localeCompare(b.wordB,'en'));
 return {roundsPerChapter:rounds,chapters,questions,choices,reviewPairCount:flagged.length,
  exposedReviewPairs:candidates.length,exposureEvents:exposures,
  warning:'Exposure is a fuzzy review candidate, NOT a confirmed wrong answer. Antonyms and grammatical contrasts may be good distractors.',
  candidates};
}
if(require.main===module){
 const root=path.resolve(__dirname,'../..');
 const rows=JSON.parse(fs.readFileSync(path.join(root,'data/cards.json'),'utf8')).rows;
 const decks=JSON.parse(fs.readFileSync(path.join(root,'vocabloom/study-decks.json'),'utf8')).decks;
 const source=fs.readFileSync(path.join(root,'vocabloom/study-integration.js'),'utf8');
 const flag=process.argv.find(a=>a.startsWith('--rounds='));
 const rounds=flag?Number(flag.split('=')[1]):60;
 const result=auditExposure(rows,decks.find(d=>d.key==='eng'),source,{rounds});
 const candidates=process.argv.includes('--all')?result.candidates:result.candidates.slice(0,20);
 process.stdout.write(JSON.stringify({...result,candidates},null,2)+'\n');
}
module.exports={auditExposure,compilePractice};
