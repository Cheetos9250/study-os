"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
for(const f of ['acc.html','eco.html','math.html'])test(f+': background reloads and cloud sync keep the current question',()=>{
 const s=fs.readFileSync(path.join(__dirname,'..',f),'utf8');
 assert.match(s,/function buildDeck\(keep\)\{ const keepId=keep&&deck\[qpos\]\?String\(deck\[qpos\]\.id\):null, keepPos=qpos;/);
 assert.match(s,/else if\(keepId!==null\)\{ const ki=deck\.findIndex\(x=>String\(x\.id\)===keepId\); qpos=ki>=0\?ki:Math\.min\(keepPos,Math\.max\(0,deck\.length-1\)\); \}/);
 assert.equal((s.match(/if\(qpos>=QS\.length\) qpos=0; buildDeck\(true\); renderQ\(\);/g)||[]).length,2,'question file loads');
 assert.match(s,/try\{ buildDeck\(true\); renderQ\(\); cardsRow\(\);/,'after a sync is applied');
});
