/* Google Classroom import helpers for classroom.html (pure functions, testable in Node).
   The page signs in with Google Identity Services using the owner's own OAuth client ID (a public id, not a
   secret; saved on this device in studyos.classroom.v1), reads courses, coursework and the owner's own
   submissions with read-only scopes, and adds chosen items to Today's tasks (studyos.home.v1 tasks, which are
   backed up and synced). The access token stays in memory only. Nothing is sent anywhere except Google. */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.StudyClassroom=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const KEY='studyos.classroom.v1',HOME='studyos.home.v1',API='https://classroom.googleapis.com/v1';
 const SCOPES='https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.coursework.me.readonly';
 const TZ='Asia/Bangkok';
 function clientId(s){s=String(s||'').trim();return /^[0-9]{6,}-[a-z0-9]+\.apps\.googleusercontent\.com$/i.test(s)?s:'';}
 const pad=n=>String(n).padStart(2,'0');
 function localDay(ms){return new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(ms));}
 /* Classroom due dates are UTC; with a time they become the Bangkok calendar day, without one the date is kept. */
 function dueDay(w){
  const d=w&&w.dueDate;if(!d||!d.year||!d.month||!d.day)return '';
  if(!w.dueTime||w.dueTime.hours===undefined&&w.dueTime.minutes===undefined)return d.year+'-'+pad(d.month)+'-'+pad(d.day);
  return localDay(Date.UTC(d.year,d.month-1,d.day,w.dueTime.hours||0,w.dueTime.minutes||0));
 }
 function dueTime(w){
  const d=w&&w.dueDate,t=w&&w.dueTime;if(!d||!t)return '';
  return new Intl.DateTimeFormat('en-GB',{timeZone:TZ,hour:'2-digit',minute:'2-digit'}).format(new Date(Date.UTC(d.year,d.month-1,d.day,t.hours||0,t.minutes||0)));
 }
 const short=s=>{s=String(s||'').replace(/\s+/g,' ').trim();return s.length>22?s.slice(0,21)+'…':s;};
 function title(courseName,workTitle){return (short(courseName)+': '+String(workTitle||'Untitled').replace(/\s+/g,' ').trim()).slice(0,80);}
 /* courses, works ({courseId → [courseWork]}), subs ({courseWorkId → submission}) → rows for the list */
 function rows(courses,works,subs,today){
  const out=[];
  for(const c of courses||[])for(const w of (works&&works[c.id])||[]){
   const s=subs&&subs[w.id],state=s&&s.state||'',done=state==='TURNED_IN'||state==='RETURNED',date=dueDay(w);
   out.push({id:'gc-'+w.id,course:c.name||'',work:w.title||'Untitled',title:title(c.name,w.title),date,time:dueTime(w),done,late:!!(s&&s.late),
    link:/^https:\/\/classroom\.google\.com\//.test(w.alternateLink||'')?w.alternateLink:'',
    pick:!done&&!!date&&date>=today});
  }
  return out.sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')||a.title.localeCompare(b.title));
 }
 /* Add or update tasks. Existing gc- tasks keep their own done tick (and become done once turned in). */
 function merge(tasks,picked,today,now){
  const list=Array.isArray(tasks)?tasks.slice():[];let added=0,updated=0;
  for(const r of picked){
   const date=r.date||today,soon=(Date.parse(date+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/864e5<=2;
   const i=list.findIndex(t=>t&&t.id===r.id);
   if(i>=0){const t=list[i],n=Object.assign({},t,{title:r.title,date,done:!!t.done||r.done,src:'classroom'});if(r.link)n.link=r.link;
    if(JSON.stringify(n)!==JSON.stringify(t)){list[i]=n;updated++;}continue;}
   const t={id:r.id,title:r.title,date,pri:soon?'High':'Medium',done:!!r.done,src:'classroom'};if(r.link)t.link=r.link;
   list.push(t);added++;
  }
  return {tasks:list,added,updated};
 }
 return {KEY,HOME,API,SCOPES,clientId,dueDay,dueTime,title,rows,merge,localDay};
});
