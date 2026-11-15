const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const pages=['index','hub','practice','calendar','progress-backup','progress-restore','accounting-textbook','acc','eco','math','eng','zh'];
for(const f of pages)test(f+'.html supports manual light/dark and loads the theme script',()=>{
 let s=fs.readFileSync(path.join(root,f+'.html'),'utf8');
 assert.match(s,/scripts\/study-theme\.js/);
 // Core pages take their theme tokens from the shared stylesheet they link.
 if(/assets\/study-world\.css/.test(s))s+=fs.readFileSync(path.join(root,'assets/study-world.css'),'utf8');
 assert.match(s,/:root:not\(\[data-theme="light"\]\)/);
 assert.match(s,/:root\[data-theme="dark"\]/);
});
test('theme script writes only its own keys and they are not part of backups',()=>{
 const s=fs.readFileSync(path.join(root,'scripts/study-theme.js'),'utf8');
 assert.deepEqual([...s.matchAll(/setItem\(([^,]+),/g)].map(m=>m[1]).sort(),['KEY','NAV_KEY']);
 assert.match(s,/NAV_KEY='studyos\.nav\.v1'/);
 assert.ok(!require('../scripts/study-progress-backup.js').keys.includes('studyos.nav.v1'));
 assert.match(s,/KEY='studyos\.theme\.v1'/);
 assert.ok(!require('../scripts/study-progress-backup.js').keys.includes('studyos.theme.v1'));
});
