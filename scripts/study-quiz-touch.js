/* Quiz pages (acc/eco/math): swipe on the question card to move between questions (owner, 23 Nov 2026).
   Left = next, right = previous; it presses the page's own Previous/Next buttons, so nothing new is stored.
   Ignored when the swipe starts in the scratchpad, a text box, a table or a scrollable area, and in the
   right edge zone, which stays for opening the notes (scripts/study-quiz-notes.js). */
(function(){
  'use strict';
  var EDGE=64,MIN=70,sx=0,sy=0,t0=0,on=false;
  function skip(el){
    for(var n=el;n&&n!==document.body;n=n.parentNode){
      if(n.nodeType!==1)continue;
      var tag=n.tagName;
      if(tag==='CANVAS'||tag==='TEXTAREA'||tag==='INPUT'||tag==='SELECT'||tag==='TABLE')return true;
      if(n.scrollWidth>n.clientWidth+4){var o=getComputedStyle(n).overflowX;if(o==='auto'||o==='scroll')return true;}
    }
    return false;
  }
  document.addEventListener('touchstart',function(e){
    on=false;if(e.touches.length!==1)return;
    var t=e.touches[0],card=e.target.closest&&e.target.closest('.qcard');
    if(!card||t.clientX<16||t.clientX>innerWidth-EDGE||skip(e.target))return;
    on=true;sx=t.clientX;sy=t.clientY;t0=Date.now();
  },{passive:true});
  document.addEventListener('touchend',function(e){
    if(!on)return;on=false;
    var t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;
    if(Date.now()-t0>700||Math.abs(dx)<MIN||Math.abs(dy)>Math.abs(dx)*0.6)return;
    var b=document.getElementById(dx<0?'qnext':'qprev');
    if(b&&!b.disabled)b.click();
  },{passive:true});
})();
