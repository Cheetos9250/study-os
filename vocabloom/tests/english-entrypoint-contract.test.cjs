'use strict';
// P1: read-only, offline contract checks for the language-first VocaBloom entrypoint.
// No browser storage, network requests, Cloudflare calls or production writes.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('vocabloom/index.html');
const verified=JSON.parse(read('data/cards.json'));
const deck=JSON.parse(read('vocabloom/study-decks.json'));
const config=JSON.parse(read('data/config.json'));

function getParser(){
 const start=html.indexOf('function parseNotionExport(payload){');
 const end=html.indexOf('async function syncNotionWords(',start);
 assert.ok(start>=0&&end>start,'Notion English parser missing');
 // Parser is pure: compile and run without loading the application or its effects.
 return new Function(html.slice(start,end)+'\nreturn parseNotionExport;')();
}

test('P1 language-only main navigation on desktop and iPad',()=>{
 assert.match(html,/<meta name="viewport" content="width=device-width, initial-scale=1\.0"/);
 const side=html.match(/<nav class="main-nav"[^>]*>([\s\S]*?)<\/nav>/);
 const mobile=html.match(/<nav class="mobile-nav"[^>]*>([\s\S]*?)<\/nav>/);
 assert.ok(side&&mobile,'Desktop and mobile navigation must both exist');
 const expected=['home','learn','practice','review','library','progress'];
 for(const [name,nav] of [['desktop',side[1]],['iPad/mobile',mobile[1]]]){
  const pages=[...nav.matchAll(/data-page="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(pages,expected,name+' unexpectedly exposes an academic/Chinese route');
 }
 assert.match(html,/<main id="mainContent"[^>]*tabindex="-1"/);
 assert.match(html,/<script src="\.\/study-integration\.js"><\/script>/);
 assert.match(html,/<script src="\.\/unified-progress\.js"><\/script>/);
});

test('P1 Verified import is English-only, deduplicated, and stable',()=>{
 const parse=getParser();
 const parsed=parse(verified);
 assert.ok(parsed.words.length>0,'Expected at least one usable Verified English word');
 assert.ok(parsed.words.length<=verified.rows.filter(x=>x.Status==='Verified'&&x.Subject==='English Vocab').length);
 assert.equal(new Set(parsed.words.map(x=>x.en.toLowerCase())).size,parsed.words.length);
 assert.equal(new Set(parsed.words.map(x=>x.id)).size,parsed.words.length);
 assert.ok(parsed.words.every(x=>x.category==='notion'&&x.level==='B1–B2'));
 assert.deepEqual(parse(verified),parsed,'Pure import should be deterministic across refresh');
 const mixed={rows:[
  {Status:'Verified',Subject:'Accounting',Front:'audit',Back:'audit|ตรวจสอบ|I audit reports.'},
  {Status:'Verified',Subject:'Chinese',Front:'你好',Back:'你好|สวัสดี|你好'},
  {Status:'Draft',Subject:'English Vocab',Front:'draftword',Back:'draftword|ร่าง|A draftword appears.'},
  {Status:'Verified',Subject:'English Vocab',Front:'adapt',Back:'adapt|ปรับตัว|I adapt quickly.',page_id:'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'},
  {Status:'Verified',Subject:'English Vocab',Front:'ADAPT',Back:'ADAPT|ปรับตัว|I ADAPT quickly.',page_id:'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'}
 ]};
 const clean=parse(mixed);
 assert.equal(clean.words.length,1,'Only one verified English entry should survive');
 assert.equal(clean.words[0].en,'adapt');
 assert.equal(clean.words[0].id,'notion-'+('httpsappnotioncomp'+'a'.repeat(32)).slice(-40));
 assert.throws(()=>parse({rows:[]}),/No usable Verified words/);
});

test('P1 language isolation does not change five legacy decks or content endpoint',()=>{
 assert.deepEqual(deck.decks.map(d=>d.key),['acc','eco','math','eng','zh']);
 assert.deepEqual(deck.decks.map(d=>d.markKey),[
  'acc-flashcards-v1','econ-flashcards-v1','math-flashcards-v1','eng-vocab-v1','zh-vocab-v1'
 ]);
 assert.deepEqual(Object.keys(config),['api']);
 assert.equal(config.api,'https://study-api.kasidit09022550.workers.dev');
 const progress=read('vocabloom/unified-progress.js');
 assert.match(progress,/const CLOUD_KEY='study-sync-key'/);
 assert.match(progress,/function cOriginalCardFor\(w\)/);
 assert.match(progress,/function cCloudStorageKey\(\)/);
});
