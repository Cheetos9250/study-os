/* Study OS course engine, shared by acc.html, eco.html, math.html, eng.html and zh.html (18 Nov 2026).
   Before this file a course page loads:
     data/courses/<course>.js           const D = {...};  cards, summaries, quiz, chapters (one line, parsed as JSON elsewhere)
     data/courses/<course>-snapshot.js  const EMBQ=[...]; saved Notion "Quiz" rows (acc, eco only)
     data/courses/<course>-extra.js     window.StudyCourseExtra = {hide, sets}  (acc only)
     window.StudyCourseOpts             {mcq:{list,seed,md,tb,cat}, written:[chapters], englishOnlyNotion}
   Storage is unchanged: study-<course>, <mark>-srs, <mark>-typ, <mark>-ext, <mark>-extq, the textbook progress key.
   A classic script on purpose: its top-level names (D, CATS, QS, store, …) stay visible to the helper scripts
   loaded after it (course mode, quiz notes, course nav, cloud sync). */
const KEY = 'study-' + D.key;
const progressWrites = window.StudyCourseStorage ? window.StudyCourseStorage.forCourse(D.key,D.markKey) : {write(key,value){try{localStorage.setItem(key,value);return true;}catch(e){alert('Progress could not be saved. Keep this page open and retry after freeing browser storage.');return false;}}};
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const rich = s => esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>');
let store = {known:[], ans:{}};
try{ const r = localStorage.getItem(KEY); if(r) store = Object.assign(store, JSON.parse(r)); }catch(e){}
const save = () => { progressWrites.write(KEY,JSON.stringify(store)); window.__xs&&window.__xs.dirty(); };
const CATS = D.cats; // [[id,label],...]
/* links from Today: ?cat=<id>[,<id>…] opens those chapters, &missed=1 shows only missed questions */
const URL_CATS=(()=>{try{return (new URLSearchParams(location.search).get('cat')||'').split(',').filter(id=>id&&D.cats.some(c=>c[0]===id));}catch(e){return [];}})();
const catLabel = id => (CATS.find(c=>c[0]===id)||[0,id])[1];

function chipRow(box, sel, onPick, countFn){
  box.innerHTML='';
  [['all','All'],...CATS].forEach(([id,l])=>{
    const b=document.createElement('button'); b.type='button'; b.className='chip';
    b.setAttribute('aria-pressed', id===sel);
    b.innerHTML = esc(l)+'<span class="n">'+countFn(id)+'</span>';
    b.onclick=()=>onPick(id); box.appendChild(b);
  });
}

/* ---------- flashcards: spaced repetition (Anki-style) ---------- */
const DAY=86400000, TZ=7*3600000, MIN=60000;
const sod=t=>Math.floor((t+TZ)/DAY)*DAY-TZ;
let srs={}, meta={day:0,newDone:0}, NEWLIM=20;
try{ const r=JSON.parse(localStorage.getItem(D.markKey+'-srs')||'{}'); srs=r.s||{}; meta=r.m||meta; NEWLIM=r.lim||20; }catch(e){}
const saveS=()=>{ progressWrites.write(D.markKey+'-srs',JSON.stringify({s:srs,m:meta,lim:NEWLIM})); window.__xs&&window.__xs.dirty(); };
const chkDay=()=>{ const d=sod(Date.now()); if(meta.day!==d){ meta.day=d; meta.newDone=0; } };
const CARDS = D.cards.map((c,i)=>({id:i,cat:c[0],f:c[1],b:c[2],ref:c[3]||'',mid:c[4],tp:c[5],tb:c[6],ans:c[7]}));
let fcat=URL_CATS.length===1?URL_CATS[0]:'all', dirBack=false, cur=null, shown=false;
const LEARN=[1,10];
const CAN_TYPE=!!D.typing; let TYPING=CAN_YES();
function CAN_YES(){ if(!D.typing) return false; try{ return localStorage.getItem(D.markKey+'-typ')!=='0'; }catch(e){ return true; } }
const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[\s'’\-]+/g,'').replace(/[0-9]/g,'').replace(/[.,!?;:。，！？；：、（）()"“”]/g,'');
let checked=false, suggest=0;
function sched(s,r){
  const now=Date.now(); s=Object.assign({st:'learn',step:0,ease:2.5,ivl:0,lapses:0},s||{}); s.ts=now;
  const grad=ivl=>{ s.st='rev'; s.ivl=ivl; s.due=sod(now)+ivl*DAY; delete s.rl; };
  if(s.st==='learn'){
    if(r===1){ s.step=0; s.due=now+LEARN[0]*MIN; }
    else if(r===2){ s.due=now+(s.step===0?6:LEARN[1])*MIN; }
    else if(r===3){ if(s.step+1<LEARN.length){ s.step++; s.due=now+LEARN[s.step]*MIN; } else grad(s.rl||1); }
    else grad(s.rl?Math.max(s.rl+1,2):4);
  } else {
    if(r===1){ s.lapses++; s.ease=Math.max(1.3,s.ease-0.2); s.rl=Math.max(1,Math.round(s.ivl*0.5)); s.st='learn'; s.step=1; s.due=now+LEARN[1]*MIN; }
    else if(r===2){ s.ease=Math.max(1.3,s.ease-0.15); grad(Math.max(s.ivl+1,Math.round(s.ivl*1.2))); }
    else if(r===3){ grad(Math.max(s.ivl+1,Math.round(s.ivl*s.ease))); }
    else { s.ease+=0.15; grad(Math.max(s.ivl+1,Math.round(s.ivl*s.ease*1.3))); }
  }
  s.last=r; return s;
}
function lbl(s){
  if(s.st==='learn'){ const m=Math.max(1,Math.round((s.due-Date.now())/MIN)); return m<60?m+' min':Math.round(m/60)+' h'; }
  return s.ivl<30?s.ivl+' d':s.ivl<365?(s.ivl/30).toFixed(1).replace('.0','')+' mo':(s.ivl/365).toFixed(1).replace('.0','')+' y';
}
const inScope=c=>fcat==='all'||c.cat===fcat;
function queues(cat){
  chkDay(); const now=Date.now(); const L=[],R=[],N=[];
  CARDS.forEach(c=>{ if(!(cat==='all'||c.cat===cat)) return; const s=srs[c.mid];
    if(!s) N.push(c); else if(s.due<=now) (s.st==='learn'?L:R).push(c); });
  L.sort((a,b)=>srs[a.mid].due-srs[b.mid].due); R.sort((a,b)=>srs[a.mid].due-srs[b.mid].due);
  return {L,R,N:N.slice(0,Math.max(0,NEWLIM-meta.newDone))};
}
function cardsRow(){ chipRow($('#cats'), fcat, id=>{ fcat=id; $('#syncBtn').textContent='Save result to Notion'; $('#syncMsg').textContent=''; cardsRow(); renderCard(); }, id=>{ const q=queues(id); return q.L.length+q.R.length+q.N.length; }); }
function renderCard(){
  const q=queues(fcat); cur=q.L[0]||q.R[0]||q.N[0]||null; shown=false;
  $('#srsCounts').innerHTML='<span class="n"><b>'+q.N.length+'</b>new</span><span class="l"><b>'+q.L.length+'</b>learning</span><span class="d"><b>'+q.R.length+'</b>due</span>';
  const total=CARDS.filter(inScope).length, seen=CARDS.filter(c=>inScope(c)&&srs[c.mid]).length;
  $('#count').textContent='Started '+seen+'/'+total+(extN?' · extra '+extN:'');
  const st=$('#stage'), show=$('#showBtn'), rt=$('#rate4');
  if(!cur){
    const waits=CARDS.filter(c=>inScope(c)&&srs[c.mid]).map(c=>srs[c.mid].due).filter(d=>d>Date.now());
    let nx=''; if(waits.length){ const d=Math.min(...waits)-Date.now(); nx=' · next card in '+(d<3600000?Math.max(1,Math.round(d/MIN))+' min':d<DAY?Math.round(d/3600000)+' h':Math.round(d/DAY)+' d'); }
    st.innerHTML='<div class="empty"><b>All done for today</b><br>'+(q.N.length===0&&CARDS.some(c=>inScope(c)&&!srs[c.mid])?'Daily new-card limit reached (change it with “New/day”)':'No cards left')+nx+'</div>';
    show.hidden=true; rt.hidden=true; $('#typeBox').hidden=true; renderSync(); return;
  }
  show.hidden=false; show.textContent='Show answer'; rt.hidden=true;
  const typ=TYPING&&cur.ans&&cur.ans.length; const front=typ?cur.tp:(dirBack?cur.b:cur.f), back=typ?cur.tb:(dirBack?cur.f:cur.b);
  checked=false; suggest=0; $('#typeBox').hidden=!typ; $('#typeRes').textContent=''; $('#typeRes').className=''; $('#typeIn').value=''; $('#typeIn').disabled=false; $('#typeGo').disabled=false; document.querySelectorAll('#rate4 .btn').forEach(b=>b.classList.remove('sug'));
  st.innerHTML='<div class="card" tabindex="0" role="button" aria-label="Card, tap to flip">'+
   '<div class="face"><span class="cat-tag">'+esc(catLabel(cur.cat))+'</span><div class="front-t'+(String(front).length<=6?' big':'')+'">'+rich(front)+'</div><span class="hint">Tap to see the answer</span></div>'+
   '<div class="face back"><span class="cat-tag">'+esc(catLabel(cur.cat))+'</span><div class="back-t">'+rich(back)+'</div>'+(cur.ref?'<span class="ref">'+esc(cur.ref)+'</span>':'')+'<span class="hint" style="bottom:28px">Tap to see the question</span></div></div>';
  st.querySelector('.card').onclick=reveal;
  renderSync(); if(typ) setTimeout(()=>{ try{ $('#typeIn').focus({preventScroll:true}); }catch(e){} },0);
}
function reveal(){
  if(!cur) return; const c=$('.card'); const f=c.classList.toggle('flipped');
  $('#showBtn').textContent=f?'Show question':'Show answer';
  if(!shown){ shown=true; const rt=$('#rate4'); rt.hidden=false; const base=srs[cur.mid]||null;
    rt.querySelectorAll('.btn').forEach(b=>{ b.querySelector('small').textContent=lbl(sched(base,+b.dataset.r)); }); }
}
function rate(r){
  if(!cur||!shown) return; chkDay();
  if(!srs[cur.mid]) meta.newDone++;
  srs[cur.mid]=sched(srs[cur.mid]||null,r); saveS(); cardsRow(); renderCard();
}
$('#showBtn').onclick=reveal;
$('#rate4').querySelectorAll('.btn').forEach(b=>b.onclick=()=>rate(+b.dataset.r));
$('#dirBtn').onclick=e=>{ dirBack=!dirBack; e.target.setAttribute('aria-pressed',dirBack); e.target.textContent=dirBack?'Front: answer':'Front: term'; renderCard(); };
$('#limBtn').onclick=e=>{ NEWLIM=NEWLIM>=40?5:NEWLIM===5?10:NEWLIM===10?20:40; saveS(); e.target.textContent='New/day: '+NEWLIM; cardsRow(); renderCard(); };
$('#limBtn').textContent='New/day: '+NEWLIM;
let rs=0; $('#resetSrs').onclick=e=>{ if(!rs){ rs=1; e.target.textContent='Tap again to confirm reset'; setTimeout(()=>{rs=0;e.target.textContent='Reset progress'},4000); return; } srs={}; meta={day:0,newDone:0}; saveS(); rs=0; e.target.textContent='Reset progress'; cardsRow(); renderCard(); };
function check(){
  if(!cur||checked||!(TYPING&&cur.ans&&cur.ans.length)) return;
  const v=$('#typeIn').value; if(!v.trim()) return;
  checked=true; const ok=cur.ans.some(a=>norm(a)===norm(v)&&norm(a)!=='');
  suggest=ok?3:1; const r=$('#typeRes');
  r.className=ok?'okk':'nok'; r.textContent=ok?'✓ Correct · Enter again to continue ("Good")':'✗ Not quite · answer: '+cur.ans[0]+' · you typed: '+v+' · Enter again to continue ("Again")';
  $('#typeIn').disabled=true; $('#typeGo').disabled=true;
  if(!shown) reveal(); else $('.card').classList.add('flipped');
  document.querySelectorAll('#rate4 .btn').forEach(b=>b.classList.toggle('sug',+b.dataset.r===suggest));
  document.addEventListener('keydown',function once(ev){ if(ev.key==='Enter'&&checked&&suggest){ ev.preventDefault(); document.removeEventListener('keydown',once); rate(suggest); } else if(!checked) document.removeEventListener('keydown',once); });
}
$('#typeGo').onclick=check;
$('#typeIn').addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); e.stopPropagation(); check(); } });
const tb=$('#typBtn'); if(CAN_TYPE){ tb.hidden=false; const syncT=()=>{ tb.textContent='Typing: '+(TYPING?'on':'off'); tb.setAttribute('aria-pressed',TYPING); $('#dirBtn').hidden=TYPING; };
  syncT(); tb.onclick=()=>{ TYPING=!TYPING; progressWrites.write(D.markKey+'-typ',TYPING?'1':'0'); syncT(); renderCard(); }; }
