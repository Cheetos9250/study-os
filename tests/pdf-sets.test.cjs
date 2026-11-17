const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path');
const R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('PDF sets answers key is backed up, labelled and validated',()=>{
  const B=require('../scripts/study-progress-backup.js'); assert.ok(B.keys.includes('studyos.pdfsets.v1'));
  assert.match(R('scripts/study-progress-backup.js'),/"studyos\.pdfsets\.v1"\) return "PDF practice answers"/);
  assert.match(R('progress-restore.html'),/"studyos\.pdfsets\.v1"\) return "PDF practice answers"/);
  const V=R('scripts/study-progress-restore.js'); assert.match(V,/key === "studyos\.pdfsets\.v1"/); assert.match(V,/Invalid PDF practice answers/);
});
test('pdf-sets page keeps files on the device and links from Practice',()=>{
  const s=R('pdf-sets.html');
  assert.match(s,/indexedDB\.open\(DB,1\)/); assert.match(s,/KEY='studyos\.pdfsets\.v1'/);
  assert.deepEqual([...s.matchAll(/fetch\(([^)]*)\)/g)].map(m=>m[1]),["'data/accounting-textbook-index.json'","'data/textbook-sos/ch'+n+'.json'"],'only reads site data (exercise index, rewritten exercises); never uploads'); assert.match(s,/isEvalSupported:false/);
  assert.match(R('practice.html'),/href="pdf-sets\.html"/);
});
