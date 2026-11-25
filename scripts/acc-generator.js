/* Fresh accounting problems (owner idea, 20 Nov 2026): random numbers, correct answer + 3 typical-mistake distractors,
   shuffled options. Pure functions, no storage. StudyAccGen.make(seed, n) -> n questions in the practice-question shape
   {id, cat, q, opts, exp, order, right:0}. Same seed = same questions. Based on the owner's generateMerchandisingQuestion().
   Fixes over the prototype: cents rounding, no duplicate options, Fisher-Yates shuffle, repeat guard inside a batch. */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.StudyAccGen=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function rng(seed){let a=(seed>>>0)||1;return function(){a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
 const ri=(r,a,b,s)=>{s=s||1;return a+Math.floor(r()*(Math.floor((b-a)/s)+1))*s;};
 const pick=(r,l)=>l[Math.floor(r()*l.length)];
 const c2=n=>Math.round(n*100)/100;
 function fmt(n){const neg=n<0,s=Math.abs(n).toFixed(2).replace(/\.00$/,''),p=s.split('.');p[0]=p[0].replace(/\B(?=(\d{3})+(?!\d))/g,',');return(neg?'-':'')+'$'+p.join('.');}
 function shuffle(a,r){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 /* correct first, then 3 different wrong values (padded with near misses when typical mistakes collide) */
 function options(r,correct,wrongs){
  const seen=new Set([c2(correct)]),out=[c2(correct)];
  for(const w of wrongs){const v=c2(w);if(v>0&&!seen.has(v)){seen.add(v);out.push(v);}if(out.length===4)break;}
  const step=correct>=1000?10:correct>=100?5:1;
  for(let k=1;out.length<4&&k<200;k++){const v=c2(correct+(r()<0.5?-1:1)*step*ri(r,1,12));if(v>0&&!seen.has(v)){seen.add(v);out.push(v);}}
  return out;
 }
 const T=[
  {id:'purch-net',cat:'c5',make(r){
   const p=ri(r,1000,10000),ret=Math.round(p*(0.1+r()*0.1)/10)*10,rate=pick(r,[0.02,0.03]),net=p-ret,ans=c2(net*(1-rate)),pc=Math.round(rate*100);
   return {q:'Merchandise costing '+fmt(p)+' is bought on account, terms '+pc+'/10, n/30. Before paying, goods costing '+fmt(ret)+' are returned. The balance is paid within the discount period. How much cash is paid?',
    ans,wr:[ans+100,ans-50,p*(1-rate),net],exp:'Net purchases = '+fmt(p)+' − '+fmt(ret)+' = '+fmt(net)+'. Discount applies to the net amount: '+fmt(net)+' × (1 − '+pc+'%) = **'+fmt(ans)+'**.'};}},
  {id:'net-sales',cat:'c5',make(r){
   const s=ri(r,5000,60000,500),ret=ri(r,200,Math.round(s*0.12/100)*100,100),d=ri(r,100,Math.max(100,Math.round(s*0.04/100)*100),100),ans=s-ret-d;
   return {q:'Sales revenue is '+fmt(s)+', sales returns and allowances are '+fmt(ret)+' and sales discounts are '+fmt(d)+'. What are net sales?',
    ans,wr:[s-ret,s-d,s+ret+d,s-ret+d],exp:'Net sales = sales − returns − discounts = '+fmt(s)+' − '+fmt(ret)+' − '+fmt(d)+' = **'+fmt(ans)+'**.'};}},
  {id:'cogp',cat:'c5',make(r){
   const p=ri(r,8000,50000,500),ret=ri(r,200,1500,100),d=ri(r,100,900,100),f=ri(r,100,1200,100),net=p-ret-d,ans=net+f;
   return {q:'Purchases are '+fmt(p)+', purchase returns '+fmt(ret)+', purchase discounts '+fmt(d)+' and freight-in '+fmt(f)+'. What is the net cost of purchases?',
    ans,wr:[net,p+f,p-ret-d-f,p-ret+f],exp:'Net purchases = '+fmt(p)+' − '+fmt(ret)+' − '+fmt(d)+' = '+fmt(net)+'. Freight-in is added: **'+fmt(ans)+'**.'};}},
  {id:'gross-profit',cat:'c5',make(r){
   const ns=ri(r,20000,90000,1000),cogs=Math.round(ns*(0.55+r()*0.2)/100)*100,ans=ns-cogs;
   return {q:'A merchandiser has net sales of '+fmt(ns)+' and cost of goods sold of '+fmt(cogs)+'. What is gross profit?',
    ans,wr:[cogs,ns+cogs,ans+1000,ans-500],exp:'Gross profit = net sales − COGS = '+fmt(ns)+' − '+fmt(cogs)+' = **'+fmt(ans)+'**.'};}},
  {id:'wavg',cat:'c6',make(r){
   const u1=ri(r,40,120,10),u2=u1+ri(r,10,80,10),c1=ri(r,8,20),c=c1+ri(r,2,9),ans=c2((u1*c1+u2*c)/(u1+u2));
   return {q:'Perpetual weighted-average. Beginning inventory: '+u1+' units at '+fmt(c1)+'. A purchase of '+u2+' units at '+fmt(c)+' follows. What is the average unit cost after the purchase?',
    ans,wr:[(c1+c)/2,c,c1,(u1*c1+u2*c)/(u1+u2)+1],exp:'Total cost = '+u1+' × '+fmt(c1)+' + '+u2+' × '+fmt(c)+' = '+fmt(u1*c1+u2*c)+'. Units = '+(u1+u2)+'. Average = **'+fmt(ans)+'** per unit.'};}},
  {id:'fifo-end',cat:'c6',make(r){
   const u1=ri(r,60,150,10),u2=ri(r,60,150,10),c1=ri(r,8,20),c=c1+ri(r,2,9),rem=ri(r,10,Math.min(u1,u2)-10,10),sold=u1+u2-rem,ans=rem*c,avg=(u1*c1+u2*c)/(u1+u2);
   return {q:'Periodic FIFO. Beginning inventory: '+u1+' units at '+fmt(c1)+'. Purchases: '+u2+' units at '+fmt(c)+'. '+sold+' units are sold. What is the cost of ending inventory?',
    ans,wr:[rem*c1,rem*avg,sold*c1,ans+rem],exp:'Ending units = '+(u1+u2)+' − '+sold+' = '+rem+'. FIFO leaves the newest cost: '+rem+' × '+fmt(c)+' = **'+fmt(ans)+'**.'};}},
  {id:'allowance',cat:'c9',make(r){
   const ar=ri(r,40000,200000,5000),pct=ri(r,2,6),bal=ri(r,300,Math.round(ar*pct/100*0.4/100)*100||300,100),tgt=ar*pct/100,ans=tgt-bal;
   return {q:'Accounts receivable are '+fmt(ar)+'. Management estimates '+pct+'% will be uncollectible. Allowance for Doubtful Accounts has a credit balance of '+fmt(bal)+' before adjustment. What is bad debt expense?',
    ans,wr:[tgt,tgt+bal,bal,ar*pct/100*2-bal],exp:'Required allowance = '+fmt(ar)+' × '+pct+'% = '+fmt(tgt)+'. Less existing credit '+fmt(bal)+' = **'+fmt(ans)+'**.'};}},
  {id:'note-int',cat:'c9',make(r){
   const p=ri(r,5000,30000,1000),rate=ri(r,6,12),days=pick(r,[60,90,120]),ans=c2(p*rate/100*days/360);
   return {q:'A '+days+'-day, '+rate+'% note receivable has a face value of '+fmt(p)+'. Use a 360-day year. How much interest is earned at maturity?',
    ans,wr:[p*rate/100*days/365,p*rate/100,p+ans,p*rate/100*days/30],exp:'Interest = '+fmt(p)+' × '+rate+'% × '+days+'/360 = **'+fmt(ans)+'**.'};}},
  {id:'bank-rec',cat:'c8',make(r){
   const b=ri(r,5000,30000,100),note=ri(r,500,5000,500),nsf=ri(r,100,900,50),fee=ri(r,10,60),ans=b+note-nsf-fee;
   return {q:'The ledger cash balance is '+fmt(b)+'. The bank collected a '+fmt(note)+' note for the company, returned a customer check for '+fmt(nsf)+' (NSF) and charged a '+fmt(fee)+' service fee, none yet recorded. What is the adjusted book balance?',
    ans,wr:[b+note,b+note+nsf+fee,b-note-nsf-fee,b+note-nsf],exp:'Adjusted book balance = '+fmt(b)+' + '+fmt(note)+' − '+fmt(nsf)+' − '+fmt(fee)+' = **'+fmt(ans)+'**.'};}}
 ];
 /* n questions; templates are dealt in rounds so a batch covers every topic; no repeated question text in a batch */
 function make(seed,n){
  const out=[],used=new Set(),r0=rng(seed),base=(seed>>>0).toString(36);let order=[];
  for(let i=0;i<n;i++){
   if(!order.length)order=shuffle(T.map((_,k)=>k),r0);
   const t=T[order.pop()];let item=null;
   for(let tries=0;tries<30;tries++){const r=rng((seed>>>0)*31+i*977+tries*7919);const m=t.make(r);if(used.has(m.q))continue;
    const o=options(r,m.ans,m.wr),ord=shuffle([0,1,2,3],r);item={m,o,ord};break;}
   if(!item)continue;used.add(item.m.q);
   out.push({id:'gen-'+base+'-'+i,cat:'g',ch:t.cat,q:item.m.q,opts:item.o.map(fmt),exp:item.m.exp,order:item.ord,right:0,gen:true,tmpl:t.id});
  }
  return out;
 }
 return {make,templates:T.map(t=>t.id),fmt};
});
