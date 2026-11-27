const test=require('node:test'),assert=require('node:assert'),fs=require('fs');
test('touch-target CSS exists',()=>{
 assert.match(fs.readFileSync('assets/study-world.css','utf8'),/pointer:coarse[\s\S]*min-height:44px/);
 assert.match(fs.readFileSync('assets/study-eink-course.css','utf8'),/body \.cells \.cell,body \.cell\{width:44px;height:44px\}/);
 const c=fs.readFileSync('scripts/study-calc.js','utf8');
 assert.match(c,/sn-tool/);
 assert.match(fs.readFileSync('practice.html','utf8'),/\.pc\.wide\{background:var\(--panel\)\}/);
});
test('declutter: acc textbook button gone, extra chips folded',()=>{
 assert.doesNotMatch(fs.readFileSync('acc.html','utf8'),/Textbook \(My PDF sets\)/);
 assert.match(fs.readFileSync('scripts/study-course-engine.js','utf8'),/<details class="qmore">/);
});
