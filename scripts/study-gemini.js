/* Study OS → Gemini: builds a Markdown summary of study progress to paste into Gemini (or any AI chat).
   Pure and read-only: the page passes in course data and the raw localStorage values. Nothing is sent anywhere. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.StudyGemini=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const DAY=864e5,TZ=7*3600000,L='ABCDEFGH';
 const SITE='https://cheetos9250.github.io/study-os/';
 const clean=(t,n)=>{const s=String(t==null?'':t).replace(/\*\*/g,'').replace(/\s+/g,' ').trim();return n&&s.length>n?s.slice(0,n-1)+'…':s;};
 const cell=t=>clean(t).replace(/\|/g,'/');
 const parse=raw=>{if(raw&&typeof raw==='object')return raw;try{const v=JSON.parse(raw||'null');return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch(e){return {};}};
 const stamp=t=>new Date(t+TZ).toISOString().slice(0,16).replace('T',' ');
 const sod=t=>Math.floor((t+TZ)/DAY)*DAY-TZ;
 function daysUntil(iso,now){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso||''));if(!m)return NaN;return Math.round((Date.UTC(+m[1],+m[2]-1,+m[3])-TZ-sod(now))/DAY);}
 /* per course: answered/right per chapter and the questions wrong now (newest first); answers before a reset are ignored */
 function courseStats(D,studyRaw){
  const st=parse(studyRaw),ans=st.ans||{},ats=st.ats||{},rst=Number(st.rst)||0,per={},wrong=[];
  for(const [id,label] of (D&&D.cats)||[])per[id]={id,label:String(label),quiz:0,answered:0,correct:0};
  ((D&&D.quiz)||[]).forEach((q,i)=>{const p=per[q[0]];if(!p)return;p.quiz++;
   const a=ans[i];if(a===undefined||a===null)return;const t=Number(ats[i])||0;if(rst&&t&&t<rst)return;
   p.answered++;if(a===q[3])p.correct++;else wrong.push({i,q,a,t,label:p.label});});
  wrong.sort((x,y)=>y.t-x.t);
  const chapters=Object.values(per).filter(p=>p.quiz>0).map(p=>Object.assign(p,{pct:p.answered?Math.round(p.correct/p.answered*100):null}));
  const total=chapters.reduce((n,p)=>n+p.quiz,0),answered=chapters.reduce((n,p)=>n+p.answered,0),correct=chapters.reduce((n,p)=>n+p.correct,0);
  return {chapters,total,answered,correct,pct:answered?Math.round(correct/answered*100):null,wrong};
 }
 /* input: {now, courses:[{key,name,D,study}], exams:[{course,title,date,cats}], wrongPerCourse, goal} */
 function buildContext(o){
  const now=Number(o&&o.now)||Date.now(),courses=(o&&o.courses)||[],wrongN=Math.max(0,Math.min(50,Number(o&&o.wrongPerCourse)||0));
  const labels={};courses.forEach(c=>{labels[c.key]={};for(const [id,l] of (c.D&&c.D.cats)||[])labels[c.key][id]=String(l);});
  const out=['# My Study OS progress','','Exported '+stamp(now)+' (Bangkok time) from Study OS ('+SITE+'). I am a first-year accounting student. Use this data to coach me.',''];
  const ex=((o&&o.exams)||[]).map(e=>({e,d:daysUntil(e.date,now)})).filter(x=>x.d>=0).sort((a,b)=>a.d-b.d);
  out.push('## Upcoming exams','');
  if(!ex.length)out.push('- None left.');
  ex.forEach(({e,d})=>{const ch=(e.cats||[]).map(id=>(labels[e.course]||{})[id]||id).join(', ');
   out.push('- '+clean(e.title)+': '+e.date+' ('+(d===0?'today':d===1?'tomorrow':'in '+d+' days')+')'+(ch?'. Chapters: '+clean(ch):''));});
  out.push('');
  courses.forEach(c=>{if(!c.D)return;const s=courseStats(c.D,c.study);
   out.push('## '+clean(c.name),'',s.answered+' of '+s.total+' practice questions answered'+(s.pct!==null?', '+s.pct+'% right':'')+'.','',
    '| Chapter | Answered | Right |','|---|---|---|');
   s.chapters.forEach(p=>out.push('| '+cell(p.label)+' | '+p.answered+' / '+p.quiz+' | '+(p.pct===null?'–':p.pct+'%')+' |'));
   const weak=s.chapters.filter(p=>p.answered>=3&&p.pct<70).sort((a,b)=>a.pct-b.pct);
   out.push('','Weak chapters (under 70% right): '+(weak.length?weak.map(p=>clean(p.label)+' '+p.pct+'%').join(', '):'none')+'.');
   if(wrongN&&s.wrong.length){out.push('','Questions I got wrong (newest '+Math.min(wrongN,s.wrong.length)+' of '+s.wrong.length+'):','');
    s.wrong.slice(0,wrongN).forEach((w,n)=>{const opts=Array.isArray(w.q[2])?w.q[2]:[];
     out.push((n+1)+'. ['+clean(w.label)+'] '+clean(w.q[1],400),'   My answer: '+L[w.a]+') '+clean(opts[w.a],160)+' · Correct: '+L[w.q[3]]+') '+clean(opts[w.q[3]],160));});}
   out.push('');});
  out.push('## What I want from you','',clean((o&&o.goal)||'Look at my exams, weak chapters and wrong questions. Tell me what to study first today, explain the ideas behind my mistakes simply, and quiz me with a few new questions one at a time.'));
  return out.join('\n')+'\n';
 }
 return {SITE,courseStats,buildContext,daysUntil};
});