document.addEventListener('keydown',e=>{
  if($('#tab-cards').hidden) return;
  if(e.target.tagName==='INPUT') return;
  if(e.key===' '&&e.target.tagName!=='BUTTON'){ e.preventDefault(); reveal(); }
  else if('1234'.includes(e.key)&&e.key) rate(+e.key);
});

/* ---------- summary ---------- */
let scat=URL_CATS.length===1?URL_CATS[0]:'all';
function renderSum(){
  chipRow($('#sumCats'), scat, id=>{scat=id;renderSum()}, id=>id==='all'?D.sum.length:D.sum.filter(s=>s.cat===id).length);
  $('#sumBody').innerHTML = D.sum.filter(s=>scat==='all'||s.cat===scat).map(s=>{
    let h='<div class="sec"><h2><span class="chtag">'+esc(catLabel(s.cat))+'</span>'+esc(s.h)+'</h2>';
    if(s.rows){ h+='<div class="tbl-wrap"><table>'+(s.head?'<tr><th>'+esc(s.head[0])+'</th><th>'+esc(s.head[1])+'</th></tr>':'')+s.rows.map(r=>'<tr><td>'+rich(r[0])+'</td><td>'+rich(r[1])+'</td></tr>').join('')+'</table></div>'; }
    if(s.tip) h+='<div class="tip">'+rich(s.tip)+'</div>';
    return h+'</div>';
  }).join('');
}

/* ---------- practice ---------- */
const QS = D.quiz.map((q,i)=>{ const o={id:i,cat:q[0],q:q[1],opts:q[2],exp:q[4]||''};
  let s=(i+1)*9301+49297; const r=()=>{s=(s*233280+49297)%2147483647;return s/2147483647};
  const idx=q[2].map((_,k)=>k); for(let k=idx.length-1;k>0;k--){const j=Math.floor(r()*(k+1));[idx[k],idx[j]]=[idx[j],idx[k]]}
  o.order=idx; o.right=q[3]; return o; });
/* ---------- extra practice sets (data/courses/<course>-extra.js: ids "<pre><n>" never shift) ---------- */
const XTRA=window.StudyCourseExtra||{}, OPT=window.StudyCourseOpts||{};
(XTRA.sets||[]).forEach(set=>set.rows.forEach((q,i)=>{ let s=(i+set.seed)*9301+49297; const r=()=>{s=(s*233280+49297)%2147483647;return s/2147483647};
  const idx=q[2].map((_,k)=>k); for(let k=idx.length-1;k>0;k--){const j=Math.floor(r()*(k+1));[idx[k],idx[j]]=[idx[j],idx[k]]}
  const o={id:set.pre+(i+set.from),cat:q[0],q:q[1],opts:q[2],exp:q[4],order:idx,right:q[3]}; if(set.case) o.case=q[5]||''; QS.push(o); }));
/* chapters that exist only in an extra set (acc: c10 Plant assets, from the 20 Nov practice exam) get a chip too */
Object.entries(OPT.extraCats||{}).forEach(([id,l])=>{ if(QS.some(q=>q.cat===id)&&!CATS.some(c=>c[0]===id)) CATS.push([id,String(l)]); });
/* near-duplicate questions hidden (answers stay saved) */
const QHIDE=new Set(XTRA.hide||[]);
/* quiz review (spaced repetition) */
let autoNext=0; let reviewOnly=/[?&]review=1\b/.test(location.search), reviewStart=Date.now(), dueSet=new Set(), showOld=false;
const isOldQ=q=>!!(window.StudyReview&&StudyReview.isOld&&StudyReview.isOld(store,q.id));
const retChip=()=>{const n=QS.filter(q=>(!qcats.size||qcats.has(q.cat))&&isOldQ(q)).length;return n||showOld?'<button class="chip" id="retBtn" aria-pressed="'+showOld+'" type="button" title="Answered right 2 times in a row. They stay out of the normal sets; a wrong answer sends one back.">Old questions<span class="n">'+n+'</span></button>':'';};
/* Difficulty tag (owner, 21 Nov 2026): from my own answers, no new storage. Wrong now or review box 0 = Hard, box 1 = Medium, box 2+ = Easy; unanswered = no tag. acc/eco/math only (where StudyQSets is loaded). */
function diffTag(q){ if(!window.StudyQSets||q.open||q.gen||store.ans[q.id]===undefined)return ''; const r=(store.rv||{})[q.id], box=Array.isArray(r)?+r[0]||0:(store.ans[q.id]===q.right?1:0);
  const lv=store.ans[q.id]!==q.right||box<1?['Hard','#e5484d']:box<2?['Medium','#d9a400']:['Easy','#2f9e5b'];
  return '<span class="dtag" data-diff="'+lv[0].toLowerCase()+'" title="Difficulty from your answers" style="display:inline-flex;align-items:center;gap:5px;margin-left:8px;padding:2px 9px;border-radius:999px;border:1.5px solid '+lv[1]+';font-size:12px;font-weight:700;line-height:1.5"><i style="width:9px;height:9px;border-radius:50%;background:'+lv[1]+';display:inline-block"></i>'+lv[0]+'</span>'; }
let redoAt=0,redoIds=new Set(); /* Start again (owner, 21 Nov 2026): in memory only; old answers stay until each question is answered again */
const reviewFresh=x=>(reviewOnly&&dueSet.has(String(x.id))&&((store.ats||{})[x.id]||0)<reviewStart)||(redoAt>0&&redoIds.has(String(x.id))&&((store.ats||{})[x.id]||0)<redoAt);
const setDone=()=>setsOn()&&qcats.size===1&&qset!=='all'&&deck.length>0&&deck.every(x=>!x.open&&store.ans[x.id]!==undefined&&!reviewFresh(x));
const revChip=()=>'<button class="chip" id="revBtn" aria-pressed="'+reviewOnly+'" type="button">Review due<span class="n">'+(window.StudyReview?QS.filter(q=>StudyReview.isDue(store,q.id,Date.now())).length:0)+'</span></button>';
for(let i=QS.length-1;i>=0;i--) if(QHIDE.has(String(QS[i].id))) QS.splice(i,1);
/* the course's own practice set (acc: scripts/acc-textbook-mcq.js, eco: eco-practice-mcq.js, math: math-practice-mcq.js) */
if(OPT.mcq&&OPT.mcq.cat&&(window[OPT.mcq.list]||[]).some(q=>q.cat===OPT.mcq.cat[0])&&!CATS.some(c=>c[0]===OPT.mcq.cat[0])) CATS.push(OPT.mcq.cat.slice());
(OPT.mcq&&window[OPT.mcq.list]||[]).forEach((q,i)=>{ let s=(i+OPT.mcq.seed)*9301+49297; const r=()=>{s=(s*233280+49297)%2147483647;return s/2147483647};
  const idx=q.opts.map((_,k)=>k); for(let k=idx.length-1;k>0;k--){const j=Math.floor(r()*(k+1));[idx[k],idx[j]]=[idx[j],idx[k]]}
  const o={id:q.id,cat:q.cat,q:q.q,opts:q.opts,exp:q.exp,order:idx,right:0,case:q.case||''}; if(OPT.mcq.md) o.md=true; if(OPT.mcq.tb&&q.ref) o.tb=q.ref.replace(/-/,' '); QS.push(o); });
