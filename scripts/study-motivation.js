/* Motivation helpers (TASKS 19–22, 18 Nov 2026): daily practice goal, study heatmap, badges, weekly summary.
   Everything is computed from data the site already keeps (quiz answer times in study-<course>, the Pomodoro log,
   WordNest days, the review schedule). The only stored setting is the practice goal, `qgoal` in studyos.home.v1
   (backed up and synced with the owner's tasks). Days are Bangkok days, weeks start on Monday. */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.StudyMotivation=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const DAY=86400000,TZ=7*3600000,GOALS=[5,10,20,30,50],DEFAULT_GOAL=10;
 const dayKey=t=>new Date(Math.floor((t+TZ)/DAY)*DAY).toISOString().slice(0,10);
 const add=(maps,d)=>maps.reduce((n,m)=>n+(Number(m&&m[d])||0),0);
 function goal(v){v=Math.round(Number(v));return Number.isFinite(v)&&v>=1&&v<=200?v:DEFAULT_GOAL;}
 function nextGoal(v){const i=GOALS.indexOf(goal(v));return GOALS[(i+1)%GOALS.length];}
 /* days in a row (ending today, or yesterday if today is still empty) where the practice goal was met */
 function goalStreak(answered,g,now){g=goal(g);let t=now,n=0;if((answered[dayKey(t)]||0)<g)t-=DAY;while((answered[dayKey(t)]||0)>=g){n++;t-=DAY;}return n;}
 /* heatmap: columns are weeks (Mon..Sun), the last column holds today; level 0–4 by quartiles of active days */
 function heatmap(maps,now,weeks){
  weeks=weeks||26;const today=dayKey(now),dow=(new Date(today+'T00:00:00Z').getUTCDay()+6)%7,start=Date.parse(today+'T00:00:00Z')-(dow+7*(weeks-1))*DAY;
  const cells=[];for(let i=0;i<weeks*7;i++){const d=new Date(start+i*DAY).toISOString().slice(0,10);cells.push({d,n:d>today?null:add(maps,d)});}
  const vals=cells.map(c=>c.n).filter(n=>n>0).sort((a,b)=>a-b),q=p=>vals.length?vals[Math.min(vals.length-1,Math.floor(vals.length*p))]:1;
  const cut=[q(.25),q(.5),q(.75)];
  cells.forEach(c=>{c.level=c.n==null?-1:!c.n?0:c.n<=cut[0]?1:c.n<=cut[1]?2:c.n<=cut[2]?3:4;});
  return {weeks,cells,active:cells.filter(c=>c.n>0).length,total:vals.reduce((a,b)=>a+b,0)};
 }
 /* this week (Monday → today) against the same days of last week */
 function weekly(per,now){
  const today=dayKey(now),dow=(new Date(today+'T00:00:00Z').getUTCDay()+6)%7,t0=Date.parse(today+'T00:00:00Z');
  const span=off=>{const out=[];for(let i=0;i<=dow;i++)out.push(new Date(t0-(dow-i+off)*DAY).toISOString().slice(0,10));return out;};
  const thisW=span(0),lastW=span(7),sum=(m,ds)=>ds.reduce((n,d)=>n+(Number(m&&m[d])||0),0),out={days:dow+1,from:thisW[0],rows:[]};
  for(const k of Object.keys(per))out.rows.push({key:k,now:sum(per[k],thisW),before:sum(per[k],lastW),activeDays:thisW.filter(d=>(per[k]||{})[d]>0).length});
  return out;
 }
 /* badges from totals; each has progress so locked ones show how far is left */
 function badges(x){
  const B=(id,icon,title,desc,have,need)=>({id,icon,title,desc,have:Math.min(have,need),need,got:have>=need});
  return [
   B('first','🌱','First step','Answer your first practice question',x.total,1),
   B('acc100','📒','Bookkeeper','100 accounting questions answered',x.byCourse.acc||0,100),
   B('eco50','📈','Market watcher','50 economics questions answered',x.byCourse.eco||0,50),
   B('math50','📐','Number cruncher','50 math questions answered',x.byCourse.math||0,50),
   B('q500','🏅','Five hundred','500 questions answered in all',x.total,500),
   B('s3','🔥','On a roll','Study 3 days in a row',x.bestStreak,3),
   B('s7','⚡','One full week','Study 7 days in a row',x.bestStreak,7),
   B('s30','🏆','Unstoppable','Study 30 days in a row',x.bestStreak,30),
   B('goal7','🎯','Goal getter','Meet the daily practice goal on 7 days',x.goalDays,7),
   B('ret50','🧠','Locked in','50 questions retired (right 4 times in a row)',x.retired,50),
   B('pomo10','⏱️','Deep focus','10 hours of finished Pomodoros',Math.floor(x.pomoMin/60),10),
   B('words500','🪺','Word collector','500 WordNest answers',x.words,500)
  ];
 }
 /* longest run of active days in a {day: n} map */
 function bestStreak(maps){const days=new Set();maps.forEach(m=>Object.keys(m||{}).forEach(d=>{if(Number(m[d])>0)days.add(d);}));
  let best=0,run=0,prev=null;[...days].sort().forEach(d=>{const t=Date.parse(d+'T00:00:00Z');run=prev!==null&&t-prev===DAY?run+1:1;prev=t;if(run>best)best=run;});return best;}
 /* exam readiness for one subject (TASK 28):
    total = questions in the bank, answered/right = unique questions answered / answered right now,
    pace = answers in the last 7 days ÷ 7, examDays = days left (null if no exam ahead). */
 function readiness(x){
  const total=Math.max(0,x.total|0),answered=Math.min(total,Math.max(0,x.answered|0)),right=Math.min(answered,Math.max(0,x.right|0)),left=total-answered;
  const pace=Math.max(0,Number(x.last7)||0)/7,daysToFinish=left===0?0:pace>0?Math.ceil(left/pace):null;
  const examDays=Number.isFinite(x.examDays)&&x.examDays>=0?x.examDays:null;
  const needPerDay=examDays===null||left===0?null:Math.ceil(left/Math.max(1,examDays));
  return {total,answered,right,left,pctDone:total?Math.round(answered/total*100):0,pctRight:total?Math.round(right/total*100):0,
   accuracy:answered?Math.round(right/answered*100):null,pace:Math.round(pace*10)/10,daysToFinish,examDays,needPerDay,
   onTrack:left===0||(examDays!==null&&daysToFinish!==null&&daysToFinish<=Math.max(1,examDays))};
 }
 return {DAY,GOALS,DEFAULT_GOAL,dayKey,goal,nextGoal,goalStreak,heatmap,weekly,badges,bestStreak,readiness};
});
