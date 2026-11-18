/* Read aloud (TASK 25): a "Read aloud" button on a course page's lesson summaries (?tab=sum) that reads the summaries
   on screen with the browser's own speech (speechSynthesis), section by section, in Thai or English per section.
   Nothing is sent anywhere and nothing is stored. */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.StudySpeak=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 /* language of a piece of text: the Thai voice whenever Thai is a fair part of it (it can read English words; the English voice cannot read Thai) */
 function lang(t){const th=(String(t).match(/[฀-๿]/g)||[]).length,en=(String(t).match(/[A-Za-z]/g)||[]).length;return th>0&&th*3>=en?'th-TH':'en-US';}
 /* split long text into pieces the speech engine handles well (iOS stops on very long utterances) */
 function chunks(t,max){max=max||220;const out=[];let cur='';
  for(const s of String(t).replace(/\s+/g,' ').trim().split(/(?<=[.!?。：:;])\s+|\s+(?=•)/)){
   if((cur+' '+s).length>max&&cur){out.push(cur);cur=s;}else cur=cur?cur+' '+s:s;
   while(cur.length>max){out.push(cur.slice(0,max));cur=cur.slice(max);}}
  if(cur)out.push(cur);return out;}
 if(typeof document==='undefined')return {lang,chunks};
 const S=window.speechSynthesis;let queue=[],on=false,btn=null;
 function voiceFor(l){const vs=S.getVoices?S.getVoices():[];return vs.find(v=>v.lang===l)||vs.find(v=>v.lang&&v.lang.slice(0,2)===l.slice(0,2))||null;}
 function next(){if(!on)return;const t=queue.shift();if(!t){stop();return;}const u=new SpeechSynthesisUtterance(t),l=lang(t),v=voiceFor(l);u.lang=l;if(v)u.voice=v;u.rate=1;u.onend=next;u.onerror=()=>{if(on)next();};S.speak(u);}
 function stop(){on=false;queue=[];try{S.cancel();}catch(e){}paint();}
 function paint(){if(btn){btn.textContent=on?'■ Stop reading':'🔊 Read aloud';btn.setAttribute('aria-pressed',String(on));}}
 function start(){const body=document.getElementById('sumBody');if(!body)return;
  queue=[...body.querySelectorAll('.sec')].flatMap(sec=>{const h=sec.querySelector('h2'),rest=sec.cloneNode(true);const hh=rest.querySelector('h2');if(hh)hh.remove();
   return chunks((h?h.textContent+'. ':'')+rest.textContent.replace(/\s*\n\s*/g,'. '));});
  if(!queue.length)return;on=true;paint();try{S.cancel();}catch(e){}next();}
 function mount(){
  if(!S||!window.SpeechSynthesisUtterance)return;const tab=document.getElementById('tab-sum');if(!tab||document.getElementById('readAloud'))return;
  btn=document.createElement('button');btn.type='button';btn.id='readAloud';btn.className='btn';btn.style.cssText='min-height:44px;margin:0 0 12px';btn.setAttribute('aria-pressed','false');
  btn.onclick=()=>on?stop():start();tab.insertBefore(btn,tab.firstChild);paint();
  document.addEventListener('click',e=>{if(on&&e.target.closest&&e.target.closest('#sumCats .chip,.tabs button'))stop();});
  window.addEventListener('pagehide',stop);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
 return {lang,chunks,stop};
});
