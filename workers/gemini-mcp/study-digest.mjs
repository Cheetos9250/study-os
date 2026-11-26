// GET /digest (Bearer token): a tiny read-only study summary for Life OS's Telegram morning message.
// Only counts and public chapter names: cards due, review questions due, accuracy, weak chapters. No question text,
// no notes, no grades, no tasks. Built from the same GET-only progress reads as /export; nothing is stored or written.
import T from '../../scripts/study-today.js';
import G from '../../scripts/study-gemini.js';
import R from '../../scripts/study-review.js';

const DAY=86400000,WEAK_BELOW=70,WEAK_MIN=3;

/** One course: D = parsed data/courses file, doc = progress doc {study, srs} (or null). */
export function courseDigest(c,D,doc,now){
 const study=(doc&&doc.study&&typeof doc.study==='object')?doc.study:{},srs=(doc&&doc.srs&&typeof doc.srs==='object')?doc.srs:{};
 const sum=T.summarize(D,JSON.stringify(srs),JSON.stringify(study),now);
 const s=G.courseStats(D,study);
 const ans=study.ans||{},ats=study.ats||{},rst=Number(study.rst)||0,since=now-7*DAY;
 let ra=0,rc=0;
 (D.quiz||[]).forEach((q,i)=>{const a=ans[i];if(a===undefined||a===null)return;const t=Number(ats[i])||0;if(rst&&t&&t<rst)return;if(t<since)return;ra++;if(a===q[3])rc++;});
 const weak=s.chapters.filter(p=>p.answered>=WEAK_MIN&&p.pct<WEAK_BELOW).sort((a,b)=>a.pct-b.pct).slice(0,3)
  .map(p=>({label:String(p.label).slice(0,80),pct:p.pct,answered:p.answered}));
 return {key:c.key,name:c.name,cards_due:sum.reviewNow,quiz_due:R.dueIds(study,now).length,answered:s.answered,total:s.total,correct:s.correct,pct:s.pct,
  recent:{days:7,answered:ra,correct:rc,pct:ra?Math.round(rc/ra*100):null},weak};
}

/** deps: {progress(env,key), courseData(env,courseObj)} from worker.mjs. A failing course is skipped, not fatal. */
export async function digestFeed(env,now,deps){
 const list=T.COURSES.filter(c=>['acc','eco','math'].includes(c.key));
 const out=await Promise.all(list.map(async c=>{
  try{const [D,doc]=await Promise.all([deps.courseData(env,c),deps.progress(env,c.key).catch(()=>null)]);return courseDigest(c,D,doc,now);}
  catch{return null;}}));
 const courses=out.filter(Boolean);
 return {generated:now,courses,totals:{cards_due:courses.reduce((n,c)=>n+c.cards_due,0),quiz_due:courses.reduce((n,c)=>n+c.quiz_due,0)}};
}