let qJump=new URLSearchParams(location.search).get('q');
/* Fresh problems (acc, scripts/acc-generator.js): random-number questions made in the browser. Nothing stored for them:
   answers of earlier visits are dropped on load, so at most one batch (OPT.gen.n) of gen-* ids ever sits in study-<course>. */
function genLoad(){ if(!OPT.gen||!window.StudyAccGen) return;
  for(const k of ['ans','ats','rv']){ const o=store[k]; if(o&&typeof o==='object') Object.keys(o).forEach(id=>{ if(/^gen-/.test(id)) delete o[id]; }); }
  for(let i=QS.length-1;i>=0;i--) if(QS[i].gen) QS.splice(i,1);
  if(!CATS.some(c=>c[0]==='g')) CATS.push(['g','Fresh problems']);
  StudyAccGen.make((Date.now()%2147483000)+1,OPT.gen.n||30).forEach(q=>QS.push(q)); }
genLoad();
/* textbook written exercises (data/textbook-sos/chN.json): full problem, working box, solution, self-marked */
const TBP_KEY='studyos.accounting.textbook.progress.v1'; const tbReveal=new Set(); let tbTimer=null;
function tbNotes(id){ try{ const p=JSON.parse(localStorage.getItem(TBP_KEY)||'{}'); return (p&&p[id]&&typeof p[id].notes==='string')?p[id].notes:''; }catch(e){ return ''; } }
function tbJe(id){ try{ const p=JSON.parse(localStorage.getItem(TBP_KEY)||'{}'); return (p&&p[id]&&Array.isArray(p[id].je))?p[id].je:[]; }catch(e){ return []; } }
function tbFs(id){ try{ const p=JSON.parse(localStorage.getItem(TBP_KEY)||'{}'); return (p&&p[id]&&Array.isArray(p[id].fs))?p[id].fs:[]; }catch(e){ return []; } }
function tbSaveFs(id,rows){ try{ const raw=localStorage.getItem(TBP_KEY); const p=raw?JSON.parse(raw):{}; if(!p||typeof p!=='object'||Array.isArray(p)) return; const cur=(p[id]||{}).fs||[]; if(JSON.stringify(cur)===JSON.stringify(rows)) return; const rec={...(p[id]||{}),updated:new Date().toISOString()}; if(rows.length) rec.fs=rows; else delete rec.fs; p[id]=rec; localStorage.setItem(TBP_KEY,JSON.stringify(p)); }catch(e){} }
let fsCtl=null;
function tbSaveJe(id,rows){ try{ const raw=localStorage.getItem(TBP_KEY); const p=raw?JSON.parse(raw):{}; if(!p||typeof p!=='object'||Array.isArray(p)) return; const cur=(p[id]||{}).je||[]; if(JSON.stringify(cur)===JSON.stringify(rows)) return; const rec={...(p[id]||{}),updated:new Date().toISOString()}; if(rows.length) rec.je=rows; else delete rec.je; p[id]=rec; localStorage.setItem(TBP_KEY,JSON.stringify(p)); }catch(e){} }
let jeCtl=null;
function tbSave(id,text){ try{ const raw=localStorage.getItem(TBP_KEY); const p=raw?JSON.parse(raw):{}; if(!p||typeof p!=='object'||Array.isArray(p)) return; if(String((p[id]||{}).notes||'')===text) return; p[id]={...(p[id]||{}),notes:text,updated:new Date().toISOString()}; localStorage.setItem(TBP_KEY,JSON.stringify(p)); }catch(e){} }
(async()=>{ let added=0;
  for(const ch of (OPT.written||[])){ try{ const r=await fetch((OPT.writtenDir||'data/textbook-sos/ch')+ch+'.json',{cache:'no-cache'}); if(!r.ok) continue; const list=await r.json();
    for(const it of (Array.isArray(list)?list:[])){ if(!it||typeof it.id!=='string'||!it.prompt) continue; const id='tbw-'+it.id; if(QS.some(q=>q.id===id)) continue;
      QS.push({id,cat:'c'+ch,q:it.title||it.id,opts:['I got it','I missed it'],order:[0,1],right:0,exp:'',open:true,src:it.id,prompt:it.prompt,solution:it.solution||'',checks:Array.isArray(it.checks)?it.checks:[],je:window.StudyJE?StudyJE.parse(it.solution||''):[],fs:window.StudyFS?StudyFS.parse(it.solution||''):{title:'',rows:[]},tb:OPT.writtenDir?it.id.replace(/^[A-Z]+(\d+)-(\d+)$/,'Ch$1 · Problem $2'):it.id.replace('-',' ')+' · written',wtag:OPT.writtenTag}); added++; } }catch(e){} }
  if(added){ const cur=deck[qpos]&&deck[qpos].id; buildDeck(); if(cur&&!qJump){ const i=deck.findIndex(x=>x.id===cur); if(i>=0) qpos=i; } renderQ(); }
})();
/* owner, 21 Nov 2026: the practice view shows only the set chips and the tool row; topic, exam-guide and type rows are hidden (code kept), written questions are off unless ?type=written */
const SLIM_ROWS=true;
const QTYPE_KEY='studyos.'+D.key+'.qtype';
let qtype='mcq'; /* written questions are hidden from Practice (owner, 21 Nov 2026) */
const typeOk=q=>(!q.open||(qJump!==null&&String(q.id)===String(qJump))); /* written questions stay out of Practice (owner, 21 Nov 2026); a ?q= link to one still opens it */
let qcats=new Set(), missedOnly=/[?&]missed=1\b/.test(location.search), unansOnly=false, shuffleOn=false, deck=[], qpos=0, qStat='', qStatErr=false;
URL_CATS.forEach(id=>qcats.add(id));
/* question sets (scripts/study-qsets.js): repeats hidden, ≤50 questions a set, 3 sets a chapter, the next set opens at 90% answered right.
   Not applied to Review due, Missed, deep links (?q=) or Cram Mode, so nothing you need to redo is ever hidden. */
