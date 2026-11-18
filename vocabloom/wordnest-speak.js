/* WordNest English speaking check: a 🎤 button next to each English word's listen button. Tap it, say the word,
   and the browser's speech recognition (Safari on iPad: Dictation on) says whether it heard that word.
   Feedback only: nothing is saved and nothing is sent anywhere by this page (the browser's own recognizer may use
   Apple's or Google's speech service, like Dictation). Chinese speaking is the Speak game in wordnest-zh-games.js. */
'use strict';
(function(){
 const norm=s=>String(s||'').toLowerCase().normalize('NFKC').replace(/[^a-z0-9' ]+/g,' ').replace(/\s+/g,' ').trim();
 /* did one of the recognizer's guesses contain the word (or phrase)? */
 function heardWord(alts,word){const w=norm(word);if(!w)return false;return (alts||[]).some(t=>(' '+norm(t)+' ').includes(' '+w+' '));}
 if(typeof module==='object'&&module.exports){module.exports={heardWord,norm};return;}
 window.WordNestSpeak={heardWord,norm};
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!window.WORDNEST||WORDNEST.lang!=='en'||!SR)return;                // no button where it cannot work
 let busy=false;
 function listen(word,btn){
  if(busy)return;busy=true;const old=btn.textContent;btn.textContent='…';btn.setAttribute('aria-busy','true');
  const r=new SR();r.lang='en-US';r.interimResults=false;r.maxAlternatives=5;let done=false;
  const end=msg=>{busy=false;btn.textContent=old;btn.removeAttribute('aria-busy');if(msg)toast(msg);};
  r.onresult=e=>{done=true;const alts=[...e.results[0]].map(a=>a.transcript);end(heardWord(alts,word)?'✓ Clear! I heard “'+word+'”':'Not quite. I heard “'+(alts[0]||'')+'”. Tap ♫ to listen, then try again.');};
  r.onerror=e=>{done=true;end(e.error==='not-allowed'?'Microphone blocked: allow it in Settings → Safari → Microphone':'No speech heard. Try again.');};
  r.onend=()=>{if(!done)end('No speech heard. Try again.');};
  try{r.start();}catch{end('Could not start the microphone');}
 }
 function decorate(){
  const root=document.getElementById('mainContent');if(!root)return;
  root.querySelectorAll('[data-action="speak"][data-word]').forEach(b=>{
   const after=b.nextElementSibling&&b.nextElementSibling.dataset.action==='ai-word'?b.nextElementSibling:b;
   if(after.nextElementSibling&&after.nextElementSibling.dataset.action==='en-mic')return;
   const x=document.createElement('button');x.type='button';x.dataset.action='en-mic';x.dataset.word=b.dataset.word;
   if(b.classList.contains('btn')){x.className='btn btn-outline';x.textContent='🎤 Say it';}else{x.className=b.className;x.textContent='🎤';}
   x.setAttribute('aria-label','Say this word and check');x.title='Say it';after.after(x);
  });
 }
 const baseRender=render;
 render=function(){const r=baseRender.apply(this,arguments);try{decorate();}catch{}return r;};
 const baseHandle=handleAction;
 handleAction=function(el){if(el.dataset.action==='en-mic'){const w=typeof getWord==='function'?getWord(el.dataset.word):null;if(w)listen(w.en,el);return;}return baseHandle(el);};
 decorate();
})();
