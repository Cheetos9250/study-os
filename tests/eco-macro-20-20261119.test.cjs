const __cs=require('./course-source.cjs');
const test=require('node:test'),assert=require('node:assert'),path=require('path'),vm=require('vm');
const R=p=>__cs.read(path.join(__dirname,'..',p),'utf8');
const ctx={window:{}};vm.runInNewContext(R('scripts/eco-practice-mcq.js'),ctx);const Q=ctx.window.ECO_PRACTICE_MCQ;
const MACRO=['g','i','b','a','d','m','f','n'];
test('economics macro: 20 new English questions per macro chapter (190+ ids per set kept stable)',()=>{
  const first={g:21,i:20,b:23,a:16,d:21,m:26,f:24,n:27};
  for(const c of MACRO){
    const fresh=Q.filter(q=>q.cat===c&&+q.id.replace(/^ep-[a-z]/,'')>=first[c]);
    assert.ok(fresh.length>=20,c+' has '+fresh.length);
  }
  assert.equal(new Set(Q.map(q=>q.id)).size,Q.length);
  const texts=Q.map(q=>q.q.toLowerCase().trim()); assert.equal(new Set(texts).size,texts.length);
  for(const q of Q){ assert.equal(new Set(q.opts).size,4,q.id); assert.ok(q.exp&&q.exp.length>10,q.id); assert.doesNotMatch(JSON.stringify(q),/[฀-๿]/,q.id); }
});
test('economics macro: numeric answers re-computed',()=>{
  const by=t=>Q.find(q=>q.q.startsWith(t));
  assert.equal(by('C = 600, I = 150').opts[0],'930 billion'); assert.equal(600+150+200+(100-120),930);
  assert.equal(by('A basket costs 400').opts[0],'115'); assert.equal(Math.round(460/400*100),115);
  assert.equal(by('The CPI rises from 110').opts[0],'10%'); assert.equal((121-110)/110*100,10);
  assert.equal(by('Currency 200').opts[0],'M1 = 800; M2 = 3,000'); assert.equal(200+600,800); assert.equal(800+1400+800,3000);
  assert.equal(by('A bank receives new reserves').opts[0],'10,000'); assert.equal(2000/0.2,10000);
  assert.equal(by('A bank has deposits of 800,000').opts[0],'120,000'); assert.equal(200000-0.1*800000,120000);
  assert.equal(by('MPC = 0.6. Government spending rises').opts[0],'75 billion'); assert.ok(Math.abs(30/(1-0.6)-75)<1e-9);
  assert.equal(by('MPC = 0.75. Taxes are cut').opts[0],'60 billion'); assert.ok(Math.abs(20*0.75/0.25-60)<1e-9);
  assert.equal(by('M = 500, V = 4').opts[0],'1,000'); assert.equal(500*4/2,1000);
  assert.equal(by('The money supply grows 8%').opts[0],'5%');
  assert.equal(by('There are 114 million').opts[0],'5%'); assert.equal(6/(114+6)*100,5);
});
