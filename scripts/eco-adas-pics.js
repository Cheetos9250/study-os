/* AD-AS pictures for Economics practice (owner, 26 Nov 2026). Static SVGs in assets/adas/, drawn for this site.
   Shown inside the answer box after the question is answered (so a picture never gives the answer away).
   Nothing is stored. Ids never change, so the list is keyed by question id (D.quiz row numbers and ep-/ex- ids). */
(function(root){
  const FILES={
    keynesian:['AD increase in the Keynesian range','assets/adas/keynesian.svg'],
    classical:['AD increase in the classical range','assets/adas/classical.svg'],
    intermediate:['AD increase in the intermediate range','assets/adas/intermediate.svg'],
    adleft:['AD decrease in the intermediate range','assets/adas/adleft.svg'],
    recgap:['Recessionary gap','assets/adas/recgap.svg'],
    infgap:['Inflationary gap','assets/adas/infgap.svg'],
    stag:['Stagflation: SRAS shifts left','assets/adas/stag.svg']};
  const AFTER={};
  const add=(k,ids)=>ids.forEach(i=>{(AFTER[i]=AFTER[i]||[]).push(k)});
  add('keynesian',['52','ep-a8','ep-a117','ex-a10','ex-a21']);
  add('classical',['ep-a9','ep-a118','ex-a22']);
  add('intermediate',['ep-a10']);
  add('adleft',['ep-a14']);
  add('recgap',['ep-a12','ep-a28','ex-a26']);
  add('infgap',['ep-a30','ex-a39','ex-a40']);
  add('stag',['50','ep-a6','ep-a31','ep-a119','ex-a15','ex-a16','ex-a31']);
  function keys(id,when){ return when==='after'?(AFTER[String(id)]||[]):[]; }
  function html(id,when){
    const k=keys(id,when); if(!k.length) return '';
    return '<div class="jpics">'+k.map(n=>'<figure style="margin:10px 0;overflow-x:auto;-webkit-overflow-scrolling:touch"><img src="'+FILES[n][1]+'" alt="'+FILES[n][0]+'" loading="lazy" style="display:block;width:100%;min-width:520px;max-width:680px;height:auto;background:#fff;border-radius:8px"></figure>').join('')+'</div>';
  }
  const api={html,keys,AFTER,FILES};
  if(typeof module!=='undefined'&&module.exports) module.exports=api; else root.EcoAdasPics=api;
})(typeof window!=='undefined'?window:globalThis);
