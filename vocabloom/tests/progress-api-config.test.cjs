'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');

const root=join(__dirname,'../..');
const text=path=>readFileSync(join(root,path),'utf8');
const subjects=['acc.html','eco.html','math.html','eng.html','zh.html'];
const originalApi='https://study-api.kasidit09022550.workers.dev';
const futureApi='https://example-progress-worker.invalid';
const config=JSON.parse(text('data/config.json'));
function response(value){return {ok:true,json:async()=>value};}
function vocabloomResolver(obj){
 const src=text('vocabloom/unified-progress.js');
 const first=src.indexOf('async function cApiUrl(){');
 const last=src.indexOf('function cCloudKey()',first);
 assert.ok(first>=0&&last>first);
 const ctx={CLOUD:{api:'',enabled:true,progressSplit:false},CLOUD_AUTO:'vocabloom-auto-sync-v1',CLOUD_AUTO_ENDPOINT:'vocabloom-auto-sync-endpoint-v1',cSafeGet:()=>null,cSafeSet:()=>true,fetch:async()=>response(obj)};
 vm.runInNewContext(src.slice(first,last)+'\nthis.cApiUrl=cApiUrl;',ctx,{timeout:1000});
 return ctx.cApiUrl;
}
function legacyResolver(file,obj){
 const src=text(file);
 const first=src.indexOf('async function cfg(){');
 const last=src.indexOf('  const say=',first);
 assert.ok(first>=0&&last>first,'Cannot extract sync cfg in '+file);
 const ctx={fetch:async()=>response(obj),LSK:'study-sync-key',PROGRESS_LSK:'study-sync-progress-key-v1'};
 vm.runInNewContext("let api='',progressKeyName=LSK;\n"+src.slice(first,last)+'\nthis.cfg=cfg;',ctx,{timeout:1000});
 return ctx.cfg;
}
const prodProgressApi='https://vocabloom-progress-cas-prod.kasidit09022550.workers.dev';
test('Live data/config.json: original api kept, progress goes to the approved CAS Worker on every client',async()=>{
 assert.deepEqual(config,{api:originalApi,progress_api:prodProgressApi});
 assert.equal(await vocabloomResolver(config)(),prodProgressApi);
 for(const path of subjects)
  assert.equal(await legacyResolver(path,config)(),prodProgressApi,path);
});
test('Opt-in progress_api can be selected independently of Notion API for all six clients',async()=>{
 const future={...config,progress_api:futureApi+'/'};
 assert.equal(await vocabloomResolver(future)(),futureApi);
 for(const path of subjects)
  assert.equal(await legacyResolver(path,future)(),futureApi,path);
});
test('Missing or empty progress_api falls back to existing api with no migration',async()=>{
 for(const value of [undefined,null,'']){
  const c={...config,progress_api:value};
  assert.equal(await vocabloomResolver(c)(),originalApi);
  for(const path of subjects)assert.equal(await legacyResolver(path,c)(),originalApi);
 }
});
test('Quiz/card loaders read only the saved data/ snapshot (Notion retired), never progress_api',()=>{
 for(const path of subjects){
  const src=text(path);
  const idx=src.indexOf('async function cfg(){');
  assert.ok(idx>=0);
  const preceding=src.slice(0,idx);
  assert.match(preceding,/fetch\('data\/'\+name\+'\.json'/);assert.doesNotMatch(preceding,/fetch\(api\+'\/'\+name\)|window\.claude\.use\("mcp"\)/);
  assert.doesNotMatch(preceding,/progress_api/);
  assert.match(src.slice(idx,idx+380),/j\.progress_api\|\|original/);
 }
});
test('No Production/Notion endpoints, secrets or Cloudflare bindings are switched in config',()=>{
 assert.doesNotMatch(text('data/config.json'),/staging|SYNC_KEY|token|key/i);
 assert.equal(text('data/config.json'),JSON.stringify(config)+'\n');
 assert.match(text('vocabloom/unified-progress.js'),/const url=String\(j\.progress_api\|\|original\)/);
});
