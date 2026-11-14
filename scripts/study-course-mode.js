/* Course pages show one mode at a time: Flashcards (?tab=cards, default), Lessons (?tab=sum) or Practice (?tab=prac).
   Clicks the page's own tab button, hides the tab bar and renames the header. Reads and writes no storage. */
(function(){
 'use strict';
 var LABEL={cards:'Flashcards',sum:'Lessons',prac:'Practice'};
 var NAME={acc:'Accounting',eco:'Economics',math:'Math',eng:'English',zh:'Chinese'};
 function pick(search){var t=new URLSearchParams(search).get('tab');return Object.prototype.hasOwnProperty.call(LABEL,t)?t:'cards';}
 function apply(){
  var tab=pick(location.search),btn=document.querySelector('.tabs button[data-tab="'+tab+'"]');
  if(!btn||btn.hidden){tab='cards';btn=document.querySelector('.tabs button[data-tab="cards"]');}
  if(btn&&btn.getAttribute('aria-selected')!=='true')btn.click();
  document.documentElement.classList.add('mode-locked');
  document.documentElement.setAttribute('data-mode',tab);
  var key=typeof D==='object'&&D&&D.key,h1=document.querySelector('header h1'),sub=document.querySelector('header span');
  if(h1&&NAME[key])h1.textContent=NAME[key];
  if(sub)sub.textContent=LABEL[tab];
  document.title=(NAME[key]||document.title)+' · '+LABEL[tab]+' — Study OS';
  window.StudyMode={tab:tab};
 }
 if(typeof module==='object'&&module.exports)module.exports={pick:pick,LABEL:LABEL,NAME:NAME};
 else if(typeof document!=='undefined')apply();
})();