let qset=(()=>{try{const v=sessionStorage.getItem('studyos.'+D.key+'.qset');return v==='all'?'all':/^[0-9]$/.test(v||'')?+v:'auto';}catch(e){return 'auto';}})();
/* topic filter (scripts/acc-topics.js, acc only): with exactly one chapter chosen, narrow the questions to a topic. Nothing is stored. */
let qtopic='',qguide='';
const topicOf=q=>window.StudyAccTopics?StudyAccTopics.of(q):'';
/* exam-guide filter (owner, 20 Nov 2026, Final 1201101 study guide): chip row All / In exam guide / Outside guide. Nothing is stored. */
const guideOf=q=>window.StudyAccTopics&&StudyAccTopics.guide?StudyAccTopics.guide(q):'';
const guideOn=()=>!!window.StudyAccTopics&&!!StudyAccTopics.guide&&!CRAM;
function guideRow(){
  if(!guideOn())return '';
  const pool=QS.filter(q=>!q.gen&&typeOk(q)&&(!qcats.size||qcats.has(q.cat))),n=v=>pool.filter(q=>guideOf(q)===v).length;
  const chip=(v,l,c)=>'<button class="chip" type="button" data-qguide="'+v+'" aria-pressed="'+(qguide===v)+'">'+l+'<span class="n">'+c+'</span></button>';
  return '<div class="row qguides" role="group" aria-label="Exam guide" style="margin-bottom:8px">'+chip('','All questions',n('in')+n('out'))+chip('in','In exam guide',n('in'))+chip('out','Outside guide',n('out'))+'</div>'+(qguide?'<div class="count" style="margin:-2px 0 10px">'+(qguide==='in'?'Final 1201101 guide: merchandising, inventory (FIFO and weighted average), AIS, cash and internal control, receivables.':'LIFO, periodic non-average methods, retail/gross-profit estimates, specific identification and plant assets are not in the guide.')+' Shows every set.</div>':'');
}
const topicOn=()=>!!window.StudyAccTopics&&qcats.size===1&&StudyAccTopics.has([...qcats][0])&&!CRAM;
function topicRow(){
  if(!topicOn())return '';
  const one=[...qcats][0],SM=setsOn()?StudyQSets.build(QS.filter(q=>!q.gen)):null,pool=QS.filter(q=>q.cat===one&&!q.gen&&typeOk(q)&&(!SM||q.open||!SM.hidden.has(String(q.id))));
  const chip=(v,l,n)=>'<button class="chip" type="button" data-qtopic="'+esc(v)+'" aria-pressed="'+(qtopic===v)+'">'+esc(l)+'<span class="n">'+n+'</span></button>';
  return '<div class="row qtopics" role="group" aria-label="Topic" style="margin-bottom:8px">'+chip('','All topics',pool.length)+StudyAccTopics.topics(one).map(t=>[t,pool.filter(q=>topicOf(q)===t).length]).filter(x=>x[1]).map(x=>chip(x[0],x[0],x[1])).join('')+'</div>'+(qtopic?'<div class="count" style="margin:-2px 0 10px">Topic view shows every set of this chapter.</div>':'');
}
const setsOn=()=>!!window.StudyQSets&&!reviewOnly&&!missedOnly&&!qJump&&!CRAM;
function setsRow(){
  if(!setsOn())return '';
  const SM=StudyQSets.build(QS.filter(q=>!q.gen)),one=qcats.size===1?[...qcats][0]:null;
  if(one&&SM.sets[one]){const pr=StudyQSets.progress(SM.sets[one],store),cur=qset==='auto'?pr.current:qset;
    return '<div class="row qsets" role="group" aria-label="Question sets" style="margin-bottom:8px">'+pr.sets.map((x,k)=>'<button class="chip" type="button" data-qset="'+k+'" aria-pressed="'+(qset!=='all'&&cur===k)+'"'+(x.open?'':' disabled title="Opens when '+Math.round(StudyQSets.UNLOCK*100)+'% of set '+k+' is answered right"')+'>Set '+(k+1)+(x.done?' ✓':x.open?'':' 🔒')+'<span class="n">'+x.right+'/'+x.n+'</span></button>').join('')
     +'<button class="chip" type="button" data-qset="all" aria-pressed="'+(qset==='all')+'">All</button></div>'
     +'<div class="count" style="margin:-2px 0 10px">The next set opens when '+Math.round(StudyQSets.UNLOCK*100)+'% of this set is answered right.'+(SM.hidden.size?' '+SM.hidden.size+' repeated question'+(SM.hidden.size===1?'':'s')+' hidden.':'')+'</div>';}
  return '<div class="row qsets" role="group" aria-label="Question sets" style="margin-bottom:8px"><button class="chip" type="button" data-qset="auto" aria-pressed="'+(qset!=='all')+'">Current set of each chapter</button><button class="chip" type="button" data-qset="all" aria-pressed="'+(qset==='all')+'">All questions</button></div>'
   +'<div class="count" style="margin:-2px 0 10px">Each chapter has sets of 50 questions (one set when it has 50 or fewer); pick one chapter to choose a set.'+(SM.hidden.size?' '+SM.hidden.size+' repeated question'+(SM.hidden.size===1?'':'s')+' hidden.':'')+'</div>';
}
function buildDeck(keep){ const keepId=keep&&deck[qpos]?String(deck[qpos].id):null, keepPos=qpos; /* keep: stay on the current question (background reloads and cloud sync) */ if(window.StudyReview&&StudyReview.seed(store,QS,Date.now()))save(); /* questions from data/quiz.json arrive later, so schedule earlier answers here */ dueSet=new Set(window.StudyReview?StudyReview.dueIds(store,reviewStart):[]); const wrong=q=>store.ans[q.id]!==undefined&&store.ans[q.id]!==q.right, none=q=>store.ans[q.id]===undefined; const SM=setsOn()?StudyQSets.build(QS.filter(q=>!q.gen)):null, okSet=SM?StudyQSets.allowed(SM,store,(qtopic||qguide)?'all':qset):null; deck=QS.filter(q=>typeOk(q)&&(!q.gen||qcats.has('g'))&&(!SM||q.open||q.gen||(!SM.hidden.has(String(q.id))&&okSet.has(String(q.id))))&&(!qtopic||topicOf(q)===qtopic)&&(!qguide||guideOf(q)===qguide)&&(!reviewOnly||dueSet.has(String(q.id)))&&(reviewOnly||(showOld?isOldQ(q):!isOldQ(q)))&&(!qcats.size||qcats.has(q.cat))&&(!(missedOnly||unansOnly)||(missedOnly&&wrong(q))||(unansOnly&&none(q))));
  if(shuffleOn){ for(let i=deck.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [deck[i],deck[j]]=[deck[j],deck[i]]; } }
  qpos=0; if(qJump){ const ji=deck.findIndex(x=>String(x.id)===qJump); if(ji>=0) qpos=ji; }
  else if(keepId!==null){ const ki=deck.findIndex(x=>String(x.id)===keepId); qpos=ki>=0?ki:Math.min(keepPos,Math.max(0,deck.length-1)); } }
/* "Ask AI why" (owner idea, 18 Nov 2026): a link to tutor.html with the question, the options, my answer and the right one.
   Nothing is sent until Send is tapped there (the tutor uses the owner's own key). */
function askPrompt(q,mine){ const L='ABCDEFGH',o=q.opts.map((t,i)=>L[i]+') '+String(t).replace(/\*\*/g,'')).join('\n'),x=t=>String(t==null?'':t).replace(/\*\*/g,'');
  return 'Practice question: '+x(q.q)+'\n'+o+'\n\n'+(q.opts[mine]!==undefined?'My answer: '+L[mine]+') '+x(q.opts[mine])+'\n':'')+'Correct answer: '+L[q.right]+') '+x(q.opts[q.right])+'\n\nExplain why the correct answer is right'+(q.opts[mine]!==undefined&&mine!==q.right?' and why mine is wrong':'')+', step by step. Then give me one similar question to try.'; }
function askAI(q,mine){ return '<div style="margin-top:8px"><a class="btn" style="min-height:44px;display:inline-flex;align-items:center" href="tutor.html?course='+encodeURIComponent(D.key)+'&cat='+encodeURIComponent(q.cat)+'&q='+encodeURIComponent(askPrompt(q,mine).slice(0,6000))+'">Ask AI why</a></div>'; }
/* Cram Mode (?tab=prac&cram=1): one read-only page of the questions to fix before the exam — answered wrong now,
   or back in review box 0 — each with its right answer and explanation. Never changes answers. */
