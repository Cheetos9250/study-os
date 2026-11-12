'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,readdirSync}=require('node:fs');
const {join}=require('node:path');

const ROOT=join(__dirname,'../..');
const SUBJECTS=['acc','eco','math','eng','zh'];
const read=path=>readFileSync(join(ROOT,path),'utf8');
function published(){
 return [
  ...readdirSync(ROOT).filter(x=>x.endsWith('.html')),
  ...readdirSync(join(ROOT,'vocabloom')).filter(x=>/\.html$|\.js$/.test(x))
   .map(x=>'vocabloom/'+x)
 ].sort();
}
function matches(source,pattern){return (source.match(pattern)||[]).length;}
// Conservatively detect known mutating HTTP requests and dynamic dispatchers.
// This is not an AST, network trace, or inventory of external writers.
function signatures(source){
 return {
  direct:matches(source,/\bmethod\s*:\s*['"](?:PUT|POST|PATCH|DELETE)['"]/g),
  conditional:matches(source,/\bmethod\s*===?\s*['"](?:PUT|POST|PATCH|DELETE)['"]/g)
 };
}
const authorized={
 ...Object.fromEntries(SUBJECTS.map(s=>[s+'.html',{direct:2,conditional:0}])),
 'vocabloom/unified-progress.js':{direct:1,conditional:0},
 'vocabloom/staging-check.html':{direct:0,conditional:2},
 'vocabloom/staging-accounting-import.html':{direct:0,conditional:4}
};
test('All published HTML/JS write-capable surfaces must be in explicit allowlist',()=>{
 const found=[];
 for(const path of published()){
  const actual=signatures(read(path));
  if(actual.direct||actual.conditional)found.push(path);
  if(path in authorized)
   assert.deepEqual(actual,authorized[path],path+' changed its mutating behavior; review inventory before merging');
  else
   assert.deepEqual(actual,{direct:0,conditional:0},
    'New or undeclared mutation-capable published client: '+path);
 }
 assert.deepEqual(found.sort(),Object.keys(authorized).sort());
});
test('Six actual learner progress writers stay scoped and legacy pages do not auto-sync',()=>{
 const unified=read('vocabloom/unified-progress.js');
 assert.match(unified,/api\+'\/progress\/'\+encodeURIComponent\(d\.key\)/);
 assert.match(unified,/const saved=await fetch\(url,\{method:'PUT',headers,body\}\)/);
 assert.match(unified,/if\(!manual&&!CLOUD\.enabled\)throw Error\(/);
 assert.match(unified,/if\(!key\)throw Error\(/);
 assert.match(unified,/cCloudStorageKey\(\)/);
 for(const subject of SUBJECTS){
  const path=subject+'.html',src=read(path);
  assert.match(src,/if\(!manual\|\|busy\) return;/,path);
  assert.match(src,/const base=await cfg\(\);/,path);
  assert.match(src,/base\+'\/progress\/'\+D\.key/,path);
  assert.match(src,/const p=await fetch\(url,\{method:'PUT',headers,body:JSON\.stringify\(joined\)\}\)/,path);
  assert.match(src,/if\(!window\.confirm\(/,path);
  assert.match(src,/progressKeyName/,path);
  assert.match(src,/Do not dispatch background GET\/PUT/,path);
 }
});
test('Notion Review Step is separate explicitly scoped write in exactly five pages',()=>{
 for(const subject of SUBJECTS){
  const src=read(subject+'.html');
  assert.equal(matches(src,/method:'POST'/g),1);
  assert.equal(matches(src,/method:'PUT'/g),1);
  assert.match(src,/reviewApi\+'\/review'/);
  assert.match(src,/headers:X\.reviewHdr\(\)/);
  assert.match(src,/window\.__xs\.reviewReady\(\)/);
  assert.doesNotMatch(src,/X\.api\(\)\+'\/review'/);
  assert.doesNotMatch(src,/X\.hdr\(\),body:JSON\.stringify\(\{page,pass\}\)/);
 }
 assert.equal(matches(read('vocabloom/unified-progress.js'),/method:'POST'/g),0);
});
test('Staging mutation surfaces cannot write other subjects or production workers',()=>{
 const check=read('vocabloom/staging-check.html');
 assert.match(check,/path='\/__staging\/probe\/'\+id/);
 assert.match(check,/request\(path,key,'PUT'/);
 assert.match(check,/connect-src https:\/\/study-api-cas-staging-only\.kasidit09022550\.workers\.dev/);
 const importer=read('vocabloom/staging-accounting-import.html');
 assert.match(importer,/method==='PUT'&&path==='\/progress\/acc'/);
 assert.match(importer,/request\('\/progress\/acc',secret,'PUT',preview\.subjects\.acc,fresh\.acc\.revision\)/);
 assert.match(importer,/revision==='"0"'/);
 assert.match(importer,/exactSameSnapshot\(fresh,active\.staging\)/);
 assert.match(importer,/connect-src https:\/\/study-api-cas-staging-only\.kasidit09022550\.workers\.dev/);
 assert.doesNotMatch(check,/\bstudy-api\.kasidit09022550\.workers\.dev\b/);
 assert.doesNotMatch(importer,/\bstudy-api\.kasidit09022550\.workers\.dev\b/);
});
test('Read-only tools and published landing pages retain zero mutating fetch signatures',()=>{
 for(const path of [
  'index.html','vocabloom/index.html',
  'vocabloom/migration-audit.html',
  'vocabloom/private-kv-capture.html',
  'vocabloom/staging-import-preflight.html',
  'vocabloom/staging-exit-check.html',
  'vocabloom/study-integration.js'
 ]){
  assert.deepEqual(signatures(read(path)),{direct:0,conditional:0},path);
 }
 assert.deepEqual(JSON.parse(read('data/config.json')),
  {api:'https://study-api.kasidit09022550.workers.dev'});
});
