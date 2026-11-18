/* AI tutor: a retired Gemini model (404) switches once to the newest stable Flash model the key can use. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const A=require('../scripts/study-tutor.js'),R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('default is the Flash alias; pickModel chooses the highest stable gemini-<n>-flash',()=>{
  assert.equal(A.PROVIDERS.gemini.model,'gemini-flash-latest');
  assert.equal(A.pickModel('gemini',['gemini-2.5-flash','gemini-3.8-flash','gemini-3.8-flash-lite','gemini-3.8-flash-image','gemini-10-pro','gemini-3.10-flash-preview']),'gemini-3.8-flash');
  assert.equal(A.pickModel('gemini',['gemini-3.8-flash-lite','gemini-flash-latest']),'gemini-flash-latest');
  assert.equal(A.pickModel('gemini',['gemini-flash-lite-latest','gemini-4-flash-preview-0612']),'gemini-4-flash-preview-0612');
  assert.equal(A.pickModel('gemini',[]),'');assert.equal(A.pickModel('openai',['x']),'');
});
test('the page retries once after a Gemini 404 with the picked model and saves it',()=>{
  const h=R('tutor.html');
  assert.match(h,/if\(out\.status===404&&cfg\.provider==='gemini'\)\{const m=await newestModel\(\);/);
  assert.match(h,/cfg\.gemini\.model=m;saveCfg\(\);/);
  assert.match(h,/A\.pickModel\(cfg\.provider,A\.models\(cfg\.provider,await res\.json\(\)\)\)/);
});
test('the sidebar scrolls when the menu is taller than the screen, without a sideways scrollbar',()=>{
  const n=R('scripts/study-nav.js');
  assert.match(n,/#studyNav\{overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;scrollbar-width:none;/);
});
