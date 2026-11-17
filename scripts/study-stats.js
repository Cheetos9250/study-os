/* Study OS stats: pure helpers for stats.html. Reads only existing data (quiz answer times, Pomodoro history, plan ticks). */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.StudyStats=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const DAY=864e5,TZ=7*3600000;
 const dayKey=t=>new Date(Math.floor((t+TZ)/DAY)*DAY).toISOString().slice(0,10);
 const parse=raw=>{try{const v=JSON.parse(raw||'null');return v&&typeof v==='object'&&!Array.isArray(v)?v:null;}catch(e){return null;}};
 function lastDays(now,n){const out=[];for(let i=n-1;i>=0;i--)out.push(dayKey(now-i*DAY));return out;}
 /* questions per day, by the time each question was last answered (ats) */
 function answersPerDay(raws){const m={};for(const raw of raws){const s=parse(raw);if(!s||!s.ats||typeof s.ats!=='object')continue;
  for(const id of Object.keys(s.ats)){const t=Number(s.ats[id]);if(!Number.isFinite(t)||t<=0||!s.ans||s.ans[id]===undefined)continue;if(s.rst&&t<s.rst)continue;const d=dayKey(t);m[d]=(m[d]||0)+1;}}return m;}
 function pomoPerDay(raw){const o=parse(raw),m={};if(o&&o.days&&typeof o.days==='object')for(const d of Object.keys(o.days)){const v=Number(o.days[d]);if(/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(v)&&v>0)m[d]=v;}return m;}
 /* days with a plan tick: chapter ticks store the day; daily task ticks are keyed by day */
 function tickDays(raw){const o=parse(raw),m={};if(!o)return m;
  if(o.done&&typeof o.done==='object')for(const ex of Object.values(o.done))if(ex&&typeof ex==='object')for(const d of Object.values(ex))if(/^\d{4}-\d{2}-\d{2}$/.test(String(d)))m[d]=(m[d]||0)+1;
  if(o.tasks&&typeof o.tasks==='object')for(const [d,t] of Object.entries(o.tasks))if(/^\d{4}-\d{2}-\d{2}$/.test(d)&&t&&Object.values(t).some(Boolean))m[d]=(m[d]||0)+1;
  return m;}
 /* consecutive active days ending today, or yesterday when today has nothing yet */
 function streak(now,maps){const active=d=>maps.some(m=>m[d]>0);let t=now,n=0;if(!active(dayKey(t)))t-=DAY;while(active(dayKey(t))){n++;t-=DAY;}return n;}
 function niceMax(v){if(v<=4)return 4;const p=Math.pow(10,Math.floor(Math.log10(v))),f=v/p;return (f<=2?2:f<=5?5:10)*p;}
 return {dayKey,lastDays,answersPerDay,pomoPerDay,tickDays,streak,niceMax};
});
