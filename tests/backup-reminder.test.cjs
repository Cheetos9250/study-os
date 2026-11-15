const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('backup page records when the last backup file was made',()=>{
 assert.match(read('progress-backup.html'),/localStorage\.setItem\("studyos\.backup-meta\.v1", JSON\.stringify\(\{ last: new Date\(\)\.toISOString\(\)/);
 assert.ok(!require('../scripts/study-progress-backup.js').keys.includes('studyos.backup-meta.v1'),'reminder setting is not study data');
});
test('Today shows a backup reminder after 3 days without a backup, only when there is progress',()=>{
 const s=read('index.html');
 assert.match(s,/id="backupNudge"/);
 assert.match(s,/if\(!has\|\|snooze===today\|\|\(days!==null&&days<3\)\)\{el\.hidden=true;return;\}/);
 assert.match(s,/href="progress-backup\.html">Back up now/);
 assert.doesNotMatch(s,/\.removeItem|\.clear\(/);
});
test('every page asks the browser to keep its storage',()=>{
 assert.match(read('scripts/study-theme.js'),/navigator\.storage\.persisted\(\)\.then\(function\(p\)\{if\(!p\)return navigator\.storage\.persist\(\);\}\)/);
});
