const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const pages=['index','hub','today','progress-backup','progress-restore','accounting-textbook','acc','eco','math','eng','zh'];
for(const f of pages)test(f+'.html supports manual light/dark and loads the theme script',()=>{
 const s=fs.readFileSync(path.join(root,f+'.html'),'utf8');
 assert.match(s,/scripts\/study-theme\.js/);
 assert.match(s,/:root:not\(\[data-theme="light"\]\)/);
 assert.match(s,/:root\[data-theme="dark"\]/);
});
test('theme script writes only its own key and is not part of backups',()=>{
 const s=fs.readFileSync(path.join(root,'scripts/study-theme.js'),'utf8');
 assert.deepEqual([...s.matchAll(/setItem\(([^,]+),/g)].map(m=>m[1]),['KEY']);
 assert.match(s,/KEY='studyos\.theme\.v1'/);
 assert.ok(!require('../scripts/study-progress-backup.js').keys.includes('studyos.theme.v1'));
});
