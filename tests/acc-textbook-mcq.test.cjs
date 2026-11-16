const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const ctx={window:{}};vm.runInNewContext(R('scripts/acc-textbook-mcq.js'),ctx);const Q=ctx.window.ACC_TB_MCQ;
const index=JSON.parse(R('data/accounting-textbook-index.json')).items.map(i=>i.id);
test('textbook-style MCQs: English, 4 distinct options, stable unique ids, refs exist in the textbook index',()=>{
  assert.ok(Q.length>=80); assert.equal(new Set(Q.map(q=>q.id)).size,Q.length);
  for(const q of Q){ assert.match(q.id,/^tb-/); assert.ok(index.includes(q.ref),q.ref); assert.match(q.cat,/^c[5-9]$/);
    assert.equal(q.opts.length,4); assert.equal(new Set(q.opts).size,4); assert.ok(q.exp);
    assert.doesNotMatch(JSON.stringify(q),/[฀-๿]/); }
  for(const c of ['c5','c6','c7','c8','c9']) assert.ok(Q.some(q=>q.cat===c),c);
});
test('accounting practice includes them in the main pool and supports ?q= deep links',()=>{
  const s=R('acc.html'); assert.match(s,/scripts\/acc-textbook-mcq\.js/); assert.match(s,/window\.ACC_TB_MCQ\|\|\[\]\)\.forEach/);
  assert.match(s,/get\('q'\)/); assert.match(s,/Textbook style/);
});
test('textbook page links each exercise to its multiple-choice question',()=>{
  const s=R('accounting-textbook.html'); assert.match(s,/scripts\/acc-textbook-mcq\.js/); assert.match(s,/id="mcqLink"/); assert.match(s,/acc\.html\?tab=prac&q=/);
});
