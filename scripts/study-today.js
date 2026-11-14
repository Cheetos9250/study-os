/* Study OS Today: read-only progress summary, exam countdown and daily plan.
   Reads existing course progress; writes only its own settings key. No network writes. */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.StudyToday=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const DAY=86400000,TZ=7*3600000;
 const SETTINGS_KEY='studyos.today.v1';
 const COURSES=Object.freeze([
  {key:'acc',page:'acc.html',mark:'acc-flashcards-v1',name:'บัญชี',full:'Accounting'},
  {key:'eco',page:'eco.html',mark:'econ-flashcards-v1',name:'เศรษฐศาสตร์',full:'Economics'},
  {key:'math',page:'math.html',mark:'math-flashcards-v1',name:'คณิตศาสตร์',full:'Mathematics'}
 ]);
 // Scopes marked unconfirmed are assumptions until the learner edits them.
 const DEFAULT_EXAMS=Object.freeze([
  {id:'acc-quiz-20261116',course:'acc',title:'Quiz บัญชี: Cost flow + Bank reconciliation',date:'2026-11-16',cats:['c6','c8'],confirmed:true},
  {id:'acc-final-20261126',course:'acc',title:'สอบปลายภาค บัญชี',date:'2026-11-26',cats:['c6','c7','c8','c9'],confirmed:false},
  {id:'eco-final-20261127',course:'eco',title:'สอบปลายภาค เศรษฐศาสตร์',date:'2026-11-27',cats:['g','i','b','a','d'],confirmed:false},
  {id:'math-final-20261201',course:'math',title:'สอบปลายภาค คณิตศาสตร์',date:'2026-12-01',cats:['c5','c6','c7'],confirmed:false}
 ]);
 const sod=t=>Math.floor((t+TZ)/DAY)*DAY-TZ;
 function dayKey(t){const d=new Date(sod(t)+TZ);return d.toISOString().slice(0,10);}
 function dateStart(iso){
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso||''));if(!m)return NaN;
  return Date.UTC(+m[1],+m[2]-1,+m[3])-TZ;
 }
 function daysUntil(iso,now){const s=dateStart(iso);return Number.isFinite(s)?Math.round((s-sod(now))/DAY):NaN;}
 function parseCourseData(html){
  const m=/^const D = (\{.*\});\s*$/m.exec(String(html||''));
  if(!m)throw Error('Course data not found');
  const D=JSON.parse(m[1]);
  if(!Array.isArray(D.cats)||!Array.isArray(D.cards)||!Array.isArray(D.quiz))throw Error('Course data incomplete');
  return D;
 }
 function readJSON(raw,fallback){if(typeof raw!=='string'||!raw)return fallback;try{const v=JSON.parse(raw);return v&&typeof v==='object'?v:fallback;}catch{return fallback;}}
 function summarize(D,srsRaw,studyRaw,now){
  const saved=readJSON(srsRaw,{}),srs=saved.s&&typeof saved.s==='object'?saved.s:{},meta=saved.m||{};
  const lim=Number.isFinite(saved.lim)?saved.lim:20,newDone=meta.day===sod(now)?(+meta.newDone||0):0;
  const study=readJSON(studyRaw,{}),ans=study.ans&&typeof study.ans==='object'?study.ans:{};
  const per={};for(const [id,label] of D.cats)per[id]={id,label,cards:0,seen:0,due:0,unseen:0,quiz:0,answered:0,correct:0};
  let due=0,learn=0,seen=0,unseen=0;
  for(const c of D.cards){
   const p=per[c[0]],s=srs[c[4]];if(!p)continue;p.cards++;
   if(s&&typeof s==='object'){p.seen++;seen++;if(Number(s.due)<=now){p.due++;if(s.st==='learn')learn++;else due++;}}
   else{p.unseen++;unseen++;}
  }
  D.quiz.forEach((q,i)=>{const p=per[q[0]];if(!p)return;p.quiz++;const a=ans[i];if(a===undefined||a===null)return;p.answered++;if(a===q[3])p.correct++;});
  return {due,learn,reviewNow:due+learn,newToday:Math.min(unseen,Math.max(0,lim-newDone)),seen,total:D.cards.length,per};
 }
 function accuracy(p){return p.answered?p.correct/p.answered:null;}
 function priority(p){const a=accuracy(p),unseen=p.cards?p.unseen/p.cards:0;return (a===null?1:1-a)+unseen*0.5;}
 function reason(p){
  const a=accuracy(p),bits=[];
  if(a===null)bits.push(p.quiz?'ยังไม่เคยทำ Practice':'ไม่มีโจทย์ Practice ในบทนี้');
  else bits.push('Practice ถูก '+Math.round(a*100)+'% ('+p.correct+'/'+p.answered+')');
  if(p.unseen)bits.push('ยังไม่เปิดการ์ด '+p.unseen+' ใบ');
  return bits.join(' · ');
 }
 function normalizeExams(list){
  if(!Array.isArray(list))return DEFAULT_EXAMS.map(e=>({...e,cats:[...e.cats]}));
  return list.filter(e=>e&&typeof e==='object'&&typeof e.id==='string'&&COURSES.some(c=>c.key===e.course)&&Number.isFinite(dateStart(e.date)))
   .map(e=>({id:e.id,course:e.course,title:String(e.title||'สอบ').slice(0,80),date:e.date,cats:Array.isArray(e.cats)?e.cats.filter(x=>typeof x==='string'):[],confirmed:!!e.confirmed}));
 }
 function loadSettings(raw){
  const s=readJSON(raw,{});
  return {exams:normalizeExams(s.exams),done:s.done&&typeof s.done==='object'?s.done:{},tasks:s.tasks&&typeof s.tasks==='object'?s.tasks:{}};
 }
 function buildPlan(exams,summaries,settings,now){
  const today=dayKey(now),tasks=[];
  const reviewNow=Object.values(summaries).reduce((n,s)=>n+(s?s.reviewNow:0),0);
  if(reviewNow)tasks.push({id:'review',kind:'review',title:'ทวนการ์ดที่ครบกำหนด',detail:reviewNow+' ใบ จากทุกวิชา — ทำก่อนเรียนเนื้อหาใหม่'});
  const upcoming=exams.map(e=>({...e,days:daysUntil(e.date,now)})).filter(e=>e.days>=0).sort((a,b)=>a.days-b.days||a.date.localeCompare(b.date));
  upcoming.forEach((e,i)=>{
   const sum=summaries[e.course];if(!sum)return;if(i>0&&(e.days>14||upcoming[0].days<=3))return; // focus on an imminent exam
   const done=settings.done[e.id]||{};
   if(e.days===0){tasks.push({id:e.id+':day',kind:'exam',examId:e.id,course:e.course,title:'วันนี้สอบ: '+e.title,detail:'ทวนสรุปสั้น ๆ และข้อที่เคยตอบผิด ไม่ต้องเริ่มเนื้อหาใหม่'});return;}
   const scope=e.cats.map(id=>sum.per[id]).filter(Boolean);
   const remaining=scope.filter(p=>!done[p.id]||done[p.id]===today).sort((a,b)=>priority(b)-priority(a));
   if(e.days===1||!remaining.length){
    tasks.push({id:e.id+':final',kind:'final',examId:e.id,course:e.course,title:'ทวนรวมก่อนสอบ: '+e.title,detail:'เปิดแท็บ Practice เลือก “เฉพาะข้อที่ผิด” ของทุกบทในขอบเขต แล้วทวน Summary บทที่ยังไม่มั่นใจ'});return;
   }
   const studyDays=Math.max(1,e.days-1);
   let k=Math.ceil(remaining.length/studyDays);if(i>0)k=Math.min(k,1);
   remaining.slice(0,k).forEach(p=>tasks.push({id:e.id+':'+p.id,kind:'chapter',examId:e.id,course:e.course,cat:p.id,
    title:p.label,exam:e.title,detail:'อ่าน Summary → การ์ดใหม่ของบท → Practice '+(p.quiz?p.quiz+' ข้อ':'(ไม่มีโจทย์)'),reason:reason(p),done:done[p.id]===today}));
  });
  return {today,tasks,upcoming};
 }
 function weakSpots(summaries,limit){
  const out=[];
  for(const c of COURSES){const s=summaries[c.key];if(!s)continue;
   for(const p of Object.values(s.per)){const a=accuracy(p);if(a!==null&&p.answered>=2&&a<0.7)out.push({course:c.key,courseName:c.name,label:p.label,acc:a,correct:p.correct,answered:p.answered});}}
  return out.sort((a,b)=>a.acc-b.acc||b.answered-a.answered).slice(0,limit||5);
 }
 function markChapter(settings,task,doneFlag,now){
  const next={exams:settings.exams,done:{...settings.done},tasks:{...settings.tasks}};
  if(task.kind==='chapter'){const d={...(next.done[task.examId]||{})};if(doneFlag)d[task.cat]=dayKey(now);else delete d[task.cat];next.done[task.examId]=d;}
  else{const t={...(next.tasks[dayKey(now)]||{})};if(doneFlag)t[task.id]=true;else delete t[task.id];next.tasks={[dayKey(now)]:t};}
  return next;
 }
 return {SETTINGS_KEY,COURSES,DEFAULT_EXAMS,sod,dayKey,dateStart,daysUntil,parseCourseData,summarize,accuracy,priority,normalizeExams,loadSettings,buildPlan,weakSpots,markChapter};
});
