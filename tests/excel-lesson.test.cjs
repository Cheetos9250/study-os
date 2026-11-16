const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path');
const R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('Excel lesson progress is backed up, labelled and validated',()=>{
  const B=require('../scripts/study-progress-backup.js'); assert.ok(B.keys.includes('studyos.excel.v1'));
  assert.match(R('scripts/study-progress-backup.js'),/"studyos\.excel\.v1"\) return "Excel lesson progress"/);
  assert.match(R('progress-restore.html'),/"studyos\.excel\.v1"\) return "Excel lesson progress"/);
  const recovery=require('../scripts/study-progress-restore.js'),ORIGIN='https://cheetos9250.github.io';
  const snap=raw=>B.createSnapshot({getItem:k=>k==='studyos.excel.v1'?raw:null},ORIGIN,new Date('2026-11-16T12:00:00Z'));
  const store=()=>{const db=new Map();return{getItem:k=>db.has(k)?db.get(k):null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k),db};};
  const ok=JSON.stringify({done:{a1:true,b6:true},ans:{x1:1,x12:0}}),s1=store();
  assert.deepEqual(recovery.restoreMissing(s1,snap(ok),ORIGIN),{restored:1,alreadyPresent:0});assert.equal(s1.getItem('studyos.excel.v1'),ok);
  for(const bad of [{done:{a1:'yes'}},{ans:{x1:'b'}},{done:[]}]){const s2=store();assert.throws(()=>recovery.restoreMissing(s2,snap(JSON.stringify(bad)),ORIGIN),/Excel/);assert.equal(s2.db.size,0);}
});
test('Excel page: steps, quiz ids and storage stay in step with the validator',()=>{
  const s=R('excel.html');
  assert.match(s,/const KEY='studyos\.excel\.v1'/);
  const ids=[...s.matchAll(/\{id:'([a-z]\d{1,2})'/g)].map(m=>m[1]);
  assert.ok(ids.length>=15); assert.equal(new Set(ids).size,ids.length,'step ids unique');
  const quiz=s.slice(s.indexOf('const QUIZ=['),s.indexOf('];',s.indexOf('const QUIZ=['))+2);
  const Q=Function('return '+quiz.replace('const QUIZ=','').replace(/;$/,''))();
  assert.ok(Q.length>=10);
  for(const q of Q){assert.ok(q.o.length>=2&&q.o.length<=10);assert.ok(Number.isInteger(q.a)&&q.a<q.o.length);assert.ok(q.e);}
  assert.doesNotMatch(s,/fetch\(/,'no network use');
  assert.doesNotMatch(s,/[฀-๿]/,'UI stays English');
});
test('Excel is linked from Practice and Lessons',()=>{
  assert.match(R('practice.html'),/href="excel\.html"/);
  assert.match(R('hub.html'),/href="excel\.html"/);
});
