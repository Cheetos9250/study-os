'use strict';
const test=require('node:test'),assert=require('node:assert');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.join(__dirname,'..');
const P=require('../scripts/eco-adas-pics.js');
const ctx={window:{}};
for(const f of ['scripts/eco-practice-mcq.js','scripts/eco-exam-mcq.js']) vm.runInNewContext(fs.readFileSync(path.join(ROOT,f),'utf8'),ctx);
const ids=new Set(ctx.window.ECO_PRACTICE_MCQ.map(q=>q.id));
const D=JSON.parse(/^const D = (\{.*\});/m.exec(fs.readFileSync(path.join(ROOT,'data/courses/eco.js'),'utf8'))[1]);
test('every picture file exists and is well formed',()=>{
  for(const [k,[alt,f]] of Object.entries(P.FILES)){
    const s=fs.readFileSync(path.join(ROOT,f),'utf8');
    assert.match(s,/^<svg [^>]*viewBox="0 0 680 370"/,k);
    assert.match(s,/<title>/,k);
    assert.ok(alt.length>5,k);
  }
});
test('every mapped id is a real economics question in the AD-AS chapter',()=>{
  for(const id of Object.keys(P.AFTER)){
    if(/^\d+$/.test(id)) assert.equal(D.quiz[Number(id)][0],'a',id);
    else { assert.ok(ids.has(id),id); assert.equal(ctx.window.ECO_PRACTICE_MCQ.find(q=>q.id===id).cat,'a',id); }
    for(const k of P.AFTER[id]) assert.ok(P.FILES[k],id+' '+k);
  }
});
test('pictures only after the answer (never before)',()=>{
  assert.equal(P.html('ep-a8','before'),'');
  assert.match(P.html('ep-a8','after'),/assets\/adas\/keynesian\.svg/);
  assert.equal(P.html('ep-a1','after'),'');
});
test('engine and eco.html wire the pictures in',()=>{
  const e=fs.readFileSync(path.join(ROOT,'scripts/study-course-engine.js'),'utf8');
  assert.match(e,/EcoAdasPics/);
  const h=fs.readFileSync(path.join(ROOT,'eco.html'),'utf8');
  assert.ok(h.indexOf('scripts/eco-adas-pics.js')>0&&h.indexOf('scripts/eco-adas-pics.js')<h.indexOf('study-course-engine.js'));
});
