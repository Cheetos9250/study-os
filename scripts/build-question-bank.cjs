#!/usr/bin/env node
/* Question bank for Gemini: every practice question of acc / eco / math, built the same way the course engine builds it
   (scripts/study-course-engine.js), so the ids match the saved answers in study-<course>.
   Sources: D.quiz in data/courses/<course>.js (id = row position), data/courses/acc-extra.js sets (id = pre + n, "hide" left out),
   the course's own MCQ list (scripts/acc-textbook-mcq.js, eco-practice-mcq.js, math-practice-mcq.js; opts[0] is right),
   and the Verified rows of data/quiz.json for that subject (id = "n-" + page id).
   Not included: Fresh problems (random each visit) and written exercises.
   Usage: node scripts/build-question-bank.cjs <out.json>   (the Gemini Worker deploy writes workers/gemini-mcp/bank.json; not committed) */
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const COURSES=[
 {key:'acc',name:'Accounting',subj:'Accounting',data:'data/courses/acc.js',extra:'data/courses/acc-extra.js',mcq:{file:'scripts/acc-textbook-mcq.js',list:'ACC_TB_MCQ'},englishOnly:true},
 {key:'eco',name:'Economics',subj:'Economics',data:'data/courses/eco.js',mcq:{file:'scripts/eco-practice-mcq.js',list:'ECO_PRACTICE_MCQ',cat:['f','Macro · Fiscal Policy']}},
 {key:'math',name:'Math',subj:'Math for Life',data:'data/courses/math.js',mcq:{file:'scripts/math-practice-mcq.js',list:'MATH_PRACTICE_MCQ'}}
];
function courseData(file){const m=/^const D = (\{.*\});\s*$/m.exec(read(file));if(!m)throw Error('no D in '+file);return JSON.parse(m[1]);}
function runScript(file){const ctx={window:{}};ctx.globalThis=ctx.window;vm.runInNewContext(read(file),ctx,{filename:file,timeout:5000});return ctx.window;}
const str=x=>String(x==null?'':x);
function build(){
 const quizRows=(JSON.parse(read('data/quiz.json')).rows)||[];
 const out={built:new Date().toISOString(),courses:{}};
 for(const c of COURSES){
  const D=courseData(c.data),cats=D.cats.map(x=>[str(x[0]),str(x[1])]),qs=[];
  const push=(id,cat,q,opts,right,exp,cs)=>qs.push({id:str(id),cat:str(cat),q:str(q),opts:(opts||[]).map(str),right:Number(right)||0,exp:str(exp),case:str(cs)});
  D.quiz.forEach((q,i)=>push(i,q[0],q[1],q[2],q[3],q[4]));
  let hide=new Set();
  if(c.extra){const X=runScript(c.extra).StudyCourseExtra||{};hide=new Set((X.hide||[]).map(String));
   (X.sets||[]).forEach(s=>s.rows.forEach((q,i)=>push(s.pre+(i+s.from),q[0],q[1],q[2],q[3],q[4],s.case?q[5]:'')));}
  for(let i=qs.length-1;i>=0;i--)if(hide.has(qs[i].id))qs.splice(i,1);
  if(c.mcq){const list=runScript(c.mcq.file)[c.mcq.list]||[];
   if(c.mcq.cat&&list.some(q=>q.cat===c.mcq.cat[0])&&!cats.some(x=>x[0]===c.mcq.cat[0]))cats.push(c.mcq.cat.slice());
   list.forEach(q=>push(q.id,q.cat,q.q,q.opts,0,q.exp,q.case));}
  quizRows.filter(r=>r&&r.Subject===c.subj&&r.Status==='Verified').forEach(r=>{
   const hit=cats.find(x=>x[1]===r.Chapter);if(!hit||!r.Question||!r.Correct)return;
   if(c.englishOnly&&/[฀-๿]/.test([r.Question,r.Correct,r['Wrong 1'],r['Wrong 2'],r['Wrong 3'],r.Explanation].join(' ')))return;
   const opts=[r.Correct,r['Wrong 1'],r['Wrong 2'],r['Wrong 3']].filter(x=>x&&String(x).trim());if(opts.length<2)return;
   const id='n-'+String(r.page_id||r.url||r.Question).split('?')[0].split('/').pop();if(hide.has(id))return;
   push(id,hit[0],r.Question,opts,0,r.Explanation);});
  out.courses[c.key]={name:c.name,cats,questions:qs};
 }
 return out;
}
module.exports={build};
if(require.main===module){const dest=process.argv[2];if(!dest){console.error('usage: build-question-bank.cjs <out.json>');process.exit(2);}
 const b=build();fs.writeFileSync(dest,JSON.stringify(b));
 console.log(Object.entries(b.courses).map(([k,v])=>k+' '+v.questions.length).join(', '));}
