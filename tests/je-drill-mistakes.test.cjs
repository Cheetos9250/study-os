'use strict';
/* JE Drill, Ask AI why and the Mistakes page (owner ideas, 18 Nov 2026). */
const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'),rd=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const J=require('../scripts/study-je-drill.js'),E=require('../scripts/je-grid.js');

test('every drill template makes a balanced entry with chart accounts that the grid accepts',()=>{
 const chart=new Set(E.accounts([]).map(a=>E.norm(a.name)));
 assert.ok(J.TEMPLATES.length>=25);
 assert.equal(new Set(J.TEMPLATES.map(t=>t.id)).size,J.TEMPLATES.length);
 for(const t of J.TEMPLATES){assert.ok(J.CHAPTERS.some(c=>c[0]===t.ch),t.id);
  for(let s=1;s<=300;s++){const d=J.make(t.id,s*104729);
   const dr=d.je.reduce((a,l)=>a+l.dr,0),cr=d.je.reduce((a,l)=>a+l.cr,0);
   assert.ok(Math.abs(dr-cr)<0.001,t.id+' balanced');
   for(const l of d.je){assert.ok(l.dr>0!==l.cr>0,t.id+' one side');assert.ok(chart.has(E.norm(l.acct)),t.id+' '+l.acct);}
   assert.ok(!/NaN|undefined|-\$/.test(d.text),t.id+' text '+d.text);
   const rows=d.je.map(l=>['',l.acct,l.dr?String(l.dr):'',l.cr?String(l.cr):'']);
   assert.ok(E.check(rows,d.je).all,t.id+' own answer passes');}}
});

test('a drill is the same for the same seed and worked examples are right',()=>{
 assert.deepEqual(J.make('fifo',42),J.make('fifo',42));
 const d=J.make('fifo',9),m=d.text.match(/(\d+) units at \$(\d+)\. Purchase: (\d+) units at \$(\d+)\. Sold (\d+) units/).slice(1).map(Number);
 const cogs=m[0]*m[1]+(m[4]-m[0])*m[3];
 assert.equal(d.je.find(l=>l.acct==='Cost of Goods Sold').dr,cogs);
 const n=J.make('nrpaid',7),p=n.text.match(/(\d+)-day, (\d+)% note receivable for \$([\d,]+)/);
 const prin=Number(p[3].replace(/,/g,'')),i=Math.round(prin*Number(p[2])/100*Number(p[1])/360*100)/100;
 assert.equal(n.je.find(l=>l.acct==='Interest Revenue').cr,i);
 const a=J.make('bdage',3),need=Number(a.text.match(/shows \$([\d,]+)/)[1].replace(/,/g,'')),bal=Number(a.text.match(/has a \$([\d,]+)/)[1].replace(/,/g,''));
 const adj=a.je[0].dr;assert.equal(adj,/debit balance/.test(a.text)?need+bal:need-bal);
});

test('score record: normalize drops bad data, record counts, weak types come back more often',()=>{
 assert.deepEqual(J.normalize({days:{'2026-11-18':{a:2,c:3},'x':{a:1,c:0}},tpl:{fifo:[2,1],'BAD!':[1,1],lcm:[1,2]}}),{days:{},tpl:{fifo:[2,1]}});
 let st=J.record({},'fifo',false,'2026-11-18');st=J.record(st,'fifo',true,'2026-11-18');st=J.record(st,'lcm',true,'2026-11-18');
 assert.deepEqual(st.days['2026-11-18'],{a:3,c:2});assert.deepEqual(st.tpl.fifo,[2,1]);
 assert.equal(J.weight(st,'fifo'),4);assert.equal(J.weight(st,'lcm'),1);assert.equal(J.weight(st,'shrink'),3);
 assert.deepEqual(J.weak(st,3).map(w=>w.id),['fifo']);
 const r=J.rng(1);for(let k=0;k<50;k++)assert.equal(J.choose(st,[6],r).ch,6);
 assert.notEqual(J.choose(st,[],J.rng(5),'fifo').id,'fifo');
 const p=J.askPrompt(J.make('pcset',1),[['','Cash','200','']]);assert.match(p,/My entry:\n- Cash Dr 200/);assert.match(p,/Correct entry:\n- Petty Cash Dr/);
});