const CRAM=/[?&]cram=1\b/.test(location.search);
function cramList(){
  const rv=store.rv||{};
  return QS.filter(q=>!q.open&&!q.gen&&(!qcats.size||qcats.has(q.cat))&&store.ans[q.id]!==undefined&&(store.ans[q.id]!==q.right||(Array.isArray(rv[q.id])&&rv[q.id][0]===0)))
    .map(q=>({q,wrong:store.ans[q.id]!==q.right})).sort((a,b)=>(b.wrong-a.wrong)||CATS.findIndex(c=>c[0]===a.q.cat)-CATS.findIndex(c=>c[0]===b.q.cat));
}
function renderCram(box){
  const list=cramList(),answered=QS.filter(q=>!q.open&&store.ans[q.id]!==undefined).length;
  let h='<div class="cram-head"><b>Cram Mode</b> · '+list.length+' question'+(list.length===1?'':'s')+' to fix'+(qcats.size?' in the chosen chapters':'')+' · <a href="'+D.key+'.html?tab=prac">Back to practice</a></div>';
  if(!list.length){ box.innerHTML=h+'<div class="empty">'+(answered?'Nothing to fix here: every answered question is right. Practise more questions to find weak spots.':'No answers yet. Do some practice first; the questions you get wrong will show up here.')+'</div>'; return; }
  h+='<ol class="cram-list">'+list.map(({q,wrong})=>{ const right=q.opts[q.right],mine=store.ans[q.id];
    return '<li class="qcard"><div class="qmeta"><span>'+esc(catLabel(q.cat))+'</span>'+(wrong?'<b class="cram-tag">Wrong</b>':'<b class="cram-tag soft">Review</b>')+'</div>'
     +(q.case?'<div class="qcase" style="border:1px solid var(--line,rgba(127,127,127,.35));border-radius:10px;padding:8px 12px;margin:6px 0;font-size:14px">'+(q.md&&window.StudySosMd?StudySosMd(q.case):rich(q.case))+'</div>':'')
     +'<p class="qtext">'+rich(q.q)+'</p><div class="explain good"><b class="v">Answer: '+rich(right)+'</b>'+(wrong&&q.opts[mine]!==undefined?'<div class="cram-mine">You chose: '+rich(q.opts[mine])+'</div>':'')+(q.exp?rich(q.exp):'')+askAI(q,wrong?mine:undefined)+'</div></li>'; }).join('')+'</ol>';
  box.innerHTML=h;
}
const jpics=(q,when)=>window.AccJournalPics?AccJournalPics.html(q.id,when):'';
function renderQ(){
  (function(box){ box.innerHTML='';
    [['all','All'],...CATS].forEach(([id,l])=>{
      const b=document.createElement('button'); b.type='button'; b.className='chip';
      b.setAttribute('aria-pressed', id==='all'?!qcats.size:qcats.has(id));
      const inCat=id==='all'?[]:QS.filter(q=>q.cat===id), mastered=inCat.length&&inCat.every(isOldQ);
      if(mastered) b.title='Mastered: every question here is an old question';
      b.innerHTML=esc(l)+(mastered?' ✓':'')+'<span class="n">'+QS.filter(q=>typeOk(q)&&(id==='all'?!q.gen:q.cat===id)).length+'</span>';
      b.onclick=()=>{ if(id==='all')qcats.clear(); else if(qcats.has(id))qcats.delete(id); else qcats.add(id); qtopic=''; qJump=null; buildDeck();renderQ(); };
      box.appendChild(b); });
  })($('#qCats'));
  if(CRAM){ renderCram($('#qBody')); return; }
  const box=$('#qBody');
  const answered=QS.filter(q=>store.ans[q.id]!==undefined), correct=answered.filter(q=>store.ans[q.id]===q.right);
  let h='<div class="score"><span class="big">'+correct.length+'/'+answered.length+'</span><span class="count">correct / answered ('+QS.length+' total)</span></div>';
  if(qStat&&qStatErr) h+='<div class="count" style="margin:-4px 0 10px;'+(qStatErr?'color:#b3261e':'')+'">'+esc(qStat)+'</div>';
  h+=setsRow()+(SLIM_ROWS?'':topicRow()+guideRow());
  if(OPT.written&&!SLIM_ROWS) h+='<div class="row" role="group" aria-label="Question type" style="margin-bottom:8px">'+[['all','All types'],['mcq','Multiple choice'],['written','Written']].map(([v,l])=>'<button class="chip qtype" type="button" data-qtype="'+v+'" aria-pressed="'+(qtype===v)+'">'+l+'<span class="n">'+QS.filter(q=>v==='all'||(v==='written'?!!q.open:!q.open)).length+'</span></button>').join('')+'</div>';
  h+='<div class="row" style="margin-bottom:12px">'+revChip()+'<button class="chip" id="missBtn" aria-pressed="'+missedOnly+'" type="button">Missed</button><button class="chip" id="unansBtn" aria-pressed="'+unansOnly+'" type="button">Unanswered</button>'+(setDone()?'<button class="chip" id="againBtn" type="button" aria-pressed="true">Start again</button>':'')+'<button class="chip" id="shufBtn" aria-pressed="'+shuffleOn+'" type="button">Shuffle</button>'+retChip()+(OPT.gen&&qcats.has('g')?'<button class="chip" id="genBtn" type="button">New problems</button>':'')+'<button class="chip" id="resetBtn" type="button">Clear answers</button></div>';
  if(!deck.length){ box.innerHTML=h+'<div class="empty">'+(reviewOnly?'Nothing to review right now. Come back tomorrow.':showOld?'No old questions here yet. A question becomes old after 2 right answers in a row.':QS.some(isOldQ)&&QS.filter(q=>typeOk(q)&&(!qcats.size||qcats.has(q.cat))).every(isOldQ)?'Everything here is an old question (answered right 2 times in a row). Tap Old questions to review them.':(missedOnly||unansOnly)?'No questions match this filter':'No questions in this chapter')+'</div>'; wireQ(); return; }
  const q=deck[qpos], ch=store.ans[q.id], done=ch!==undefined&&!reviewFresh(q);
  if(qJump&&deck.some(x=>String(x.id)===qJump)&&String(q.id)!==qJump) qJump=null; /* deep link used once you move on */
  window.StudyLast&&StudyLast.mark({href:D.key+'.html?tab=prac&q='+encodeURIComponent(q.id),title:D.title+' · Practice',sub:'Q '+(qpos+1)+' · '+q.q,course:D.key});
  h+='<div class="qcard"><div class="qbar"><i style="width:'+((qpos+1)/deck.length*100)+'%"></i></div><div class="qmeta"><b>Q '+(qpos+1)+'/'+deck.length+'</b><span>'+esc(catLabel(q.cat))+'</span>'+diffTag(q)+'</div>';
  if(q.tb) h+='<div class="qsrc" style="font-size:12px;opacity:.7;margin:4px 0">'+esc(q.wtag||'Textbook style')+' · '+esc(q.tb)+'</div>';
  if(q.case) h+='<div class="qcase" style="border:1px solid var(--line,rgba(127,127,127,.35));border-radius:10px;padding:10px 12px;margin:8px 0 12px;font-size:14px;line-height:1.55;overflow-wrap:anywhere">'+(q.md&&window.StudySosMd?StudySosMd(q.case):rich(q.case))+'</div>';
  if(q.open){ const shown=done||tbReveal.has(q.id);
    h+='<p class="qtext"><b>'+esc(q.q)+'</b></p><div class="qcase sos-body" style="border:1px solid var(--line,rgba(127,127,127,.35));border-radius:10px;padding:10px 12px;margin:8px 0 10px;font-size:15px">'+StudySosMd(q.prompt)+'</div>';
    const jeOn=!!(q.je&&q.je.length&&window.StudyJE), fsOn=!!(q.fs&&q.fs.rows&&q.fs.rows.length&&window.StudyFS);
    if(jeOn) h+=StudyJE.html();
    if(fsOn) h+=StudyFS.html();
    h+='<textarea id="tbAns" class="tb-ans'+(jeOn||fsOn?' tb-ans-sm':'')+'" maxlength="15000" placeholder="'+(jeOn||fsOn?'Other working (optional). Saved on this device.':(OPT.writtenDir?'Work it out here. Saved on this device.':'Work it out here. Saved on this device (shared with the textbook in My PDF sets).'))+'" aria-label="Your working"></textarea>';
    if(!done&&q.checks.length) h+='<div id="tbChecks">'+StudySosChecks.html(q.checks)+'<div class="tb-row" id="tbQuick" hidden><span class="count">All correct.</span><button class="btn primary" id="tbGotQuick" type="button">Mark as got it</button></div></div>';
    if(!shown) h+='<div class="tb-row"><button class="btn primary" id="tbShow" type="button">Show solution</button></div>';
    else { h+='<div class="explain"><b class="v">Solution</b><div class="sos-body">'+StudySosMd(q.solution)+'</div></div>';
      h+= done ? '<div class="count" style="margin-top:8px">'+(ch===q.right?'Marked: got it':'Marked: missed · it will come back in Review due')+'</div>' : '<div class="tb-row"><span class="count">How did you do?</span><button class="btn" id="tbGot" type="button">I got it</button><button class="btn" id="tbMiss" type="button">I missed it</button></div>'; }
  } else {
  h+='<p class="qtext">'+rich(q.q)+'</p>'+jpics(q,'before')+'<div class="opts">';
  q.order.forEach((oi,k)=>{ let cls='opt'; if(done){ cls+= oi===q.right?' right':(oi===ch?' wrong':' dim'); }
    h+='<button type="button" class="'+cls+'" data-oi="'+oi+'" '+(done?'disabled':'')+'><span class="k">'+'ABCD'[k]+'</span><span>'+rich(q.opts[oi])+'</span></button>'; });
  h+='</div>';
  if(done){ const ok=ch===q.right; h+='<div class="explain '+(ok?'good':'bad')+'"><b class="v">'+(ok?'Correct':'Not quite · answer '+'ABCD'[q.order.indexOf(q.right)])+'</b>'+rich(q.exp)+jpics(q,'after')+(ok?'':askAI(q,ch))+'</div>'; }
  }
  const scrOn=!!window.StudyScratch&&!q.gen, scrId=D.key+':'+q.id;
  if(scrOn&&StudyScratch.isOpen()) h+='<div id="scrBox"></div>';
  h+='<div class="qnav"><button class="btn" id="qprev" type="button" '+(qpos===0?'disabled':'')+'>Previous</button>'+(scrOn?'<button class="btn" id="qscr" type="button" aria-pressed="'+StudyScratch.isOpen()+'">Scratchpad'+(StudyScratch.has(scrId)?' ✎':'')+'</button>':'')+'<button class="btn primary" id="qnext" type="button" '+(qpos===deck.length-1?'disabled':'')+'>Next</button></div></div>';
  h+='<div class="cells">'+deck.map((x,i)=>{const a=store.ans[x.id]; return '<button type="button" class="cell'+(a===undefined||reviewFresh(x)?'':(a===x.right?' ok':' no'))+(i===qpos?' cur':'')+'" data-i="'+i+'" aria-label="Question '+(i+1)+'">'+(i+1)+'</button>'}).join('')+'</div>';
  box.innerHTML=h;
  box.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{ store.ans[q.id]=+b.dataset.oi; (store.ats=store.ats||{})[q.id]=Date.now(); window.StudyReview&&StudyReview.record(store,q.id,store.ans[q.id]===q.right,Date.now()); save(); const ok=store.ans[q.id]===q.right; renderQ();
    /* right answer: move on by itself after a moment (owner, 23 Nov 2026); a wrong one stays so the answer can be read */
    if(ok&&qpos<deck.length-1){ const at=qpos,id=String(q.id); clearTimeout(autoNext); autoNext=setTimeout(()=>{ if(qpos===at&&deck[qpos]&&String(deck[qpos].id)===id){ qpos++; renderQ(); } },900); } });
  if(q.open){ const ta=$('#tbAns'); if(ta){ ta.value=tbNotes(q.src); ta.oninput=()=>{ clearTimeout(tbTimer); tbTimer=setTimeout(()=>tbSave(q.src,ta.value),400); }; ta.onblur=()=>{ clearTimeout(tbTimer); tbSave(q.src,ta.value); }; }
    jeCtl=null; const jb=$('#jeBox'); if(jb) jeCtl=StudyJE.mount(jb,{answer:q.je,rows:tbJe(q.src),save:rows=>tbSaveJe(q.src,rows),onAllCorrect:done?null:()=>mark(0)});
    fsCtl=null; const fb=$('#fsBox'); if(fb) fsCtl=StudyFS.mount(fb,{answer:q.fs,rows:tbFs(q.src),save:rows=>tbSaveFs(q.src,rows),onAllCorrect:done?null:()=>mark(0)});
    const flush=()=>{ if(ta){ clearTimeout(tbTimer); tbSave(q.src,ta.value); } if(jeCtl) jeCtl.flush(); if(fsCtl) fsCtl.flush(); };
    const sb=$('#tbShow'); if(sb) sb.onclick=()=>{ flush(); tbReveal.add(q.id); renderQ(); };
    const mark=v=>{ flush(); store.ans[q.id]=v; (store.ats=store.ats||{})[q.id]=Date.now(); window.StudyReview&&StudyReview.record(store,q.id,v===q.right,Date.now()); save(); renderQ(); };
    StudySosChecks.wire($('#tbChecks'),q.checks,(ok,filled,total)=>{ const qk=$('#tbQuick'); if(qk) qk.hidden=!(ok===total); });
    const gq=$('#tbGotQuick'); if(gq) gq.onclick=()=>mark(0);
    const g=$('#tbGot'); if(g) g.onclick=()=>mark(0); const m=$('#tbMiss'); if(m) m.onclick=()=>mark(1); }
  box.querySelectorAll('.cell').forEach(b=>b.onclick=()=>{ qpos=+b.dataset.i; renderQ(); });
  { const sb=$('#qscr'); if(sb) sb.onclick=()=>{ StudyScratch.setOpen(!StudyScratch.isOpen()); renderQ(); };
    const sx=$('#scrBox'); if(sx) StudyScratch.mount(sx,scrId,has=>{ const b=$('#qscr'); if(b) b.textContent='Scratchpad'+(has?' ✎':''); }); }
  const p=$('#qprev'), n=$('#qnext'); if(p) p.onclick=()=>{qpos--;renderQ()}; if(n) n.onclick=()=>{qpos++;renderQ()};
  wireQ();
}
function wireQ(){
  document.querySelectorAll('#qBody [data-qguide]').forEach(b=>b.onclick=()=>{ qguide=b.dataset.qguide||''; qJump=null; buildDeck(); renderQ(); });
  document.querySelectorAll('#qBody [data-qtopic]').forEach(b=>b.onclick=()=>{ qtopic=b.dataset.qtopic||''; qJump=null; buildDeck(); renderQ(); });
  document.querySelectorAll('#qBody [data-qset]').forEach(b=>b.onclick=()=>{ const v=b.dataset.qset; qset=v==='all'?'all':v==='auto'?'auto':+v; try{sessionStorage.setItem('studyos.'+D.key+'.qset',String(qset));}catch(e){} buildDeck(); renderQ(); });
  document.querySelectorAll('#qBody .qtype').forEach(b=>b.onclick=()=>{ qtype=b.dataset.qtype; try{sessionStorage.setItem(QTYPE_KEY,qtype);}catch(e){} qJump=null; buildDeck(); renderQ(); });
  const ab=$('#againBtn'); if(ab) ab.onclick=()=>{redoIds=new Set(deck.map(x=>String(x.id)));redoAt=Date.now();shuffleOn=true;qJump=null;buildDeck();renderQ()};
  const rb=$('#revBtn'); if(rb) rb.onclick=()=>{reviewOnly=!reviewOnly;qJump=null;reviewStart=Date.now();qpos=0;buildDeck();renderQ()};
  const m=$('#missBtn'); if(m) m.onclick=()=>{missedOnly=!missedOnly;qJump=null;buildDeck();renderQ()};
  const u=$('#unansBtn'); if(u) u.onclick=()=>{unansOnly=!unansOnly;qJump=null;buildDeck();renderQ()};
  const rt=$('#retBtn'); if(rt) rt.onclick=()=>{showOld=!showOld;qpos=0;buildDeck();renderQ()};
  const gb=$('#genBtn'); if(gb) gb.onclick=()=>{genLoad();qJump=null;qpos=0;save();buildDeck();renderQ()};
  const sh=$('#shufBtn'); if(sh) sh.onclick=()=>{shuffleOn=!shuffleOn;buildDeck();renderQ()};
  const r=$('#resetBtn'); if(r) r.onclick=()=>{ if(!window.confirm('Clear all practice answers for this subject? Scores and answer history will be removed.')) return; store.ans={}; store.ats={}; store.rv={}; store.rst=Date.now(); save(); buildDeck(); renderQ(); };
}

