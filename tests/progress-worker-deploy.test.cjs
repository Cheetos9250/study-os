const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const jsonc=s=>JSON.parse(s.replace(/^\s*\/\/.*$/mg,''));
test('progress Worker config: separate name, own SQLite class, no secrets in the file',()=>{
 const src=read('workers/progress/wrangler.jsonc'),w=jsonc(src);
 assert.equal(w.name,'vocabloom-progress-cas-prod');assert.notEqual(w.name,'study-api');
 assert.equal(w.main,'../../experiments/prod-progress-cas/worker.mjs');
 assert.deepEqual(w.durable_objects.bindings,[{name:'PROD_PROGRESS_DO',class_name:'ProductionProgressDO'}]);
 assert.deepEqual(w.migrations,[{tag:'v1',new_sqlite_classes:['ProductionProgressDO']}]);
 assert.ok(!('PROGRESS_SYNC_KEY' in w.vars));assert.doesNotMatch(src,/"(?:SYNC_KEY|PROGRESS_SYNC_KEY|API_TOKEN|NOTION_TOKEN)"\s*:/);
 assert.match(read('experiments/prod-progress-cas/worker.mjs'),/const PROD_HOST='vocabloom-progress-cas-prod\.kasidit09022550\.workers\.dev'/);
});
test('deploy workflow is manual, typed confirmation, never prints the key',()=>{
 const y=read('.github/workflows/deploy-progress-worker.yml');
 assert.match(y,/on:\n  workflow_dispatch:/);assert.doesNotMatch(y,/\n  (push|pull_request|schedule):/);
 assert.match(y,/github\.event\.inputs\.confirm == 'DEPLOY'/);
 assert.match(y,/printf '%s' "\$PROGRESS_SYNC_KEY" \| npx --yes wrangler@4 secret put PROGRESS_SYNC_KEY/);
 assert.doesNotMatch(y,/echo "?\$PROGRESS_SYNC_KEY/);assert.doesNotMatch(y,/set -x/);
 assert.match(y,/test "\$noauth" = 401/);
});
test('public config: legacy api unchanged, progress_api points only at the separate CAS Worker',()=>{
 const c=JSON.parse(read('data/config.json'));
 assert.deepEqual(Object.keys(c),['api','progress_api']);
 assert.equal(c.api,'https://study-api.kasidit09022550.workers.dev');
 assert.equal(c.progress_api,'https://vocabloom-progress-cas-prod.kasidit09022550.workers.dev');
});
