/* Course deep links: course.html?tab=cards|sum|prac&cat=<chapter id>.
   Only clicks the page's existing tab and chapter chips; reads and writes no progress. */
(function(){
 'use strict';
 const tabs={cards:{box:'#cats'},sum:{box:'#sumCats'},prac:{box:'#qCats'}};
 function apply(search){
  const p=new URLSearchParams(search),tab=p.get('tab'),cat=p.get('cat');
  if(!Object.prototype.hasOwnProperty.call(tabs,tab))return false;
  const btn=document.querySelector('.tabs button[data-tab="'+tab+'"]');
  if(!btn||btn.hidden)return false;
  btn.click();
  if(!cat||typeof D==='undefined'||!Array.isArray(D.cats))return true;
  const i=D.cats.findIndex(c=>c[0]===cat);
  if(i<0)return true;
  const chips=document.querySelectorAll(tabs[tab].box+' .chip');
  /* index 0 is "all"; the engine may already have selected it from ?cat= (a second click would turn it off again) */
  if(chips[i+1]&&chips[i+1].getAttribute('aria-pressed')!=='true')chips[i+1].click();
  return true;
 }
 if(typeof module==='object'&&module.exports)module.exports={apply};
 else if(typeof document!=='undefined')apply(location.search);
})();
