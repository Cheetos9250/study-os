'use strict';
const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path');
const G=require('../scripts/acc-generator.js');
const {readSource}=require('./course-source.cjs');

test('same seed gives the same questions, different seeds differ',()=>{
  assert.deepStrictEqual(G.make(42,27),G.make(42,27));
  assert.notDeepStrictEqual(G.make(42,27).map(q=>q.q),G.make(43,27).map(q=>q.q));
});

test('every question has 4 different options, the right one first, a shuffled order and a worked explanation',()=>{
  const seenPos=new Set();
  for(let seed=1;seed<=400;seed++){
    const qs=G.make(seed,18);assert.strictEqual(qs.length,18);
    const texts=new Set(),ids=new Set();
    for(const q of qs){
      assert.strictEqual(q.cat,'g');assert.strictEqual(q.right,0);assert.ok(q.gen);
      assert.strictEqual(q.opts.length,4);assert.strictEqual(new Set(q.opts).size,4,q.q+' '+q.opts);
      q.opts.forEach(o=>assert.match(o,/^\$\d[\d,]*(\.\d{1,2})?$/,'no negative or odd money: '+o));
      assert.deepStrictEqual([...q.order].sort(),[0,1,2,3]);
      seenPos.add(q.order.indexOf(0));
      assert.ok(q.exp.includes('**'+q.opts[0]+'**'),'explanation shows the right answer: '+q.exp);
      assert.ok(!texts.has(q.q),'no repeated text in a batch');texts.add(q.q);
      assert.ok(!ids.has(q.id));ids.add(q.id);assert.match(q.id,/^gen-[a-z0-9]+-\d+$/);
    }
  }
  assert.strictEqual(seenPos.size,4,'right answer lands in every position');
});

test('a batch of 27 covers every template',()=>{
  const used=new Set(G.make(7,27).map(q=>q.tmpl));
  assert.strictEqual(used.size,G.templates.length);
});

test('the owner prototype maths: net of returns, then discount, cents rounded',()=>{
  for(let seed=1;seed<=200;seed++){
    for(const q of G.make(seed,9).filter(x=>x.tmpl==='purch-net')){
      const n=q.q.match(/\$([\d,]+)/g).map(x=>+x.replace(/[$,]/g,'')),rate=+q.q.match(/(\d)\/10/)[1]/100;
      const want=Math.round((n[0]-n[1])*(1-rate)*100)/100;
      assert.strictEqual(+q.opts[0].replace(/[$,]/g,''),want);
    }
  }
});

test('fmt keeps cents only when needed',()=>{
  assert.strictEqual(G.fmt(1234),'$1,234');assert.strictEqual(G.fmt(1234.5),'$1,234.50');assert.strictEqual(G.fmt(0.07),'$0.07');
});

test('acc.html loads the generator and the engine hooks it without storing its answers',()=>{
  const html=fs.readFileSync(path.join(__dirname,'..','acc.html'),'utf8');
  assert.match(html,/scripts\/acc-generator\.js/);assert.match(html,/gen:\{n:27\}/);
  const src=readSource(path.join(__dirname,'..','acc.html'));
  assert.match(src,/function genLoad\(\)/);
  assert.match(src,/\/\^gen-\/\.test\(id\)\)\s*delete o\[id\]/,'old gen answers are dropped on load');
  assert.match(src,/!q\.gen\|\|qcats\.has\('g'\)/,'only shown when the Fresh problems chapter is chosen');
  assert.match(src,/StudyQSets\.build\(QS\.filter\(q=>!q\.gen&&!q\.inbox\)\)/);
});
