'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'accounting-textbook.html'),'utf8'),today=fs.readFileSync(path.join(root,'today.html'),'utf8');
test('reader has 1–9 chapter chips that clear search and keep the chapter select in sync',()=>{
 assert.match(html,/id="chapterChips"/);
 assert.match(html,/function buildChips\(\)/);
 assert.match(html,/\/\^\[1-9\]\$\/\.test\(String\(x\.chapter\)\)/);
 assert.match(html,/\$\('search'\)\.value='';\$\('chapter'\)\.value=v\.chapter;filteredChanged\(\)/);
 assert.match(html,/function syncChips\(\)/);
});
test('reader supports validated ?ch=, ?type= and ?q= deep links without breaking resume',()=>{
 assert.match(html,/new URLSearchParams\(location\.search\)/);
 assert.match(html,/linkCh=\/\^\[1-9\]\$\/\.test\(link\.get\('ch'\)/);
 assert.match(html,/\['Quick Study','Exercise','Problem A','Problem B'\]\.includes\(link\.get\('type'\)\)/);
 assert.match(html,/records\.find\(x=>x\.id===link\.get\('q'\)\)/);
 assert.match(html,/const resumed=records\.find\(x=>x\.id===resumeId\)/);
});
test('stored PDF restore shows a loading message instead of a Choose PDF prompt',()=>{
 assert.match(html,/let restoring=false/);
 assert.match(html,/if\(!pdfDoc&&restoring\)/);
 assert.match(html,/restoring=true;setPdfState\('กำลังเปิดตำรา…',false\);paint\(\)/);
 assert.match(html,/finally\{restoring=false;paint\(\);\}/);
 assert.match(html,/id="pdfWhere"/);
 assert.match(html,/navigator\.storage\.persist\(\)/);
});
test('wide screens use a split question/answer view and narrow screens get a jump bar',()=>{
 assert.match(html,/id="paneQ"/);assert.match(html,/id="paneA"/);
 assert.match(html,/@media\(min-width:980px\)\{[\s\S]*\.split\{display:grid;grid-template-columns:minmax\(0,1\.25fr\)/);
 assert.match(html,/\.jump-bar\{display:none\}/);
 assert.match(html,/id="jumpQ"/);assert.match(html,/id="jumpA"/);
 assert.match(html,/\.chapter-chips button\{min-width:44px;min-height:44px/);
});
test('Today links accounting chapter tasks to that textbook chapter only',()=>{
 assert.match(today,/accounting-textbook\.html\?ch='\+t\.cat\.slice\(1\)/);
 assert.match(today,/c\.key==='acc'&&\/\^c\[1-9\]\$\/\.test\(t\.cat\)/);
});
test('reader still limits scope to chapters 1–9 and adds no network writes',()=>{
 assert.doesNotMatch(html,/method:\s*'(POST|PUT|PATCH|DELETE)'/);
 assert.match(html,/records=catalog\.items\.filter\(x=>!x\.sectionOnly&&\/\^\[1-9\]\$\/\.test\(String\(x\.chapter\)\)\)/);
});
