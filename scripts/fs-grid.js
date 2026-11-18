/* Statement table for written accounting exercises whose solution is a two- or three-column statement:
   "| Opal Boutique — Income Statement |  |", "| Current assets |  |", "| Bank reconciliation |  |", "| Item | Amount |".
   The learner types lines (line item, amount, total) like the textbook layout. Check entry looks at:
   - totals (bold rows in the solution: Net sales, Gross profit, Net income …): a typed line with a matching
     name and amount;
   - every other amount in the solution: typed somewhere.
   Order does not matter; negative amounts may be typed as (1,200) or 1,200. Rows are stored by the page
   (acc.html keeps them as "fs" in the textbook progress record). Answers are never shown before Show solution. */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.StudyFS=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const MAX_ROWS=40;
 const esc=t=>String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
 function num(t){
  let s=String(t==null?'':t).replace(/\*+/g,'').trim().replace(/[$,\s฿]/g,'').replace(/−/g,'-');
  const m=s.match(/^\((.*)\)$/);if(m)s='-'+m[1];
  return /^-?(\d+\.?\d*|\.\d+)$/.test(s)?parseFloat(s):null;
 }
 const STOP=new Set(['less','add','deduct','total','and','of','the','a','an','for','from','to','on','in','expense','expenses','revenues','revenue','net','plus','minus']);
 function words(s){
  return String(s||'').toLowerCase().replace(/\([^)]*\)/g,' ').replace(/&/g,' and ').replace(/[^a-z0-9 ]+/g,' ').split(/\s+/)
   .map(w=>w.replace(/ies$/,'y').replace(/s$/,'')).filter(w=>w&&!STOP.has(w));
 }
 /* names agree when they share a meaningful word, or both are only stop words (e.g. "Net income" keeps "income") */
 const LIGHT=new Set(['less','add','deduct','and','of','the','a','an','for','from','to','on','in','plus','minus','total']);
 const allWords=s=>String(s||'').toLowerCase().replace(/\([^)]*\)/g,' ').replace(/[^a-z0-9 ]+/g,' ').split(/\s+/).map(w=>w.replace(/ies$/,'y').replace(/s$/,'')).filter(w=>w&&!LIGHT.has(w));
 function sameName(a,b){
  const A=words(a),B=words(b);
  if(A.length&&B.length)return A.some(w=>B.includes(w));
  const C=allWords(a),D=allWords(b);return C.length>0&&D.length>0&&C.some(w=>D.includes(w)); // "Total revenues" vs "Total revenue"
 }
 const isHead=c=>c.length>=2&&c[0]&&!/^date$/i.test(c[0])&&c.slice(1).every(x=>!x||/^amount$/i.test(x));
 /* Answer rows from every statement table in the solution markdown. */
 function parse(md){
  const lines=String(md||'').split('\n'),rows=[];let title='';
  const cells=l=>l.trim().replace(/^\||\|$/g,'').split('|').map(x=>x.trim());
  for(let i=0;i<lines.length;i++){
   if(!/^\s*\|/.test(lines[i])||!lines[i+1]||!/^\s*\|\s*:?-{2,}/.test(lines[i+1]))continue;
   const h=cells(lines[i]);
   if(!isHead(h)){i++;continue;}
   if(!title)title=/^item$/i.test(h[0])?'Statement':h[0].replace(/\*+/g,'');
   for(i+=2;i<lines.length&&/^\s*\|/.test(lines[i]);i++){
    const c=cells(lines[i]),label=(c[0]||'').replace(/\*+/g,'').trim();
    const amts=c.slice(1).map(num).filter(v=>v!==null&&v!==0).map(Math.abs);
    if(!label||!amts.length)continue;
    /* numbers written inside a label ("Accounts receivable 58,400 − allowance 3,150") are accepted on their own lines too */
    const inLabel=(label.match(/\(?\$?\d[\d,]*(?:\.\d+)?\)?/g)||[]).map(num).filter(v=>v!==null&&Math.abs(v)>=10).map(Math.abs);
    rows.push({label,amts,also:inLabel,total:/^\s*\*\*/.test(c[0])||c.slice(1).some(x=>/^\*\*/.test(x))});
   }
   i--;
  }
  return {title,rows};
 }
 function clean(rows){
  if(!Array.isArray(rows))return [];
  return rows.slice(0,MAX_ROWS).map(r=>Array.isArray(r)?[0,1,2].map(i=>String(r[i]==null?'':r[i]).slice(0,100)):['','','']);
 }
 const filled=r=>r.some(x=>String(x).trim());
 const close=(a,b)=>Math.abs(a-b)<0.01;
 /* Check typed rows against the answer. */
 function check(rows,ans){
  const typed=rows.map(r=>({label:r[0],amts:[num(r[1]),num(r[2])].filter(v=>v!==null&&v!==0).map(Math.abs)}));
  const totals=ans.rows.filter(r=>r.total),plain=ans.rows.filter(r=>!r.total);
  const used=new Set();
  let tOk=0;const tMiss=[];
  for(const t of totals){
   const amt=t.amts[t.amts.length-1];
   const i=typed.findIndex((u,k)=>!used.has(k)&&u.amts.some(v=>close(v,amt))&&sameName(u.label,t.label));
   if(i>=0){used.add(i);tOk++;}else tMiss.push(t.label);
  }
  const all=typed.flatMap(u=>u.amts);
  const need=plain.flatMap(r=>r.amts),pool=all.slice();let lOk=0;
  for(const r of plain)for(const v of r.amts){let k=pool.findIndex(x=>close(x,v));
   /* a net line may be shown as its parts (58,400 and 3,150 for 55,250) */
   if(k<0&&r.also&&r.also.length>=2&&r.also.every(a=>pool.some(x=>close(x,a)))){lOk++;continue;}
   if(k>=0){pool.splice(k,1);lOk++;}}
  const known=ans.rows.flatMap(r=>r.amts.concat(r.also||[]));
  const res=rows.map((r,i)=>{
   if(!filled(r))return null;const u=typed[i];
   if(!u.amts.length)return String(r[0]).trim()?null:{ok:false,why:'Enter an amount'};
   if(used.has(i))return {ok:true};
   const bad=u.amts.filter(v=>!known.some(k=>close(k,v)));
   if(bad.length)return {ok:false,why:'Check the amount'};
   const tot=totals.find(t=>u.amts.some(v=>close(v,t.amts[t.amts.length-1])));
   if(tot&&!plain.some(p=>p.amts.some(v=>u.amts.some(x=>close(x,v)))))return {ok:false,why:'Amount fits "'+tot.label+'" — check the name'};
   return {ok:true};
  });
  return {rows:res,totalsOk:tOk,totals:totals.length,totalsMissing:tMiss,linesOk:lOk,lines:need.length,
   all:tOk===totals.length&&lOk===need.length&&res.every(x=>!x||x.ok)};
 }
 const CSS='.fs{border:1px solid var(--line,rgba(127,127,127,.4));border-radius:10px;padding:10px 12px;margin:10px 0}'
 +'.fs-h{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:6px}.fs-h b{font-size:15px}.fs-h span{font-size:12.5px;opacity:.75}'
 +'.fs-row{display:grid;grid-template-columns:minmax(0,1fr) 112px 112px 36px;gap:6px;align-items:center;margin:4px 0}'
 +'.fs-head{font-size:12px;font-weight:700;opacity:.75;margin-bottom:2px}.fs-head .n{text-align:right;padding-right:8px}'
 +'.fs input{width:100%;box-sizing:border-box;min-height:40px;padding:6px 8px;border-radius:8px;border:1px solid rgba(127,127,127,.45);background:transparent;color:inherit;font:inherit;font-size:15px}'
 +'.fs input.n{text-align:right;font-variant-numeric:tabular-nums}.fs input.tot{font-weight:700}'
 +'.fs-row.ok input{border-color:var(--ok,#2f8f5b)}.fs-row.no input{border-color:var(--bad,#d6453d)}'
 +'.fs-x{min-height:40px;border:0;background:transparent;color:inherit;opacity:.6;font-size:20px;cursor:pointer;border-radius:8px}.fs-x:hover{opacity:1}'
 +'.fs-why{grid-column:1/-1;font-size:12.5px;margin:-2px 0 4px}.fs-why.ok{color:var(--ok,#2f8f5b)}.fs-why.no{color:var(--bad,#d6453d)}'
 +'.fs-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px}.fs-sum{font-size:13px}.fs-sum.ok{color:var(--ok,#2f8f5b);font-weight:700}.fs-miss{font-size:12.5px;margin:6px 0 0;color:var(--bad,#d6453d)}'
 +'@media (max-width:560px){.fs-row{grid-template-columns:minmax(0,1fr) minmax(0,1fr) 34px;grid-template-areas:"lab lab x" "amt tot ."}'
 +'.fs-row .l{grid-area:lab}.fs-row .a{grid-area:amt}.fs-row .t{grid-area:tot}.fs-row .fs-x{grid-area:x}'
 +'.fs-row{padding-bottom:6px;border-bottom:1px dashed rgba(127,127,127,.35)}.fs-head{display:none}}'
 /* the same narrow layout when the table sits in a narrow panel (My PDF sets side panel) */
 +'.fs{container-type:inline-size}@container (max-width:560px){.fs-row{grid-template-columns:minmax(0,1fr) minmax(0,1fr) 34px;grid-template-areas:"lab lab x" "amt tot ."}'
 +'.fs-row .l{grid-area:lab}.fs-row .a{grid-area:amt}.fs-row .t{grid-area:tot}.fs-row .fs-x{grid-area:x}'
 +'.fs-row{padding-bottom:6px;border-bottom:1px dashed rgba(127,127,127,.35)}.fs-head{display:none}}';
 function ensureCss(doc){if(doc.getElementById('fsCss'))return;const s=doc.createElement('style');s.id='fsCss';s.textContent=CSS;doc.head.appendChild(s);}
 function html(){return '<div class="fs" id="fsBox" role="group" aria-label="Statement"></div>';}
 const nice=t=>{const m=String(t).split(/\s+—\s+/);const x=m.length>1?m.slice(1).join(' — '):String(t);
  return /^(current|non-current|plant|long-term)?\s*(assets|liabilities|equity)\b/i.test(x)?'Balance sheet · '+x:x;};
 /* Mount the table in box. opts: {answer:{title,rows}, rows, save(rows), onAllCorrect()} */
 function mount(box,opts){
  if(!box)return null;ensureCss(box.ownerDocument);
  const B=opts.btnClass||'btn'; /* noCheck: a free table with live totals only (no answer to compare with) */
  const ans=opts.answer||{title:'',rows:[]};
  let rows=clean(opts.rows);while(rows.length<4)rows.push(['','','']);
  let result=null,timer=null;
  const save=()=>{clearTimeout(timer);timer=setTimeout(()=>opts.save&&opts.save(rows.filter(filled).length?rows:[]),300);};
  function paint(focus){
   let h='<div class="fs-h"><b>'+esc(nice(ans.title)||'Statement')+'</b><span>One line per item. Put subtotals and totals in Total.</span></div>'
    +'<div class="fs-row fs-head" aria-hidden="true"><span>Line item</span><span class="n">Amount</span><span class="n">Total</span><span></span></div>';
   rows.forEach((r,i)=>{const rr=result&&result.rows[i];
    h+='<div class="fs-row'+(rr?rr.ok?' ok':' no':'')+'" data-r="'+i+'">'
     +'<input class="l" data-c="0" value="'+esc(r[0])+'" placeholder="'+(i===0?'e.g. Sales':'Line item')+'" aria-label="Line '+(i+1)+' item" autocomplete="off" autocapitalize="sentences" spellcheck="false">'
     +'<input class="n a" data-c="1" inputmode="decimal" value="'+esc(r[1])+'" placeholder="Amount" aria-label="Line '+(i+1)+' amount" autocomplete="off">'
     +'<input class="n t tot" data-c="2" inputmode="decimal" value="'+esc(r[2])+'" placeholder="Total" aria-label="Line '+(i+1)+' total" autocomplete="off">'
     +'<button type="button" class="fs-x" data-x="'+i+'" aria-label="Remove line '+(i+1)+'">×</button>'
     +(rr?'<div class="fs-why '+(rr.ok?'ok':'no')+'">'+(rr.ok?'✓ in the answer':'✗ '+esc(rr.why))+'</div>':'')+'</div>';});
   h+='<div class="fs-bar"><button type="button" class="'+B+'" data-add>+ Add line</button>'+(opts.noCheck?'':'<button type="button" class="'+B+' primary" data-check>Check statement</button>')+''
    +'<span class="fs-sum'+(result&&result.all?' ok':'')+'" aria-live="polite">'+(result?result.all?'All correct.':'Totals '+result.totalsOk+' of '+result.totals+' · amounts '+result.linesOk+' of '+result.lines:'')+'</span>'
    +(result&&result.all&&opts.onAllCorrect?'<button type="button" class="'+B+' primary" data-got>Mark as got it</button>':'')+'</div>'
    +(result&&!result.all&&result.totalsMissing.length?'<p class="fs-miss">Missing or wrong: '+result.totalsMissing.map(esc).join(', ')+'</p>':'');
   box.innerHTML=h;
   if(focus){const el=box.querySelector('[data-r="'+focus[0]+'"] [data-c="'+focus[1]+'"]');if(el)el.focus();}
  }
  box.addEventListener('input',e=>{
   const inp=e.target,row=inp.closest('[data-r]');if(!row||!inp.dataset.c)return;
   rows[+row.dataset.r][+inp.dataset.c]=inp.value.slice(0,100);
   if(result){result=null;box.querySelectorAll('.fs-row').forEach(x=>x.classList.remove('ok','no'));box.querySelectorAll('.fs-why,.fs-miss,[data-got]').forEach(x=>x.remove());const s=box.querySelector('.fs-sum');if(s){s.textContent='';s.className='fs-sum';}}
   save();
  });
  box.addEventListener('keydown',e=>{
   if(e.key!=='Enter'||!e.target.dataset.c)return;e.preventDefault();
   const i=+e.target.closest('[data-r]').dataset.r;
   if(i===rows.length-1&&rows.length<MAX_ROWS&&filled(rows[i])){rows.push(['','','']);paint([i+1,0]);}
   else paint([Math.min(i+1,rows.length-1),0]);
  });
  box.addEventListener('click',e=>{
   const x=e.target.closest('[data-x]');
   if(x){rows.splice(+x.dataset.x,1);if(!rows.length)rows.push(['','','']);result=null;paint();save();return;}
   if(e.target.closest('[data-add]')){if(rows.length<MAX_ROWS){rows.push(['','','']);paint([rows.length-1,0]);}return;}
   if(e.target.closest('[data-check]')){result=check(rows,ans);paint();return;}
   if(e.target.closest('[data-got]')&&opts.onAllCorrect)opts.onAllCorrect();
  });
  paint();
  return {rows:()=>rows,flush:()=>{clearTimeout(timer);opts.save&&opts.save(rows.filter(filled).length?rows:[]);}};
 }
 return {parse,check,clean,words,sameName,num,html,mount};
});