/* ---------- tabs ---------- */
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.tabs button').forEach(x=>x.setAttribute('aria-selected',x===b));
  ['cards','sum','prac'].forEach(t=>$('#tab-'+t).hidden = t!==b.dataset.tab);
});

/* ---------- Notion sync (via the viewer's Notion connector) ---------- */
const STEPS=[1,3,7,14,30], PASS=0.8, NOTION="Notion";
let mcp=null, syncing=false, owner=false;
const todayBkk=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Bangkok"}).format(new Date());
function scopeT(){ const sc=CARDS.filter(c=>c.cat===fcat); const seen=sc.filter(c=>srs[c.mid]); const g=seen.filter(c=>srs[c.mid].last>=3).length; return {g,b:seen.length-g,n:sc.length}; }
function renderSync(){
  const box=$('#sync'); const page=(D.pages||{})[fcat];
  if(!box) return;
  if(fcat==='all'||!page||!((owner&&mcp)||(window.__xs&&window.__xs.reviewReady()))){ box.hidden=true; return; }
  const t=scopeT(); if(t.n===0||t.g+t.b<t.n){ box.hidden=true; return; }
  box.hidden=false; const pass=t.g/t.n>=PASS, pct=Math.round(t.g/t.n*100);
  $('#syncText').textContent=pass?'Good/Easy '+pct+'% · passed 80% → Review Step +1':'Good/Easy '+pct+'% · below 80% → Review Step back to 0 (review again tomorrow)';
  if(!syncing) $('#syncBtn').disabled=false;
}
function errText(e,writing){
  switch(e&&e.code){
    case "server_not_connected": return "Notion is not connected: add Notion in claude.ai Settings → Connectors, then try again";
    case "needs_reauth": return "Notion connection expired: reconnect in claude.ai Settings → Connectors";
    case "selection_required": return "More than one Notion account: choose one in the claude.ai window, then try again";
    case "approval_required": case "not_in_manifest": case "consent_required": return "This page is not yet allowed to use Notion; tap again and choose Allow";
    case "blocked_by_policy": return "Your organization does not allow Notion from this page";
    case "tool_error": return "Notion refused the save: "+(e.message||"").slice(0,160);
    case "server_unavailable": case "upstream_error": return writing?"Notion did not reply; it may have saved. Check the chapter page in Notion before trying again.":"Notion is temporarily unreachable; try again shortly";
    default: return "Save failed ("+((e&&e.code)||"unknown")+")";
  }
}
async function syncViaApi(){
  const page=(D.pages||{})[fcat]; if(!page||syncing) return;
  const t=scopeT(), pass=t.g/t.n>=PASS, msg=$('#syncMsg'); const X=window.__xs;
  syncing=true; $('#syncBtn').disabled=true; msg.className=''; msg.textContent='Saving to Notion…';
  let done=false;
  try{
    const reviewApi=await X.reviewApi();
    if(!X.reviewReady())throw Error('Original Notion Worker credential is missing');
    const r=await fetch(reviewApi+'/review',{method:'POST',headers:X.reviewHdr(),body:JSON.stringify({page,pass})});
    const j=await r.json().catch(()=>({}));
    if(r.status===401){ msg.className='err'; msg.textContent='Wrong sync key; use the ☁ button to set it again'; }
    else if(!r.ok||!j.ok){ msg.className='err'; msg.textContent='Save failed ('+(j.error||r.status)+')'; }
    else if(j.already){ msg.className='ok'; msg.textContent='Already saved today · Review Step = '+j.step; done=true; $('#syncBtn').textContent='Saved ✓'; }
    else{ msg.className='ok'; msg.textContent='Saved · '+catLabel(fcat)+': Last review '+j.today+' · Review Step '+j.step+' → '+j.next+' · next review in '+STEPS[Math.min(j.next,STEPS.length-1)]+' days'; done=true; $('#syncBtn').textContent='Saved ✓'; }
  }catch(e){ msg.className='err'; msg.textContent='Could not reach the sync server; try again'; }
  syncing=false; if(!done) $('#syncBtn').disabled=false;
}
async function syncNotion(){
  if(!(owner&&mcp)&&window.__xs&&window.__xs.reviewReady()) return syncViaApi();
  const page=(D.pages||{})[fcat]; if(!mcp||!page||syncing) return;
  const t=scopeT(), pass=t.g/t.n>=PASS;
  syncing=true; $('#syncBtn').disabled=true;
  const msg=$('#syncMsg'); msg.className=''; msg.textContent='Reading the current Review Step from Notion…';
  let step=0;
  try{
    const r=await mcp.callTool(NOTION,"notion-fetch",{id:page},{cache:false});
    const p=r.payload; const text=typeof p==="string"?p:(p&&typeof p.text==="string"?p.text:JSON.stringify(p));
    const m=text.match(/\\?"Review Step\\?"\s*:\s*(\d+(?:\.\d+)?)/); if(m) step=Math.max(0,Math.round(Number(m[1])));
  }catch(e){ msg.className='err'; msg.textContent=errText(e,false); syncing=false; $('#syncBtn').disabled=false; return; }
  const next=pass?step+1:0, today=todayBkk();
  msg.textContent='Saving to Notion…';
  try{
    await mcp.callTool(NOTION,"notion-update-page",{page_id:page,command:"update_properties",properties:{"date:Last review:start":today,"date:Last review:is_datetime":0,"Review Step":next}});
    msg.className='ok'; msg.textContent='Saved · '+catLabel(fcat)+': Last review '+today+' · Review Step '+step+' → '+next+' · next review in '+STEPS[Math.min(next,STEPS.length-1)]+' days';
    $('#syncBtn').textContent='Saved ✓';
  }catch(e){ msg.className='err'; msg.textContent=errText(e,true); $('#syncBtn').disabled=false; }
  syncing=false;
}
$('#syncBtn').onclick=syncNotion;
// Notion is no longer used (owner decision, 15 Nov 2026): cards and questions come only from the saved snapshot.
loadStatic();

