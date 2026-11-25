const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path');
const rd=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const S=require('../scripts/study-scratch.js');
const mem=()=>{const m={};return{getItem:k=>k in m?m[k]:null,setItem:(k,v)=>{m[k]=String(v);},removeItem:k=>{delete m[k];},m};};
const stroke=(w=2.2,n=4)=>[w,...Array.from({length:n*2},(_,i)=>10+i)];
test('save and load keep each question separate and keep the other questions',()=>{
  const st=mem();assert.equal(S.save(st,'acc:ps-1',[stroke()]),true);assert.equal(S.save(st,'eco:m1-9',[stroke(3,2)]),true);
  assert.equal(S.load(st,'acc:ps-1').length,1);assert.equal(S.load(st,'eco:m1-9')[0][0],3);
  S.save(st,'acc:ps-1',[]);assert.equal(S.load(st,'acc:ps-1').length,0);assert.equal(S.load(st,'eco:m1-9').length,1);
  S.save(st,'eco:m1-9',[]);assert.equal(st.getItem(S.KEY),null);
});
test('clean drops malformed strokes and caps size',()=>{
  const bad=[null,[1],[2,1,2,3],['a',1,2],[0,1,2],[99,1,2],[2,5000,1],stroke()];
  assert.equal(S.clean(bad).length,1,'only the valid stroke survives');
  assert.equal(S.clean(Array.from({length:400},()=>stroke())).length,S.MAXSTROKES);
  assert.deepEqual(S.clean('x'),[]);
});
test('broken stored data reads as empty and a full browser reports false',()=>{
  const st=mem();st.setItem(S.KEY,'{nope');assert.deepEqual(S.load(st,'acc:q'),[]);
  const full={getItem:()=>null,setItem:()=>{throw new Error('quota');},removeItem(){}};assert.equal(S.save(full,'acc:q',[stroke()]),false);
});
test('scratch key is backed up, labelled and validated on restore',()=>{
  const B=require('../scripts/study-progress-backup.js'),R=require('../scripts/study-progress-restore.js'),ORIGIN='https://cheetos9250.github.io';
  assert.ok(B.keys.includes('studyos.scratch.v1'));assert.equal(B.labelForKey('studyos.scratch.v1'),'Scratchpad working');
  assert.match(rd('progress-restore.html'),/studyos\.scratch\.v1"\) return "Scratchpad working"/);
  const snap=raw=>B.createSnapshot({getItem:k=>k==='studyos.scratch.v1'?raw:null},ORIGIN,new Date('2026-11-22T12:00:00Z'));
  const ok=JSON.stringify({'acc:ps-1':[stroke()]});const t=mem();
  assert.deepEqual(R.restoreMissing(t,snap(ok),ORIGIN),{restored:1,alreadyPresent:0});assert.equal(t.getItem('studyos.scratch.v1'),ok);
  for(const bad of [[],{'acc:q':'x'},{'bad key':[stroke()]},{'acc:q':[[2,1,2,3]]},{'acc:q':[['x',1,2]]},{'acc:q':[[99,1,2,3]]},{'acc:q':[[2,1,9999]]}])
    assert.throws(()=>R.restoreMissing(mem(),snap(JSON.stringify(bad)),ORIGIN),JSON.stringify(bad));
});
test('engine and course pages wire the scratchpad (acc, eco, math only, not the fresh-problem batch)',()=>{
  const e=rd('scripts/study-course-engine.js');
  assert.match(e,/const scrOn=!!window\.StudyScratch&&!q\.gen/);assert.match(e,/StudyScratch\.mount\(sx,scrId/);
  for(const c of['acc','eco','math'])assert.match(rd(c+'.html'),/scripts\/study-scratch\.js\?v=\d+/);
  for(const c of['eng','zh'])assert.doesNotMatch(rd(c+'.html'),/study-scratch/);
});
