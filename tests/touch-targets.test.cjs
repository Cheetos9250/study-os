const test=require('node:test'),assert=require('node:assert'),fs=require('fs');
test('touch-target CSS and FAB auto-hide exist',()=>{
 assert.match(fs.readFileSync('assets/study-world.css','utf8'),/pointer:coarse[\s\S]*min-height:44px/);
 assert.match(fs.readFileSync('assets/study-eink-course.css','utf8'),/body \.cells \.cell,body \.cell\{width:44px;height:44px\}/);
 const c=fs.readFileSync('scripts/study-calc.js','utf8');
 assert.match(c,/fab-away/);
 assert.match(fs.readFileSync('practice.html','utf8'),/\.pc\.wide\{background:var\(--panel\)\}/);
});
