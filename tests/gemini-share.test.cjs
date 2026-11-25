const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const G=require('../scripts/study-gemini.js');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const D={cats:[['c5','05 Merchandising'],['c6','06 Inventory']],quiz:[
 ['c5','Q one **bold**',['a','b','c','d'],0,''],['c5','Q two',['a','b','c','d'],1,''],['c5','Q three',['a','b','c','d'],2,''],['c6','Q four',['x|y','b'],0,'']]};
const now=Date.UTC(2026,10,23,5);
test('courseStats counts answers per chapter and skips answers before a reset',()=>{
 const s=G.courseStats(D,JSON.stringify({ans:{0:0,1:0,2:0,3:1},ats:{0:now-3e5,1:now-2e5,2:now-1e5,3:5},rst:10}));
 assert.equal(s.answered,3);assert.equal(s.correct,1);assert.equal(s.total,4);
 assert.deepEqual(s.wrong.map(w=>w.i),[2,1]);
 assert.equal(s.chapters.find(c=>c.id==='c6').answered,0);
});
test('buildContext writes exams, chapter table, weak chapters and wrong questions',()=>{
 const md=G.buildContext({now,wrongPerCourse:1,exams:[{course:'acc',title:'Accounting final',date:'2026-11-26',cats:['c5']},{course:'acc',title:'Old',date:'2026-11-01',cats:[]}],
  courses:[{key:'acc',name:'Accounting',D,study:{ans:{0:1,1:0,2:0},ats:{0:1,1:2,2:3}}}]});
 assert.match(md,/Accounting final: 2026-11-26 \(in 3 days\)\. Chapters: 05 Merchandising/);
 assert.doesNotMatch(md,/Old:/);
 assert.match(md,/\| 05 Merchandising \| 3 \/ 3 \| 0% \|/);
 assert.match(md,/Weak chapters \(under 70% right\): 05 Merchandising 0%/);
 assert.match(md,/newest 1 of 3/);assert.match(md,/1\. \[05 Merchandising\] Q three/);
 assert.doesNotMatch(md,/\*\*/);
});
test('gemini page is read-only, sends nothing and is linked from the nav',()=>{
 const h=read('gemini.html');
 /* the only thing the page may store is the Drive-inbox Web app URL and its cache (owner, 25 Nov 2026); never progress */
 assert.deepEqual([...new Set((h.match(/localStorage\.(?:setItem|removeItem)\(\s*([A-Za-z]+)/g)||[]).map(x=>x.replace(/.*\(\s*/,'')))].sort(),['C','K']);
 assert.match(h,/var K='studyos\.inbox\.url\.v1',C='studyos\.inbox\.cache\.v1'/);
 /* only GETs: course data, the owner's own Drive-inbox URL, and the prompt file; no body is ever sent */
 assert.doesNotMatch(h,/fetch\((?!c\.data|u\+\(u\.indexOf\('\?'\)<0\?'\?':'&'\)\+'fresh=1',\{cache:'no-store'\}|'docs\/gemini-question-prompt\.md')/);
 assert.doesNotMatch(h,/method\s*:|body\s*:/);
 assert.match(h,/study-eink-base\.css/);
 assert.match(read('scripts/study-nav.js'),/gemini\.html/);
});
