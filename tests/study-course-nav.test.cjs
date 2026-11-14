'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
test('academic course pages link to Today and load the deep-link helper last',()=>{
 for(const f of ['acc.html','eco.html','math.html']){
  const h=read(f);
  assert.match(h,/<a href="today\.html">Today<\/a>/);
  assert.match(h,/<script src="scripts\/study-course-nav\.js\?v=1"><\/script>\s*<\/html>\s*$/);
 }
});
test('deep-link helper is read-only and ignores unknown tabs',()=>{
 const src=read('scripts/study-course-nav.js');
 assert.doesNotMatch(src,/localStorage|sessionStorage|fetch\(|XMLHttpRequest|setItem|removeItem/);
 const {apply}=require('../scripts/study-course-nav.js');
 const clicks=[];
 global.document={querySelector:()=>null,querySelectorAll:()=>[]};
 assert.equal(apply('?tab=__proto__&cat=c1'),false);
 assert.equal(apply('?tab=nope'),false);
 assert.equal(apply(''),false);
 delete global.document;
});
test('shared CSS keeps 44px touch targets and hides rating buttons before reveal',()=>{
 const css=read('assets/study-course-layout.css');
 assert.match(css,/\.rate4\[hidden\]\{display:none\}/);
 assert.match(css,/\.chip\{min-height:44px/);
 assert.match(css,/\.btn\{min-height:44px\}/);assert.match(css,/\.cells \.cell\{width:40px;height:40px/);
});
test('Today plan links only to existing course pages with tab and chapter parameters',()=>{
 const html=read('today.html');
 assert.match(html,/function link\(c,tab,cat\)/);
 assert.match(html,/'sum',t\.cat/);assert.match(html,/'prac',t\.cat/);
});