test('jedrill key is backed up, labelled and validated on restore',()=>{
 const B=require('../scripts/study-progress-backup.js');assert.ok(B.keys.includes('studyos.jedrill.v1'));
 assert.equal(B.labelForKey('studyos.jedrill.v1'),'JE Drill score');
 assert.match(rd('progress-restore.html'),/studyos\.jedrill\.v1"\) return "JE Drill score"/);
 const R=require('../scripts/study-progress-restore.js'),ORIGIN='https://cheetos9250.github.io';
 const snap=raw=>B.createSnapshot({getItem:k=>k==='studyos.jedrill.v1'?raw:null},ORIGIN,new Date('2026-11-18T12:00:00Z'));
 const mem=()=>{const m={};return {getItem:k=>k in m?m[k]:null,setItem:(k,v)=>{m[k]=String(v);},removeItem:k=>{delete m[k];}};};
 const ok=JSON.stringify({days:{'2026-11-18':{a:3,c:2}},tpl:{fifo:[2,1]}});
 const s1=mem();assert.deepEqual(R.restoreMissing(s1,snap(ok),ORIGIN),{restored:1,alreadyPresent:0});assert.equal(s1.getItem('studyos.jedrill.v1'),ok);
 for(const bad of [{days:{'2026-11-18':{a:1,c:2}}},{days:{},tpl:{fifo:[1,2]}},{tpl:{}}])
  assert.throws(()=>R.restoreMissing(mem(),snap(JSON.stringify(bad)),ORIGIN));
});

test('JE Drill page writes only its own key; Mistakes page writes nothing',()=>{
 const jd=rd('je-drill.html'),mn=rd('mistakes.html');
 assert.match(jd,/scripts\/je-grid\.js\?v=\d+/);assert.match(jd,/scripts\/study-je-drill\.js\?v=1/);
 assert.deepEqual([...jd.matchAll(/localStorage\.setItem\(([^,]+),/g)].map(m=>m[1]),['J.KEY']);
 assert.doesNotMatch(mn,/setItem|removeItem/);
 assert.match(mn,/\?tab=prac&q='\+m\.i/);assert.match(mn,/&missed=1/);assert.match(mn,/cram=1/);
 const p=rd('practice.html');assert.match(p,/href="je-drill\.html"/);assert.match(p,/href="mistakes\.html"/);
 const sw=rd('sw.js');assert.match(sw,/'je-drill\.html'/);assert.match(sw,/'mistakes\.html'/);
});

test('Ask AI why links on wrong answers: course engine, Cram Mode, mock exam, Mistakes',()=>{
 const en=rd('scripts/study-course-engine.js');
 assert.match(en,/\(ok\?'':askAI\(q,ch\)\)/);assert.match(en,/askAI\(q,wrong\?mine:undefined\)/);
 assert.match(en,/href="tutor\.html\?course='\+encodeURIComponent\(D\.key\)/);
 for(const f of ['acc','eco','math','eng','zh'])assert.match(rd(f+'.html'),/study-course-engine\.js\?v=12/);
 assert.match(rd('mock.html'),/Ask AI why<\/a>/);assert.match(rd('mistakes.html'),/Ask AI why<\/a>/);
 /* the prompt is built from the question data, never sends anything by itself */
 const fn=en.match(/function askPrompt\(q,mine\)\{[\s\S]*?; \}\n/)[0]+'return askPrompt;';
 const askPrompt=new Function(fn)();
 const q={q:'What is **2+2**?',opts:['3','4','5'],right:1};
 const t=askPrompt(q,2);assert.match(t,/What is 2\+2\?/);assert.match(t,/My answer: C\) 5/);assert.match(t,/Correct answer: B\) 4/);assert.match(t,/why mine is wrong/);
 assert.doesNotMatch(askPrompt(q,undefined),/My answer/);
});
