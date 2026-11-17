/* Journal entry grid for written accounting exercises whose solution has a "| Date | Account | Debit | Credit |" table.
   The learner types lines (date, account, debit, credit); the grid shows live Dr/Cr totals and checks the lines
   against the solution: order and dates are ignored, account names are compared loosely (case, punctuation,
   common short forms). Rows are stored by the page (acc.html keeps them as "je" in the textbook progress record).
   Correct answers are never shown before the learner asks for the solution. */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.StudyJE=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const MAX_ROWS=40;
 const esc=t=>String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
 function num(t){
  let s=String(t==null?'':t).trim().replace(/[$,\s฿]/g,'').replace(/−/g,'-');
  const m=s.match(/^\((.*)\)$/);if(m)s='-'+m[1];
  return /^-?(\d+\.?\d*|\.\d+)$/.test(s)?parseFloat(s):null;
 }
 const ALIAS=[[/^a ?r$/,'accounts receivable'],[/^a ?p$/,'accounts payable'],[/^ar /,'accounts receivable '],
  [/^cost of goods sold$/,'cost of sales'],[/^cogs$/,'cost of sales'],[/^inventory$/,'merchandise inventory'],
  [/^allowance for uncollectible accounts$/,'allowance for doubtful accounts'],[/^bad debt expense$/,'bad debts expense'],
  [/^uncollectible accounts expense$/,'bad debts expense'],[/^n ?r$/,'notes receivable'],[/^n ?p$/,'notes payable']];
 function norm(s){
  let t=String(s||'').toLowerCase().replace(/&/g,' and ').replace(/\bdr\.?\s|\bcr\.?\s/g,' ').replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();
  t=t.replace(/^(to )?/,'');
  for(const [re,to] of ALIAS)t=t.replace(re,to);
  return t;
 }
 /* Answer lines from every Date|Account|Debit|Credit table in the solution markdown. */
 function parse(md){
  const lines=String(md||'').split('\n'),out=[];
  for(let i=0;i<lines.length;i++){
   if(!/^\s*\|\s*Date\s*\|\s*Account\s*\|\s*Debit\s*\|\s*Credit\s*\|\s*$/i.test(lines[i]))continue;
   i+=2;let date='';
   for(;i<lines.length&&/^\s*\|/.test(lines[i]);i++){
    const c=lines[i].trim().replace(/^\||\|$/g,'').split('|').map(x=>x.trim());
    if(c.length<4)continue;
    if(c[0])date=c[0];
    const dr=num(c[2])||0,cr=num(c[3])||0,acct=c[1].replace(/\*+/g,'').trim();
    if(!acct||(!dr&&!cr))continue;
    out.push({date,acct,dr,cr});
   }
   i--;
  }
  return out;
 }
 const COMMON=['Cash','Accounts Receivable','Accounts Payable','Merchandise Inventory','Sales','Sales Discounts','Sales Returns and Allowances',
  'Cost of Sales','Notes Receivable','Notes Payable','Interest Revenue','Interest Receivable','Interest Expense','Allowance for Doubtful Accounts',
  'Bad Debts Expense','Credit Card Expense','Bank Service Charge Expense','Supplies','Prepaid Rent','Rent Expense','Utilities Expense',
  'Salaries Expense','Delivery Expense','Equipment','Accumulated Depreciation','Depreciation Expense','Petty Cash','Cash Over and Short',
  'Unearned Revenue','Service Revenue','Owner Capital','Owner Withdrawals','Income Summary'];
 /* Account names for the suggestion list: the answer's accounts mixed into a common list, sorted, so the list gives nothing away. */
 function accounts(answer){
  const seen=new Map();
  for(const a of [...answer.map(x=>x.acct),...COMMON]){const k=norm(a);if(k&&!seen.has(k))seen.set(k,a);}
  return [...seen.values()].sort((a,b)=>a.localeCompare(b));
 }
 function clean(rows){
  if(!Array.isArray(rows))return [];
  return rows.slice(0,MAX_ROWS).map(r=>Array.isArray(r)?[0,1,2,3].map(i=>String(r[i]==null?'':r[i]).slice(0,80)):['','','','']);
 }
 const filled=r=>r.some(x=>String(x).trim());
 function totals(rows){
  let dr=0,cr=0;
  for(const r of rows){dr+=num(r[2])||0;cr+=num(r[3])||0;}
  return {dr:Math.round(dr*100)/100,cr:Math.round(cr*100)/100};
 }
 /* Compare learner rows with the answer. Returns per-row results and a summary. */
 function check(rows,answer){
  const used=new Set(),res=[];let ok=0;
  const amt=r=>({dr:num(r[2])||0,cr:num(r[3])||0});
  rows.forEach((r,i)=>{
   if(!filled(r)){res[i]=null;return;}
   const a=amt(r),n=norm(r[1]);
   if(a.dr&&a.cr){res[i]={ok:false,why:'Use either Debit or Credit, not both'};return;}
   if(!a.dr&&!a.cr){res[i]={ok:false,why:'Enter an amount'};return;}
   let hit=-1;
   answer.forEach((x,j)=>{if(hit<0&&!used.has(j)&&norm(x.acct)===n&&Math.abs(x.dr-a.dr)<0.01&&Math.abs(x.cr-a.cr)<0.01)hit=j;});
   if(hit>=0){used.add(hit);ok++;res[i]={ok:true};return;}
   const sameAcct=answer.some((x,j)=>!used.has(j)&&norm(x.acct)===n);
   const sameAmt=answer.some((x,j)=>!used.has(j)&&(Math.abs(x.dr-a.dr)<0.01&&a.dr||Math.abs(x.cr-a.cr)<0.01&&a.cr));
   const flip=answer.some((x,j)=>!used.has(j)&&norm(x.acct)===n&&(Math.abs(x.dr-a.cr)<0.01&&a.cr||Math.abs(x.cr-a.dr)<0.01&&a.dr));
   res[i]={ok:false,why:flip?'Wrong side (Debit ↔ Credit)':sameAcct?'Check the amount':sameAmt?'Check the account name':'Not in the answer'};
  });
  const entered=res.filter(Boolean).length,t=totals(rows);
  return {rows:res,ok,entered,total:answer.length,missing:Math.max(0,answer.length-ok),balanced:t.dr===t.cr&&t.dr>0,
   all:ok===answer.length&&entered===answer.length};
 }
 const fmt=n=>n.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2});
 const CSS='.je{border:1px solid var(--line,rgba(127,127,127,.4));border-radius:10px;padding:10px 12px;margin:10px 0}'
 +'.je-h{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:6px}.je-h b{font-size:15px}.je-h span{font-size:12.5px;opacity:.75}'
 +'.je-row{display:grid;grid-template-columns:78px minmax(0,1fr) 104px 104px 36px;gap:6px;align-items:center;margin:4px 0}'
 +'.je-head{font-size:12px;font-weight:700;opacity:.75;margin-bottom:2px}.je-head .n{text-align:right;padding-right:8px}'
 +'.je input{width:100%;box-sizing:border-box;min-height:40px;padding:6px 8px;border-radius:8px;border:1px solid rgba(127,127,127,.45);background:transparent;color:inherit;font:inherit;font-size:15px}'
 +'.je input.n{text-align:right;font-variant-numeric:tabular-nums}.je input.cr{padding-left:26px}'
 +'.je-row.ok input{border-color:var(--ok,#2f8f5b)}.je-row.no input{border-color:var(--bad,#d6453d)}'
 +'.je-x{min-height:40px;border:0;background:transparent;color:inherit;opacity:.6;font-size:20px;cursor:pointer;border-radius:8px}.je-x:hover{opacity:1}'
 +'.je-why{grid-column:2/-1;font-size:12.5px;margin:-2px 0 4px}.je-why.ok{color:var(--ok,#2f8f5b)}.je-why.no{color:var(--bad,#d6453d)}'
 +'.je-tot{display:grid;grid-template-columns:78px minmax(0,1fr) 104px 104px 36px;gap:6px;border-top:2px solid currentColor;margin-top:6px;padding-top:6px;font-weight:700;font-variant-numeric:tabular-nums}'
 +'.je-tot .lab{grid-column:1/3}.je-tot .n{text-align:right;padding-right:8px}.je-bal{font-size:13px;font-weight:700;margin:6px 0 0}.je-bal.ok{color:var(--ok,#2f8f5b)}.je-bal.no{color:var(--bad,#d6453d)}'
 +'.je-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px}.je-sum{font-size:13px}.je-sum.ok{color:var(--ok,#2f8f5b);font-weight:700}'
 +'@media (max-width:560px){.je-row,.je-tot{grid-template-columns:64px minmax(0,1fr) minmax(0,1fr) 34px;grid-template-areas:"acct acct acct x" "date dr cr ."}'
 +'.je-row .d{grid-area:date}.je-row .a{grid-area:acct}.je-row .dr{grid-area:dr}.je-row .c{grid-area:cr}.je-row .je-x{grid-area:x}'
 +'.je-row{padding-bottom:6px;border-bottom:1px dashed rgba(127,127,127,.35)}.je-head{display:none}'
 +'.je-tot{grid-template-areas:"lab dr cr ."}.je-tot .lab{grid-area:lab}.je-tot .t1{grid-area:dr}.je-tot .t2{grid-area:cr}.je-why{grid-column:1/-1}}';
 function ensureCss(doc){if(doc.getElementById('jeCss'))return;const s=doc.createElement('style');s.id='jeCss';s.textContent=CSS;doc.head.appendChild(s);}
 function html(){return '<div class="je" id="jeBox" role="group" aria-label="Journal entry"></div>';}
 /* Mount the grid in box. opts: {answer, rows, save(rows), onAllCorrect()} */
 function mount(box,opts){
  if(!box)return null;ensureCss(box.ownerDocument);
  const answer=opts.answer||[],list='jeAcc'+Math.random().toString(36).slice(2,7);
  let rows=clean(opts.rows);while(rows.length<3)rows.push(['','','','']);
  let result=null,timer=null;
  const save=()=>{clearTimeout(timer);timer=setTimeout(()=>opts.save&&opts.save(rows.filter(filled).length?rows:[]),300);};
  function paint(focus){
   const t=totals(rows),any=rows.some(r=>num(r[2])||num(r[3]));
   let h='<div class="je-h"><b>Journal entry</b><span>Type each line. Indent is automatic for credits.</span></div>'
    +'<div class="je-row je-head" aria-hidden="true"><span>Date</span><span>Account</span><span class="n">Debit</span><span class="n">Credit</span><span></span></div>';
   rows.forEach((r,i)=>{const rr=result&&result.rows[i];
    h+='<div class="je-row'+(rr?rr.ok?' ok':' no':'')+'" data-r="'+i+'">'
     +'<input class="d" data-c="0" value="'+esc(r[0])+'" placeholder="Date" aria-label="Line '+(i+1)+' date" autocomplete="off">'
     +'<input class="a'+(num(r[3])&&!num(r[2])?' cr':'')+'" data-c="1" list="'+list+'" value="'+esc(r[1])+'" placeholder="Account" aria-label="Line '+(i+1)+' account" autocomplete="off" autocapitalize="words" spellcheck="false">'
     +'<input class="n dr" data-c="2" inputmode="decimal" value="'+esc(r[2])+'" placeholder="Debit" aria-label="Line '+(i+1)+' debit" autocomplete="off">'
     +'<input class="n c" data-c="3" inputmode="decimal" value="'+esc(r[3])+'" placeholder="Credit" aria-label="Line '+(i+1)+' credit" autocomplete="off">'
     +'<button type="button" class="je-x" data-x="'+i+'" aria-label="Remove line '+(i+1)+'">×</button>'
     +(rr?'<div class="je-why '+(rr.ok?'ok':'no')+'">'+(rr.ok?'✓ correct':'✗ '+esc(rr.why))+'</div>':'')+'</div>';});
   h+='<div class="je-tot"><span class="lab">Total</span><span class="n t1">'+fmt(t.dr)+'</span><span class="n t2">'+fmt(t.cr)+'</span></div>';
   if(any)h+='<p class="je-bal '+(t.dr===t.cr?'ok':'no')+'" aria-live="polite">'+(t.dr===t.cr?'Debits = Credits ✓':'Not balanced · difference '+fmt(Math.abs(t.dr-t.cr)))+'</p>';
   h+='<div class="je-bar"><button type="button" class="btn" data-add>+ Add line</button><button type="button" class="btn primary" data-check>Check entry</button>'
    +'<span class="je-sum'+(result&&result.all?' ok':'')+'" aria-live="polite">'+(result?result.all?'All lines correct.':result.ok+' of '+result.total+' lines correct'+(result.missing&&result.entered<result.total?' · '+(result.total-result.entered)+' line'+(result.total-result.entered>1?'s':'')+' missing':''):'')+'</span>'
    +(result&&result.all&&opts.onAllCorrect?'<button type="button" class="btn primary" data-got>Mark as got it</button>':'')+'</div>'
    +'<datalist id="'+list+'">'+accounts(answer).map(a=>'<option value="'+esc(a)+'">').join('')+'</datalist>';
   box.innerHTML=h;
   if(focus){const el=box.querySelector('[data-r="'+focus[0]+'"] [data-c="'+focus[1]+'"]');if(el)el.focus();}
  }
  function totalsOnly(){ // live update without re-rendering the inputs (keeps the keyboard open on iPad)
   const t=totals(rows),any=rows.some(r=>num(r[2])||num(r[3]));
   box.querySelector('.t1').textContent=fmt(t.dr);box.querySelector('.t2').textContent=fmt(t.cr);
   let p=box.querySelector('.je-bal');
   if(!any){if(p)p.remove();return;}
   if(!p){p=box.ownerDocument.createElement('p');p.setAttribute('aria-live','polite');box.querySelector('.je-tot').after(p);}
   p.className='je-bal '+(t.dr===t.cr?'ok':'no');p.textContent=t.dr===t.cr?'Debits = Credits ✓':'Not balanced · difference '+fmt(Math.abs(t.dr-t.cr));
  }
  box.addEventListener('input',e=>{
   const inp=e.target,row=inp.closest('[data-r]');if(!row||!inp.dataset.c)return;
   rows[+row.dataset.r][+inp.dataset.c]=inp.value.slice(0,80);
   if(+inp.dataset.c>=2){const a=row.querySelector('.a'),r=rows[+row.dataset.r];a.classList.toggle('cr',!!num(r[3])&&!num(r[2]));}
   if(result){result=null;row.classList.remove('ok','no');const w=row.querySelector('.je-why');if(w)w.remove();const s=box.querySelector('.je-sum');if(s){s.textContent='';s.className='je-sum';}const g=box.querySelector('[data-got]');if(g)g.remove();}
   totalsOnly();save();
  });
  box.addEventListener('keydown',e=>{
   if(e.key!=='Enter'||!e.target.dataset.c)return;e.preventDefault();
   const i=+e.target.closest('[data-r]').dataset.r;
   if(i===rows.length-1&&rows.length<MAX_ROWS&&filled(rows[i])){rows.push(['','','','']);paint([i+1,0]);}
   else paint([Math.min(i+1,rows.length-1),0]);
  });
  box.addEventListener('click',e=>{
   const x=e.target.closest('[data-x]');
   if(x){rows.splice(+x.dataset.x,1);if(!rows.length)rows.push(['','','','']);result=null;paint();save();return;}
   if(e.target.closest('[data-add]')){if(rows.length<MAX_ROWS){rows.push(['','','','']);paint([rows.length-1,0]);}return;}
   if(e.target.closest('[data-check]')){result=check(rows,answer);paint();return;}
   if(e.target.closest('[data-got]')&&opts.onAllCorrect)opts.onAllCorrect();
  });
  paint();
  return {rows:()=>rows,flush:()=>{clearTimeout(timer);opts.save&&opts.save(rows.filter(filled).length?rows:[]);}};
 }
 return {parse,norm,num,accounts,check,totals,clean,html,mount};
});
