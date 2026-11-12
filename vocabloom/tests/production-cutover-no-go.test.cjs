'use strict';
/**
 * Phase 6 NO-GO guardrail. A deliberate Production cutover must explicitly
 * change this test and its reviewed policy. Never silently point the study
 * site to Staging or repurpose the original Notion Worker.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const ROOT=join(__dirname,'../..');
const read=path=>readFileSync(join(ROOT,path),'utf8');
const ORIGINAL='https://study-api.kasidit09022550.workers.dev';
const STAGING='https://study-api-cas-staging-only.kasidit09022550.workers.dev';
const SUBJECTS=['acc','eco','math','eng','zh'];
test('Production config is intentionally unchanged; no unapproved progress cutover',()=>{
 const config=JSON.parse(read('data/config.json'));
 assert.deepEqual(config,{api:ORIGINAL});
 assert.equal(read('data/config.json'),JSON.stringify(config)+'\n');
 assert.ok(!('progress_api' in config));
 assert.ok(!Object.values(config).includes(STAGING));
});
test('Isolated staging Wrangler config cannot accidentally rename staging to Production',()=>{
 const wrangler=JSON.parse(read('experiments/study-sync-cas/wrangler.jsonc'));
 assert.equal(wrangler.name,'study-api-cas-staging-only');
 assert.equal(wrangler.main,'worker.mjs');
 assert.equal(wrangler.vars.STAGING_ONLY,'true');
 assert.equal(wrangler.vars.ALLOWED_ORIGIN,'https://cheetos9250.github.io');
 assert.equal(wrangler.durable_objects.bindings.length,1);
 assert.equal(wrangler.durable_objects.bindings[0].name,'PROGRESS_DO');
 assert.equal(wrangler.durable_objects.bindings[0].class_name,'StudyProgressDO');
 assert.ok(!('NOTION_TOKEN' in wrangler.vars));
 assert.ok(!('SYNC_KEY' in wrangler.vars));
});
test('Staging worker hard-fails on wrong flag, hostname and origin',()=>{
 const worker=read('experiments/study-sync-cas/worker.mjs');
 assert.match(worker,/if\(String\(env\.STAGING_ONLY\)!=='true'\|\|/);
 assert.match(worker,/STAGING_HOST\.test\(parsed\.hostname\)/);
 assert.match(worker,/return cors\(response\(\{error:'Staging deployment guard denied this host\/configuration'\},503\)\)/);
 assert.match(worker,/if\(origin&&origin!==allowed\)return response\(\{error:'Origin not allowed'\},403\)/);
 assert.match(worker,/if\(!env\.SYNC_KEY\|\|request\.headers\.get\('X-Sync-Key'\)!==env\.SYNC_KEY\)/);
 assert.doesNotMatch(worker,/https:\/\/study-api\.kasidit09022550\.workers\.dev/);
});
test('Production Notion quiz/cards loading is separate from optional progress routing',()=>{
 for(const subject of SUBJECTS){
  const src=read(subject+'.html'),before=src.slice(0,src.indexOf('async function cfg(){'));
  assert.match(before,/if\(c\.ok\) api=String\(\(await c\.json\(\)\)\.api\|\|''\)/);
  assert.doesNotMatch(before,/progress_api/);
  const block=src.slice(src.indexOf('async function cfg(){'),src.indexOf('  const say=',src.indexOf('async function cfg(){')));
  assert.match(block,/j\.progress_api\|\|j\.api/);
 }
 const unified=read('vocabloom/unified-progress.js');
 assert.match(unified,/j\.progress_api\|\|j\.api/);
});
test('All staging helper pages are restricted to the staging-only worker',()=>{
 const pages=[
  'vocabloom/staging-check.html','vocabloom/staging-import-preflight.html',
  'vocabloom/staging-accounting-import.html','vocabloom/staging-exit-check.html'
 ];
 for(const file of pages){
  const src=read(file);
  assert.match(src,/Content-Security-Policy/);
  assert.match(src,/study-api-cas-staging-only\.kasidit09022550\.workers\.dev/);
  assert.doesNotMatch(src,/\bstudy-api\.kasidit09022550\.workers\.dev\b/,file);
  assert.doesNotMatch(src,/\b(?:localStorage|sessionStorage)\b/,file);
  assert.match(src,/referrer" content="no-referrer"/);
 }
 const exit=read('vocabloom/staging-exit-check.html');
 assert.match(exit,/method:'GET'/);
 assert.doesNotMatch(exit,/\bmethod\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/);
 const importPage=read('vocabloom/staging-accounting-import.html');
 assert.match(importPage,/method==='PUT'&&path==='\/progress\/acc'/);
 assert.match(importPage,/ensure\(revision==='"0"'/);
});
test('Neither public config nor staging Wrangler may contain a real user token',()=>{
 for(const path of ['data/config.json','experiments/study-sync-cas/wrangler.jsonc']){
  const source=read(path);
  assert.doesNotMatch(source,/Bearer\s+[a-z0-9._-]{16,}/i);
  assert.doesNotMatch(source,/"(?:NOTION_TOKEN|SYNC_KEY|API_TOKEN)"\s*:/);
 }
});
