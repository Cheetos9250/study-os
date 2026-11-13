'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),src=fs.readFileSync(path.join(root,'vocabloom/index.html'),'utf8');
const i=src.indexOf('function parseNotionExport(payload){'),j=src.indexOf('async function syncNotionWords(',i);
const parse=new Function(src.slice(i,j)+'return parseNotionExport')();
const pid='0123456789abcdef0123456789abcdef';
function imported(word,example,pos='v'){
 const row={Status:'Verified',Subject:'English Vocab',Front:word,Back:`${pos} | ความหมาย | ${example}`,page_id:pid};
 try{return parse({rows:[row]}).words[0];}catch(e){assert.match(e.message,/No usable Verified words/);return null;}
}
test('Source POS permits regular verb/noun inflections and preserves full phrasal verbs',()=>{
 for(const [word,example,pos] of [
 ['modify','The team modified its policy.','v'],['rally','Stocks rallied.','v./n.'],
 ['authority','Authorities opened an inquiry.','n'],['trading card','Trading cards are sold at auctions.','n'],
 ['hollow out','New highways hollowed out towns.','phr v'],['hinge on','It hinges on sales.','v'],
 ['ramp up','They ramped up output.','v'],['edge up','Prices edged up.','v'],
 ['account for','Housing accounted for the rise.','v'],['admit','She admitted the mistake.','v'],
 ['flop','The product flopped.','v'],['modify','They are modifying policy.','v']
 ]){const w=imported(word,example,pos);assert.ok(w,word);assert.equal(w.en,word);assert.equal(w.example,example);assert.equal(w.id,'notion-tioncomp'+pid);}
});
test('Whole tokens reject substring matches, partial phrases and unsupported derivations',()=>{
 for(const [word,example,pos] of [
 ['art','We met in the quarter.','n'],['port','The report is ready.','n'],
 ['modify','The modification was approved.','v'],['rally','The rallyingpoint is here.','v'],
 ['securities filing','The filing disclosed risks.','n'],['account for','They accounted the total.','v'],
 ['ramp up','They ramped output up.','v'],['modify','They modified the plan.','adj'],
 ['flop','The product floped.','v'],['admit','She admited the error.','v']
 ])assert.equal(imported(word,example,pos),null,word+' / '+example);
});
test('Case and compatibility normalization still require all headword tokens',()=>{
 assert.ok(imported('ramp up','They RAMPED UP output.'));
 assert.ok(imported('modify','They ｍｏｄｉｆｉｅｄ the policy.'));
 assert.ok(imported('art','We discussed “art”.','n'));
 assert.equal(imported('art','The artist arrived.','n'),null);
});
test('Current export imports the eight reviewed inflected entries with canonical source IDs',()=>{
 const rows=JSON.parse(fs.readFileSync(path.join(root,'data/cards.json'),'utf8')).rows;
 const words=parse({rows}).words,byWord=new Map(words.map(w=>[w.en,w]));
 for(const word of ['hollow out','modify','hinge on','ramp up','authority','edge up','account for','rally'])assert.ok(byWord.has(word),word);
 assert.ok(!byWord.has('securities filing'));
 for(const w of words){const row=rows.find(r=>r.Front===w.en&&r.Status==='Verified'&&r.Subject==='English Vocab');assert.equal(w.id,'notion-tioncomp'+row.page_id);}
});
