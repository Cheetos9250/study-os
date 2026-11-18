const __cs=require('./course-source.cjs');
const test=require('node:test'),assert=require('node:assert'),fs=require('fs');
for(const f of ['acc','eco','math']){
  test(f+' practice tab supports multi-chapter and unanswered filters',()=>{
    const s=__cs.read(f+'.html','utf8');
    assert.match(s,/let qcats=new Set\(\)/);
    assert.match(s,/id="unansBtn"/);
    assert.match(s,/\(!qcats\.size\|\|qcats\.has\(q\.cat\)\)/);
    assert.ok(!/qcat==='all'/.test(s));
  });
}
