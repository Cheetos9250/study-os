/* Study OS site search (opened from the nav). Loaded only when you open search; the data is fetched then, once:
   course pages (flashcards, summaries, quiz questions), data/quiz.json, textbook-style questions, the textbook
   exercise index, and your lesson notes (read from this browser only). Reads, never writes, study data. */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.StudySearch=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const COURSES=[['acc','Accounting'],['eco','Economics'],['math','Math'],['eng','English'],['zh','Chinese']];
 const SUBJ={Accounting:'acc','Math for Life':'math',Economics:'eco','English Vocab':'eng',Chinese:'zh'};
 const TYPE={q:'Question',card:'Card',sum:'Summary',note:'My note',tb:'Textbook'};
 const plain=t=>String(t==null?'':t).replace(/<[^>]*>/g,' ').replace(/[*_`#|]/g,'').replace(/\s+/g,' ').trim();
 const fold=t=>plain(t).toLowerCase().normalize('NFKC');
 const enc=encodeURIComponent;
 /* Build the list of searchable items from already-loaded sources (pure; tested in Node). */
 function buildIndex(src){
  const out=[],name=k=>(COURSES.find(c=>c[0]===k)||[k,k])[1];
  const add=(type,course,title,sub,href)=>{title=plain(title);if(title)out.push({type,course,title,sub:plain(sub).slice(0,160),href,text:fold(title+' '+sub)});};
  for(const [k,D] of Object.entries(src.courses||{})){
   if(!D)continue;const page=k+'.html',cat=id=>(D.cats||[]).find(c=>c[0]===id),lab=id=>(cat(id)||[id,''])[1];
   (D.quiz||[]).forEach((q,i)=>add('q',k,q[1],name(k)+' · '+lab(q[0]),page+'?tab=prac&q='+i));
   (D.cards||[]).forEach(c=>add('card',k,c[1],String(c[2]||'').split('\n')[0],page+'?tab=cards&cat='+enc(c[0])));
   (D.sum||[]).forEach(s=>add('sum',k,s.h,(s.rows||[]).map(r=>r.join(': ')).join(' · '),page+'?tab=sum&cat='+enc(s.cat)));
  }
  for(const r of (src.quizRows||[])){
   const k=SUBJ[r.Subject],D=k&&(src.courses||{})[k];if(!D||r.Status!=='Verified'||!r.Question||!r.Correct)continue;
   const hit=(D.cats||[]).find(c=>c[1]===r.Chapter);if(!hit)continue;
   if(/[฀-๿]/.test([r.Question,r.Correct].join(' ')))continue;
   const id='n-'+String(r.page_id||r.url||r.Question).split('?')[0].split('/').pop();
   add('q',k,r.Question,name(k)+' · '+hit[1],k+'.html?tab=prac&q='+enc(id));
  }
  for(const m of (src.accMcq||[]))if(m&&m.id&&m.q)add('q','acc',m.q,'Accounting · textbook style '+(m.ref||''),'acc.html?tab=prac&q='+enc(m.id));
  for(const it of (src.written||[]))if(it&&it.id)add('q','acc',it.title||it.id,'Accounting · written · '+it.id+' · '+plain(it.prompt).slice(0,90),'acc.html?tab=prac&q='+enc('tbw-'+it.id));
  for(const it of (src.textbook||[]))if(it&&it.id&&!it.sectionOnly)add('tb','acc',it.id+' '+(it.title||''),'Textbook exercises · Ch'+(it.chapter||''),'accounting-textbook.html?q='+enc(it.id));
  for(const [key,v] of Object.entries(src.notes||{})){
   const m=/^([a-z]+):([A-Za-z0-9_-]+)$/.exec(key);if(!m||!v||typeof v.text!=='string'||!v.text.trim())continue;
   const k=m[1],D=(src.courses||{})[k],lab=D&&(D.cats||[]).find(c=>c[0]===m[2]);
   add('note',k,v.text.split('\n')[0].slice(0,90),name(k)+(lab?' · '+lab[1]:'')+' · '+v.text.slice(0,120),k+'.html?tab=prac'+(lab?'&cat='+enc(m[2]):''));
  }
  return out;
 }
 const RANK={note:0,q:1,tb:2,sum:3,card:4};
 /* Every word must appear; title matches first, then notes, questions, textbook, summaries, cards. */
 function search(index,query,limit){
  const words=fold(query).split(/\s+/).filter(w=>w.length>0);if(!words.length)return [];
  const hits=[];
  for(const it of index){if(!words.every(w=>it.text.includes(w)))continue;
   const t=fold(it.title),score=(words.every(w=>t.includes(w))?0:10)+(t.startsWith(words[0])?0:1)+RANK[it.type];hits.push([score,it]);}
  hits.sort((a,b)=>a[0]-b[0]||a[1].title.length-b[1].title.length);
  return hits.slice(0,limit||40).map(h=>h[1]);
 }
 /* ---------- browser: load data once, then a dialog ---------- */
 let index=null,loading=null;
 function parseCourse(html){const m=/^const D = (\{.*\});\s*$/m.exec(String(html||''));if(!m)return null;try{return JSON.parse(m[1]);}catch(e){return null;}}
 const getJ=u=>fetch(u,{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null);
 const getT=u=>fetch(u,{cache:'no-cache'}).then(r=>r.ok?r.text():'').catch(()=>'');
 function loadScript(src){return new Promise(res=>{if(window.ACC_TB_MCQ)return res();const s=document.createElement('script');s.src=src;s.onload=s.onerror=()=>res();document.head.appendChild(s);});}
 function load(){
  if(index)return Promise.resolve(index);
  if(loading)return loading;
  const courses={};
  loading=Promise.all([
   ...COURSES.map(([k])=>getT(k+'.html').then(h=>{courses[k]=parseCourse(h);})),
   getJ('data/quiz.json'),
   Promise.all([5,6,7,8,9].map(n=>getJ('data/textbook-sos/ch'+n+'.json'))),
   getJ('data/accounting-textbook-index.json'),
   loadScript('scripts/acc-textbook-mcq.js?v=1')
  ]).then(r=>{
   const q=r[COURSES.length],w=r[COURSES.length+1],tb=r[COURSES.length+2];
   let notes={};try{notes=JSON.parse(localStorage.getItem('studyos.notes.v1')||'{}')||{};}catch(e){}
   index=buildIndex({courses,quizRows:q&&q.rows||[],written:w.flatMap(x=>Array.isArray(x)?x:[]),textbook:tb&&tb.items||[],accMcq:window.ACC_TB_MCQ||[],notes});
   return index;
  });
  return loading;
 }
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const CSS='#ssDlg[hidden]{display:none}#ssDlg{position:fixed;inset:0;z-index:96;display:flex;align-items:flex-start;justify-content:center;padding:max(16px,env(safe-area-inset-top)) 16px 16px;background:rgba(0,0,0,.45)}'
 +'#ssDlg .ss-box{--b:#fff;--f:#111;--m:#505050;background:var(--b);color:var(--f);border:3px solid var(--f);border-radius:6px;width:min(680px,100%);max-height:calc(94dvh - 32px);display:flex;flex-direction:column;box-shadow:6px 6px 0 rgba(0,0,0,.25);font-family:"Zen Maru Gothic","Mali",system-ui,-apple-system,sans-serif;margin-top:6vh}'
 +'@media(prefers-color-scheme:dark){:root:not([data-theme="light"]) #ssDlg .ss-box{--b:#0e0e0f;--f:#f0f0ee;--m:#a9a9a6}}:root[data-theme="dark"] #ssDlg .ss-box{--b:#0e0e0f;--f:#f0f0ee;--m:#a9a9a6}'
 +'#ssDlg .ss-top{display:flex;gap:8px;padding:12px;border-bottom:2px solid var(--f)}'
 +'#ssDlg input{flex:1;min-width:0;min-height:46px;padding:0 14px;font:inherit;font-size:17px;border:2px solid var(--f);border-radius:6px;background:transparent;color:inherit}'
 +'#ssDlg .ss-x{min-width:46px;min-height:46px;border:2px solid var(--f);border-radius:6px;background:var(--b);color:var(--f);font:700 15px inherit;cursor:pointer}'
 +'#ssDlg .ss-st{padding:8px 14px;font-size:13px;color:var(--m);margin:0}'
 +'#ssDlg ul{list-style:none;margin:0;padding:0 6px 8px;overflow:auto}'
 +'#ssDlg li a{display:block;padding:10px 10px;border-radius:6px;color:inherit;text-decoration:none;min-height:44px}#ssDlg li a:hover,#ssDlg li a:focus-visible{background:rgba(127,127,127,.16);outline:none}'
 +'#ssDlg li b{display:block;font-size:15px;line-height:1.35}#ssDlg li span{display:block;font-size:13px;color:var(--m);line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
 +'#ssDlg li i{font-style:normal;font-size:11px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;border:1.5px solid var(--f);border-radius:4px;padding:0 5px;margin-right:6px}';
 let dlg=null,prev=null,timer=null;
 function open(initial){
  if(!dlg){
   const st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
   dlg=document.createElement('div');dlg.id='ssDlg';dlg.setAttribute('role','dialog');dlg.setAttribute('aria-modal','true');dlg.setAttribute('aria-label','Search');
   dlg.innerHTML='<div class="ss-box"><div class="ss-top"><input type="search" id="ssQ" placeholder="Search cards, questions, notes, textbook…" aria-label="Search" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search"><button type="button" class="ss-x" aria-label="Close search">Esc</button></div><p class="ss-st" role="status"></p><ul id="ssList"></ul></div>';
   document.body.appendChild(dlg);
   dlg.addEventListener('click',e=>{if(e.target===dlg)close();});
   dlg.querySelector('.ss-x').onclick=close;
   dlg.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){const ls=[...dlg.querySelectorAll('#ssList a')];if(!ls.length)return;e.preventDefault();
     const i=ls.indexOf(document.activeElement),n=e.key==='ArrowDown'?Math.min(i+1,ls.length-1):i<=0?-1:i-1;(n<0?dlg.querySelector('#ssQ'):ls[n]).focus();}
    if(e.key==='Enter'&&document.activeElement&&document.activeElement.id==='ssQ'){const a=dlg.querySelector('#ssList a');if(a){e.preventDefault();location.href=a.href;}}});
   dlg.querySelector('#ssQ').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(run,120);});
  }
  prev=document.activeElement;dlg.hidden=false;
  const inp=dlg.querySelector('#ssQ');if(initial)inp.value=initial;inp.focus();
  if(!index){say('Loading…');load().then(run);}else run();
 }
 function say(t){if(dlg)dlg.querySelector('.ss-st').textContent=t;}
 function run(){
  if(!dlg||!index)return;const q=dlg.querySelector('#ssQ').value.trim(),list=dlg.querySelector('#ssList');
  if(!q){list.innerHTML='';say(index.length+' items · type to search');return;}
  const r=search(index,q,40);
  say(r.length?(r.length>=40?'Top 40 results':r.length+' result'+(r.length>1?'s':'')):'No results');
  list.innerHTML=r.map(it=>'<li><a href="'+esc(it.href)+'"><b><i>'+esc(TYPE[it.type])+'</i>'+esc(it.title)+'</b><span>'+esc(it.sub)+'</span></a></li>').join('');
 }
 function close(){if(dlg)dlg.hidden=true;if(prev&&prev.focus)try{prev.focus();}catch(e){}}
 return {buildIndex,search,open,close,load,parseCourse};
});
