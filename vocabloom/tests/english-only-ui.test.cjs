'use strict';
// P1 display isolation: no production requests and no localStorage writes.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {test}=require('node:test');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ui=read('vocabloom/study-integration.js');
const bundle=JSON.parse(read('vocabloom/study-decks.json'));
function extract(start,end){
 const a=ui.indexOf(start),b=ui.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'Could not locate '+start);
 return ui.slice(a,b);
}
const visible=extract('function uVisibleDecks(){','function uReadSrs(d){');
const home=extract('function uHome(){','function uReview(){');
const review=extract('function uReview(){','function uHTML(){');
const panel=extract('function uHTML(){','function uCardHTML(d){');
const action=extract('function uAction(el){','async function uBoot(){');

test('P1 preserves all five original decks and storage identities',()=>{
 assert.deepEqual(bundle.decks.map(d=>d.key),['acc','eco','math','eng','zh']);
 assert.deepEqual(bundle.decks.map(d=>d.markKey),[
  'acc-flashcards-v1','econ-flashcards-v1','math-flashcards-v1','eng-vocab-v1','zh-vocab-v1'
 ]);
 assert.equal(bundle.decks.reduce((n,d)=>n+d.cards.length,0),757);
 assert.ok(ui.includes("const UACTIVE_LANGUAGE='eng'"));
 assert.ok(ui.includes('subject:UACTIVE_LANGUAGE'));
 // Content/Progress routes and verified exports are intentionally untouched.
 const config=JSON.parse(read('data/config.json'));
 assert.equal(config.api,'https://study-api.kasidit09022550.workers.dev');
 assert.equal(Object.hasOwn(config,'progress_api'),false);
});

test('P1 home, review and integrated panel render English only',()=>{
 const output=new Function('decks',[
  "const UACTIVE_LANGUAGE='eng';",
  'const USTATE={decks,ready:true,error:"",subject:"eng",cat:"all",tab:"cards",mode:"due",flip:false,browse:0,quizIndex:0,missed:false};',
  'const UICONS={acc:"A",eco:"E",math:"M",eng:"EN",zh:"ZH"};',
  'const uDeck=(key=USTATE.subject)=>USTATE.decks.find(d=>d.key===key);',
  'const uStats=d=>({total:d.cards.length,seen:1,due:d.key==="eng"?3:99});',
  'const uQuiz=()=>[],uCardHTML=()=>"<div>English learning cards</div>",uQuizHTML=()=>"",uSummaryHTML=()=>"";',
  'const h=s=>String(s),heading=(title,description)=>"<h1>"+title+"</h1><p>"+description+"</p>";',
  visible,home,review,panel,
  'return {home:uHome(),review:uReview(),panel:uHTML()};'
 ].join('\n'))(bundle.decks);
 for(const [page,markup] of Object.entries(output)){
  assert.match(markup,/English/i,page+' missing English context');
  for(const unwanted of ['Accounting','Economics','Math for Life','Chinese']){
   assert.ok(!markup.includes(unwanted),page+' leaked academic/Chinese subject '+unwanted);
  }
  assert.ok(!/data-subject="(acc|eco|math|zh)"/.test(markup),page+' offered non-English subject');
 }
 assert.match(output.home,/51 English cards/);
 assert.match(output.review,/3 DUE/);
 assert.match(output.panel,/data-subject="eng"/);
});

test('P1 subject events reject hidden academic and Chinese selections',()=>{
 const attempt=new Function('decks',[
  "const UACTIVE_LANGUAGE='eng';",
  'const USTATE={decks,subject:"eng",cat:"all",tab:"quiz",mode:"browse",flip:true,browse:3,quizIndex:2,missed:false};',
  'const ui={page:"home"};let renders=0;',
  'const uDeck=(key=USTATE.subject)=>USTATE.decks.find(d=>d.key===key);',
  'const render=()=>{renders++};',
  action,
  'for(const subject of ["acc","eco","math","zh"]){uAction({dataset:{action:"u-subject",subject}});}',
  'const blocked={subject:USTATE.subject,renders,tab:USTATE.tab,page:ui.page};',
  'uAction({dataset:{action:"u-subject",subject:"eng"}});',
  'return {blocked,allowed:{subject:USTATE.subject,renders,tab:USTATE.tab,page:ui.page}};'
 ].join('\n'))(bundle.decks);
 assert.deepEqual(attempt.blocked,{subject:'eng',renders:0,tab:'quiz',page:'home'});
 assert.deepEqual(attempt.allowed,{subject:'eng',renders:1,tab:'cards',page:'studymerge'});
});
