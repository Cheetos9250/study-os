"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('Today: one-tap backup builds the same file as the backup page, share sheet on touch, download otherwise',()=>{
 const s=read('index.html');
 assert.match(s,/<script src="scripts\/study-progress-backup\.js\?v=[^"]+"><\/script>\s*<script src="scripts\/study-today\.js/);
 assert.match(s,/BK\.createSnapshot\(localStorage,location\.origin,new Date\(\)\)/);
 assert.match(s,/navigator\.canShare\(\{files:\[f\]\}\)/);
 assert.match(s,/navigator\.share\(\{files:\[f\],title:'Study OS backup'\}\)\.then\(\(\)=>bkDone\('share'\)/);
 assert.match(s,/err\.name==='AbortError'\)bkSay\('Cancelled/,'cancelling the share sheet does not count as a backup');
 assert.match(s,/a\.download=name/);
 assert.match(s,/'study-os-progress-'\+new Date\(\)\.toISOString\(\)\.slice\(0,10\)\+'\.json'/);
 assert.doesNotMatch(read('progress-backup.html'),/localStorage\.(?:setItem|removeItem)/,'backup page stays read-only');
});
test('Today lists what cloud sync does not cover, using the backup labels',()=>{
 const s=read('index.html');
 assert.match(s,/function notInCloud\(c\)\{return BK\?BK\.keys\.filter/);
 assert.match(s,/Only on this device: /);
 // the keys treated as synced are exactly what scripts/study-cloud.js syncs
 const cloud=read('scripts/study-cloud.js');
 for(const k of ['studyos.today.v1','studyos.notes.v1','studyos.home.v1','studyos.grades.v1'])assert.ok(cloud.includes("'"+k+"'"),k+' is synced by study-cloud.js');
 const B=require('../scripts/study-progress-backup.js');
 for(const k of ['studyos.accounting.textbook.progress.v1','vocabloom_mvp_v1','studyos.excel.v1','studyos.pdfsets.v1']){
  assert.ok(B.keys.includes(k));assert.doesNotMatch(B.labelForKey(k),/Unknown/);
 }
 assert.ok(!cloud.includes("'vocabloom_mvp_v1'"),'WordNest history is not in cloud sync, so Today lists it');
 // Excel, PDF sets and textbook answers count as synced only after the extra subject has synced once (Worker redeployed)
 assert.match(s,/extra=!!read\('study-sync-extra-base-v1'\)/);
});
