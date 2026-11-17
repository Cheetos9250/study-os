/* Finds a chapter's "Multiple Choice Quiz" in the text of PDF pages (used by My PDF sets for the accounting textbook).
   Works on the device only, on the owner's own PDF; nothing is uploaded. Pure functions so they can be tested in Node.
   - pageLines(textContent, page): the page's text as lines, top to bottom (pdf.js getTextContent items).
   - findQuiz(lines): {n, page:{q:pdfPage}, opts:{q:letters}, key:{q:'a'..'e'}} for the first quiz found, n=0 if none. */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.PdfMcq=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function pageLines(tc,p){
  const rows=new Map();
  for(const it of (tc&&tc.items)||[]){
   if(!it.str)continue;const y=Math.round(it.transform[5]);
   let k=[...rows.keys()].find(v=>Math.abs(v-y)<3);if(k===undefined){k=y;rows.set(k,[]);}rows.get(k).push(it);
  }
  return [...rows.keys()].sort((a,b)=>b-a).map(y=>({p,t:rows.get(y).sort((a,b)=>a.transform[4]-b.transform[4]).map(i=>i.str).join(' ').replace(/\s+/g,' ').trim()})).filter(l=>l.t);
 }
 const QUIZ=/multiple[\s-]*choice\s+quiz/i, ANSWERS=/answers?\s+to\s+multiple[\s-]*choice\s+quiz/i;
 const STOP=/^(quick\s+study|discussion\s+questions|exercises?\b|problem\s+set|key\s+terms|summary)/i;
 /* highest option letter written on a line: "a." or "(a)" or "a)" */
 function optsIn(t){let best=0;for(const m of t.matchAll(/(?:^|\s|\()([a-e])\s*[.)]\s*\S/g)){const k='abcde'.indexOf(m[1])+1;if(k>best)best=k;}return best;}
 function findQuiz(lines){
  const out={n:0,page:{},opts:{},key:{}};
  const start=lines.findIndex(l=>QUIZ.test(l.t)&&!ANSWERS.test(l.t));
  if(start<0)return out;
  let last=0;
  for(let i=start+1;i<lines.length;i++){
   const t=lines[i].t;
   if(ANSWERS.test(t)||(last>0&&STOP.test(t)))break;
   const m=t.match(/^(\d{1,2})\s*[.)]\s*(.*)$/);
   if(m&&+m[1]===last+1){last=+m[1];out.page[last]=lines[i].p;out.opts[last]=Math.max(4,optsIn(m[2]));continue;}
   if(last){const k=optsIn(t);if(k>out.opts[last])out.opts[last]=Math.min(5,Math.max(4,k));}
   if(last>=20)break;
  }
  out.n=last;
  if(!last)return out;
  /* answer key, e.g. "ANSWERS TO MULTIPLE CHOICE QUIZ 1. b; $45,000 … 2. d 3. a …" */
  const a=lines.findIndex((l,i)=>i>start&&ANSWERS.test(l.t));
  if(a>=0){
   const text=lines.slice(a,a+12).map(l=>l.t).join(' ').replace(ANSWERS,' ');
   for(const m of text.matchAll(/(?:^|[\s;,(])(\d{1,2})\s*[.)]\s*\(?([a-e])\)?(?=[\s;,.:)]|$)/gi)){
    const q=+m[1];if(q>=1&&q<=last&&!out.key[q])out.key[q]=m[2].toLowerCase();
   }
  }
  return out;
 }
 return {pageLines,findQuiz,optsIn};
});
