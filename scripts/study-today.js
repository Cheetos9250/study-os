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
 // Vocabulary decks (no exams or chapters plan); used for due counts only.
 const LANGS=Object.freeze([
  {key:'eng',page:'eng.html',data:'data/courses/eng.js',app:'vocabloom/?lang=en',mark:'eng-vocab-v1',name:'English'},
  {key:'zh',page:'zh.html',data:'data/courses/zh.js',app:'vocabloom/?lang=zh',mark:'zh-vocab-v1',name:'Chinese'}
 ]);
 const COURSES=Object.freeze([
  {key:'acc',page:'acc.html',data:'data/courses/acc.js',mark:'acc-flashcards-v1',name:'Accounting',full:'ACC'},
  {key:'eco',page:'eco.html',data:'data/courses/eco.js',mark:'econ-flashcards-v1',name:'Economics',full:'ECO'},
  {key:'math',page:'math.html',data:'data/courses/math.js',mark:'math-flashcards-v1',name:'Math',full:'MATH'}
 ]);
 // Scopes marked unconfirmed are assumptions until the learner edits them.
 const DEFAULT_EXAMS=Object.freeze([
  {id:'acc-quiz-20261116',course:'acc',title:'Accounting quiz',date:'2026-11-16',cats:['c6','c8'],confirmed:true},
  {id:'acc-final-20261126',course:'acc',title:'Accounting final',date:'2026-11-26',cats:['c5','c6','c7','c8','c9'],confirmed:true},
  {id:'gc-video-20261120',course:'other',title:'Global Citizenship: group video due',date:'2026-11-20',cats:[],confirmed:true},
  {id:'eco-final-20261127',course:'eco',title:'Economics final',date:'2026-11-27',cats:['g','i','b','a','d','m','f','n'],confirmed:true},
  {id:'math-final-20261201',course:'math',title:'Math final',date:'2026-12-01',cats:['c5','c6','c7'],confirmed:false}
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
  if(a===null)bits.push(p.quiz?'Not practiced':'No questions');
  else bits.push(Math.round(a*100)+'% correct');
  if(p.unseen)bits.push(p.unseen+' new cards');
  return bits.join(' · ');
 }
 // Default exam titles were Thai before the English UI; rename only exact old defaults.
 const OLD_TITLES={'Quiz \u0e1a\u0e31\u0e0d\u0e0a\u0e35: Cost flow + Bank reconciliation':'Accounting quiz','\u0e2a\u0e2d\u0e1a\u0e1b\u0e25\u0e32\u0e22\u0e20\u0e32\u0e04 \u0e1a\u0e31\u0e0d\u0e0a\u0e35':'Accounting final','\u0e2a\u0e2d\u0e1a\u0e1b\u0e25\u0e32\u0e22\u0e20\u0e32\u0e04 \u0e40\u0e28\u0e23\u0e29\u0e10\u0e28\u0e32\u0e2a\u0e15\u0e23\u0e4c':'Economics final','\u0e2a\u0e2d\u0e1a\u0e1b\u0e25\u0e32\u0e22\u0e20\u0e32\u0e04 \u0e04\u0e13\u0e34\u0e15\u0e28\u0e32\u0e2a\u0e15\u0e23\u0e4c':'Math final'};
 // The 2026 syllabus puts Ch5–9 after the midterm: upgrade the old untouched default (Ch6–9, unconfirmed) only.
 function upgradeDefault(e){
  if(e.id==='acc-final-20261126'&&!e.confirmed&&e.cats.join()==='c6,c7,c8,c9')return {...e,cats:['c5','c6','c7','c8','c9'],confirmed:true};
  // Economics outline (16 Nov 2026): final covers the post-midterm macro topics already in the default scope.
  // Money, fiscal and monetary policy chapters added 18 Nov 2026 (in the final per the outline): add them to the untouched scope.
  if(e.id==='eco-final-20261127'&&e.cats.join()==='g,i,b,a,d')return {...e,cats:['g','i','b','a','d','m','f','n'],confirmed:true};
  return e;
 }
 function normalizeExams(list){
  if(!Array.isArray(list))return DEFAULT_EXAMS.map(e=>({...e,cats:[...e.cats]}));
  return list.filter(e=>e&&typeof e==='object'&&typeof e.id==='string'&&(e.course==='other'||COURSES.some(c=>c.key===e.course)||LANGS.some(c=>c.key===e.course))&&Number.isFinite(dateStart(e.date)))
   .map(e=>({id:e.id,course:e.course,title:String(OLD_TITLES[e.title]||e.title||'Exam').slice(0,80),date:e.date,cats:Array.isArray(e.cats)?e.cats.filter(x=>typeof x==='string'):[],confirmed:!!e.confirmed}))
   .map(upgradeDefault);
 }
 // Weekly timetable: [{id,day:0-6 (Sun=0),start:'HH:MM',end:'HH:MM',name,code,course,skip}]
 const HHMM=/^([01]\d|2[0-3]):[0-5]\d$/;
 function normalizeTimetable(list){
  if(!Array.isArray(list))return [];
  return list.filter(x=>x&&typeof x==='object'&&Number.isInteger(x.day)&&x.day>=0&&x.day<=6&&HHMM.test(x.start)&&HHMM.test(x.end)&&x.start<x.end)
   .slice(0,60).map((x,i)=>({id:typeof x.id==='string'&&x.id?x.id.slice(0,40):'c'+i,day:x.day,start:x.start,end:x.end,
    name:String(x.name||'Class').slice(0,40),code:String(x.code||'').slice(0,16),
    course:[...COURSES,...LANGS].some(c=>c.key===x.course)?x.course:'',skip:!!x.skip}))
   .sort((a,b)=>a.day-b.day||a.start.localeCompare(b.start));
 }
 function classesOn(timetable,iso){const t=dateStart(iso);if(!Number.isFinite(t))return [];const dow=new Date(t+7*3600000).getUTCDay();return normalizeTimetable(timetable).filter(x=>x.day===dow);}
 // Defaults that existed before seenDefaults was tracked; later defaults are added once to saved schedules.
 const FIRST_DEFAULTS=['acc-quiz-20261116','acc-final-20261126','eco-final-20261127','math-final-20261201'];
 function loadSettings(raw){
  const s=readJSON(raw,{});
  const exams=normalizeExams(s.exams);
  const seen=Array.isArray(s.seenDefaults)?s.seenDefaults.filter(x=>typeof x==='string'):FIRST_DEFAULTS;
  if(Array.isArray(s.exams))for(const d of DEFAULT_EXAMS)if(!seen.includes(d.id)&&!exams.some(e=>e.id===d.id))exams.push({...d,cats:[...d.cats]});
  const seenDefaults=[...new Set([...seen,...DEFAULT_EXAMS.map(d=>d.id)])];
  return {exams,done:s.done&&typeof s.done==='object'?s.done:{},tasks:s.tasks&&typeof s.tasks==='object'?s.tasks:{},timetable:normalizeTimetable(s.timetable),seenDefaults};
 }
 /* Work back from the exam date: questions still to answer plus wrong ones to redo, spread over the study days left (the last day is final review). */
 function runway(exams,summaries,now){
  const out=[];
  for(const e of exams){
   const d=daysUntil(e.date,now),sum=summaries&&summaries[e.course];
   if(!(d>0)||!sum||!Array.isArray(e.cats)||!e.cats.length)continue;
   let fresh=0,wrong=0;
   for(const id of e.cats){const p=sum.per&&sum.per[id];if(!p)continue;fresh+=Math.max(0,p.quiz-p.answered);wrong+=Math.max(0,p.answered-p.correct);}
   const left=fresh+wrong,studyDays=Math.max(1,d-1);
   out.push({examId:e.id,course:e.course,title:e.title,days:d,fresh,wrong,left,perDay:left?Math.ceil(left/studyDays):0});
  }
  return out.sort((a,b)=>a.days-b.days);
 }
 function buildPlan(exams,summaries,settings,now){
  const today=dayKey(now),tasks=[];
  const reviewNow=Object.values(summaries).reduce((n,s)=>n+(s?s.reviewNow:0),0);
  if(reviewNow)tasks.push({id:'review',kind:'review',title:'Review due cards',detail:reviewNow+' cards'});
  const upcoming=exams.map(e=>({...e,days:daysUntil(e.date,now)})).filter(e=>e.days>=0).sort((a,b)=>a.days-b.days||a.date.localeCompare(b.date));
  upcoming.forEach((e,i)=>{
   const sum=summaries[e.course];if(!sum)return;if(i>0&&(e.days>14||(upcoming[0].days<=3&&upcoming[0].days>0)))return; // focus on an imminent exam (on exam day, keep the next ones moving)
   const done=settings.done[e.id]||{};
   if(e.days===0){tasks.push({id:e.id+':day',kind:'exam',examId:e.id,course:e.course,title:'Exam today: '+e.title,detail:'Quick summary + missed questions'});return;}
   const scope=e.cats.map(id=>sum.per[id]).filter(Boolean);
   /* exam mode (last 3 days): missed questions and the weakest chapters of this exam come first */
   if(e.days<=3){
    const missed=scope.reduce((n,p)=>n+Math.max(0,p.answered-p.correct),0),cats=scope.filter(p=>p.answered>p.correct).map(p=>p.id);
    if(missed)tasks.push({id:e.id+':missed',kind:'missed',examId:e.id,course:e.course,cats,title:'Redo missed questions: '+e.title,detail:missed+' missed in '+cats.length+' chapter'+(cats.length>1?'s':'')+' · exam in '+e.days+' day'+(e.days>1?'s':''),exam:e.title,days:e.days});
    scope.filter(p=>{const a=accuracy(p);return a!==null&&p.answered>=2&&a<0.7;}).sort((a,b)=>accuracy(a)-accuracy(b)).slice(0,2)
     .forEach(p=>tasks.push({id:e.id+':weak:'+p.id,kind:'weak',examId:e.id,course:e.course,cat:p.id,title:'Weak chapter: '+p.label,detail:Math.round(accuracy(p)*100)+'% correct · practise until it is above 70%',exam:e.title,days:e.days}));
   }
   const remaining=scope.filter(p=>!done[p.id]||done[p.id]===today).sort((a,b)=>priority(b)-priority(a));
   if(e.days===1||!remaining.length){
    tasks.push({id:e.id+':final',kind:'final',examId:e.id,course:e.course,cats:e.cats.slice(),title:'Final review: '+e.title,detail:'Summaries + practice in all exam chapters'});return;
   }
   const studyDays=Math.max(1,e.days-1);
   let k=Math.ceil(remaining.length/studyDays);if(i>0)k=Math.min(k,1);
   remaining.slice(0,k).forEach(p=>tasks.push({id:e.id+':'+p.id,kind:'chapter',examId:e.id,course:e.course,cat:p.id,
    title:p.label,exam:e.title,days:e.days,detail:'Summary → Cards → Practice',reason:reason(p),done:done[p.id]===today}));
  });
  const rw=runway(exams,summaries,now);
  tasks.forEach(t=>{if(t.kind==='chapter'){const r=rw.find(x=>x.examId===t.examId);if(r&&r.perDay)t.pace=r.perDay;}});
  return {today,tasks,upcoming,runway:rw};
 }
 function weakSpots(summaries,limit){
  const out=[];
  for(const c of COURSES){const s=summaries[c.key];if(!s)continue;
   for(const p of Object.values(s.per)){const a=accuracy(p);if(a!==null&&p.answered>=2&&a<0.7)out.push({course:c.key,courseName:c.name,cat:p.id,label:p.label,acc:a,correct:p.correct,answered:p.answered});}}
  return out.sort((a,b)=>a.acc-b.acc||b.answered-a.answered).slice(0,limit||5);
 }
 function markChapter(settings,task,doneFlag,now){
  const next={...settings,exams:settings.exams,done:{...settings.done},tasks:{...settings.tasks}};
  if(task.kind==='chapter'){const d={...(next.done[task.examId]||{})};if(doneFlag)d[task.cat]=dayKey(now);else delete d[task.cat];next.done[task.examId]=d;}
  else{const t={...(next.tasks[dayKey(now)]||{})};if(doneFlag)t[task.id]=true;else delete t[task.id];next.tasks={[dayKey(now)]:t};}
  return next;
 }
 return {SETTINGS_KEY,COURSES,LANGS,normalizeTimetable,classesOn,DEFAULT_EXAMS,sod,dayKey,dateStart,daysUntil,parseCourseData,summarize,accuracy,priority,normalizeExams,loadSettings,runway,buildPlan,weakSpots,markChapter};
});
