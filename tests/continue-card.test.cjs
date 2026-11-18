"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const L=require('../scripts/study-last.js');
test('last place: only plain site links are kept; not study data, so not backed up',()=>{
 const m=new Map();global.localStorage={getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,v)};
 assert.equal(L.mark({href:'acc.html?tab=prac&q=tbw-QS-9-2',title:'<b>Accounting</b>',sub:'Q 3 · **Cash**',course:'acc'}),true);
 const v=L.get();assert.equal(v.href,'acc.html?tab=prac&q=tbw-QS-9-2');assert.equal(v.title,'Accounting');assert.equal(v.sub,'Q 3 · Cash');
 for(const bad of ['https://evil.test/x.html','javascript:alert(1)','//evil.test/a.html','../x.html','acc.html#x'])assert.equal(L.mark({href:bad}),false,bad);
 assert.ok(!require('../scripts/study-progress-backup.js').keys.includes(L.KEY));
 delete global.localStorage;
});
test('course and textbook pages record the place; eco/math accept ?q= like acc',()=>{
 for(const f of ['acc.html','eco.html','math.html']){const s=read(f);
  assert.match(s,/<script src="scripts\/study-last\.js\?v=\d+"><\/script>/,f);
  assert.match(s,/StudyLast\.mark\(\{href:D\.key\+'\.html\?tab=prac&q='\+encodeURIComponent\(q\.id\)/,f);
  assert.match(s,/qpos=0; if\(qJump\)\{ const ji=deck\.findIndex\(x=>String\(x\.id\)===qJump\); if\(ji>=0\) qpos=ji; \}/,f);}
 assert.match(read('pdf-sets.html'),/StudyLast\.mark\(\{href:'pdf-sets\.html\?book=1&q='\+encodeURIComponent\(id\)/);
});
test('Today shows the Continue card with a countdown to the next exam (that subject first)',()=>{
 const s=read('index.html');
 assert.match(s,/<a class="cont" id="continue" hidden><\/a>/);
 assert.match(s,/const ex=upcoming\(\),mine=ex\.find\(e=>e\.course===L\.course\),ne=mine\|\|ex\[0\];/);
 assert.match(s,/renderBackupNudge\(\);renderContinue\(\);/);
});
