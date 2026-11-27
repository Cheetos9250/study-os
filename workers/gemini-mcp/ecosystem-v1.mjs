// ecosystem/v1: the versioned JSON contract other apps (Life OS) read from this Worker. See docs/ecosystem.md.
// GET /plan = open tasks, upcoming exams and the weekly timetable; GET /digest = study counts (study-digest.mjs).
// Rules: adding a field keeps v1; removing or renaming a field, or changing its meaning or type, is v2.
// The fixture docs/ecosystem/v1.fixture.json is the shared example both repos test against.
import T from '../../scripts/study-today.js';

export const VERSION=1;
const DAY=/^\d{4}-\d{2}-\d{2}$/,HM=/^\d{2}:\d{2}$/;
const PRI={High:'high',Medium:'medium',Low:'low',high:'high',medium:'medium',low:'low'};
const str=(v,n)=>String(v==null?'':v).slice(0,n);

/** today = progress doc {today:{...}} (exams, timetable), home = progress doc {home:{tasks}}; both may be null. */
export function planFeed(today,home,now){
 const settings=T.loadSettings(JSON.stringify((today&&today.today)||{}));
 const h=(home&&home.home)||{};
 const tasks=(Array.isArray(h.tasks)?h.tasks:[]).filter(t=>t&&typeof t==='object'&&t.title&&!t.done).slice(0,500).map(t=>({
  id:str(t.id,80),title:str(t.title,200),date:DAY.test(String(t.date||''))?t.date:null,pri:PRI[t.pri]||'medium',done:false,
  link:/^https:\/\//.test(String(t.link||''))?str(t.link,500):null}));
 const exams=settings.exams.filter(e=>e&&e.title&&DAY.test(String(e.date||''))&&T.daysUntil(e.date,now)>=0)
  .sort((a,b)=>a.date.localeCompare(b.date)).slice(0,100).map(e=>({title:str(e.title,120),date:e.date,course:str(e.course,20)}));
 const classes=settings.timetable.filter(c=>!c.skip).slice().sort((a,b)=>a.day-b.day||a.start.localeCompare(b.start)).slice(0,100)
  .map(c=>({day:c.day,start:c.start,end:c.end,name:str(c.name,120)}));
 return {v:VERSION,kind:'plan',generated:now,tasks,exams,classes};
}

/** Contract check: returns a list of problems (empty = valid). Used by tests here and copied by consumers. */
export function validate(x){
 const err=[],is=(ok,msg)=>{if(!ok)err.push(msg);};
 if(!x||typeof x!=='object')return ['not an object'];
 is(x.v===VERSION,'v must be '+VERSION);
 is(Number.isFinite(x.generated),'generated must be a time in ms');
 if(x.kind==='plan'){
  for(const k of ['tasks','exams','classes'])is(Array.isArray(x[k]),k+' must be a list');
  (x.tasks||[]).forEach((t,i)=>{is(typeof t.id==='string'&&typeof t.title==='string'&&t.title,'tasks['+i+'] id/title');
   is(t.date===null||DAY.test(t.date),'tasks['+i+'].date');is(['high','medium','low'].includes(t.pri),'tasks['+i+'].pri');
   is(typeof t.done==='boolean','tasks['+i+'].done');is(t.link===null||/^https:\/\//.test(t.link),'tasks['+i+'].link');});
  (x.exams||[]).forEach((e,i)=>{is(typeof e.title==='string'&&e.title&&DAY.test(e.date)&&typeof e.course==='string','exams['+i+']');});
  (x.classes||[]).forEach((c,i)=>{is(Number.isInteger(c.day)&&c.day>=0&&c.day<=6&&HM.test(c.start)&&HM.test(c.end)&&typeof c.name==='string','classes['+i+']');});
 }else if(x.kind==='digest'){
  is(Array.isArray(x.courses),'courses must be a list');
  is(x.totals&&Number.isInteger(x.totals.cards_due)&&Number.isInteger(x.totals.quiz_due),'totals');
  (x.courses||[]).forEach((c,i)=>{is(typeof c.key==='string'&&typeof c.name==='string','courses['+i+'] key/name');
   for(const k of ['cards_due','quiz_due','answered','total','correct'])is(Number.isInteger(c[k]),'courses['+i+'].'+k);
   is(c.pct===null||Number.isFinite(c.pct),'courses['+i+'].pct');
   is(c.recent&&c.recent.days===7&&Number.isInteger(c.recent.answered),'courses['+i+'].recent');
   is(Array.isArray(c.weak),'courses['+i+'].weak');});
 }else err.push('kind must be plan or digest');
 return err;
}
