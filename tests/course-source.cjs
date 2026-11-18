/* Test helper: course pages (acc/eco/math/eng/zh.html) load their data and the shared engine as separate files
   since 18 Nov 2026. readSource() returns a course page with those <script src> tags replaced by one inline
   <script> holding the same code, in load order, so source checks see what the browser runs. Other files are
   returned unchanged. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.join(__dirname,'..');
const COURSE=/^(acc|eco|math|eng|zh)\.html$/;
const TAGS=/((?:<script src="data\/courses\/[^"]+"><\/script>\n)+)<script>(window\.StudyCourseOpts=[^\n]*)<\/script>\n<script src="scripts\/study-course-engine\.js[^"]*"><\/script>/;
function file(rel){return fs.readFileSync(path.join(ROOT,rel),'utf8');}
function inline(html){
 return html.replace(TAGS,(m,data,opts)=>{
  const parts=[...data.matchAll(/src="([^"?]+)/g)].map(x=>file(x[1]));
  return '<script>\n'+parts.join('\n')+opts+'\n'+file('scripts/study-course-engine.js')+'</script>';
 });
}
function readSource(rel){
 const abs=path.isAbsolute(rel)?rel:path.join(ROOT,rel),t=fs.readFileSync(abs,'utf8');
 return COURSE.test(path.basename(abs))&&path.dirname(abs)===ROOT?inline(t):t;
}
module.exports={readSource,inline,ROOT};
/* drop-in for fs.readFileSync in source tests: course pages come back inlined, everything else is read as usual */
module.exports.read=function(p,enc){
 const abs=path.resolve(String(p));
 if(COURSE.test(path.basename(abs))&&path.dirname(abs)===ROOT)return inline(fs.readFileSync(abs,'utf8'));
 return fs.readFileSync(p,enc);
};
/* data/courses/acc-extra.js: the extra accounting practice sets and the hidden near-duplicates */
module.exports.accExtra=function(){
 const vm=require('node:vm'),ctx={window:{}};
 vm.runInNewContext(file('data/courses/acc-extra.js'),ctx);
 const X=ctx.window.StudyCourseExtra,set=(pre,from)=>X.sets.find(s=>s.pre===pre&&s.from===from);
 return {X,set,ERR:set('err-',1),CH8:set('c8x-',1),BANKERR:set('err-b',1),BANKERR2:set('err-b',21),BRC:set('brc-',1)};
};
