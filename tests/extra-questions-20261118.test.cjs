/* Extra questions (18 Nov 2026) so each exam chapter can have 3 sets: English, 4 distinct options, explanation, unique ids. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8'),ctx={window:{}};
vm.runInNewContext(R('scripts/eco-practice-mcq.js'),ctx);vm.runInNewContext(R('scripts/math-practice-mcq.js'),ctx);vm.runInNewContext(R('data/courses/acc-extra.js'),ctx);
const E=ctx.window.ECO_PRACTICE_MCQ,M=ctx.window.MATH_PRACTICE_MCQ,X=ctx.window.StudyCourseExtra;
const ok=(q,opts,exp)=>{assert.equal(opts.length,4,q);assert.equal(new Set(opts).size,4,q);assert.ok(exp,q);assert.doesNotMatch(q+opts.join('')+exp,/[฀-๿]/,q);};
test('economics: growth, money & banking, monetary policy now have 20+ practice questions each',()=>{
  const n=c=>E.filter(q=>q.cat===c).length;assert.ok(n('d')>=20&&n('m')>=25&&n('n')>=26,JSON.stringify({d:n('d'),m:n('m'),n:n('n')}));
  assert.equal(new Set(E.map(q=>q.id)).size,E.length);E.forEach(q=>ok(q.q,q.opts,q.exp));
  const qs=E.map(q=>q.q.toLowerCase());assert.equal(new Set(qs).size,qs.length,'no repeated question text');
});
test('accounting Ch7 and Ch9 extra sets and math Ch6',()=>{
  for(const [pre,cat] of [['x7-','c7'],['x9-','c9']]){const s=X.sets.find(x=>x.pre===pre);assert.equal(s.rows.length,10);s.rows.forEach(r=>{assert.equal(r[0],cat);assert.equal(r[3],0);ok(r[1],r[2],r[4]);});}
  const c6=M.filter(q=>q.cat==='c6');assert.ok(c6.length>=20);assert.equal(new Set(M.map(q=>q.id)).size,M.length);c6.forEach(q=>assert.equal(q.opts.length,4));
});
test('number checks in the new questions',()=>{
  const find=t=>E.find(q=>q.q.startsWith(t))||X.sets.flatMap(s=>s.rows.map(r=>({q:r[1],opts:r[2]}))).find(q=>q.q.startsWith(t));
  assert.equal(find('If the reserve ratio is 20%').opts[0],'5');
  assert.equal(find('With an MPC of 0.75').opts[0],'400 million');
  assert.equal(find('If the CPI rises from 120 to 126').opts[0],'5%');
  assert.equal(find('A 12,000, 6%, 90-day note').opts[0],String(12000*0.06*90/360));
  assert.equal(find('The maturity value of a 10,000, 9%, 60-day note').opts[0],(10000+10000*0.09*60/360).toLocaleString('en-US'));
});
