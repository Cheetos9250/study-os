/* WordNest → AI tutor (tutor.html). An "Ask AI" button on each word (word library, learn and game screens,
   flashcards, Chinese games) opens three ready questions:
   - example sentences, - how it differs from similar words, - /quiz on the words I get wrong most often.
   Each one opens tutor.html?course=eng|zh&q=<question>; the tutor only fills the box, nothing is sent until Send.
   Reads only; no storage keys. */
'use strict';
(function(){
 const LANG=(window.WORDNEST&&WORDNEST.lang)||'en';
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const clean=s=>String(s||'').replace(/\*\*/g,'').replace(/\s+/g,' ').trim();
 /* the words I get wrong most often */
 function mistakes(lang,max=12){
  if(lang==='zh'){
   const d=typeof uDeck==='function'?uDeck('zh'):null;if(!d)return [];
   const s=uReadSrs(d).s,by=new Map(d.cards.map(x=>[x[4],x]));
   return Object.entries(s).filter(([id,v])=>by.has(id)&&v&&(Number(v.lapses)>0||Number(v.last)===1))
    .sort((a,b)=>(Number(b[1].lapses)||0)-(Number(a[1].lapses)||0)||(Number(b[1].ts)||0)-(Number(a[1].ts)||0))
    .slice(0,max).map(([id])=>{const x=by.get(id),py=Array.isArray(x[7])?x[7][1]:'';return x[1]+(py?' ('+py+')':'');});
  }
  const prog=(typeof data==='object'&&data.progress)||{};
  return Object.entries(prog).filter(([,p])=>p&&Number(p.wrong)>0)
   .sort((a,b)=>(Number(b[1].wrong)-Number(b[1].correct||0))-(Number(a[1].wrong)-Number(a[1].correct||0))||Number(b[1].wrong)-Number(a[1].wrong))
   .slice(0,max).map(([id])=>{const w=typeof getWord==='function'?getWord(id):null;return w?w.en:'';}).filter(Boolean);
 }
 function prompts(lang,term,mean){
  const t=clean(term),m=clean(mean),about=m?' ('+m+')':'';
  const miss=mistakes(lang);if(t&&!miss.includes(t)&&!miss.some(x=>x.startsWith(t+' ')))miss.unshift(t);
  if(lang==='zh')return [
   ['Example sentences','ยกตัวอย่างประโยคภาษาจีนง่าย ๆ 5 ประโยคที่ใช้คำว่า '+t+about+' เขียนอักษรจีน พินอิน และคำแปลไทยทุกประโยค แล้วบอกคำที่มักใช้คู่กัน'],
   ['Similar words','อธิบายความต่างของคำว่า '+t+about+' กับคำภาษาจีนที่ความหมายหรือเสียงคล้ายกัน ทำเป็นตารางเทียบ (อักษรจีน · พินอิน · ความหมาย · ใช้เมื่อไร) พร้อมประโยคตัวอย่างคู่กัน'],
   ['Quiz my mistakes','/quiz 10 คำศัพท์ภาษาจีนที่ผมทำผิดบ่อย: '+miss.join(', ')]];
  return [
   ['Example sentences','Give 5 example sentences (B1–B2) using "'+t+'"'+about+', each with a Thai translation, and list common collocations with this word.'],
   ['Similar words','Explain the difference between "'+t+'"'+about+' and English words with a similar meaning or spelling. Use a table (word · meaning in Thai · when to use) and give a pair of example sentences for each.'],
   ['Quiz my mistakes','/quiz 10 English vocabulary I often get wrong: '+miss.join(', ')]];
 }
 function link(lang,q){return '../tutor.html?course='+(lang==='zh'?'zh':'eng')+'&q='+encodeURIComponent(q);}
 function dialog(){
  let d=document.getElementById('wnAiDlg');
  if(!d){d=document.createElement('dialog');d.id='wnAiDlg';d.setAttribute('aria-labelledby','wnAiTitle');d.className='wn-ai-dlg';document.body.appendChild(d);
   d.addEventListener('click',e=>{if(e.target===d||e.target.closest('[data-ai-close]'))d.close();});}
  return d;
 }
 function open(lang,term,mean){
  const d=dialog(),list=prompts(lang,term,mean);
  d.innerHTML='<h2 id="wnAiTitle">Ask AI about <span'+(lang==='zh'?' lang="zh"':'')+'>'+esc(clean(term))+'</span></h2>'
   +'<p class="subheading">Opens the AI tutor with the question ready. Check it, then tap Send.</p>'
   +list.map(([label,q])=>'<a class="btn btn-outline wn-ai-opt" href="'+esc(link(lang,q))+'"><b>'+esc(label)+'</b><small>'+esc(q.length>120?q.slice(0,117)+'…':q)+'</small></a>').join('')
   +'<button type="button" class="btn btn-primary" data-ai-close>Close</button>';
  if(d.showModal&&!d.open)d.showModal();else d.setAttribute('open','');
 }
 function quizMistakes(lang){
  const miss=mistakes(lang);
  if(!miss.length){toast('No mistakes saved yet. Play a game first.');return;}
  location.href=link(lang,prompts(lang,'','')[2][1]);
 }
 /* add the button next to each English word's listen button, and on the flashcard */
 function decorate(){
  const root=document.getElementById('mainContent');if(!root)return;
  root.querySelectorAll('[data-action="speak"][data-word]').forEach(b=>{
   if(b.nextElementSibling&&b.nextElementSibling.dataset.action==='ai-word')return;
   const x=document.createElement('button');x.type='button';x.dataset.action='ai-word';x.dataset.word=b.dataset.word;x.dataset.lang='en';
   if(b.classList.contains('btn')){x.className='btn btn-outline';x.textContent='✦ Ask AI';}else{x.className=b.className;x.textContent='AI';x.setAttribute('aria-label','Ask AI about this word');x.title='Ask AI';}
   b.after(x);
  });
  if(LANG==='en'&&typeof ui==='object'&&ui.page==='practice'&&!ui.game&&!root.querySelector('[data-action="ai-quiz"]')){
   const sel=root.querySelector('.games-selection');
   if(sel){const p=document.createElement('div');p.className='pill-row mt20';p.innerHTML='<button class="btn btn-outline" data-action="ai-quiz" data-lang="en">✦ AI quiz on my mistakes</button>';sel.after(p);}
  }
  const sp=root.querySelector('[data-action="u-speak"]');
  if(sp&&!(sp.nextElementSibling&&sp.nextElementSibling.dataset.action==='ai-card')){
   const x=document.createElement('button');x.type='button';x.className='btn btn-outline mt20';x.dataset.action='ai-card';x.textContent='✦ Ask AI';sp.after(x);
  }
 }
 const css=document.createElement('style');
 css.textContent='.wn-ai-dlg{max-width:min(460px,calc(100vw - 32px));border:var(--bw,3px) solid var(--ink,#111);border-radius:var(--r,10px);padding:18px;background:var(--panel,#fff);color:var(--text,#111)}'
  +'.wn-ai-dlg::backdrop{background:rgba(0,0,0,.45)}.wn-ai-dlg h2{margin:0 0 6px;font-size:22px}'
  +'.wn-ai-opt{display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;margin:0 0 10px;padding:10px 14px;text-align:left;white-space:normal;text-decoration:none}'
  +'.wn-ai-opt small{font-weight:500;color:var(--muted);line-height:1.4;font-size:13px}'
  +'[data-action="ai-word"].icon-small{font-weight:900;font-size:12px}';
 document.head.appendChild(css);
 const baseRender=render;
 render=function(){const r=baseRender.apply(this,arguments);try{decorate();}catch{}return r;};
 const baseHandle=handleAction;
 handleAction=function(el){
  const a=el.dataset.action;
  if(a==='ai-word'){
   if(el.dataset.word&&typeof getWord==='function'){const w=getWord(el.dataset.word);if(w)open('en',w.en,w.th);return;}
   open(el.dataset.lang==='zh'?'zh':'en',el.dataset.term||'',el.dataset.mean||'');return;
  }
  if(a==='ai-card'){
   const d=typeof uDeck==='function'?uDeck():null,c=d&&typeof uCurrent==='function'?uCurrent(d):null;if(!c)return;
   const lang=d.key==='zh'?'zh':'en',raw=d.cards.find(x=>x[4]===c.mid);
   const mean=raw?clean(raw[5]||c.b):clean(c.b).slice(0,120);
   const py=lang==='zh'&&raw&&Array.isArray(raw[7])?raw[7][1]+' · ':'';
   open(lang,c.f,py+mean);return;
  }
  if(a==='ai-quiz'){quizMistakes(el.dataset.lang==='zh'?'zh':LANG);return;}
  return baseHandle(el);
 };
 window.WordNestAI={prompts,mistakes,link,open};
 decorate();
})();
