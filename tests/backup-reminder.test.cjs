const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('backup page stays read-only; Today records when Back up now is tapped',()=>{
 assert.doesNotMatch(read('progress-backup.html'),/localStorage\.(?:setItem|removeItem)/);
 assert.match(read('index.html'),/\$\('#bkCheck'\)\.onclick=\(\)=>bkMark\('today'\)/);
 assert.ok(!require('../scripts/study-progress-backup.js').keys.includes('studyos.backup-meta.v1'),'reminder setting is not study data');
});
test('Today shows a backup reminder (3 days without cloud sync, weekly with it), only when there is progress',()=>{
 const s=read('index.html');
 assert.match(s,/id="backupNudge"/);
 assert.match(s,/const every=c\.on\?7:3;/);
 assert.match(s,/if\(!has\|\|snooze===today\|\|\(days!==null&&days<every\)\)\{el\.hidden=true;return;\}/);
 assert.match(s,/href="progress-backup\.html" id="bkNow">Back up now/);
 assert.doesNotMatch(s,/\.removeItem|\.clear\(/);
});
test('every page asks the browser to keep its storage',()=>{
 assert.match(read('scripts/study-theme.js'),/navigator\.storage\.persisted\(\)\.then\(function\(p\)\{if\(!p\)return navigator\.storage\.persist\(\);\}\)/);
});
