const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const ctx={window:{}};vm.runInNewContext(R('scripts/math-practice-mcq.js'),ctx);const Q=ctx.window.MATH_PRACTICE_MCQ;
test('math chapters 5–7 practice: English MCQs, stable unique ids, 4 distinct options',()=>{
  assert.ok(Q.length>=60); assert.equal(new Set(Q.map(q=>q.id)).size,Q.length);
  for(const c of ['c5','c6','c7']) assert.ok(Q.filter(q=>q.cat===c).length>=15,c);
  for(const q of Q){ assert.match(q.id,/^mp[567]-\d+$/); assert.equal(q.opts.length,4); assert.equal(new Set(q.opts).size,4); assert.ok(q.exp); assert.doesNotMatch(JSON.stringify(q),/[฀-๿]/); }
});
test('key calculations match the course methods',()=>{
  const near=(a,b,t=0.005)=>Math.abs(a-b)<=t;
  assert.ok(near(10800*0.18*30/365,159.78));            // average daily balance, days/365
  assert.ok(near(100000*1.01**12,112682.50));           // quarterly compounding
  assert.ok(near(80000/1.03**8,63152.74));              // present value
  const d=[4,7,10,7,5,2,7],m=d.reduce((a,b)=>a+b)/d.length; assert.ok(near(Math.sqrt(d.reduce((a,x)=>a+(x-m)**2,0)/d.length),2.39,0.005));
  assert.ok(near(15+0.25*(18-15),15.75)); assert.ok(near(30+0.75*(35-30),33.75)); // Qr = r(N+1)/4
});
test('math page loads the set and renders case text',()=>{
  const s=R('math.html'); assert.match(s,/scripts\/math-practice-mcq\.js/); assert.match(s,/MATH_PRACTICE_MCQ/); assert.match(s,/if\(q\.case\) h\+=/);
});
