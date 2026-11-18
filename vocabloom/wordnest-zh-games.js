/* WordNest Chinese games (?lang=zh): Match, Listen, Pinyin and Meaning over the 279 Chinese flashcards.
   Progress goes into the Chinese flashcard schedule (zh-vocab-v1-srs, already backed up and synced):
   - a wrong answer counts as "Again" (the word comes back soon);
   - a right answer on a word that is due or new counts as "Good"; a right answer on a word that is not due yet changes nothing.
   No new storage keys. Deep link: vocabloom/?lang=zh&game=match|listen|pinyin|meaning */
'use strict';
(function(){
 if(!window.WORDNEST||WORDNEST.lang!=='zh')return;
 const MODES=[
  ['match','🧩','Match','Pair each word with its meaning'],
  ['listen','🎧','Listen','Hear the word, pick the characters'],
  ['pinyin','🔤','Pinyin','See the characters, pick the pinyin'],
  ['meaning','💬','Meaning','See the characters, pick the meaning']];
 const ROUND=10,PAIRS=5;
 const G={mode:'',cat:'all',items:[],i:0,answer:null,score:0,missed:[],board:null};
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 function deck(){return typeof uDeck==='function'?uDeck('zh'):null;}
 /* raw card: [cat, characters, back, ref, id, short meaning, full, [characters, pinyin, pinyin]] */
 function words(){
  const d=deck();if(!d)return [];
  return d.cards.map(x=>{
   const py=(Array.isArray(x[7])&&x[7][1])||((/\*\*([^*]+)\*\*/.exec(x[2]||'')||[])[1])||'';
   const lines=String(x[5]||x[2]||'').replace(/\*\*/g,'').split('\n').map(s=>s.trim()).filter(Boolean);
   return {cat:x[0],hz:String(x[1]||''),py:String(py).trim(),th:lines[0]||'',en:lines[1]||'',mid:x[4]};
  }).filter(w=>w.hz&&w.py&&w.th);
 }
 const meaning=w=>w.th+(w.en&&w.en!==w.th?' · '+w.en:'');
 function srs(){return uReadSrs(deck());}
 function pool(){
  const all=words().filter(w=>G.cat==='all'||w.cat===G.cat),s=srs().s,now=Date.now();
  const due=all.filter(w=>s[w.mid]&&Number(s[w.mid].due||0)<=now),fresh=all.filter(w=>!s[w.mid]),rest=all.filter(w=>s[w.mid]&&Number(s[w.mid].due||0)>now);
  return shuffle(due).concat(shuffle(fresh),shuffle(rest));                 // due words first, then new, then the rest
 }
 /* record one answer in the Chinese schedule */
 function record(w,correct){
  const d=deck();if(!d||typeof uSchedule!=='function')return;
  const p=uReadSrs(d),cur=p.s[w.mid],now=Date.now(),isDue=!cur||Number(cur.due||0)<=now;
  if(correct&&!isDue)return;
  const day=uStartDay(now);if(p.m.day!==day){p.m.day=day;p.m.newDone=0;}
  if(!cur)p.m.newDone=(Number(p.m.newDone)||0)+1;
  p.s[w.mid]=uSchedule(cur,correct?3:1);
  try{const old=JSON.parse(localStorage.getItem(d.markKey+'-srs')||'{}')||{};localStorage.setItem(d.markKey+'-srs',JSON.stringify({...old,s:p.s,m:p.m}));}catch{toast('Could not save progress');return;}
  if(window.StudyCloud)StudyCloud.dirty();
 }
 function say(text){
  if(!('speechSynthesis' in window)){toast('This browser cannot read aloud');return;}
  speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='zh-CN';u.rate=.8;
  const v=speechSynthesis.getVoices().find(x=>/^zh(-|_)?(CN|Hans)?/i.test(x.lang));if(v)u.voice=v;
  speechSynthesis.speak(u);
 }
 function options(w,field,list){
  const val=x=>field==='mean'?meaning(x):x[field];
  const same=shuffle(list.filter(x=>x.cat===w.cat)),other=shuffle(list.filter(x=>x.cat!==w.cat)),out=[val(w)],seen=new Set(out);
  for(const x of same.concat(other)){if(out.length>=4)break;const v=val(x);if(!v||seen.has(v)||x.hz===w.hz)continue;seen.add(v);out.push(v);}
  return shuffle(out);
 }
 function start(mode){
  G.mode=mode;G.i=0;G.answer=null;G.score=0;G.missed=[];G.board=null;
  const list=pool(),all=words();
  if(list.length<4){toast('This chapter has too few words for a game');G.mode='';return;}
  if(mode==='match'){
   const pick=list.slice(0,PAIRS);
   G.board={left:shuffle(pick),right:shuffle(pick),sel:null,done:{},wrong:{},flash:null};
   G.items=pick;
  }else{
   G.items=list.slice(0,ROUND).map(w=>({w,opts:options(w,mode==='listen'?'hz':mode==='pinyin'?'py':'mean',all)}));
   if(mode==='listen')setTimeout(()=>say(G.items[0].w.hz),250);
  }
 }
 function aiBtn(w){return '<button class="btn btn-outline" data-action="ai-word" data-lang="zh" data-term="'+esc(w.hz)+'" data-mean="'+esc(w.py+' · '+meaning(w))+'">✦ Ask AI</button>';}
 function menuHTML(){
  const d=deck(),all=words(),s=srs().s,now=Date.now(),due=all.filter(w=>s[w.mid]&&Number(s[w.mid].due||0)<=now).length;
  return '<div class="u-cats" role="group" aria-label="Chapter"><button class="'+(G.cat==='all'?'on':'')+'" data-action="zg-cat" data-cat="all">All ('+all.length+')</button>'
   +(d?d.cats.map(c=>'<button class="'+(G.cat===c[0]?'on':'')+'" data-action="zg-cat" data-cat="'+esc(c[0])+'">'+esc(c[1])+'</button>').join(''):'')+'</div>'
   +'<p class="subheading">'+due+(due===1?' word':' words')+' due · due words come first, then new ones. A wrong answer brings the word back soon.</p>'
   +'<div class="zg-modes">'+MODES.map(m=>'<button class="zg-mode" data-action="zg-start" data-mode="'+m[0]+'"><span class="zg-ic" aria-hidden="true">'+m[1]+'</span><b>'+m[2]+'</b><small>'+m[3]+'</small></button>').join('')+'</div>';
 }
 function matchHTML(){
  const b=G.board,left=b.left.map(w=>{const on=b.sel===w.mid,done=b.done[w.mid],bad=b.flash&&b.flash[0]===w.mid;
    return '<button class="u-option zg-tile zg-hz'+(done?' right':bad?' wrong':on?' zg-on':'')+'" data-action="zg-left" data-id="'+esc(w.mid)+'" '+(done?'disabled':'')+' aria-pressed="'+on+'" lang="zh">'+esc(w.hz)+'</button>';}).join('');
  const right=b.right.map(w=>{const done=b.done[w.mid],bad=b.flash&&b.flash[1]===w.mid;
    return '<button class="u-option zg-tile'+(done?' right':bad?' wrong':'')+'" data-action="zg-right" data-id="'+esc(w.mid)+'" '+(done?'disabled':'')+'>'+esc(meaning(w))+'</button>';}).join('');
  const n=Object.keys(b.done).length;
  return '<div class="panel"><div class="panel-header"><span class="badge">'+n+' / '+b.left.length+' matched</span><span class="question-number">Tap a word, then its meaning</span></div>'
   +'<div class="zg-match"><div>'+left+'</div><div>'+right+'</div></div></div>';
 }
 function questionHTML(){
  const it=G.items[G.i],w=it.w,found=G.answer!==null,right=G.mode==='listen'?w.hz:G.mode==='pinyin'?w.py:meaning(w);
  const prompt=G.mode==='listen'
   ?'<button class="btn btn-primary btn-lg" data-action="zg-say">♫ Play again</button><p class="subheading mt10">Which word did you hear?</p>'
   :'<div class="zg-big" lang="zh">'+esc(w.hz)+'</div>'+(G.mode==='meaning'&&found?'<p class="zg-py">'+esc(w.py)+'</p>':'')
    +'<p class="subheading">'+(G.mode==='pinyin'?'Pick the pinyin':'Pick the meaning')+'</p>';
  const opts=it.opts.map((o,k)=>{const cls=found?(o===right?' right':k===G.answer?' wrong':''):'';
   return '<button class="u-option'+cls+'" data-action="zg-pick" data-k="'+k+'" '+(found?'disabled':'')+(G.mode==='listen'?' lang="zh"':'')+'>'+'ABCD'[k]+'. '+esc(o)+'</button>';}).join('');
  const fb=found?'<div class="notice mt20"><b>'+(it.opts[G.answer]===right?'✓ Correct':'✗ Not quite')+'</b><p><span lang="zh" class="zg-hzs">'+esc(w.hz)+'</span> · '+esc(w.py)+' · '+esc(meaning(w))+'</p>'
   +'<div class="pill-row"><button class="btn btn-outline" data-action="zg-say">♫ Listen</button>'+aiBtn(w)+'<button class="btn btn-primary" data-action="zg-next">'+(G.i+1<G.items.length?'Next →':'See result →')+'</button></div></div>':'';
  return '<div class="panel"><div class="panel-header"><span class="badge">'+(G.i+1)+' / '+G.items.length+'</span><span class="question-number">'+G.score+' correct</span></div><div class="zg-q">'+prompt+'</div>'+opts+fb+'</div>';
 }
 function resultHTML(){
  const total=G.mode==='match'?G.items.length:G.items.length,miss=G.missed;
  const list=miss.length?'<h3 class="mt20">Words to practise</h3><div class="zg-miss">'+miss.map(w=>'<div class="word-row"><div class="word-meta"><h3 lang="zh">'+esc(w.hz)+' <small>'+esc(w.py)+'</small></h3><p>'+esc(meaning(w))+'</p></div><div class="word-trail"><button class="icon-small" data-action="zg-sayw" data-hz="'+esc(w.hz)+'" aria-label="Listen">♫</button></div></div>').join('')+'</div>':'<p>No mistakes. 加油!</p>';
  return '<div class="panel"><h2>'+G.score+' / '+total+' correct</h2>'+list
   +'<div class="pill-row mt20"><button class="btn btn-primary" data-action="zg-start" data-mode="'+G.mode+'">Play again</button>'
   +(miss.length?'<button class="btn btn-outline" data-action="ai-quiz" data-lang="zh">✦ AI quiz on my mistakes</button>':'')
   +'<button class="btn btn-outline" data-action="zg-menu">All games</button></div></div>';
 }
 function html(){
  const m=MODES.find(x=>x[0]===G.mode);
  const title=m?m[2]+' · Chinese':'Chinese games';
  const back=m?'<button class="btn btn-outline" data-action="zg-menu">← All games</button>':'';
  let body;
  if(!deck())body='<div class="panel"><h3>Loading words…</h3></div>';
  else if(!m)body=menuHTML();
  else if(G.mode==='match')body=Object.keys(G.board.done).length===G.board.left.length?resultHTML():matchHTML();
  else body=G.i>=G.items.length?resultHTML():questionHTML();
  return heading(title,m?m[3]:'Match, listen and guess pinyin or meaning for '+words().length+' words',back)+body;
 }
 function paint(){
  updateChrome();const bc=document.getElementById('breadcrumbCurrent');if(bc)bc.textContent='Games';
  document.querySelectorAll('[data-page]').forEach(x=>x.classList.toggle('active',x.dataset.page==='zhgames'));
  document.getElementById('mainContent').innerHTML=html();
 }
 function act(el){
  const a=el.dataset.action;
  if(a==='zg-cat'){G.cat=el.dataset.cat;paint();return true;}
  if(a==='zg-start'){start(el.dataset.mode);paint();window.scrollTo({top:0,behavior:'instant'});return true;}
  if(a==='zg-menu'){G.mode='';paint();return true;}
  if(a==='zg-say'){const it=G.items[G.i];if(it)say(it.w.hz);return true;}
  if(a==='zg-sayw'){say(el.dataset.hz);return true;}
  if(a==='zg-pick'){
   if(G.answer!==null)return true;const it=G.items[G.i],w=it.w,k=Number(el.dataset.k);
   const right=G.mode==='listen'?w.hz:G.mode==='pinyin'?w.py:meaning(w),ok=it.opts[k]===right;
   G.answer=k;if(ok)G.score++;else G.missed.push(w);record(w,ok);
   if(G.mode!=='listen'||!ok)say(w.hz);
   paint();return true;
  }
  if(a==='zg-next'){G.i++;G.answer=null;paint();const it=G.items[G.i];if(G.mode==='listen'&&it)setTimeout(()=>say(it.w.hz),200);return true;}
  if(a==='zg-left'){const b=G.board;b.sel=b.sel===el.dataset.id?null:el.dataset.id;b.flash=null;const w=b.left.find(x=>x.mid===b.sel);if(w)say(w.hz);paint();return true;}
  if(a==='zg-right'){
   const b=G.board;if(!b.sel){toast('Tap a word on the left first');return true;}
   const w=b.left.find(x=>x.mid===b.sel);
   if(el.dataset.id===b.sel){b.done[b.sel]=1;if(!b.wrong[b.sel])G.score++;record(w,!b.wrong[b.sel]);b.sel=null;b.flash=null;}
   else{if(!b.wrong[b.sel]){b.wrong[b.sel]=1;G.missed.push(w);}b.flash=[b.sel,el.dataset.id];}
   paint();
   if(b.flash){const f=b.flash;setTimeout(()=>{if(G.board===b&&b.flash===f){b.flash=null;paint();}},700);}
   return true;
  }
  return false;
 }
 // style
 const css=document.createElement('style');
 css.textContent='.zg-modes{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:12px;margin:16px 0}'
  +'.zg-mode{display:flex;flex-direction:column;align-items:flex-start;gap:4px;text-align:left;padding:18px;min-height:120px;background:var(--panel);color:var(--text);border:var(--bw,3px) solid var(--ink);border-radius:var(--r,10px);font:inherit}'
  +'.zg-mode:hover{background:var(--panel-2)}.zg-mode b{font:700 20px var(--num,serif)}.zg-mode small{color:var(--muted);font-size:14px;line-height:1.4}.zg-ic{font-size:28px}'
  +'.zg-q{text-align:center;margin:6px 0 14px}.zg-big{font:700 clamp(54px,12vw,88px)/1.15 "Noto Sans SC","PingFang SC","Hiragino Sans GB",system-ui,sans-serif;margin:8px 0}'
  +'.zg-py{font-size:20px;font-weight:700;margin:0 0 6px}.zg-hzs{font-size:20px;font-weight:700}'
  +'.zg-match{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:10px}.zg-tile{min-height:56px;margin:0 0 10px;text-align:center;overflow-wrap:anywhere}'
  +'.zg-hz{font-size:24px;font-weight:700}.zg-tile.zg-on{background:var(--ink);color:var(--paper)}'
  +'.u-option[lang=zh]{font-size:24px;font-weight:700}.zg-miss{display:grid;gap:8px}.zg-miss small{font-size:14px;font-weight:600;color:var(--muted)}'
  +'@media(max-width:520px){.zg-tile{font-size:14px;padding:8px}.zg-tile.zg-hz{font-size:22px}}';
 document.head.appendChild(css);
 // nav: "Games" next to Flashcards
 const navCards=document.querySelector('#sideNav [data-page=studymerge]');
 if(navCards){const b=document.createElement('button');b.className='nav-item';b.dataset.page='zhgames';b.innerHTML='<span class="nav-icon">🎮</span> Games';navCards.after(b);}
 const mobCards=document.querySelector('.mobile-nav [data-page=studymerge]');
 if(mobCards){const b=document.createElement('button');b.dataset.page='zhgames';b.textContent='Games';mobCards.after(b);}
 const baseRender=render;
 render=function(){if(ui.page==='zhgames')return paint();return baseRender();};
 const baseHandle=handleAction;
 handleAction=function(el){if(String(el.dataset.action||'').startsWith('zg-')&&act(el))return;return baseHandle(el);};
 window.WordNestZhGames={words,options,start,state:G,record};
 const want=new URLSearchParams(location.search).get('game');
 const open=()=>{ui.page='zhgames';if(want&&MODES.some(m=>m[0]===want))start(want);render();};
 if(want!==null){if(deck())open();else{let n=0;const t=setInterval(()=>{if(deck()||++n>40){clearInterval(t);open();}},250);}}
 // repaint once the deck arrives if the games page is open
 else{let n=0;const t=setInterval(()=>{if(deck()||++n>40){clearInterval(t);if(ui.page==='zhgames')render();}},250);}
})();