/* ---------- extra cards from the Notion "Flashcards" table ---------- */
const SUBJ={acc:'Accounting',math:'Math for Life',eco:'Economics',eng:'English Vocab',zh:'Chinese'}[D.key];
const EXT_DS='collection://7eb4091a-8830-43de-8185-cd26b65d5ce7', EXT_KEY=D.markKey+'-ext';
let extN=0;
function setExt(rows){
  for(let i=CARDS.length-1;i>=0;i--) if(String(CARDS[i].mid).startsWith('n-')) CARDS.splice(i,1);
  extN=0;
  (rows||[]).forEach(r=>{ if(r.Status!=='Verified') return; const hit=CATS.find(c=>c[1]===r.Chapter); if(!hit||!r.Front) return;
    const mid='n-'+String(r.page_id||r.url||r.Front).split('?')[0].split('/').pop();
    if(CARDS.some(c=>c.mid===mid)) return;
    CARDS.push({id:CARDS.length,cat:hit[0],f:r.Front,b:r.Back||'',ref:r.Ref||'',mid}); extN++; });
}
try{ setExt(JSON.parse(localStorage.getItem(EXT_KEY)||'[]')); }catch(e){}

const FC_VIEW='https://app.notion.com/p/3156c08e298f410a9782144f64a3ae69?v=a0498df1-b75a-4f90-b6a0-00753d39bc96';
const Q_VIEW='https://app.notion.com/p/776e2eeaf73e4154812ae8e4813f9be6?v=696b7bb301874367829744d89c404695';
const unesc=s=>typeof s==='string'?s.replace(/\\([\\|$*_`~\[\]()<>#+\-.!&])/g,'$1'):s;
async function fetchRows(view){
  const out=[]; let cursor=null;
  for(let i=0;i<8;i++){
    const a={mode:'view',view_url:view,page_size:100}; if(cursor) a.start_cursor=cursor;
    const r=await mcp.callTool(NOTION,"notion-query-data-sources",{data:a},{cache:false});
    let p=r.payload; if(typeof p==="string"){ try{ p=JSON.parse(p); }catch(e){} }
    if(p&&typeof p.text==="string"){ try{ p=JSON.parse(p.text); }catch(e){} }
    if(!p||!Array.isArray(p.results)) throw new Error('bad payload');
    p.results.forEach(x=>{ if(x.Subject===SUBJ){ const y={}; for(const k in x) y[k]=unesc(x[k]); out.push(y); } });
    if(!p.has_more||!p.next_cursor) break; cursor=p.next_cursor;
  }
  return out;
}
async function loadExt(){
  if(!mcp||!SUBJ) return;
  try{
    const rows=await fetchRows(FC_VIEW);
    setExt(rows); try{ localStorage.setItem(EXT_KEY,JSON.stringify(rows)); }catch(e){}
    cardsRow(); if(!shown) renderCard();
  }catch(e){}
}

/* ---------- extra quiz questions from the Notion "Quiz" table ---------- */
const QDS='collection://21fcc8d7-5e96-4061-a02f-d71fc5705812', QKEY=D.markKey+'-extq';
function hashN(s){ let h=7; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))%1000003; return h; }
function setExtQ(rows){
  for(let i=QS.length-1;i>=0;i--) if(String(QS[i].id).startsWith('n-')) QS.splice(i,1);
  (rows||[]).forEach(r=>{ if(r.Status!=='Verified') return; const hit=CATS.find(c=>c[1]===r.Chapter); if(!hit||!r.Question||!r.Correct) return;
    if(OPT.englishOnlyNotion&&/[\u0E00-\u0E7F]/.test([r.Question,r.Correct,r['Wrong 1'],r['Wrong 2'],r['Wrong 3'],r.Explanation].join(' '))) return; // English-only practice (owner, 15 Nov 2026)
    const opts=[r.Correct,r['Wrong 1'],r['Wrong 2'],r['Wrong 3']].filter(x=>x&&String(x).trim());
    if(opts.length<2) return;
    const id='n-'+String(r.page_id||r.url||r.Question).split('?')[0].split('/').pop();
    if(typeof QHIDE!=='undefined'&&QHIDE.has(id)) return;
    let s=hashN(id)+49297; const rn=()=>{s=(s*233280+49297)%2147483647;return s/2147483647};
    const idx=opts.map((_,k)=>k); for(let k=idx.length-1;k>0;k--){const j=Math.floor(rn()*(k+1));[idx[k],idx[j]]=[idx[j],idx[k]]}
    QS.push({id,cat:hit[0],q:r.Question,opts,exp:r.Explanation||'',order:idx,right:0}); });
}
const EMBQ_ROWS=typeof EMBQ!=='undefined'&&Array.isArray(EMBQ)?EMBQ:[]; /* data/courses/<course>-snapshot.js */
try{ const _c=JSON.parse(localStorage.getItem(QKEY)||'[]'); const _m=new Map(); EMBQ_ROWS.forEach(r=>_m.set(r.url,r)); _c.forEach(r=>_m.set(r.url,r)); setExtQ([..._m.values()]); buildDeck(); }catch(e){}
async function loadExtQ(){
  if(!SUBJ) return;
  if(!mcp){ qStat='Notion not connected — using built-in questions (as of 10 Nov 2026)'; qStatErr=false; renderQ(); loadStatic(); return; }
  qStat='Loading questions from Notion…'; qStatErr=false; renderQ();
  let lastErr=null;
  for(let a=0;a<3;a++){
    try{
      const rows=await fetchRows(Q_VIEW);
      try{ localStorage.setItem(QKEY,JSON.stringify(rows)); }catch(e){}
      setExtQ(rows);
      const n=QS.filter(q=>String(q.id).startsWith('n-')).length;
      qStat='Loaded from Notion · added '+n+' ข้อ'; qStatErr=false;
      if(qpos>=QS.length) qpos=0; buildDeck(true); renderQ(); return;
    }catch(e){ lastErr=e; await new Promise(r=>setTimeout(r,2500*(a+1))); }
  }
  const n=QS.filter(q=>String(q.id).startsWith('n-')).length;
  qStat='Could not load from Notion ('+String((lastErr&&lastErr.message)||lastErr||'').slice(0,60)+') — using '+n+' saved questions';
  qStatErr=true; renderQ();
}
async function loadStatic(){
  await 0;
  if(!SUBJ) return;
  try{
    const getJ=async(name)=>{
      // Notion is no longer used (owner decision, 15 Nov 2026): read only the saved snapshot in data/.
      const r=await fetch('data/'+name+'.json',{cache:'no-store'}); if(!r.ok) throw new Error(name+' '+r.status); return r.json();
    };
    const [q,c]=await Promise.all([getJ('quiz'), getJ('cards').catch(()=>null)]);
    const rows=(q.rows||[]).filter(x=>x.Subject===SUBJ);
    setExtQ(rows); try{ localStorage.setItem(QKEY,JSON.stringify(rows)); }catch(e){}
    if(c&&c.rows){ const cr=c.rows.filter(x=>x.Subject===SUBJ); setExt(cr); try{ localStorage.setItem(EXT_KEY,JSON.stringify(cr)); }catch(e){} cardsRow(); if(!shown) renderCard(); }
    const n=QS.filter(x=>String(x.id).startsWith('n-')).length;
    qStat='Saved questions · added '+n+' questions · updated '+(q.updated||'-'); qStatErr=false;
    if(qpos>=QS.length) qpos=0; buildDeck(true); renderQ();
  }catch(e){}
}
setInterval(()=>{ if(!cur&&!$('#tab-cards').hidden){ cardsRow(); renderCard(); } },20000);
if(!D.sum.length) document.querySelectorAll('.tabs button').forEach(b=>{ if(b.dataset.tab!=='cards') b.hidden=true; });
cardsRow(); renderCard(); renderSum(); buildDeck(); renderQ();
/* ---------- cross-device progress sync + Notion save via the Worker ---------- */
window.__xs=(()=>{
  const LSK='study-sync-key', PROGRESS_LSK='study-sync-progress-key-v1';
  let api='', contentApi='', progressKeyName=LSK, timer=null, busy=false, applying=false, box=null, msgEl=null, btnEl=null;
  const key=()=>{
   let raw='';try{raw=localStorage.getItem(progressKeyName)||''}catch(e){return ''}
   if(progressKeyName===LSK)return raw;
   // Progress-only key is bound to the exact URL, never copied across hosts.
   try{
    const entry=JSON.parse(raw);
    return entry&&entry.endpoint===api&&typeof entry.key==='string'
     ?entry.key.trim():'';
   }catch(e){return ''}
  };
  const contentKey=()=>{ try{ return localStorage.getItem(LSK)||''; }catch(e){ return ''; } };
  const hdr=()=>({'X-Sync-Key':key(),'Content-Type':'application/json'});
  async function cfg(){ if(api) return api; try{ const c=await fetch('data/config.json',{cache:'no-store'}); if(c.ok){ const j=await c.json(); const original=String(j.api||'').replace(/\/+$/,''); const next=String(j.progress_api||original).replace(/\/+$/,''); contentApi=original; api=next; progressKeyName=next&&next!==original?PROGRESS_LSK:LSK; } }catch(e){} return api; }
  const say=(t,ok)=>{ if(msgEl){ msgEl.textContent=t; msgEl.style.color=ok?'var(--ok,#1d7a4a)':'var(--bad,#b3261e)'; } };
  const hhmm=()=>new Intl.DateTimeFormat('th-TH',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Bangkok'}).format(new Date());
  function local(){ return {study:{ans:store.ans||{},ats:store.ats||{},rst:store.rst||0,known:store.known||[],rv:store.rv||{}}, srs:{s:srs||{},m:meta||{day:0,newDone:0}}}; }
  function merge(a,b){
    const A=a.study||{}, B=b.study||{}, out={study:{ans:{},ats:{},rst:0,known:[]},srs:{s:{},m:{day:0,newDone:0}}};
    const rst=Math.max(A.rst||0,B.rst||0); out.study.rst=rst;
    const ids=new Set([...Object.keys(A.ans||{}),...Object.keys(B.ans||{})]);
    ids.forEach(id=>{
      const ha=A.ans&&A.ans[id]!==undefined, hb=B.ans&&B.ans[id]!==undefined;
      const ta=(A.ats||{})[id]||0, tb=(B.ats||{})[id]||0;
      const useA=ha&&(!hb||ta>=tb), v=useA?A.ans[id]:B.ans[id], t=useA?ta:tb;
      if(!(ha||hb)) return; if(rst&&t<rst) return;
      out.study.ans[id]=v; out.study.ats[id]=t;
      const rvx=useA?(A.rv||{})[id]:(B.rv||{})[id]; if(rvx)(out.study.rv=out.study.rv||{})[id]=rvx;
    });
    out.study.known=[...new Set([...(A.known||[]),...(B.known||[])])];
    const SA=(a.srs||{}).s||{}, SB=(b.srs||{}).s||{};
    new Set([...Object.keys(SA),...Object.keys(SB)]).forEach(id=>{
      const x=SA[id], y=SB[id]; if(!x){ out.srs.s[id]=y; return; } if(!y){ out.srs.s[id]=x; return; }
      out.srs.s[id]=((x.ts||0)>=(y.ts||0))?x:y;
    });
    const MA=(a.srs||{}).m||{day:0,newDone:0}, MB=(b.srs||{}).m||{day:0,newDone:0};
    out.srs.m = MA.day>MB.day?MA : MB.day>MA.day?MB : {day:MA.day,newDone:Math.max(MA.newDone||0,MB.newDone||0)};
    return out;
  }
  function apply(m){
    applying=true;
    try{
      store.ans=m.study.ans; store.ats=m.study.ats; store.rst=m.study.rst; store.known=m.study.known; store.rv=m.study.rv||{}; window.StudyReview&&StudyReview.seed(store,QS,Date.now()); save();
      srs=m.srs.s; meta=m.srs.m; saveS();
      try{ buildDeck(true); renderQ(); cardsRow(); if(!shown) renderCard(); }catch(e){}
    } finally { applying=false; }
  }
  async function sync(manual,auto){
    // Deliberate manual click only; never run on page load, visibility or rating.
    if(!manual||busy) return;
    const base=await cfg();
    if(!base){ say('api is not set in data/config.json'); return; }
    if(!key()){ if(!auto)askKey(); return; }
    if(auto&&progressKeyName===LSK){ say('Auto sync works only with the separate Progress Worker'); return; }
    if(!auto&&!window.confirm('Sync will read and write the scores for '+D.key+' to the Cloudflare Worker.\n\nIf the Worker does not support ETag/If-Match, this older sync can overwrite scores when another device syncs at the same time. Back up first and avoid syncing two devices at once.\n\nSync manually now?')) return;
    busy=true;say('Checking revision and syncing…',true);
    try{
      const url=base+'/progress/'+D.key;
      let done=false;
      for(let attempt=1;attempt<=6;attempt++){
        const r=await fetch(url,{headers:hdr(),cache:'no-store'});
        if(r.status===401){
          say('Wrong sync key; tap the button to set it again');
          try{localStorage.removeItem(progressKeyName);}catch(e){}
          busy=false;paint();return;
        }
        if(!r.ok)throw Error('GET HTTP '+r.status);
        const etag=(r.headers?.get?.('X-Sync-Revision')??r.headers?.get?.('ETag'))||'';
        const revision=/^"[0-9]+"$/.test(etag)?etag:'';
        if(auto&&!revision)throw Error('Worker sent no revision (ETag), so auto sync is off; use manual sync instead');
        const originalTag=r.headers?.get?.('ETag')||'';
        const customRev=r.headers?.get?.('X-Sync-Revision');
        // A weak tag or malformed application version indicates broken CAS.
        // Never treat it as a safe legacy manual-sync fallback.
        if(!revision&&(customRev!==null&&customRev!==undefined||/^W\//.test(originalTag)))
          throw Error('Worker sent an unsafe revision number; sync stopped to protect your data');
        const remote=await r.json();
        if(remote!==null&&(typeof remote!=='object'||Array.isArray(remote)||remote.error))
          throw Error('Invalid Worker data');
        const snapshot=local(),baseline=JSON.stringify(snapshot);
        const joined=merge(snapshot,remote||{});
        const headers=revision?{...hdr(),'If-Match':revision}:hdr();
        const p=await fetch(url,{method:'PUT',headers,body:JSON.stringify(joined)});
        if(revision&&(p.status===409||p.status===412))continue;
        if(p.status===428)throw Error('Worker requires If-Match but sent no ETag');
        if(!p.ok)throw Error('PUT HTTP '+p.status);
        if(JSON.stringify(local())!==baseline){
          if(revision)continue;
          throw Error('Scores changed during the older sync; local scores were not overwritten');
        }
        apply(joined);
        done=true;break;
      }
      if(!done)throw Error('Data changed concurrently more than 6 times; local scores are kept');
      dirtyFlag=false;say('Synced '+hhmm(),true);
    }catch(e){say('Sync failed: '+String(e.message||e));}
    busy=false;paint();
  }
  /* Opt-in automatic sync: only with the separate Progress Worker (progress_api) and a CAS revision header. */
  const AUTOK='study-sync-auto-v1';
  let dirtyFlag=false,autoTimer=null,autoBtn=null;
  const autoOn=()=>{try{return localStorage.getItem(AUTOK)==='1'}catch(e){return false}};
  const autoReady=()=>!!(api&&key()&&progressKeyName!==LSK);
  function schedule(ms){ clearTimeout(autoTimer); autoTimer=setTimeout(()=>{ if(autoOn()&&autoReady()&&!document.hidden||dirtyFlag&&autoOn()&&autoReady()) sync(true,true); },ms); }
  function setAuto(on){ try{ if(on)localStorage.setItem(AUTOK,'1'); else localStorage.removeItem(AUTOK); }catch(e){ say('Could not save the auto sync setting'); return; } if(on){arm();schedule(500);} else clearTimeout(autoTimer); say(on?'Auto sync is on':'Auto sync is off',true); paint(); }
  let armed=false;
  function arm(){ if(armed)return; armed=true;
    setInterval(()=>{ if(!document.hidden&&autoOn()&&autoReady()) sync(true,true); },300000);
    document.addEventListener('visibilitychange',()=>{ if(!autoOn()||!autoReady())return; if(document.hidden){ if(dirtyFlag) sync(true,true); } else schedule(800); }); }
  function askKey(){
    let k=''; try{ k=window.prompt(progressKeyName===LSK?
     'Enter the SYNC_KEY for the original Cloudflare Worker.\n\nThis older page no longer syncs automatically; you will be asked to confirm one manual sync.':
     'Enter the key for the separate Progress Worker.\n\nDo not reuse the original or staging Worker key; this key is only for the new Progress endpoint.')||''; }catch(e){}
    k=k.trim(); if(!k) return;
    try{
     const scoped=progressKeyName===LSK?k:JSON.stringify({endpoint:api,key:k});
     localStorage.setItem(progressKeyName,scoped);
    }catch(e){say('Could not save the key on this device, so nothing was synced');return}
    paint(); try{ renderSync(); }catch(e){} sync(true);
  }
  function paint(){ if(btnEl) btnEl.textContent=key()?'☁ Sync manually':'☁ Set sync key'; if(autoBtn){ const can=progressKeyName!==LSK&&!!key(); autoBtn.hidden=!can; autoBtn.textContent=autoOn()?'⟳ Auto: on':'⟳ Auto: off'; autoBtn.setAttribute('aria-pressed',autoOn()); } }
  function mount(){
    box=document.createElement('div');
    box.className='cloud-sync-bar';
    box.style.cssText='position:fixed;right:12px;bottom:12px;z-index:50;display:flex;gap:8px;align-items:center;background:var(--surface,#fff);color:var(--ink,#1c1c1c);border:1px solid var(--line,#bbb);border-radius:999px;padding:6px 12px;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,.12)';
    msgEl=document.createElement('span'); msgEl.setAttribute('role','status');
    btnEl=document.createElement('button'); btnEl.type='button'; btnEl.style.cssText='border:0;background:transparent;font:inherit;color:inherit;cursor:pointer;font-weight:600;padding:2px 4px';
    btnEl.onclick=async()=>{ await cfg(); if(!key()) askKey(); else sync(true); };
    autoBtn=document.createElement('button'); autoBtn.type='button'; autoBtn.hidden=true; autoBtn.style.cssText=btnEl.style.cssText;
    autoBtn.onclick=()=>{ if(autoOn()){ setAuto(false); return; } if(window.confirm('Turn on auto sync?\n\nThis page will read and write the scores for '+D.key+' with your own Progress Worker from time to time (on open, after answering and every few minutes), merging item by item without overwriting.\n\nUse the same key on every device. Turn it off any time with the same button.')) setAuto(true); };
    box.append(msgEl,btnEl,autoBtn); document.body.appendChild(box); paint();
  }
  mount();
  say(autoOn()?'Auto sync is on':'Cloud Sync: auto off',true);
  cfg().then(()=>{ try{ renderSync(); }catch(e){} paint(); if(autoOn()&&autoReady()){arm();schedule(1500);} });
  // LocalStorage writes still happen immediately in save() and saveS().
  // Do not dispatch background GET/PUT even if the browser already has a SYNC_KEY.
  return { dirty(){ if(autoOn()&&!applying&&autoReady()){ dirtyFlag=true; schedule(20000); } },
    ready(){ return !!(api&&key()); },
    reviewReady(){return !!(contentApi&&contentKey())},
    reviewApi:async()=>{await cfg();return contentApi;},
    reviewHdr:()=>({'X-Sync-Key':contentKey(),'Content-Type':'application/json'}),
    api:()=>api, hdr, sync };
})();
