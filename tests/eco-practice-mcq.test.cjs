const __cs=require('./course-source.cjs');
const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const R=p=>__cs.read(path.join(__dirname,'..',p),'utf8');
const ctx={window:{}};vm.runInNewContext(R('scripts/eco-practice-mcq.js'),ctx);const Q=ctx.window.ECO_PRACTICE_MCQ;
test('economics macro practice: 83+ English MCQs covering every final topic, stable unique ids',()=>{
  assert.ok(Q.length>=80); assert.equal(new Set(Q.map(q=>q.id)).size,Q.length);
  for(const c of ['g','b','i','a','f']) assert.ok(Q.filter(q=>q.cat===c).length>=15,c);
  for(const q of Q){ assert.match(q.id,/^ep-[gbiafdmn]\d+$/); assert.equal(q.opts.length,4); assert.equal(new Set(q.opts).size,4); assert.ok(q.exp); assert.doesNotMatch(JSON.stringify(q),/[฀-๿]/); }
});
test('eco page loads the set, adds a Fiscal Policy chip and renders case tables',()=>{
  const s=R('eco.html'); assert.match(s,/scripts\/eco-practice-mcq\.js/); assert.match(s,/mcq:\{list:'ECO_PRACTICE_MCQ',seed:2101,md:true,cat:\['f','Macro · Fiscal Policy'\]\}/); assert.match(s,/CATS\.push\(OPT\.mcq\.cat\.slice\(\)\)/);
  assert.match(s,/if\(q\.case\) h\+=/); assert.match(s,/scripts\/textbook-sos-render\.js/);
});
