/* JE Drill (owner idea, 18 Nov 2026): endless journal-entry practice for the accounting final (Ch5–9).
   Each drill is a short transaction made from a template with random names and amounts; the learner types the entry
   in the journal grid (scripts/je-grid.js) and it is checked line by line. Perpetual inventory, gross method for
   purchase discounts, 360-day year for interest, as in the course textbook.
   Pure functions here (testable in Node). The page je-drill.html keeps the score in studyos.jedrill.v1:
   {days: {YYYY-MM-DD: {a, c}}, tpl: {templateId: [tries, right]}} (backed up and validated on restore). */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.StudyJEDrill=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const KEY='studyos.jedrill.v1';
 /* small seeded random generator so a drill can be repeated from its seed */
 function rng(seed){let s=(Number(seed)>>>0)||1;return ()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
 const pick=(r,a)=>a[Math.floor(r()*a.length)];
 const amt=(r,lo,hi,step)=>{step=step||100;return Math.round((lo+r()*(hi-lo))/step)*step;};
 const money=n=>'$'+Number(n).toLocaleString('en-US',{minimumFractionDigits:Number.isInteger(n)?0:2,maximumFractionDigits:2});
 const r2=n=>Math.round(n*100)/100;
 const L=(acct,dr,cr)=>({acct,dr:r2(dr||0),cr:r2(cr||0)});
 const WHO=['Lin Co.','Arun Shop','Mali Traders','Kai Ltd.','Nara Store','Pim & Co.','Somchai Supply','Ploy Mart'];
 const DAYS=[30,60,90,120];
 /* id, chapter, short title, gen(r) → {text, je:[{acct,dr,cr}], hint} */
 const T=[
  {id:'buycr',ch:5,title:'Buy inventory on credit',gen(r){const a=amt(r,1000,20000),w=pick(r,WHO);
   return {text:'Purchased merchandise from '+w+' for '+money(a)+' on credit, terms n/30.',je:[L('Merchandise Inventory',a),L('Accounts Payable',0,a)],hint:'Perpetual system: purchases go straight to Merchandise Inventory.'};}},
  {id:'paydisc',ch:5,title:'Pay within the discount period',gen(r){const a=amt(r,1000,20000),p=pick(r,[1,2,3]),d=r2(a*p/100);
   return {text:'Paid a '+money(a)+' invoice for merchandise within the discount period, terms '+p+'/10, n/30 (recorded at the gross amount).',je:[L('Accounts Payable',a),L('Merchandise Inventory',0,d),L('Cash',0,a-d)],hint:'The purchase discount lowers the cost of the inventory.'};}},
  {id:'payfull',ch:5,title:'Pay after the discount period',gen(r){const a=amt(r,1000,20000);
   return {text:'Paid a '+money(a)+' invoice for merchandise after the 2/10 discount period ended.',je:[L('Accounts Payable',a),L('Cash',0,a)],hint:'No discount after the discount period.'};}},
  {id:'purret',ch:5,title:'Return goods to the supplier',gen(r){const a=amt(r,200,3000);
   return {text:'Returned '+money(a)+' of defective merchandise bought on credit to the supplier.',je:[L('Accounts Payable',a),L('Merchandise Inventory',0,a)],hint:'A purchase return reduces both what you owe and your inventory.'};}},
  {id:'frin',ch:5,title:'Freight on a purchase (FOB shipping point)',gen(r){const a=amt(r,100,900,10);
   return {text:'Paid '+money(a)+' cash for freight on merchandise bought FOB shipping point.',je:[L('Merchandise Inventory',a),L('Cash',0,a)],hint:'FOB shipping point: the buyer pays freight, and it is part of inventory cost.'};}},
  {id:'frout',ch:5,title:'Freight on a sale (FOB destination)',gen(r){const a=amt(r,100,900,10);
   return {text:'Paid '+money(a)+' cash to deliver merchandise sold FOB destination.',je:[L('Delivery Expense',a),L('Cash',0,a)],hint:'FOB destination: the seller pays freight as a selling expense.'};}},
  {id:'sellcr',ch:5,title:'Sell on credit',gen(r){const c=amt(r,1000,15000),s=Math.round(c*(1.3+r()*0.6)/100)*100,w=pick(r,WHO);
   return {text:'Sold merchandise to '+w+' for '+money(s)+' on credit, terms 2/10, n/30. The merchandise cost '+money(c)+'.',je:[L('Accounts Receivable',s),L('Sales',0,s),L('Cost of Goods Sold',c),L('Merchandise Inventory',0,c)],hint:'Two entries in a perpetual system: the sale at selling price, and the cost at cost.'};}},
  {id:'sellcash',ch:5,title:'Sell for cash',gen(r){const c=amt(r,500,8000),s=Math.round(c*(1.3+r()*0.6)/100)*100;
   return {text:'Sold merchandise for '+money(s)+' cash. The merchandise cost '+money(c)+'.',je:[L('Cash',s),L('Sales',0,s),L('Cost of Goods Sold',c),L('Merchandise Inventory',0,c)],hint:'Record the sale and the cost of the goods sold.'};}},
  {id:'coldisc',ch:5,title:'Customer pays within the discount period',gen(r){const a=amt(r,1000,15000),p=pick(r,[1,2,3]),d=r2(a*p/100);
   return {text:'Received payment from a customer for a '+money(a)+' credit sale within the discount period, terms '+p+'/10, n/30.',je:[L('Cash',a-d),L('Sales Discounts',d),L('Accounts Receivable',0,a)],hint:'Sales Discounts is a contra-revenue account (debit).'};}},
  {id:'salret',ch:5,title:'Customer returns goods',gen(r){const s=amt(r,300,3000),c=Math.round(s*0.6/10)*10;
   return {text:'A customer returned merchandise sold on credit for '+money(s)+'. The goods cost '+money(c)+' and go back into inventory.',je:[L('Sales Returns and Allowances',s),L('Accounts Receivable',0,s),L('Merchandise Inventory',c),L('Cost of Goods Sold',0,c)],hint:'Undo the sale at selling price, and put the goods back at cost.'};}},
  {id:'salallow',ch:5,title:'Sales allowance',gen(r){const a=amt(r,100,1500,50);
   return {text:'Granted a customer a '+money(a)+' allowance on merchandise sold on credit because it was slightly damaged (the customer keeps it).',je:[L('Sales Returns and Allowances',a),L('Accounts Receivable',0,a)],hint:'No goods come back, so there is no cost entry.'};}},
  {id:'shrink',ch:5,title:'Inventory shrinkage',gen(r){const b=amt(r,20000,60000),s=amt(r,200,1500,10);
   return {text:'At year-end the Merchandise Inventory account shows '+money(b)+', but a physical count finds '+money(b-s)+'. Record the shrinkage.',je:[L('Cost of Goods Sold',s),L('Merchandise Inventory',0,s)],hint:'Shrinkage is added to Cost of Goods Sold.'};}},
  {id:'fifo',ch:6,title:'Sale with FIFO cost',gen(r){const u1=pick(r,[10,20,30,40]),c1=pick(r,[5,6,8,10]),u2=pick(r,[20,30,40]),c2=c1+pick(r,[1,2,3]),sold=u1+Math.floor(r()*(u2-5))+1,price=c2*2,
    cost=u1*c1+(sold-u1)*c2,s=sold*price;
   return {text:'Beginning inventory: '+u1+' units at '+money(c1)+'. Purchase: '+u2+' units at '+money(c2)+'. Sold '+sold+' units on credit at '+money(price)+' each. Record the sale using FIFO (perpetual).',je:[L('Accounts Receivable',s),L('Sales',0,s),L('Cost of Goods Sold',cost),L('Merchandise Inventory',0,cost)],hint:'FIFO: the '+u1+' oldest units first, then '+(sold-u1)+' from the purchase.'};}},
  /* LIFO removed 24 Nov 2026: outside the Final 1201101 exam guide (owner) */
  {id:'lcm',ch:6,title:'Lower of cost or market',gen(r){const c=amt(r,5000,30000),m=c-amt(r,200,2000);
   return {text:'Year-end inventory cost is '+money(c)+'; its market value (replacement cost) is '+money(m)+'. Apply lower of cost or market.',je:[L('Cost of Goods Sold',c-m),L('Merchandise Inventory',0,c-m)],hint:'Write inventory down to market; the loss goes to Cost of Goods Sold.'};}},
  {id:'pcset',ch:8,title:'Set up a petty cash fund',gen(r){const a=pick(r,[100,150,200,250,300,500]);
   return {text:'Established a petty cash fund of '+money(a)+' by writing a check.',je:[L('Petty Cash',a),L('Cash',0,a)],hint:'Only the set-up (or a change in size) touches Petty Cash.'};}},
  {id:'pcfill',ch:8,title:'Replenish petty cash (cash short)',gen(r){const f=pick(r,[200,250,300]),p=amt(r,10,50,1),d=amt(r,10,50,1),o=amt(r,10,40,1),sh=pick(r,[1,2,3,4,5]),left=f-p-d-o-sh;
   return {text:'The '+money(f)+' petty cash fund has receipts for postage '+money(p)+', delivery '+money(d)+' and repairs '+money(o)+', and '+money(left)+' cash left. Replenish the fund.',je:[L('Postage Expense',p),L('Delivery Expense',d),L('Repairs Expense',o),L('Cash Over and Short',sh),L('Cash',0,f-left)],hint:'Receipts + cash left = '+money(p+d+o+left)+', so the fund is '+money(sh)+' short (debit Cash Over and Short).'};}},
  {id:'bksc',ch:8,title:'Bank service charge',gen(r){const a=amt(r,10,60,1);
   return {text:'The bank statement shows a '+money(a)+' service charge not yet recorded in the books.',je:[L('Bank Service Charge Expense',a),L('Cash',0,a)],hint:'Book-side adjustments from the bank reconciliation need entries.'};}},
  {id:'bknsf',ch:8,title:'NSF check',gen(r){const a=amt(r,100,1500,5),w=pick(r,WHO);
   return {text:'The bank returned a '+money(a)+' check from '+w+' marked NSF (not sufficient funds).',je:[L('Accounts Receivable',a),L('Cash',0,a)],hint:'The customer still owes the money.'};}},
  {id:'bknote',ch:8,title:'Bank collects a note',gen(r){const p=amt(r,1000,8000,500),i=amt(r,20,300,5);
   return {text:'The bank collected a '+money(p)+' note receivable plus '+money(i)+' interest for the company and added it to the account.',je:[L('Cash',p+i),L('Notes Receivable',0,p),L('Interest Revenue',0,i)],hint:'Cash goes up by the note plus interest.'};}},
  {id:'bkerr',ch:8,title:'Book error on a check',gen(r){const actual=amt(r,300,2000,1),diff=pick(r,[9,18,27,90,180,270]),booked=actual-diff;
   return {text:'A check for '+money(actual)+' paid to a supplier on account was recorded in the books as '+money(booked)+'. Correct the error.',je:[L('Accounts Payable',diff),L('Cash',0,diff)],hint:'The books show too little paid; reduce Cash and Accounts Payable by the '+money(diff)+' difference.'};}},
  {id:'bdpct',ch:9,title:'Bad debts: percent of sales',gen(r){const s=amt(r,100000,400000,10000),p=pick(r,[0.5,1,1.5,2]),b=r2(s*p/100);
   return {text:'Credit sales for the year are '+money(s)+'. The company estimates bad debts at '+p+'% of credit sales. Record the adjusting entry.',je:[L('Bad Debts Expense',b),L('Allowance for Doubtful Accounts',0,b)],hint:'Income statement method: the estimate is the expense, whatever the allowance balance.'};}},
  {id:'bdage',ch:9,title:'Bad debts: aging (balance sheet method)',gen(r){const need=amt(r,2000,9000),bal=amt(r,200,1500),deb=r()<0.4,adj=deb?need+bal:need-bal;
   return {text:'The aging schedule shows '+money(need)+' of accounts receivable will be uncollectible. Before adjusting, Allowance for Doubtful Accounts has a '+money(bal)+' '+(deb?'debit':'credit')+' balance. Record the adjusting entry.',je:[L('Bad Debts Expense',adj),L('Allowance for Doubtful Accounts',0,adj)],hint:'Adjust the allowance to '+money(need)+' credit: '+(deb?money(need)+' + '+money(bal):money(need)+' − '+money(bal))+'.'};}},
  {id:'wo',ch:9,title:'Write off an account (allowance method)',gen(r){const a=amt(r,200,3000,10),w=pick(r,WHO);
   return {text:'Wrote off '+w+'’s '+money(a)+' account as uncollectible (allowance method).',je:[L('Allowance for Doubtful Accounts',a),L('Accounts Receivable',0,a)],hint:'The expense was already estimated; the write-off uses the allowance.'};}},
  {id:'recov',ch:9,title:'Recover a written-off account',gen(r){const a=amt(r,200,3000,10),w=pick(r,WHO);
   return {text:w+' unexpectedly paid in full the '+money(a)+' account that had been written off (allowance method).',je:[L('Accounts Receivable',a),L('Allowance for Doubtful Accounts',0,a),L('Cash',a),L('Accounts Receivable',0,a)],hint:'First reinstate the account, then record the cash collection.'};}},
  {id:'ccard',ch:9,title:'Credit card sale',gen(r){const s=amt(r,1000,10000),p=pick(r,[2,3,4]),f=r2(s*p/100);
   return {text:'Sold merchandise for '+money(s)+' to customers who used a bank credit card; the bank deducts a '+p+'% fee and deposits the rest at once. (Ignore cost of goods sold.)',je:[L('Cash',s-f),L('Credit Card Expense',f),L('Sales',0,s)],hint:'The fee is an expense when the cash arrives.'};}},
  {id:'nraccept',ch:9,title:'Accept a note from a customer',gen(r){const a=amt(r,1000,10000,500),w=pick(r,WHO),d=pick(r,DAYS),p=pick(r,[6,8,9,12]);
   return {text:'Accepted a '+d+'-day, '+p+'% note for '+money(a)+' from '+w+' to settle its past-due account.',je:[L('Notes Receivable',a),L('Accounts Receivable',0,a)],hint:'No interest yet; it is earned over time.'};}},
  {id:'nrpaid',ch:9,title:'Note honored at maturity',gen(r){const a=amt(r,1000,12000,1000),d=pick(r,DAYS),p=pick(r,[6,9,12]),i=r2(a*p/100*d/360);
   return {text:'A '+d+'-day, '+p+'% note receivable for '+money(a)+' is paid in full at maturity (no interest was accrued before; use a 360-day year).',je:[L('Cash',a+i),L('Notes Receivable',0,a),L('Interest Revenue',0,i)],hint:'Interest = '+money(a)+' × '+p+'% × '+d+'/360 = '+money(i)+'.'};}},
  {id:'nrdis',ch:9,title:'Note dishonored',gen(r){const a=amt(r,1000,12000,1000),d=pick(r,DAYS),p=pick(r,[6,9,12]),i=r2(a*p/100*d/360),w=pick(r,WHO);
   return {text:w+' dishonored its '+d+'-day, '+p+'% note for '+money(a)+' at maturity. Record the dishonor, keeping the claim with interest (360-day year).',je:[L('Accounts Receivable',a+i),L('Notes Receivable',0,a),L('Interest Revenue',0,i)],hint:'The interest is still earned; the customer now owes note + interest.'};}},
  {id:'nraccr',ch:9,title:'Accrue interest on a note',gen(r){const a=amt(r,2000,12000,1000),p=pick(r,[6,9,12]),d=pick(r,[30,60]),i=r2(a*p/100*d/360);
   return {text:'At year-end, a '+p+'% note receivable for '+money(a)+' has been outstanding for '+d+' days. Accrue the interest earned (360-day year).',je:[L('Interest Receivable',i),L('Interest Revenue',0,i)],hint:'Interest = '+money(a)+' × '+p+'% × '+d+'/360.'};}}
 ];
 const CHAPTERS=[[5,'Ch5 Merchandising'],[6,'Ch6 Inventory'],[8,'Ch8 Cash'],[9,'Ch9 Receivables']];
 function make(tpl,seed){const t=typeof tpl==='string'?T.find(x=>x.id===tpl):tpl;if(!t)return null;const d=t.gen(rng(seed));
  return {id:t.id,ch:t.ch,title:t.title,seed:Number(seed)>>>0,text:d.text,je:d.je,hint:d.hint};}
 /* score record, unknown or broken fields dropped */
 function normalize(raw){
  const o=raw&&typeof raw==='object'?raw:{},out={days:{},tpl:{}};
  for(const [d,v] of Object.entries(o.days&&typeof o.days==='object'?o.days:{}))
   if(/^\d{4}-\d{2}-\d{2}$/.test(d)&&v&&Number.isInteger(v.a)&&Number.isInteger(v.c)&&v.a>=0&&v.c>=0&&v.c<=v.a&&v.a<=10000)out.days[d]={a:v.a,c:v.c};
  for(const [k,v] of Object.entries(o.tpl&&typeof o.tpl==='object'?o.tpl:{}))
   if(/^[a-z0-9]{2,12}$/.test(k)&&Array.isArray(v)&&v.length===2&&v.every(Number.isInteger)&&v[0]>=0&&v[1]>=0&&v[1]<=v[0])out.tpl[k]=[v[0],v[1]];
  return out;
 }
 function record(st,id,ok,day){st=normalize(st);const d=st.days[day]||{a:0,c:0};d.a++;if(ok)d.c++;st.days[day]=d;const t=st.tpl[id]||[0,0];t[0]++;if(ok)t[1]++;st.tpl[id]=t;return st;}
 /* weight per template: never tried 3, weak (under 70% right) 4, otherwise 1; chapters filter (empty = all) */
 function weight(st,id){const t=st&&st.tpl&&st.tpl[id];if(!t||!t[0])return 3;return t[1]/t[0]<0.7?4:1;}
 function choose(st,chs,rand,avoid){
  const list=T.filter(t=>(!chs||!chs.length||chs.includes(t.ch))&&t.id!==avoid),pool=list.length?list:T;
  const w=pool.map(t=>weight(st,t.id)),sum=w.reduce((a,b)=>a+b,0);let x=(rand||Math.random)()*sum;
  for(let i=0;i<pool.length;i++){x-=w[i];if(x<0)return pool[i];}return pool[pool.length-1];
 }
 /* weakest templates with at least 2 tries */
 function weak(st,n){return Object.entries(normalize(st).tpl).filter(([id,v])=>v[0]>=2&&T.some(t=>t.id===id)).map(([id,v])=>({id,title:(T.find(t=>t.id===id)||{}).title||id,tries:v[0],right:v[1],pct:Math.round(v[1]/v[0]*100)}))
  .filter(x=>x.pct<100).sort((a,b)=>a.pct-b.pct||b.tries-a.tries).slice(0,n||3);}
 /* a prompt for the AI tutor about one drill and the learner's lines */
 function askPrompt(d,rows){
  const mine=(rows||[]).filter(r=>r&&r.some(x=>String(x).trim())).map(r=>'- '+(r[1]||'?')+(r[2]?' Dr '+r[2]:'')+(r[3]?' Cr '+r[3]:'')).join('\n');
  return 'Journal entry question: '+d.text+'\n\nMy entry:\n'+(mine||'(nothing yet)')+'\n\nCorrect entry:\n'+d.je.map(l=>'- '+l.acct+(l.dr?' Dr '+l.dr:'')+(l.cr?' Cr '+l.cr:'')).join('\n')+'\n\nExplain step by step why the correct entry is right and what I got wrong. Show the entry as a table.';
 }
 return {KEY,TEMPLATES:T,CHAPTERS,rng,make,normalize,record,weight,choose,weak,askPrompt,money};
});
