/* "Continue where I left off": the last place you studied (page + question), shown on Today.
   Stored in studyos.last.v1, a screen setting like studyos.pomo.v1: not study data, not backed up, not synced.
   Only plain page links inside this site are kept (e.g. "acc.html?tab=prac&q=123"). */
(function(root){
 'use strict';
 var KEY='studyos.last.v1',SAFE=/^[a-z0-9-]+\.html(\?[A-Za-z0-9_.~%&=+-]*)?$/;
 function strip(t,n){return String(t==null?'':t).replace(/<[^>]*>/g,' ').replace(/[*_`#|]/g,'').replace(/\s+/g,' ').trim().slice(0,n);}
 function mark(o){
  if(!o||!SAFE.test(String(o.href||'')))return false;
  var v={href:o.href,title:strip(o.title,80),sub:strip(o.sub,110),course:strip(o.course,12),t:Date.now()};
  try{localStorage.setItem(KEY,JSON.stringify(v));return true;}catch(e){return false;}
 }
 function get(){
  try{var v=JSON.parse(localStorage.getItem(KEY)||'null');return v&&SAFE.test(String(v.href))&&Number.isFinite(v.t)?v:null;}catch(e){return null;}
 }
 var api={KEY:KEY,mark:mark,get:get,strip:strip};
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.StudyLast=api;
})(typeof window!=='undefined'?window:null);
