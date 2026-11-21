/* Question sets per chapter (owner, 18 Nov 2026): no repeated questions, at most 50 (owner, 21 Nov 2026) and at least 10 questions in a set,
   three sets per chapter (fewer when a chapter has under 30, more when it has over 150). Set 1 is open; the next set opens when 90% of the current set is
   "mastered" — answered right at least twice in a row (review box ≥ 2 in study-<course>.rv).
   Pure functions; the course engine uses them to filter the deck. Nothing is stored: answers stay where they are,
   and hidden repeats keep their saved answers. */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.StudyQSets=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const MAX=50,MIN=10,SETS=3,MASTER_BOX=2,UNLOCK=0.9;
 /* same question = same words, ignoring case, spaces, punctuation and option order */
 function norm(t){return String(t||'').toLowerCase().normalize('NFKC').replace(/\*\*/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();}
 /* qs: [{id, cat, q, open}] in practice order → {hidden:Set(ids), sets:{cat:[[ids]…]}, setOf:{id:index}} */
 function build(qs){
  const seen={},hidden=new Set(),byCat={};
  for(const q of qs||[]){if(!q||q.open)continue;const k=q.cat+'|'+norm(q.q);
   if(seen[k]!==undefined){hidden.add(String(q.id));continue;}seen[k]=q.id;(byCat[q.cat]=byCat[q.cat]||[]).push(String(q.id));}
  const sets={},setOf={};
  for(const cat of Object.keys(byCat)){const ids=byCat[cat],size=Math.min(MAX,Math.max(MIN,Math.ceil(ids.length/SETS))),list=[];
   for(let i=0;i<ids.length;i+=size)list.push(ids.slice(i,i+size));
   sets[cat]=list;list.forEach((s,k)=>s.forEach(id=>{setOf[id]=k;}));}
  return {hidden,sets,setOf};
 }
 function mastered(store,id){const r=store&&store.rv&&store.rv[id];return Array.isArray(r)&&Number(r[0])>=MASTER_BOX;}
 /* per chapter: each set's size, mastered count, done flag, open flag; current = first open set not done (or the last) */
 function progress(sets,store){
  const out=[];let open=true;
  for(const ids of sets||[]){const m=ids.filter(id=>mastered(store,id)).length,done=ids.length>0&&m/ids.length>=UNLOCK;
   out.push({n:ids.length,mastered:m,done,open});open=open&&done;}
  let current=out.findIndex(s=>s.open&&!s.done);if(current<0)current=Math.max(0,out.length-1);
  return {sets:out,current};
 }
 /* which questions a deck may show: mode 'auto' = each chapter's current set; a number k = set k (only if open); 'all' = every set */
 function allowed(model,store,mode){
  const ok=new Set();
  for(const cat of Object.keys(model.sets)){const list=model.sets[cat],pr=progress(list,store);
   let ks=mode==='all'?list.map((_,k)=>k):typeof mode==='number'?(pr.sets[mode]&&pr.sets[mode].open?[mode]:[pr.current]):[pr.current];
   ks.forEach(k=>(list[k]||[]).forEach(id=>ok.add(id)));}
  return ok;
 }
 return {MAX,MIN,SETS,MASTER_BOX,UNLOCK,norm,build,mastered,progress,allowed};
});
