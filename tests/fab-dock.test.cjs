const test=require('node:test'),assert=require('node:assert'),fs=require('fs');
const calc=fs.readFileSync('scripts/study-calc.js','utf8'),notes=fs.readFileSync('scripts/study-quiz-notes.js','utf8');
test('on narrow screens the floating Calc and Notes buttons are hidden (they sat on the answers)',()=>{
 assert.match(calc,/@media\(max-width:899\.98px\)\{#calcBtn,#qnBtn\{display:none!important\}\}/);
 assert.match(notes,/#qnBtn\{display:none!important\}/);
 assert.doesNotMatch(calc,/fab-away/);
 assert.doesNotMatch(calc,/84px \+ env\(safe-area-inset-bottom\)/);
});
test('they are tools in the bottom bar More menu instead, and still open the same panels',()=>{
 for(const [src,id] of [[calc,'calcBtn'],[notes,'qnBtn']]){
  assert.match(src,new RegExp("dataset\\.tool='"+id+"'"));
  assert.match(src,/getElementById\('snFoot'\)/);
  assert.match(src,/btn\.click\(\)/);
  assert.match(src,/\.sn-tool\{display:none\}/,'hidden on desktop, where the floating buttons stay');
 }
});
