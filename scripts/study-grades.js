/* Study OS grades: weighted course scores, letter grade, what is needed on the rest, and an estimated GPA.
   Pure functions; the page stores data under KEY in this browser only. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StudyGrades=api;})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const KEY='studyos.grades.v1';
 const DEFAULT_SCALE=[[80,'A'],[75,'B+'],[70,'B'],[65,'C+'],[60,'C'],[55,'D+'],[50,'D'],[0,'F']];
 const POINTS={'A':4,'B+':3.5,'B':3,'C+':2.5,'C':2,'D+':1.5,'D':1,'F':0};
 const num=v=>{const n=Number(String(v==null?'':v).replace(',', '.'));return Number.isFinite(n)?n:null;};
 function normScale(s){if(!Array.isArray(s))return DEFAULT_SCALE.map(x=>[...x]);const out=s.filter(x=>Array.isArray(x)&&Number.isFinite(x[0])&&Object.prototype.hasOwnProperty.call(POINTS,x[1])).map(x=>[x[0],x[1]]).sort((a,b)=>b[0]-a[0]);return out.length?out:DEFAULT_SCALE.map(x=>[...x]);}
 function normItem(it,i){if(!it||typeof it!=='object')return null;const w=num(it.weight),mx=num(it.max),g=it.got==null||it.got===''?null:num(it.got);
  return {id:typeof it.id==='string'&&it.id?it.id.slice(0,40):'i'+i,name:String(it.name||'Item').slice(0,40),weight:w!=null&&w>=0&&w<=100?w:0,max:mx!=null&&mx>0?mx:100,got:g!=null&&g>=0?g:null};}
 function normCourse(c,i){if(!c||typeof c!=='object')return null;const cr=num(c.credits);
  return {id:typeof c.id==='string'&&c.id?c.id.slice(0,40):'g'+i,name:String(c.name||'Course').slice(0,60),credits:cr!=null&&cr>0&&cr<=12?cr:3,
   items:(Array.isArray(c.items)?c.items:[]).slice(0,40).map(normItem).filter(Boolean),scale:normScale(c.scale)};}
 function load(raw){let o={};try{o=JSON.parse(raw||'{}')||{};}catch{o={};}return {courses:(Array.isArray(o.courses)?o.courses:[]).slice(0,30).map(normCourse).filter(Boolean)};}
 function letterFor(pct,scale){for(const [min,l] of normScale(scale))if(pct>=min)return l;return 'F';}
 function result(c){
  const weightTotal=c.items.reduce((n,x)=>n+x.weight,0);
  const done=c.items.filter(x=>x.got!=null),doneWeight=done.reduce((n,x)=>n+x.weight,0);
  const earned=done.reduce((n,x)=>n+x.weight*Math.min(x.got,x.max*1.5)/x.max,0);
  const remaining=Math.max(0,weightTotal-doneWeight);
  const scale=normScale(c.scale);
  // Letter: final if everything is graded, otherwise the rate so far (earned out of the graded weight).
  const pctSoFar=doneWeight?earned/doneWeight*100:null;
  const letter=!done.length?'':remaining>0?letterFor(pctSoFar,scale):letterFor(earned,scale);
  const needs=scale.filter(x=>x[1]!=='F').map(([min,l])=>({letter:l,need:remaining>0?(min-earned)/remaining*100:NaN}));
  return {weightTotal,doneWeight,earned,remaining,pctSoFar,letter,needs,final:remaining===0&&done.length>0};
 }
 function gpa(courses){let pts=0,credits=0;for(const c of courses){const r=result(c);if(!r.letter)continue;pts+=POINTS[r.letter]*c.credits;credits+=c.credits;}return {gpa:credits?pts/credits:0,credits};}
 return {KEY,DEFAULT_SCALE,POINTS,num,load,result,gpa,letterFor};
});
