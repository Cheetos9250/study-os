'use strict';
/* No Notion network calls or user credentials. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {test}=require('node:test');
const root=path.join(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const cards=JSON.parse(read('data/cards.json'));
const quiz=JSON.parse(read('data/quiz.json'));
const app=read('vocabloom/index.html');
const integration=read('vocabloom/study-integration.js');
const exporter=read('scripts/sync_notion.py');
const pages=['acc.html','eco.html','math.html','eng.html','zh.html'];
const pidPattern=/^[0-9a-f]{32}$/;
function extract(code,start,end){
 const i=code.indexOf(start),j=code.indexOf(end,i+start.length);
 assert.ok(i>=0&&j>i,'Unable to extract '+start);
 return code.slice(i,j);
}
test('SEC-04: public card and quiz JSON contain stable page IDs and no full Notion links',()=>{
 assert.ok(cards.rows.length>=400);
 assert.ok(quiz.rows.length>=200);
 for(const [name,payload] of [['cards',cards],['quiz',quiz]]){
  assert.ok(!read('data/'+(name==='cards'?'cards.json':'quiz.json')).includes('app.notion.com/p/'));
  const ids=new Set();
  for(const row of payload.rows){
   assert.ok(pidPattern.test(row.page_id),'Invalid Notion identifier in '+name);
   assert.ok(!Object.hasOwn(row,'url'),'Direct URL leaked in '+name);
   assert.ok(!ids.has(row.page_id),'Repeated ID in '+name);
   ids.add(row.page_id);
  }
 }
});
test('SEC-04: VocaBloom word IDs exactly match old canonical URL-derived IDs',()=>{
 const fn=new Function(extract(app,'function parseNotionExport(payload){','async function syncNotionWords(manual=false){')+'return parseNotionExport;')();
 const fixture=[{Front:'watermelon',Back:'noun | แตงโม | I ate a watermelon yesterday.',Subject:'English Vocab',Status:'Verified',page_id:'0123456789abcdef0123456789abcdef'}];
 const imported=fn({rows:fixture,updated:'test'});
 const previousId='notion-'+('https://app.notion.com/p/'+fixture[0].page_id).replace(/[^a-zA-Z0-9]/g,'').slice(-40);
 assert.equal(imported.words[0].id,previousId);
 const cached=fn({rows:[{...fixture[0],page_id:undefined,url:'https://app.notion.com/p/'+fixture[0].page_id}],updated:'test'});
 assert.equal(cached.words[0].id,previousId);
});
test('SEC-04: Original SRS IDs are unchanged and quiz IDs are preserved',()=>{
 const oldUrl='https://app.notion.com/p/0123456789abcdef0123456789abcdef';
 const id='0123456789abcdef0123456789abcdef';
 assert.equal('n-'+oldUrl.split('?')[0].split('/').pop(),'n-'+id);
 const cardCode=extract(integration,'function uCards(d){','function uSelected(d){');
 const quizCode=extract(integration,'function uQuiz(d){','function uHome(){');
 const environment=new Function('row','quizRow',[
  'const USTATE={rows:[row],quizzes:[quizRow]};const UNAMES={acc:"Accounting"};',
  cardCode,quizCode,
  'const deck={key:"acc",cats:[["inventory","06 Inventory"]],cards:[],quiz:[]};',
  'return {card:uCards(deck)[0],quiz:uQuiz(deck)[0]};'
 ].join('\n'))(
  {page_id:id,Front:'FIFO',Back:'First-in, first-out',Status:'Verified',Subject:'Accounting',Chapter:'06 Inventory'},
  {page_id:id,Question:'Which inventory method?',Correct:'FIFO', 'Wrong 1':'LIFO',Status:'Verified',Subject:'Accounting',Chapter:'06 Inventory'});
 assert.equal(environment.card.mid,'n-'+id);
 assert.equal(environment.quiz.id,'n-'+id);
});
test('SEC-04: Older study pages accept both new page_id and cached full URL',()=>{
 for(const page of pages){
  const contents=read(page);
  assert.ok(contents.includes('String(r.page_id||r.url||r.Front)'),page+' card parser changed');
  assert.ok(contents.includes('String(r.page_id||r.url||r.Question)'),page+' quiz parser changed');
 }
 assert.ok(exporter.includes('r["page_id"] = pid'));
 assert.ok(!exporter.includes('r["url"] ='));
});
