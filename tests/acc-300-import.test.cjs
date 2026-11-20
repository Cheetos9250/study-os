/* 300-question practice exams (owner, 20 Nov 2026): set ps-, topic filter and the Ch5-9 bilingual summary. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.join(__dirname,'..');
const rows=[];
for(const ch of [5,6,7,8,9,10]){ for(const l of fs.readFileSync(path.join(ROOT,'data/acc-questions/c'+ch+'.json'),'utf8').split('\n')){ const s=l.trim().replace(/,$/,''); if(s.startsWith('{'))rows.push(JSON.parse(s)); } }
const ps=rows.filter(r=>/^ps-\d+$/.test(r.id));
const topics=require('../scripts/acc-topics.js');
test('ps- set: 278 questions, contiguous ids, 4 distinct options, clean text',()=>{
  assert.equal(ps.length,278);
  const ids=ps.map(r=>+r.id.slice(3)).sort((a,b)=>a-b); ids.forEach((n,i)=>assert.equal(n,i+1));
  for(const r of ps){ const [cat,q,o,right,exp]=r.row; assert.match(cat,/^c[5-9]$/); assert.equal(o.length,4,r.id); assert.equal(new Set(o).size,4,r.id); assert.equal(right,0);
    for(const s of [q,exp,...o]){ assert.doesNotMatch(s,/\\[a-zA-Z]|\$\$|`|Question \d+/,r.id); }
    assert.ok(exp.length>15,r.id); }
});
test('ps- set: fixed questions carry the corrected numbers',()=>{
  const by=f=>ps.filter(r=>f(r.row));
  const gp=by(r=>/Company P bought merchandise for \$6,000/.test(r[1])); assert.equal(gp.length,1); assert.equal(gp[0].row[2][0],'$3,026.40');
  const rec=by(r=>/Horizon Co\./.test(r[1])); assert.equal(rec.length,1); assert.match(rec[0].row[1],/\$30,310/); assert.equal(rec[0].row[2][0],'$31,680');
  const lifo=by(r=>/LIFO Perpetual\*\* vs/.test(r[1])||/LIFO Perpetual vs/.test(r[1])); assert.equal(lifo.length,1); assert.equal(lifo[0].row[2][0],'$160 higher under LIFO Perpetual');
  assert.equal(by(r=>/wait: let/.test(r[2].join(' '))).length,0);
});
test('ps- set: questions that used "Question N" now carry the earlier facts as case text',()=>{
  const dep=ps.filter(r=>/earlier problem/.test(r.row[1])); assert.ok(dep.length>=15);
  for(const r of dep) assert.ok(r.row[5]&&r.row[5].startsWith('Earlier problem: '),r.id);
});
test('set is registered once with its own seed',()=>{
  const S=JSON.parse(fs.readFileSync(path.join(ROOT,'data/acc-questions/_sets.json'),'utf8')).sets.filter(s=>s.pre==='ps-');
  assert.deepEqual(S.map(s=>[s.from,s.seed,s.count]),[[1,1701,278]]);
  assert.equal(S[0].case,true);
});
test('topic filter: at least 95% of Ch5-9 practice questions get a topic, every topic belongs to its chapter',()=>{
  let n=0,other=0;
  for(const r of rows){ const [cat,q,,,exp,cs]=r.row; if(r.hide||!topics.has(cat))continue; n++; const t=topics.of({cat,q,exp,case:cs}); assert.ok(topics.topics(cat).includes(t),r.id); if(t==='Other')other++; }
  assert.ok(n>500); assert.ok(other/n<0.05,'other share '+other/n);
  assert.equal(topics.topics('c8').length,new Set(topics.topics('c8')).size); assert.equal(topics.of({cat:'c10',q:'x'}),''); assert.equal(topics.has('c1'),false);
});
test('engine and acc.html wire the topic filter; other courses stay unchanged',()=>{
  const e=fs.readFileSync(path.join(ROOT,'scripts/study-course-engine.js'),'utf8'),h=fs.readFileSync(path.join(ROOT,'acc.html'),'utf8');
  assert.match(e,/data-qtopic/); assert.match(e,/topicOn=\(\)=>!!window\.StudyAccTopics&&qcats\.size===1/);
  assert.match(e,/\(!qtopic\|\|topicOf\(q\)===qtopic\)/); assert.match(h,/acc-topics\.js\?v=1/);
  for(const c of ['eco','math','eng','zh']) assert.doesNotMatch(fs.readFileSync(path.join(ROOT,c+'.html'),'utf8'),/acc-topics/);
  assert.doesNotMatch(e,/localStorage\.setItem\([^)]*qtopic/);
});
test('summary: 21 new Ch5-9 sections after the short ones, plain text, two columns',()=>{
  const t=fs.readFileSync(path.join(ROOT,'data/courses/acc.js'),'utf8').split('\n'),D=JSON.parse(t.find(l=>l.startsWith('const D = ')).slice(10).replace(/;\s*$/,''));
  const added=D.sum.filter(s=>s.head&&s.head[0]==='Topic'); assert.equal(added.length,21);
  for(const c of ['c5','c6','c7','c8','c9']){ const idx=D.sum.map((s,i)=>s.cat===c?i:-1).filter(i=>i>=0); const last=idx[idx.length-1]; assert.equal(D.sum[last].head[0],'Topic',c); assert.ok(D.sum[idx[0]].head[0]!=='Topic',c); }
  for(const s of added){ assert.ok(s.rows.length>=2); for(const r of s.rows){ assert.equal(r.length,2); assert.doesNotMatch(r.join(' '),/\\text|\$\$|\\frac|<br>/); } }
  assert.equal(D.sum.length,37);
});
