/* Chapter 7 special-journal pictures (owner, 22 Nov 2026). Tables copied from the teacher's Chapter 7 slides (assets/journals/*.svg).
   'before': the question names the journal, so the picture sits under the question.
   'after': the journal is only in the answer, so the picture waits until the question is answered (it would give the answer away).
   Static pictures only: nothing is stored. On a phone the picture keeps a 600 px minimum width and scrolls sideways. Ids never change, so this list is keyed by question id. */
(function(root){
  const FILES={sales:['Sales Journal','assets/journals/sales.svg'],purchases:['Purchases Journal','assets/journals/purchases.svg'],receipts:['Cash Receipts Journal','assets/journals/receipts.svg'],disbursements:['Cash Disbursements Journal','assets/journals/disbursements.svg']};
  const S='sales',P='purchases',R='receipts',D='disbursements';
  const BEFORE={'tb-QS-7-6':[S],'tb-E-7-1a':[S],'tb-E-7-1b':[S],'tb-QS-7-7':[R],'tb-E-7-7':[D],'28':[S],'x7-10':[S],'ps-114':[P],'ps-116':[S,R],'ps-118':[R],'ps-122':[D],'ps-123':[S],'ps-126':[P],'ps-130':[S],'ps-131':[S],'ps-132':[D],'ps-135':[P],'ps-136':[R],'ps-141':[P],'ps-143':[S],'ps-148':[R],'ps-149':[P],'ps-154':[R],'ps-155':[R],'ps-157':[R],'ps-160':[D],'ps-163':[R],'gd-134':[S],'gd-143':[D],'gd-144':[P],'gd-145':[S],'gd-147':[R],'gd-152':[P],'gd-164':[D],'gd-167':[R],'gd-169':[R],'gd-173':[S]};
  const AFTER={'tb-QS-7-5':[S],'tb-QS-7-9':[P],'tb-E-7-2':[D],'tb-E-7-8':[R],'x7-4':[S],'x7-5':[R],'x7-6':[P],'x7-7':[D],'ps-113':[R],'ps-120':[D],'ps-129':[R],'ps-133':[R],'ps-140':[S],'ps-146':[D],'gd-126':[D],'gd-142':[S,R],'gd-150':[D],'gd-155':[R],'gd-162':[R],'gd-171':[D]};
  function keys(id,when){ const m=when==='after'?AFTER:BEFORE; return m[String(id)]||[]; }
  function html(id,when){
    const k=keys(id,when); if(!k.length) return '';
    return '<div class="jpics">'+k.map(n=>'<figure style="margin:10px 0;overflow-x:auto;-webkit-overflow-scrolling:touch"><img src="'+FILES[n][1]+'" alt="'+FILES[n][0]+' from the Chapter 7 slides" loading="lazy" style="display:block;width:100%;min-width:600px;max-width:680px;height:auto;border:1px solid var(--line,rgba(127,127,127,.35));border-radius:8px;background:#fff"></figure>').join('')+'</div>';
  }
  const api={html,keys,BEFORE,AFTER,FILES};
  if(typeof module!=='undefined'&&module.exports) module.exports=api; else root.AccJournalPics=api;
})(typeof window!=='undefined'?window:globalThis);
