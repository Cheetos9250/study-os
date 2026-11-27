/* Practice calculator: a floating calculator for quiz pages (?tab=prac) and the textbook exercises.
   Pure arithmetic, no eval: numbers, + − × ÷, ^, %, brackets, unary minus.
   History (the tape): the last 30 calculations, kept on this device in studyos.calc.v1 (not backed up). */
(function(){
 'use strict';
 /* ---------- maths (also exported for tests) ---------- */
 var PREC={'+':1,'-':1,'*':2,'/':2,'^':3,'u':4};
 function tokens(src){
  var s=String(src).replace(/[×x]/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/,/g,''),out=[],i=0;
  while(i<s.length){var c=s[i];
   if(c===' '){i++;continue;}
   if(/[0-9.]/.test(c)){var j=i;while(j<s.length&&/[0-9.]/.test(s[j]))j++;var t=s.slice(i,j);if((t.match(/\./g)||[]).length>1||t==='.')throw new Error('bad number');out.push({n:parseFloat(t)});i=j;continue;}
   if('+-*/^()%'.indexOf(c)>=0){out.push({o:c});i++;continue;}
   throw new Error('bad character');}
  return out;}
 function evaluate(src){
  var tk=tokens(src),q=[],st=[],prev=null;
  tk.forEach(function(t){
   if(t.n!==undefined){q.push(t.n);}
   else if(t.o==='%'){if(prev&&(prev.n!==undefined||prev.o===')'||prev.o==='%'))q.push('%');else throw new Error('bad %');}
   else if(t.o==='('){st.push('(');}
   else if(t.o===')'){while(st.length&&st[st.length-1]!=='(')q.push(st.pop());if(!st.length)throw new Error('brackets');st.pop();}
   else{var op=t.o;if((op==='-'||op==='+')&&(!prev||(prev.o&&prev.o!==')'&&prev.o!=='%'))){if(op==='+'){prev=t;return;}op='u';}
    while(st.length){var top=st[st.length-1];if(top==='(')break;if(PREC[top]>PREC[op]||(PREC[top]===PREC[op]&&op!=='^'&&op!=='u'))q.push(st.pop());else break;}
    st.push(op);}
   prev=t;});
  while(st.length){var o=st.pop();if(o==='(')throw new Error('brackets');q.push(o);}
  var v=[];
  q.forEach(function(x){
   if(typeof x==='number'){v.push(x);return;}
   if(x==='%'){if(!v.length)throw new Error('syntax');v.push(v.pop()/100);return;}
   if(x==='u'){if(!v.length)throw new Error('syntax');v.push(-v.pop());return;}
   if(v.length<2)throw new Error('syntax');var b=v.pop(),a=v.pop();
   v.push(x==='+'?a+b:x==='-'?a-b:x==='*'?a*b:x==='/'?a/b:Math.pow(a,b));});
  if(v.length!==1||!isFinite(v[0]))throw new Error(v.length===1?'not a number':'syntax');
  return Math.round(v[0]*1e10)/1e10;}
 function fmt(n){return n.toLocaleString('en-US',{maximumFractionDigits:10});}
 if(typeof module==='object'&&module.exports){module.exports={evaluate:evaluate,fmt:fmt};return;}
 if(typeof document==='undefined')return;

 /* ---------- interface ---------- */
 var CSS=''
 +'#calcBtn,#calc{--c-ink:#111;--c-paper:#fff;--c-key:#f2f2f0;--c-mute:#555;--c-acc:var(--acc,#d43a2a);--c-acc-ink:var(--acc-ink,#fff);font-family:"Zen Maru Gothic","Mali",system-ui,-apple-system,sans-serif;box-sizing:border-box}'
 +'@media(prefers-color-scheme:dark){:root:not([data-theme="light"]) #calcBtn,:root:not([data-theme="light"]) #calc{--c-ink:#f0f0ee;--c-paper:#171718;--c-key:#242426;--c-mute:#a9a9a6;--c-acc:#ff8a7a;--c-acc-ink:#0e0e0f}}'
 +':root[data-theme="dark"] #calcBtn,:root[data-theme="dark"] #calc{--c-ink:#f0f0ee;--c-paper:#171718;--c-key:#242426;--c-mute:#a9a9a6;--c-acc:#ff8a7a;--c-acc-ink:#0e0e0f}'
 +'#calcBtn{position:fixed;z-index:72;right:var(--calc-right,16px);bottom:calc(16px + env(safe-area-inset-bottom));display:inline-flex;align-items:center;gap:8px;min-height:48px;padding:0 16px;border:3px solid var(--c-ink);border-radius:6px;background:var(--c-paper);color:var(--c-ink);font-weight:900;font-size:15px;cursor:pointer}'
 +'#calcBtn svg{width:20px;height:20px}'
 +'@media(max-width:899.98px){#calcBtn{bottom:calc(84px + env(safe-area-inset-bottom))}}'
 +'@media(min-width:1000px){html.qn-open #calcBtn{right:calc(min(380px,32vw) + 16px)}}'
 +'@media(max-width:999.98px){html.qn-open #calcBtn{display:none}}'
 +'@media(max-width:899.98px){#calcBtn{width:52px;padding:0;justify-content:center}#calcBtn span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}}'
 +'@media(min-width:900px){html:not(.qn-open) #calcBtn{right:max(12px,env(safe-area-inset-right))!important;bottom:calc(76px + env(safe-area-inset-bottom));width:52px;padding:0;justify-content:center}html:not(.qn-open) #calcBtn span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}}'
 +'#calc{position:fixed;z-index:90;width:min(300px,calc(100vw - 24px));background:var(--c-paper);color:var(--c-ink);border:3px solid var(--c-ink);border-radius:8px;box-shadow:0 14px 34px -12px rgba(0,0,0,.45);touch-action:none}'
 +'#calc[hidden]{display:none}'
 +'#calc .c-head{display:flex;align-items:center;gap:8px;padding:6px 6px 6px 12px;border-bottom:3px solid var(--c-ink);cursor:grab;user-select:none;-webkit-user-select:none}'
 +'#calc .c-head b{font:700 17px "Kaisei Decol",serif;flex:1}'
 +'#calc .c-head small{font-size:12px;color:var(--c-mute)}'
 +'#calc .c-x{min-width:40px;min-height:40px;border:2px solid var(--c-ink);border-radius:6px;background:var(--c-paper);color:var(--c-ink);cursor:pointer;display:inline-grid;place-items:center}'
 +'#calc .c-x svg{width:16px;height:16px}'
 +'#calc .c-scr{padding:10px 12px 8px;text-align:right;border-bottom:2px solid var(--c-ink)}'
 +'#calc .c-exp{min-height:20px;font-size:14px;color:var(--c-mute);word-break:break-all}'
 +'#calc .c-res{font:700 30px/1.2 "Kaisei Decol",serif;font-variant-numeric:tabular-nums;word-break:break-all}'
 +'#calc .c-res.err{font-size:18px;color:#c21f2f}'
 +'#calc .c-tape{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;margin-top:6px}'
 +'#calc .c-tape button{border:1.5px solid var(--c-ink);border-radius:4px;background:var(--c-paper);color:var(--c-ink);font-weight:700;font-size:12px;font-family:inherit;padding:2px 7px;min-height:28px;cursor:pointer;font-variant-numeric:tabular-nums}'
 +'#calc .c-hb{min-height:40px;padding:0 10px;border:2px solid var(--c-ink);border-radius:6px;background:var(--c-paper);color:var(--c-ink);font-weight:700;font-size:13px;font-family:inherit;cursor:pointer}'
 +'#calc .c-hb[aria-pressed="true"]{background:var(--c-ink);color:var(--c-paper)}'
 +'#calc .c-hist{max-height:268px;overflow-y:auto;padding:6px 10px 10px;display:grid;gap:4px}'
 +'#calc .c-hist[hidden]{display:none}'
 +'#calc .c-hist .h{display:flex;justify-content:space-between;gap:10px;text-align:left;min-height:40px;padding:4px 8px;border:1.5px solid var(--c-ink);border-radius:5px;background:var(--c-paper);color:var(--c-ink);font-family:inherit;font-size:13px;cursor:pointer;font-variant-numeric:tabular-nums}'
 +'#calc .c-hist .h span{color:var(--c-mute);overflow-wrap:anywhere}#calc .c-hist .h b{white-space:nowrap}'
 +'#calc .c-hist .e{font-size:13px;color:var(--c-mute);text-align:center;padding:16px 4px}'
 +'#calc .c-hist .clr{justify-self:end;min-height:36px;padding:0 10px;border:1.5px solid var(--c-ink);border-radius:5px;background:var(--c-paper);color:#c21f2f;font-weight:700;font-family:inherit;cursor:pointer}'
 +'#calc .c-keys[hidden]{display:none}'
 +'#calc .c-keys{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:10px}'
 +'#calc .c-keys button{min-height:48px;border:2px solid var(--c-ink);border-radius:6px;background:var(--c-key);color:var(--c-ink);font-weight:900;font-size:18px;font-family:inherit;cursor:pointer;touch-action:manipulation}'
 +'#calc .c-keys button:active{transform:translateY(1px)}'
 +'#calc .c-keys .op{background:var(--c-ink);color:var(--c-paper)}'
 +'#calc .c-keys .eq{background:var(--c-acc);color:var(--c-acc-ink)}'
 +'#calc .c-keys .fn{font-size:15px}'
 +'#calcBtn:focus-visible,#calc button:focus-visible{outline:3px solid var(--c-ink);outline-offset:2px}'
 +'@media print{#calc,#calcBtn{display:none}}';
 var ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15v3M8 18h.01M12 18h.01"/></svg>';
 var X='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
 var KEYS=[['C','fn','clear'],['⌫','fn','back'],['%','fn'],['÷','op','/'],['7'],['8'],['9'],['×','op','*'],['4'],['5'],['6'],['−','op','-'],['1'],['2'],['3'],['+','op','+'],['( )','fn','paren'],['0'],['.'],['=','eq','eq']];
 var HK='studyos.calc.v1',MAXH=30;
 function readHist(){try{var o=JSON.parse(localStorage.getItem(HK)||'[]');return Array.isArray(o)?o.filter(function(x){return x&&typeof x.e==='string'&&typeof x.v==='number'&&isFinite(x.v);}).slice(0,MAXH):[];}catch(e){return [];}}
 function writeHist(){try{localStorage.setItem(HK,JSON.stringify(hist.slice(0,MAXH)));}catch(e){}}
 var hist=readHist(),expr='',last=null,tape=hist.slice(0,4).map(function(x){return x.v;}),panel,exp,res,tp,btn,hl,keys;
 function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
 function paintHist(){hl.innerHTML=hist.length?hist.map(function(x,i){return '<button type="button" class="h" data-h="'+i+'" title="Use this result"><span>'+esc(x.e)+' =</span><b>'+fmt(x.v)+'</b></button>';}).join('')+'<button type="button" class="clr">Clear history</button>':'<p class="e">No calculations yet. Results you get with = are kept here on this device.</p>';}
 function use(v){expr+=(/[0-9.)%]$/.test(expr)?'*':'')+(v<0?'('+v+')':String(v));show();}
 function show(){exp.textContent=expr.replace(/\*/g,'×').replace(/\//g,'÷').replace(/-/g,'−')||' ';
  if(!expr){res.textContent=last===null?'0':fmt(last);res.classList.remove('err');return;}
  try{var v=evaluate(expr);res.textContent=fmt(v);res.classList.remove('err');}catch(e){res.textContent=fmt(last===null?0:last);res.classList.remove('err');}}
 function paintTape(){tp.innerHTML=tape.map(function(v,i){return '<button type="button" data-t="'+i+'" title="Use this result">'+fmt(v)+'</button>';}).join('');}
 function press(k){
  if(k==='clear'){expr='';last=null;show();return;}
  if(k==='back'){expr=expr.slice(0,-1);show();return;}
  if(k==='eq'){if(!expr)return;try{var v=evaluate(expr);last=v;tape.unshift(v);tape=tape.slice(0,4);hist.unshift({e:expr.replace(/\*/g,'×').replace(/\//g,'÷').replace(/-/g,'−'),v:v,t:Date.now()});hist=hist.slice(0,MAXH);writeHist();if(!hl.hidden)paintHist();expr='';paintTape();show();res.textContent=fmt(v);}catch(e){res.textContent=e.message==='not a number'?'Cannot divide by zero':'Check the expression';res.classList.add('err');}return;}
  if(k==='paren'){var open=(expr.match(/\(/g)||[]).length-(expr.match(/\)/g)||[]).length;k=(open>0&&/[0-9.)%]$/.test(expr))?')':'(';if(k==='('&&/[0-9.)%]$/.test(expr))expr+='*';}
  if(k==='neg'){var m=expr.match(/(\d*\.?\d+%?)$/);if(m){var s=expr.slice(0,expr.length-m[1].length);expr=(/\(-$/.test(s)?s.slice(0,-2)+m[1]:s+'(-'+m[1]);}else if(!expr&&last!==null){expr=String(-last);}else expr+='(-';show();return;}
  if(!expr&&last!==null&&/^[+\-*/^%]$/.test(k))expr=String(last);
  if(/^[+*/^]$/.test(k)&&/[+\-*/^]$/.test(expr))expr=expr.slice(0,-1);
  expr+=k;show();}
 function place(x,y){var w=panel.offsetWidth,h=panel.offsetHeight;x=Math.max(6,Math.min(innerWidth-w-6,x));y=Math.max(6,Math.min(innerHeight-h-6,y));panel.style.left=x+'px';panel.style.top=y+'px';}
 function setOpen(on){panel.hidden=!on;btn.setAttribute('aria-expanded',String(on));if(on){if(!panel.style.left)place(innerWidth-panel.offsetWidth-20,innerHeight-panel.offsetHeight-(innerWidth<900?150:90));panel.querySelector('.c-keys button').focus({preventScroll:true});}else btn.focus({preventScroll:true});}
 function mount(){
  var mode=document.documentElement.getAttribute('data-mode');
  if(document.getElementById('calc')||(mode&&mode!=='prac'))return;
  var st=document.createElement('style');st.id='calcCss';st.textContent=CSS;document.head.appendChild(st);
  btn=document.createElement('button');btn.type='button';btn.id='calcBtn';btn.setAttribute('aria-controls','calc');btn.setAttribute('aria-label','Calculator');btn.title='Calculator';btn.setAttribute('aria-expanded','false');btn.innerHTML=ICON+'<span>Calc</span>';
  panel=document.createElement('div');panel.id='calc';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Calculator');
  panel.innerHTML='<div class="c-head"><b>Calculator</b><small>drag to move</small><button type="button" class="c-hb" aria-pressed="false">History</button><button type="button" class="c-x" aria-label="Close calculator">'+X+'</button></div>'
   +'<div class="c-scr"><div class="c-exp" aria-live="polite"></div><div class="c-res" role="status">0</div><div class="c-tape" aria-label="Recent results"></div></div>'
   +'<div class="c-hist" hidden aria-label="Calculation history"></div><div class="c-keys">'+KEYS.map(function(k){return '<button type="button" class="'+(k[1]||'')+'" data-k="'+(k[2]||k[0])+'"'+(k[0]==='⌫'?' aria-label="Delete last"':k[0]==='C'?' aria-label="Clear"':k[0]==='( )'?' aria-label="Brackets"':'')+'>'+k[0]+'</button>';}).join('')+'</div>';
  document.body.appendChild(panel);document.body.appendChild(btn);
  exp=panel.querySelector('.c-exp');res=panel.querySelector('.c-res');tp=panel.querySelector('.c-tape');hl=panel.querySelector('.c-hist');keys=panel.querySelector('.c-keys');paintTape();
  var hb=panel.querySelector('.c-hb');hb.onclick=function(){var on=hl.hidden;hl.hidden=!on;keys.hidden=on;hb.setAttribute('aria-pressed',String(on));if(on)paintHist();};
  hl.addEventListener('click',function(e){if(e.target.closest('.clr')){if(!confirm('Clear the calculator history on this device?'))return;hist=[];tape=[];writeHist();paintHist();paintTape();return;}var b=e.target.closest('[data-h]');if(!b)return;use(hist[+b.dataset.h].v);hl.hidden=true;keys.hidden=false;hb.setAttribute('aria-pressed','false');});
  /* sit to the left of the quiz Notes button when there is one */
  /* read the size after the first paint, so it does not force an extra layout of the long page while loading */
  requestAnimationFrame(function(){setTimeout(function(){var nb=document.getElementById('qnBtn');if(nb)document.documentElement.style.setProperty('--calc-right',(nb.offsetWidth+28)+'px');},0);});
  btn.onclick=function(){setOpen(panel.hidden);};
  panel.querySelector('.c-x').onclick=function(){setOpen(false);};
  panel.querySelector('.c-keys').addEventListener('click',function(e){var b=e.target.closest('button');if(b)press(b.dataset.k);});
  tp.addEventListener('click',function(e){var b=e.target.closest('[data-t]');if(!b)return;use(tape[+b.dataset.t]);});
  res.addEventListener('dblclick',function(){if(navigator.clipboard)navigator.clipboard.writeText(res.textContent.replace(/,/g,'')).catch(function(){});});
  /* keyboard, only while the calculator is open and no text field has focus */
  document.addEventListener('keydown',function(e){if(panel.hidden)return;var t=e.target;if(t&&(t.tagName==='TEXTAREA'||t.tagName==='INPUT'||t.tagName==='SELECT'||t.isContentEditable))return;
   var k=e.key,map={'Enter':'eq','=':'eq','Backspace':'back','Delete':'clear','Escape':null,'x':'*','X':'*'};
   if(k==='Escape'){setOpen(false);e.preventDefault();return;}
   if(/^[0-9.+\-*/^%()]$/.test(k)){press(k);e.preventDefault();}else if(map[k]){press(map[k]);e.preventDefault();}});
  /* drag by the header */
  var head=panel.querySelector('.c-head'),dx=0,dy=0,drag=false;
  head.addEventListener('pointerdown',function(e){if(e.target.closest('button'))return;drag=true;var r=panel.getBoundingClientRect();dx=e.clientX-r.left;dy=e.clientY-r.top;head.setPointerCapture(e.pointerId);});
  head.addEventListener('pointermove',function(e){if(drag)place(e.clientX-dx,e.clientY-dy);});
  head.addEventListener('pointerup',function(){drag=false;});
  addEventListener('resize',function(){if(!panel.hidden)place(panel.offsetLeft,panel.offsetTop);});
  show();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
