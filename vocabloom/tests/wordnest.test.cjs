const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'..'),js=fs.readFileSync(path.join(dir,'wordnest.js'),'utf8'),html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
test('WordNest replaces the VocaBloom name and loads last',()=>{
 assert.match(html,/<title>WordNest<\/title>/);assert.doesNotMatch(html,/<title>VocaBloom/);
 assert.match(html,/<script src="\.\/unified-progress\.js"><\/script>\s*<script src="\.\/wordnest\.js"><\/script>/);
});
test('language comes from ?lang and maps to one existing deck each',()=>{
 assert.match(js,/get\('lang'\)==='zh'\?'zh':'en'/);
 assert.match(js,/const DECK=LANG==='zh'\?'zh':'eng';/);
 const decks=JSON.parse(fs.readFileSync(path.join(dir,'study-decks.json'),'utf8')).decks;
 const zh=decks.find(d=>d.key==='zh'),eng=decks.find(d=>d.key==='eng');
 assert.ok(zh&&eng);assert.equal(zh.markKey,'zh-vocab-v1');assert.equal(eng.markKey,'eng-vocab-v1');
});
test('WordNest layer writes no storage of its own',()=>{
 assert.doesNotMatch(js,/localStorage|sessionStorage|fetch\(/);
});
