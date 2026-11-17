"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const S=require('../scripts/study-search.js'),root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
test('index covers questions, cards, summaries, notes and textbook; links open the item',()=>{
 const acc=S.parseCourse(read('acc.html'));assert.ok(acc&&acc.quiz.length>10);
 const idx=S.buildIndex({courses:{acc},notes:{'acc:c5':{text:'Remember FOB shipping point'}},
  textbook:[{id:'QS-9-2',title:'Credit card sales',chapter:9}],written:[{id:'QS-9-26',title:'Preparing an income statement',prompt:'x'}],
  accMcq:[{id:'tb-QS-5-1',ref:'QS-5-1',q:'Kerr Co. buys merchandise'}],quizRows:[{Subject:'Accounting',Status:'Verified',Chapter:acc.cats[0][1],Question:'What is an asset?',Correct:'A resource',page_id:'abc'}]});
 const types=new Set(idx.map(x=>x.type));for(const t of ['q','card','sum','note','tb'])assert.ok(types.has(t),t);
 assert.equal(S.search(idx,'accounting equation')[0].href,'acc.html?tab=prac&q=0');
 assert.match(S.search(idx,'fob shipping')[0].href,/^acc\.html\?tab=prac&cat=c5$/);
 assert.equal(S.search(idx,'credit card sales').find(x=>x.type==='tb').href,'accounting-textbook.html?q=QS-9-2');
 assert.ok(S.search(idx,'income statement').some(x=>x.href==='acc.html?tab=prac&q=tbw-QS-9-26'));
 assert.ok(S.search(idx,'kerr').some(x=>x.href==='acc.html?tab=prac&q=tb-QS-5-1'));
 assert.ok(S.search(idx,'what is an asset').some(x=>x.href==='acc.html?tab=prac&q=n-abc'));
 assert.equal(S.search(idx,'').length,0);assert.equal(S.search(idx,'zzzzqqq').length,0);
});
test('nav opens search lazily (button, More item, / key); search only reads study data',()=>{
 const n=read('scripts/study-nav.js');
 assert.match(n,/class="sn-find"/);assert.match(n,/class="sn-find-m"/);
 assert.match(n,/new URL\('study-search\.js\?v=1',navSrc\)/);assert.match(n,/if\(e\.key!=='\/'\|\|e\.metaKey/);
 assert.doesNotMatch(read('scripts/study-search.js'),/localStorage\.(setItem|removeItem)/);
});
