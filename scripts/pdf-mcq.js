/* Finds a chapter's "Multiple Choice Quiz" in the text of PDF pages (used by My PDF sets for the accounting textbook).
   Works on the device only, on the owner's own PDF; nothing is uploaded. Pure functions so they can be tested in Node.
   The 24e textbook prints the quiz in two columns at the end of each chapter, e.g. Ch 8 on pp. 337–338:
     MULTIPLE CHOICE QUIZ … 1. … (left) … 4. … (right column) …
     ANSWERS TO MULTIPLE CHOICE QUIZ  1. a; …  2. a; …  3. c; …  4. d; …
     Discussion Questions … QUICK STUDY …
   - pageLines(textContent, page, pageWidth): the page's text as lines with their column (0 left, 1 right) and height.
   - findQuiz(lines): {n, page:{q:pdfPage}, opts:{q:letters}, key:{q:'a'..'e'}} for the first quiz found, n=0 if none. */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.PdfMcq=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function pageLines(tc,p,width){
  const rows=new Map(),mid=width>0?width/2:Infinity;
  for(const it of (tc&&tc.items)||[]){
   if(!it.str||!it.str.trim())continue;
   const x=it.transform[4],y=Math.round(it.transform[5]),col=x>=mid-4?1:0;
   let k=[...rows.keys()].find(v=>v.col===col&&Math.abs(v.y-y)<3);
   if(!k){k={col,y};rows.set(k,[]);}rows.get(k).push(it);
  }
  return [...rows.keys()].sort((a,b)=>a.col-b.col||b.y-a.y).map(k=>({p,col:k.col,y:k.y,
   t:rows.get(k).sort((a,b)=>a.transform[4]-b.transform[4]).map(i=>i.str).join(' ').replace(/\s+/g,' ').trim()})).filter(l=>l.t);
 }
 const QUIZ=/multiple[\s-]*choice\s+(quiz|questions?|test)\b/i, ANSWERS=/answers?\s+to\s+(the\s+)?multiple[\s-]*choice\s+(quiz|questions?)/i;
 const STOP=/^(quick\s+study|discussion\s+questions|exercises?\b|problem\s+set|key\s+terms|summary)/i;
 /* any mention, for a whole-book search when the quiz is not near the chapter end */
 const MENTION=/multiple[\s-]*choice/i;
 /* highest option letter written on a line: "a." or "(a)" or "a)" */
 function optsIn(t){let best=0;for(const m of t.matchAll(/(?:^|\s|\()([a-e])\s*[.)]\s*\S/g)){const k='abcde'.indexOf(m[1])+1;if(k>best)best=k;}return best;}
 /* The lines that belong to the quiz, in reading order: below the heading, left column then right column on each
    page, up to the first "Discussion Questions" / "Quick Study" band. Lines without a position keep their order. */
 function quizBody(lines,si){
  const head=lines[si];
  if(!lines.every(l=>typeof l.y==='number'))return lines.slice(si+1);
  const pages=[...new Set(lines.filter(l=>l.p>=head.p).map(l=>l.p))].sort((a,b)=>a-b),body=[];
  for(const p of pages){
   let ls=lines.filter(l=>l.p===p&&l!==head);
   if(p===head.p)ls=ls.filter(l=>l.y<head.y-1);
   const stop=ls.filter(l=>STOP.test(l.t)).sort((a,b)=>b.y-a.y)[0];
   if(stop)ls=ls.filter(l=>l.y>stop.y+1);
   body.push(...ls.sort((a,b)=>(a.col||0)-(b.col||0)||b.y-a.y));
   if(stop)break;
  }
  return body;
 }
 function findQuiz(lines){
  const out={n:0,page:{},opts:{},key:{}};
  const si=lines.findIndex(l=>QUIZ.test(l.t)&&!ANSWERS.test(l.t));
  if(si<0)return out;
  const geo=lines.every(l=>typeof l.y==='number'),body=quizBody(lines,si);
  let last=0;
  for(const l of body){
   const t=l.t;
   if(!geo&&last>0&&STOP.test(t))break;
   const m=t.match(/^(\d{1,2})\s*[.)]\s*(.*)$/);
   /* a question, not an answer line such as "1. a; recognizes …" */
   if(m&&+m[1]===last+1&&!/^[a-e]\s*[;,]/.test(m[2])){last=+m[1];out.page[last]=l.p;out.opts[last]=Math.max(4,optsIn(m[2]));continue;}
   if(last&&!ANSWERS.test(t)){const k=optsIn(t);if(k>out.opts[last])out.opts[last]=Math.min(5,Math.max(4,k));}
   if(last>=20)break;
  }
  out.n=last;
  if(!last)return out;
  /* answer key: "1. a; …", "2. c 3. a" (lowercase letter, then ; , ) end or the next number) */
  const ai=body.findIndex(l=>ANSWERS.test(l.t));
  if(ai>=0){
   for(const l of body.slice(ai)){
    if(!geo&&STOP.test(l.t))break;
    for(const m of l.t.replace(ANSWERS,' ').matchAll(/(?:^|[\s(])(\d{1,2})\s*[.)]\s*\(?([a-e])\)?(?=\s*[;,)]|\s*$|\s+\d)/g)){
     const q=+m[1];if(q>=1&&q<=last&&!out.key[q])out.key[q]=m[2];
    }
   }
  }
  return out;
 }
 return {pageLines,findQuiz,optsIn,MENTION};
});
