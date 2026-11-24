'use strict';
const test=require('node:test'),assert=require('node:assert');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.join(__dirname,'..');
const ctx={window:{}};
for(const f of ['scripts/eco-practice-mcq.js','scripts/eco-exam-mcq.js']) vm.runInNewContext(fs.readFileSync(path.join(ROOT,f),'utf8'),ctx);
const ALL=ctx.window.ECO_PRACTICE_MCQ;
const EX=ALL.filter(q=>/^ex-/.test(q.id));
test('250 exam questions, 50 per topic',()=>{
  assert.equal(EX.length,250);
  for(const c of ['g','b','i','a','f']) assert.equal(EX.filter(q=>q.cat===c).length,50,c);
});
test('shape: id, 4 distinct options, explanation, no Thai, no LaTeX',()=>{
  for(const q of EX){
    assert.match(q.id,/^ex-[gbiaf]\d+$/);
    assert.equal(q.opts.length,4,q.id);
    assert.equal(new Set(q.opts).size,4,q.id);
    assert.ok(q.exp&&q.exp.length>10,q.id);
    const t=q.q+q.opts.join('')+q.exp;
    assert.ok(!/[฀-๿]/.test(t),q.id+' thai');
    assert.ok(!/\\(text|times|div|Delta|frac)|\$\$/.test(t),q.id+' latex');
  }
});
test('question text is unique across the whole practice list',()=>{
  const seen=new Set();
  for(const q of ALL){const k=q.q.toLowerCase().trim();assert.ok(!seen.has(k),q.id);seen.add(k);}
});
test('questions that pointed at another question are self-contained',()=>{
  for(const q of EX) assert.ok(!/\bQuestion \d+\b|\bQ\d+\b/.test(q.q),q.id);
});
test('known answers',()=>{
  const by=id=>EX.find(q=>q.id===id);
  assert.match(by('ex-b7').q,/unemployment rate/i);
  assert.equal(by('ex-g16').opts[0].includes('137.5'),true);
});
test('eco.html loads the exam file right after the practice file',()=>{
  const h=fs.readFileSync(path.join(ROOT,'eco.html'),'utf8');
  const a=h.indexOf('scripts/eco-practice-mcq.js'),b=h.indexOf('scripts/eco-exam-mcq.js');
  assert.ok(a>0&&b>a);
});
