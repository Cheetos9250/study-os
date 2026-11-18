/* TASK 4: written calculation practice for Math Ch5–7 (data/math-written/chN.json), shown like accounting written exercises. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('10 problems per chapter with prompt, worked solution and number checks',()=>{
  const ids=new Set();
  for(const ch of [5,6,7]){const l=JSON.parse(R('data/math-written/ch'+ch+'.json'));assert.equal(l.length,10,'ch'+ch);
    for(const p of l){assert.match(p.id,new RegExp('^MATH'+ch+'-\\d+$'));assert.ok(!ids.has(p.id));ids.add(p.id);
      assert.ok(p.title&&p.prompt&&p.solution);assert.ok(Array.isArray(p.checks)&&p.checks.length>=1);
      for(const c of p.checks){assert.equal(typeof c[0],'string');assert.ok(Number.isFinite(c[1]));if(c.length>2)assert.ok(c[2]>0);}
      assert.doesNotMatch(JSON.stringify(p),/[฀-๿]/);}}
});
test('answers that follow the course methods',()=>{
  const all=[5,6,7].flatMap(ch=>JSON.parse(R('data/math-written/ch'+ch+'.json'))),get=(id,i)=>all.find(p=>p.id===id).checks[i||0][1];
  assert.equal(get('MATH5-1'),24000*0.075*120/360,'ordinary interest uses 360 days');
  assert.equal(get('MATH5-6',1),2000*1.07,'7% sales tax');
  assert.ok(Math.abs(get('MATH5-9')-358000/30)<0.01,'average daily balance');
  assert.equal(get('MATH6-3'),60+50+40-20-15-10+5);assert.equal(get('MATH7-3'),31,'quartile position r(N+1)/4');
  assert.ok(Math.abs(get('MATH7-6',1)-5/36)<0.001);
});
test('math page turns written practice on from its own folder',()=>{
  assert.match(R('math.html'),/written:\[5,6,7\],writtenDir:'data\/math-written\/ch',writtenTag:'Written'/);
  const e=R('scripts/study-course-engine.js');assert.match(e,/fetch\(\(OPT\.writtenDir\|\|'data\/textbook-sos\/ch'\)\+ch\+'\.json'/);
});
