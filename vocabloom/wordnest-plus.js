/* WordNest extras (18 Nov 2026), English and Chinese:
   - EN / 中文 switch in the top bar; 拼音 on/off (hides prompt pinyin to practise reading characters);
   - word garden: New / Learning / Mastered, a plant that grows as words are mastered, Panic Review (3 minutes,
     10 most-missed or newest words) and Review weakest 10;
   - goal calendar (12 weeks, a filled square = daily goal met);
   - typo highlighting in typed answers; Sentence dictation (English);
   - CSV import (also Anki's text export) and export;
   - confusable words: "Don't mix up with …" under answers and cards, a side-by-side compare, and links I add myself;
   - words added from Study OS Today ("+ New word") are merged in when this page is open.
   Storage: only vocabloom_mvp_v1 (settings.hidePinyin, settings.links, settings.linksTs, custom words), which is
   already backed up; links sync through wordnest-sync.js. Chinese answers use the Chinese schedule as before. */
'use strict';
(function(){
 const T=window.WordNestTools,LANG=(window.WORDNEST&&WORDNEST.lang)||'en',ZG=()=>window.WordNestZhGames;
 if(!T||typeof data!=='object')return;
 const esc=T.esc;
 const save=()=>{store();if(typeof cCloudDebounce==='function')cCloudDebounce();};
 const goal=()=>Math.max(1,Number(data.settings.goal)||10);
 /* ---------- data views ---------- */
 const enWords=()=>typeof allWords==='function'?allWords():[];
 const addedAt=w=>{const m=/^custom-(\d+)/.exec(w.id||'');return m?+m[1]:0;};
 function enItems(){return enWords().map(w=>{const p=progressFor(w.id)||{};return {id:w.id,w,wrong:+p.wrong||0,correct:+p.correct||0,seen:!!p.seen,added:addedAt(w)};});}
 function zhItems(){const g=ZG();if(!g)return [];const s=g.srs().s;return g.words().map(w=>{const x=s[w.mid];return {id:w.mid,w,wrong:x?(+x.lapses||0)+(Number(x.last)===1?1:0):0,correct:x&&x.st==='rev'?1:0,seen:!!x,added:0};});}
 function status(){
  if(LANG==='zh'){const g=ZG();return g?T.statusZh(g.words().map(w=>w.mid),g.srs().s):{new:0,learning:0,mastered:0};}
  return T.statusEn(enWords().map(w=>w.id),data.progress||{});
 }
 /* ---------- bloom plant (inline SVG, ink style) ---------- */
 function plantSVG(stage){
  const ink='var(--ink,#111)',acc='var(--acc,#e33)',p=[];
  p.push('<path d="M20 92h80" stroke="'+ink+'" stroke-width="3" stroke-linecap="round"/><path d="M38 92l6 18h32l6-18z" fill="var(--panel,#fff)" stroke="'+ink+'" stroke-width="3" stroke-linejoin="round"/>');
  if(stage===0)p.push('<ellipse cx="60" cy="86" rx="7" ry="4.5" fill="'+ink+'"/>');
  if(stage>=1)p.push('<path d="M60 92V'+(stage>=3?40:stage===2?58:72)+'" stroke="'+ink+'" stroke-width="3" stroke-linecap="round"/>');
  if(stage>=1)p.push('<path d="M60 '+(stage>=2?78:74)+'c-10 0-16-6-16-14 9 0 16 5 16 14z" fill="'+ink+'"/>');
  if(stage>=2)p.push('<path d="M60 68c10 0 17-6 17-15-10 0-17 6-17 15z" fill="'+ink+'"/>');
  if(stage>=3)p.push('<path d="M60 56c-9 0-14-5-14-12 8 0 14 4 14 12z" fill="'+ink+'"/>');
  if(stage===3)p.push('<path d="M60 26c6 4 8 10 0 16-8-6-6-12 0-16z" fill="'+acc+'" stroke="'+ink+'" stroke-width="2.5"/>');
  if(stage>=4){const r=stage===5?15:11;for(let k=0;k<6;k++){const a=k*Math.PI/3,x=60+Math.cos(a)*r,y=32+Math.sin(a)*r;p.push('<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+(stage===5?9:7)+'" fill="'+acc+'" stroke="'+ink+'" stroke-width="2.5"/>');}
   p.push('<circle cx="60" cy="32" r="'+(stage===5?7:5.5)+'" fill="var(--panel,#fff)" stroke="'+ink+'" stroke-width="2.5"/>');}
  if(stage===5)p.push('<path d="M92 30l3-7 3 7 7 3-7 3-3 7-3-7-7-3z" fill="'+ink+'"/><path d="M22 44l2-5 2 5 5 2-5 2-2 5-2-5-5-2z" fill="'+ink+'"/>');
  return '<svg class="wn-plant" viewBox="0 0 120 112" role="img" aria-label="Your plant: '+T.BLOOM[stage]+'">'+p.join('')+'</svg>';
 }
 function gardenHTML(){
  const st=status(),stage=T.bloomStage(st),total=st.new+st.learning+st.mastered;
  const next=['Learn a few words to plant the seed','Keep practising: leaves come at 20% learning','A bud appears when 10% are mastered','It blooms at 30% mastered','Full bloom at 60% mastered','Full bloom. Keep it watered with reviews'][stage];
  return '<section class="panel wn-garden" aria-labelledby="wnGardenH"><div class="wn-garden-row">'+plantSVG(stage)+'<div class="wn-garden-text"><span class="section-kicker">YOUR WORD GARDEN</span><h3 id="wnGardenH">'+T.BLOOM[stage]+'</h3><p class="subheading">'+esc(next)+'</p>'
   +'<div class="wn-status" role="list"><span role="listitem"><b>'+st.new+'</b> New</span><span role="listitem"><b>'+st.learning+'</b> Learning</span><span role="listitem"><b>'+st.mastered+'</b> Mastered</span></div>'
   +'<div class="wn-bar" aria-hidden="true"><i style="width:'+(total?st.mastered/total*100:0)+'%"></i><i class="l" style="width:'+(total?st.learning/total*100:0)+'%"></i></div>'
   +'<div class="pill-row mt20"><button class="btn btn-primary" data-action="wn-panic">⚡ Panic review · 3 min</button><button class="btn btn-outline" data-action="wn-weak">Review weakest 10</button></div></div></div></section>';
 }
 /* ---------- goal calendar ---------- */
 function perDay(){const m={};Object.keys(data.days||{}).forEach(d=>{const n=+(data.days[d]&&data.days[d].answered)||0;if(n>0)m[d]=n;});return m;}
 function heatHTML(){
  const cells=T.heatCells(perDay(),goal(),today(),12),met=cells.filter(c=>c.met).length;
  const fmt=d=>new Date(d+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'});
  return '<section class="panel wn-heat-panel" aria-labelledby="wnHeatH"><div class="panel-header"><h3 id="wnHeatH">Goal calendar</h3><span class="badge">'+met+' DAYS MET · 12 WEEKS</span></div>'
   +'<div class="wn-heat" role="img" aria-label="Goal met on '+met+' of the last '+cells.length+' days">'+cells.map(c=>'<i class="'+(c.met?'met':c.n?'some':'')+(c.date===today()?' now':'')+'" title="'+esc(fmt(c.date)+': '+c.n+' answers'+(c.met?' · goal met':''))+'"></i>').join('')+'</div>'
   +'<p class="footnote mt10"><span class="wn-key met"></span> goal met ('+goal()+'+) &nbsp; <span class="wn-key some"></span> some practice &nbsp; Columns are weeks, Monday on top.</p></section>';
 }
 /* ---------- Panic Review: 10 words, 3 minutes, pick the meaning ---------- */
 const P={on:false,items:[],i:0,score:0,end:0,missed:[],flash:null,timer:null};
 const meanOf=w=>LANG==='zh'?ZG().meaning(w):w.th;
 const termOf=w=>LANG==='zh'?w.hz:w.en;
 function panicStart(){
  const items=LANG==='zh'?zhItems():enItems(),all=items.map(x=>x.w);
  if(all.length<4){toast('Not enough words yet');return;}
  const weak=T.pickWeak(items.filter(x=>x.wrong>0||x.added),10),rest=items.filter(x=>!weak.includes(x)).sort(()=>Math.random()-.5),pick=weak.concat(rest).slice(0,10);
  P.items=pick.map(x=>{const right=meanOf(x.w),opts=[right],seen=new Set(opts);
   for(const o of all.slice().sort(()=>Math.random()-.5)){if(opts.length>=4)break;const m=meanOf(o);if(m&&!seen.has(m)){seen.add(m);opts.push(m);}}
   return {w:x.w,right,opts:opts.sort(()=>Math.random()-.5)};});
  Object.assign(P,{on:true,i:0,score:0,missed:[],flash:null,end:Date.now()+180000});
  clearInterval(P.timer);P.timer=setInterval(()=>{const el=document.getElementById('pnClock');if(!el||ui.page!=='panic'){clearInterval(P.timer);return;}const l=Math.max(0,P.end-Date.now());el.textContent=Math.floor(l/60000)+':'+String(Math.ceil(l/1000)%60).padStart(2,'0');if(!l){P.i=P.items.length;render();}},500);
  ui.page='panic';render();window.scrollTo({top:0,behavior:'instant'});
 }
 function panicHTML(){
  const done=P.i>=P.items.length||Date.now()>=P.end,l=Math.max(0,P.end-Date.now());
  const head='<div class="page-heading"><div><div class="eyebrow mb16">⚡ PANIC REVIEW</div><h1>Quick review</h1><p class="subheading">10 words you miss most or added last. Tap fast.</p></div><button class="btn btn-outline" data-action="wn-panic-exit">Close</button></div>';
  if(done){clearInterval(P.timer);const answered=Math.min(P.i,P.items.length);
   return head+'<div class="panel"><h2>'+P.score+' / '+answered+' correct'+(answered<P.items.length?' · time up':'')+'</h2>'
    +(P.missed.length?'<h3 class="mt20">Missed</h3><div class="zg-miss">'+P.missed.map(w=>'<div class="word-row"><div class="word-meta"><h3'+(LANG==='zh'?' lang="zh"':'')+'>'+esc(termOf(w))+(LANG==='zh'?' <small>'+esc(w.py)+'</small>':'')+'</h3><p>'+esc(meanOf(w))+'</p></div></div>').join('')+'</div>':'<p>All correct. Nice!</p>')
    +'<div class="pill-row mt20"><button class="btn btn-primary" data-action="wn-panic">Again</button>'+(P.missed.length?'<button class="btn btn-outline" data-action="ai-quiz" data-lang="'+LANG+'">✦ AI quiz on my mistakes</button>':'')+'<button class="btn btn-outline" data-action="wn-panic-exit">Done</button></div></div>';}
  const it=P.items[P.i];
  return head+'<div class="panel"><div class="panel-header"><span class="badge">'+(P.i+1)+' / '+P.items.length+'</span><span class="wn-clock" id="pnClock" role="timer">'+Math.floor(l/60000)+':'+String(Math.ceil(l/1000)%60).padStart(2,'0')+'</span></div>'
   +'<div class="zg-q"><div class="zg-big wn-term"'+(LANG==='zh'?' lang="zh"':'')+'>'+esc(termOf(it.w))+'</div></div>'
   +it.opts.map((o,k)=>'<button class="u-option'+(P.flash&&P.flash.k===k?(P.flash.ok?' right':' wrong'):P.flash&&o===it.right?' right':'')+'" data-action="wn-panic-pick" data-k="'+k+'" '+(P.flash?'disabled':'')+'>'+esc(o)+'</button>').join('')+'</div>';
 }
 function panicPick(k){
  if(P.flash)return;const it=P.items[P.i],ok=it.opts[k]===it.right;P.flash={k,ok};if(ok)P.score++;else P.missed.push(it.w);
  if(LANG==='zh')ZG().record(it.w,ok);else recordAnswer(it.w.id,ok);
  render();setTimeout(()=>{P.flash=null;P.i++;if(ui.page==='panic')render();},ok?350:900);
 }
 /* ---------- Review weakest 10 ---------- */
 function weakStart(){
  if(LANG==='zh'){const items=zhItems(),list=T.pickWeak(items.filter(x=>x.wrong>0),10).map(x=>x.w);
   if(!list.length){toast('No missed words yet. Play a game first.');return;}ZG().start('meaning',list);ui.page='zhgames';render();return;}
  const items=enItems().filter(x=>x.seen),list=T.pickWeak(items.filter(x=>x.wrong>0),10);
  const pick=(list.length?list:items.sort((a,b)=>(progressFor(a.id).streak||0)-(progressFor(b.id).streak||0)).slice(0,10)).map(x=>x.id);
  if(!pick.length){toast('Practise a few words first');return;}
  ui.game={mode:'type',ids:pick,index:0,score:0,wrong:0,answer:null,result:false,review:true};ui.page='practice';render();window.scrollTo({top:0,behavior:'instant'});
 }
 /* ---------- confusable words ---------- */
 const linkKey=(lang,id)=>lang+':'+id;
 function links(){const l=data.settings.links;return l&&typeof l==='object'&&!Array.isArray(l)?l:{};}
 function setLink(a,b,on){const l={...links()},add=(x,y)=>{const s=new Set(l[x]||[]);on?s.add(y):s.delete(y);if(s.size)l[x]=[...s];else delete l[x];};add(a,b);add(b,a);data.settings.links=l;data.settings.linksTs=Date.now();save();}
 const enCache=new Map();
 function enConf(w){
  if(!w)return [];const k=w.id;if(!enCache.has(k)){const all=enWords(),names=all.map(x=>x.en),hit=T.confusableEn(w.en,names,3);enCache.set(k,hit.map(n=>all.find(x=>x.en===n)).filter(Boolean));}
  const own=(links()[linkKey('en',w.id)]||[]).map(x=>getWord(x.slice(3))).filter(Boolean);
  const out=own.map(x=>({w:x,why:'linked'}));enCache.get(k).forEach(x=>{if(!out.some(o=>o.w.id===x.id))out.push({w:x,why:'looks alike'});});return out.slice(0,3);
 }
 function zhConf(w){
  const g=ZG();if(!g||!w)return [];const all=g.words(),own=(links()[linkKey('zh',w.mid)]||[]).map(x=>all.find(y=>y.mid===x.slice(3))).filter(Boolean);
  const out=own.map(x=>({w:x,why:'linked'}));T.confusableZh(w,all,window.WordNestPinyin.toneless,3).forEach(c=>{if(!out.some(o=>o.w.mid===c.w.mid))out.push(c);});return out.slice(0,3);
 }
 function lineHTML(lang,w,list){
  if(!list.length)return '';const id=lang==='zh'?w.mid:w.id;
  return '<p class="wn-conf">⚠ Don\'t mix up with: '+list.map(c=>'<button type="button" class="wn-conf-b" data-action="wn-compare" data-lang="'+lang+'" data-a="'+esc(id)+'" data-b="'+esc(lang==='zh'?c.w.mid:c.w.id)+'"'+(lang==='zh'?' lang="zh"':'')+'>'+esc(lang==='zh'?c.w.hz:c.w.en)+'</button>').join(' ')+'</p>';
 }
 const find=(lang,id)=>lang==='zh'?(ZG()?ZG().words().find(x=>x.mid===id):null):getWord(id);
 function dlg(){let d=document.getElementById('wnDlg');if(!d){d=document.createElement('dialog');d.id='wnDlg';d.className='wn-ai-dlg wn-dlg';d.setAttribute('aria-labelledby','wnDlgT');document.body.appendChild(d);d.addEventListener('click',e=>{if(e.target===d||e.target.closest('[data-dlg-close]'))d.close();});}return d;}
 function show(d){if(d.showModal&&!d.open)d.showModal();else d.setAttribute('open','');}
 function side(lang,w){
  return '<div class="wn-side"><h3'+(lang==='zh'?' lang="zh"':'')+'>'+esc(lang==='zh'?w.hz:w.en)+'</h3>'+(lang==='zh'?'<p><b>'+esc(w.py)+'</b></p>':'')+'<p>'+esc(lang==='zh'?ZG().meaning(w):w.th)+'</p>'+(lang==='en'&&w.example?'<p class="footnote">'+esc(w.example)+'</p>':'')
   +'<button type="button" class="btn btn-outline" data-action="wn-say" data-lang="'+lang+'" data-t="'+esc(lang==='zh'?w.hz:w.en)+'">♫ Listen</button></div>';
 }
 function compare(lang,a,b){
  const ai=document.getElementById('wnAiDlg');if(ai&&ai.open)ai.close();
  const A=find(lang,a),B=find(lang,b);if(!A||!B)return;const on=(links()[linkKey(lang,a)]||[]).includes(linkKey(lang,b)),d=dlg();
  const q=lang==='zh'?'อธิบายความต่างของ '+A.hz+' ('+A.py+') กับ '+B.hz+' ('+B.py+') พร้อมประโยคตัวอย่างคู่กัน มีพินอินและคำแปลไทย':'Explain the difference between "'+A.en+'" and "'+B.en+'" with a pair of example sentences each and Thai translations, and a tip to remember which is which.';
  d.innerHTML='<h2 id="wnDlgT">Don\'t mix them up</h2><div class="wn-compare">'+side(lang,A)+side(lang,B)+'</div>'
   +'<div class="pill-row mt20"><button type="button" class="btn '+(on?'btn-outline':'btn-primary')+'" data-action="wn-link" data-lang="'+lang+'" data-a="'+esc(a)+'" data-b="'+esc(b)+'" aria-pressed="'+on+'">'+(on?'Linked ✓ (tap to unlink)':'Link these two')+'</button><a class="btn btn-outline" href="../tutor.html?course='+(lang==='zh'?'zh':'eng')+'&q='+encodeURIComponent(q)+'">✦ Ask AI</a><button type="button" class="btn btn-outline" data-dlg-close>Close</button></div>';
  show(d);
 }
 /* link any word: search box inside a dialog */
 function linkPicker(lang,id){
  const w=find(lang,id);if(!w)return;const d=dlg();
  d.innerHTML='<h2 id="wnDlgT">Link a word you mix up with <span'+(lang==='zh'?' lang="zh"':'')+'>'+esc(lang==='zh'?w.hz:w.en)+'</span></h2><input class="search-input" id="wnLinkQ" placeholder="Type a word'+(lang==='zh'?', pinyin':'')+' or meaning" autocomplete="off" aria-label="Find a word"><div id="wnLinkR" class="wn-link-r"></div><div class="pill-row mt20"><button type="button" class="btn btn-outline" data-dlg-close>Close</button></div>';
  show(d);const q=d.querySelector('#wnLinkQ'),r=d.querySelector('#wnLinkR');
  const pool=lang==='zh'?ZG().words().map(x=>({id:x.mid,t:x.hz,s:x.py+' · '+ZG().meaning(x)})):enWords().map(x=>({id:x.id,t:x.en,s:x.th}));
  q.oninput=()=>{const v=q.value.trim().toLowerCase();const hit=v?pool.filter(x=>x.id!==id&&(x.t.toLowerCase().includes(v)||x.s.toLowerCase().includes(v)||(lang==='zh'&&window.WordNestPinyin.toneless(x.s).toLowerCase().includes(v)))).slice(0,8):[];
   r.innerHTML=hit.map(x=>'<button type="button" class="u-option" data-action="wn-compare" data-lang="'+lang+'" data-a="'+esc(id)+'" data-b="'+esc(x.id)+'"><b'+(lang==='zh'?' lang="zh"':'')+'>'+esc(x.t)+'</b> · '+esc(x.s)+'</button>').join('')||(v?'<p class="footnote">No match</p>':'');};
  q.focus();
 }
 window.WordNestConfuse={
  zhLine:w=>lineHTML('zh',w,zhConf(w)),
  enLine:w=>lineHTML('en',w,enConf(w)),
  /* part of the Ask AI dialog: confusable words + link button */
  dialogPart:(lang,term)=>{const w=lang==='zh'?(ZG()?ZG().words().find(x=>x.hz===term):null):enWords().find(x=>x.en===String(term).toLowerCase());if(!w)return '';
   const list=lang==='zh'?zhConf(w):enConf(w),id=lang==='zh'?w.mid:w.id;
   return '<div class="wn-ai-conf">'+(list.length?lineHTML(lang,w,list):'<p class="footnote">No look-alike words found.</p>')+'<button type="button" class="btn btn-outline" data-action="wn-linkpick" data-lang="'+lang+'" data-id="'+esc(id)+'">≈ Link a word I mix up</button></div>';}
 };
 /* ---------- CSV ---------- */
 function download(name,text){
  const blob=new Blob(['﻿'+text],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);a.remove();},1500);
 }
 function exportCSV(which){
  const day=today();
  if(LANG==='zh'){const g=ZG();download('wordnest-chinese-'+day+'.csv',T.toCSV([['characters','pinyin','thai','english','chapter']].concat(g.words().map(w=>[w.hz,w.py,w.th,w.en,w.cat]))));return;}
  const list=which==='mine'?(data.custom||[]):enWords();
  if(!list.length){toast('No words to export yet');return;}
  download('wordnest-english-'+(which==='mine'?'my-words-':'')+day+'.csv',T.toCSV([['word','meaning','example','level','category']].concat(list.map(w=>[w.en,w.th,w.example,w.level||'',w.category||'']))));
  toast('CSV saved');
 }
 function importCSV(file){
  if(!file)return;const r=new FileReader();
  r.onload=()=>{let rows;try{rows=T.wordsFromCSV(T.parseCSV(r.result));}catch{toast('Could not read this file');return;}
   const have=new Set(enWords().map(w=>w.en.toLowerCase())),now=Date.now();let n=0;
   rows.forEach((w,i)=>{if(have.has(w.en))return;have.add(w.en);data.custom.push({id:'custom-'+(now+i)+'-'+Math.random().toString(36).slice(2,7),en:w.en,th:w.th,example:w.example||w.en,emoji:'💡',category:'personal',level:/^[ABC][12]$/.test(w.level)?w.level:'B1',syncTs:now+i});n++;});
   if(n){save();enCache.clear();}toast(n?n+' word'+(n>1?'s':'')+' added to My words':'No new words in this file');render();};
  r.readAsText(file);
 }
 function csvPanel(){
  return '<div class="panel mt20"><span class="section-kicker">IMPORT / EXPORT WORDS</span><h3 class="mt10">CSV (Excel, Google Sheets, Anki)</h3><p>Export opens in Excel or Sheets. Import reads columns <b>word, meaning, example</b> (example optional), or an Anki “Notes in Plain Text” export. New words go to My words; words you already have are skipped.</p>'
   +'<div class="pill-row"><button class="btn btn-outline" data-action="wn-csv-out" data-which="all">↓ All words (CSV)</button><button class="btn btn-outline" data-action="wn-csv-out" data-which="mine">↓ My words (CSV)</button><button class="btn btn-primary" data-action="wn-csv-in">↑ Import CSV</button></div><input type="file" id="wnCsvIn" accept=".csv,.txt,.tsv,text/csv,text/plain" hidden></div>';
 }
 /* ---------- English: typo highlighting + Sentence dictation ---------- */
 if(LANG==='en'&&Array.isArray(GAMES)&&!GAMES.some(g=>g.mode==='sdict'))GAMES.splice(4,0,{mode:'sdict',icon:'📝',name:'Sentence dictation',desc:'Listen to a whole sentence and type it.'});
 if(typeof startGame==='function'){
  const base=startGame;
  startGame=function(mode,force){
   if(mode!=='sdict')return base.apply(this,arguments);
   const pool=enWords().filter(w=>w.example&&w.example.length<=110&&w.example.toLowerCase()!==w.en.toLowerCase());
   if(!pool.length){toast('No example sentences yet');return;}
   ui.game={mode:'sdict',ids:pool.sort(()=>Math.random()-.5).slice(0,8).map(w=>w.id),index:0,score:0,wrong:0,answer:null,result:false};ui.page='practice';render();
  };
 }
 if(typeof answerGame==='function'){
  const base=answerGame;
  answerGame=function(value){
   const g=ui.game;if(g&&g.answer===null)g.typed=String(value||'');
   if(!g||g.mode!=='sdict')return base.apply(this,arguments);
   const w=getWord(g.ids[g.index]);if(!w||g.answer!==null)return;
   const ok=T.normSentence(value)===T.normSentence(w.example);g.answer=ok?w.id:'wrong';if(ok)g.score++;else g.wrong++;recordAnswer(w.id,ok);render();
  };
 }
 if(typeof gameQuestionHTML==='function'){
  const base=gameQuestionHTML;
  gameQuestionHTML=function(){
   const g=ui.game;if(!g||g.mode!=='sdict')return base.apply(this,arguments);
   const w=getWord(g.ids[g.index]);if(!w)return '';const found=g.answer!==null;
   return '<div class="game-visual" style="height:110px;font-size:46px">📝</div><h2 class="game-title">Type the sentence you hear</h2><p class="game-desc">Case and punctuation do not matter.</p><div class="center"><button class="btn btn-ghost" data-action="speak-example" data-word="'+esc(w.id)+'">♫ Play sentence</button></div>'
    +'<form id="gameAnswerForm" class="center"><textarea id="gameAnswer" class="answer-input wn-sdict" rows="2" aria-label="The sentence you heard" placeholder="Type the sentence…" autocomplete="off" spellcheck="false" autocapitalize="off" '+(found?'disabled':'')+'></textarea>'+(!found?'<div class="lesson-actions"><button type="submit" class="btn btn-primary">Check answer →</button></div>':'')+'</form>'
    +(found?'<div class="feedback '+(g.answer===w.id?'ok':'wrong')+'">'+(g.answer===w.id?'✓ Correct! Great listening.':'✗ The sentence was: “'+esc(w.example)+'”')+'</div><div class="lesson-actions"><button class="btn btn-primary" data-action="game-next">'+(g.index===g.ids.length-1?'See results':'Next question →')+'</button></div>':'');
  };
 }
 /* ---------- decorate pages after each render ---------- */
 let spoke='';
 function decorate(){
  const root=document.getElementById('mainContent');if(!root)return;
  document.body.classList.toggle('wn-hide-py',LANG==='zh'&&!!data.settings.hidePinyin);
  if(LANG==='en'){
   const g=ui.game;
   if(ui.page==='practice'&&g&&!g.result){
    const w=getWord(g.ids[g.index]);
    if(g.mode==='sdict'&&g.answer===null&&w&&spoke!==g.index+':'+w.id){spoke=g.index+':'+w.id;setTimeout(()=>speak(w.example),250);}
    const fb=root.querySelector('.feedback');
    if(fb&&w&&!fb.dataset.wn){fb.dataset.wn='1';
     if(g.answer==='wrong'&&g.typed&&['type','dictation','sentence','sdict'].includes(g.mode))fb.insertAdjacentHTML('beforeend','<p class="wd-line">Your answer: '+T.diffHTML(g.typed.trim(),g.mode==='sdict'?w.example:w.en)+'</p>');
     fb.insertAdjacentHTML('afterend',window.WordNestConfuse.enLine(w));}
    if(g.mode==='sdict'){const el=root.querySelector('textarea#gameAnswer');if(el&&!el.dataset.wn){el.dataset.wn='1';el.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();el.form.requestSubmit();}});}}
   }
   if(ui.page==='learn'){const b=root.querySelector('[data-action="speak-example"][data-word]');if(b&&!root.querySelector('.wn-conf')){const w=getWord(b.dataset.word);const html=w&&window.WordNestConfuse.enLine(w);if(html)(b.closest('.lesson-actions')||b.parentElement).insertAdjacentHTML('afterend',html);}}
   if(ui.page==='home'&&!root.querySelector('.wn-garden')){
    const anchor=[...root.querySelectorAll('.section-header')].find(x=>/learning path/i.test(x.textContent));
    const html=gardenHTML()+heatHTML();if(anchor)anchor.insertAdjacentHTML('beforebegin',html);else root.insertAdjacentHTML('beforeend',html);}
   if(ui.page==='settings'&&!root.querySelector('#wnCsvIn'))root.insertAdjacentHTML('beforeend',csvPanel());
  }
  /* flashcards (both languages): warning on the answer side */
  if(ui.page==='studymerge'&&typeof uDeck==='function'){
   const d=uDeck(),flip=root.querySelector('.u-flip.back');
   if(d&&flip&&!root.querySelector('.wn-conf')){const c=uCurrent(d);if(c){let html='';
    if(d.key==='zh'&&ZG()){const w=ZG().words().find(x=>x.mid===c.mid);if(w)html=window.WordNestConfuse.zhLine(w);}
    else if(d.key==='eng'){const w=enWords().find(x=>x.en.toLowerCase()===String(c.f).toLowerCase());if(w)html=window.WordNestConfuse.enLine(w);}
    if(html)flip.insertAdjacentHTML('afterend',html);}}
  }
 }
 /* ---------- top bar: language switch and pinyin toggle ---------- */
 const bar=document.querySelector('.topbar-right');
 if(bar&&!bar.querySelector('.wn-hswitch')){
  const box=document.createElement('div');box.className='wn-hswitch';box.setAttribute('role','group');box.setAttribute('aria-label','Language');
  box.innerHTML='<a href="./?lang=en"'+(LANG==='en'?' aria-current="page"':'')+'>EN</a><a href="./?lang=zh" lang="zh"'+(LANG==='zh'?' aria-current="page"':'')+'>中文</a>'
   +(LANG==='zh'?'<button type="button" class="wn-pyt" data-action="wn-pinyin" aria-pressed="'+!data.settings.hidePinyin+'" title="Show or hide pinyin in games and on card backs">拼音 '+(data.settings.hidePinyin?'off':'on')+'</button>':'');
  bar.prepend(box);
 }
 /* ---------- styles ---------- */
 const css=document.createElement('style');
 css.textContent=''
  +'.wn-hswitch{display:flex;align-items:center;gap:4px}.wn-hswitch a,.wn-hswitch button{min-height:44px;min-width:44px;display:inline-flex;align-items:center;justify-content:center;padding:0 10px;border:2px solid var(--ink);border-radius:var(--r-s,8px);background:var(--panel);color:var(--text);font-weight:900;font-size:13px;text-decoration:none}'
  +'.wn-hswitch a[aria-current=page]{background:var(--ink);color:var(--paper)}.wn-hswitch .wn-pyt[aria-pressed=false]{background:var(--panel-2)}'
  +'@media(max-width:560px){.topbar-date,#soundToggle{display:none}.mobile-logo{white-space:nowrap}.wn-hswitch a,.wn-hswitch button{padding:0 7px}.topbar-right{gap:8px}}'
  +'.wn-hide-py .zg-py:not(.peek){filter:blur(7px);cursor:pointer;user-select:none}.wn-hide-py .u-flip.back strong>b:first-child{filter:blur(7px)}'
  +'.wn-garden-row{display:flex;gap:18px;align-items:center}.wn-plant{flex:none;width:120px;height:112px}.wn-garden-text{flex:1;min-width:0}.wn-garden h3{margin:4px 0 2px;font-size:22px}'
  +'.wn-status{display:flex;flex-wrap:wrap;gap:8px 18px;margin:8px 0}.wn-status b{font:700 22px var(--num,serif);margin-right:4px}'
  +'.wn-bar{display:flex;height:10px;border:2px solid var(--ink);border-radius:99px;overflow:hidden;background:var(--panel-2);max-width:460px}.wn-bar i{display:block;height:100%;background:var(--ink)}.wn-bar i.l{background:var(--acc,#e33)}'
  +'.wn-garden,.wn-heat-panel{margin-top:22px}'
  +'.wn-heat{display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,1fr);gap:4px;max-width:100%;overflow:hidden;justify-content:start}'
  +'.wn-heat i,.wn-key{display:inline-block;width:clamp(12px,3.4vw,20px);aspect-ratio:1;border:1.5px solid var(--ink);border-radius:4px;background:var(--panel)}'
  +'.wn-heat i.some,.wn-key.some{background:repeating-linear-gradient(135deg,var(--panel) 0 2px,var(--ink) 2px 3px)}.wn-heat i.met,.wn-key.met{background:var(--ink)}.wn-heat i.now{outline:2px solid var(--acc,#e33);outline-offset:1px}.wn-key{width:12px;vertical-align:-2px}'
  +'.wn-clock{font:700 26px var(--num,serif);font-variant-numeric:tabular-nums}.wn-term{font-size:clamp(40px,9vw,64px)}'
  +'.wd-line{margin:8px 0 0;font-size:18px;letter-spacing:.04em;overflow-wrap:anywhere}.wd-ok{color:inherit}.wd-miss{text-decoration:none;background:var(--low,#cfe8d6);color:var(--low-t,#123);border-bottom:2px solid currentColor;padding:0 1px}.wd-extra{background:var(--hi,#f6d0cb);color:var(--hi-t,#511);padding:0 1px}'
  +'.wn-conf{margin:12px 0 0;font-weight:700;line-height:2}.wn-conf-b{min-height:40px;margin:0 2px;padding:0 10px;border:2px solid var(--ink);border-radius:var(--r-s,8px);background:var(--panel);color:var(--text);font-weight:900;cursor:pointer}'
  +'.wn-compare{display:grid;grid-template-columns:1fr 1fr;gap:10px}.wn-side{border:2px solid var(--ink);border-radius:var(--r-s,8px);padding:10px 12px;min-width:0;overflow-wrap:anywhere}.wn-side h3{font-size:24px;margin:0 0 4px}.wn-side p{margin:4px 0}'
  +'.wn-dlg{max-width:min(560px,calc(100vw - 32px))}.wn-link-r{margin-top:8px;max-height:46vh;overflow:auto}.wn-ai-conf{border-top:2px solid var(--ink);margin-top:10px;padding-top:6px}'
  +'.wn-sdict{width:min(100%,560px);min-height:80px;padding:10px 12px;font-size:17px;resize:vertical}'
  +'@media(max-width:520px){.wn-garden-row{flex-direction:column;align-items:flex-start}.wn-compare{grid-template-columns:1fr}}';
 document.head.appendChild(css);
 /* ---------- Chinese games menu extras ---------- */
 if(LANG==='zh')window.WordNestZhMenuExtra=()=>gardenHTML()+heatHTML()+'<div class="pill-row mt20"><button class="btn btn-outline" data-action="wn-csv-out" data-which="zh">↓ Export Chinese words (CSV)</button></div>';
 /* ---------- render + actions ---------- */
 const baseRender=render;
 render=function(){
  if(ui.page==='panic'){updateChrome();const bc=document.getElementById('breadcrumbCurrent');if(bc)bc.textContent='Panic review';document.querySelectorAll('[data-page]').forEach(x=>x.classList.remove('active'));document.getElementById('mainContent').innerHTML=panicHTML();return;}
  const r=baseRender.apply(this,arguments);try{decorate();}catch(e){console.warn(e);}return r;
 };
 const baseHandle=handleAction;
 handleAction=function(el){
  const a=el.dataset.action;
  switch(a){
   case 'wn-panic':panicStart();return;
   case 'wn-panic-pick':panicPick(+el.dataset.k);return;
   case 'wn-panic-exit':clearInterval(P.timer);ui.page=LANG==='zh'?'zhgames':'home';render();return;
   case 'wn-weak':weakStart();return;
   case 'wn-pinyin':data.settings.hidePinyin=!data.settings.hidePinyin;store();el.setAttribute('aria-pressed',String(!data.settings.hidePinyin));el.textContent='拼音 '+(data.settings.hidePinyin?'off':'on');render();return;
   case 'wn-compare':compare(el.dataset.lang,el.dataset.a,el.dataset.b);return;
   case 'wn-link':{const l=el.dataset.lang,on=el.getAttribute('aria-pressed')!=='true';setLink(linkKey(l,el.dataset.a),linkKey(l,el.dataset.b),on);compare(l,el.dataset.a,el.dataset.b);toast(on?'Linked':'Unlinked');render();return;}
   case 'wn-linkpick':linkPicker(el.dataset.lang,el.dataset.id);return;
   case 'wn-say':{if(el.dataset.lang==='zh'&&ZG())ZG().say(el.dataset.t);else if(typeof speak==='function')speak(el.dataset.t);return;}
   case 'wn-csv-out':exportCSV(el.dataset.which);return;
   case 'wn-csv-in':{const f=document.getElementById('wnCsvIn');if(f)f.click();return;}
  }
  return baseHandle(el);
 };
 document.addEventListener('change',e=>{if(e.target&&e.target.id==='wnCsvIn'){const f=e.target.files&&e.target.files[0];e.target.value='';importCSV(f);}});
 document.addEventListener('click',e=>{const p=e.target.closest&&e.target.closest('.wn-hide-py .zg-py');if(p)p.classList.toggle('peek');},true);
 /* words added from Study OS Today while this page is open: merge them in (never drop words from memory) */
 addEventListener('storage',e=>{
  if(e.key!=='vocabloom_mvp_v1'||!e.newValue)return;
  let o;try{o=JSON.parse(e.newValue);}catch{return;}
  const ids=new Set((data.custom||[]).map(x=>x.id)),add=(o&&Array.isArray(o.custom)?o.custom:[]).filter(x=>x&&x.id&&x.en&&!ids.has(x.id));
  if(add.length){data.custom=(data.custom||[]).concat(add);store();enCache.clear();render();toast(add.length+' new word'+(add.length>1?'s':'')+' added');}
 });
 window.WordNestPlus={gardenHTML,heatHTML,panicStart,weakStart,exportCSV,importCSV,status,P};
 render();
})();
