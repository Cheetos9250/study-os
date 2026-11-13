/* Unified flashcards for VocaBloom; additive, leaves old Study OS pages untouched. */
"use strict";
const USTYLE="\n.u-subjects{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:12px;margin:18px 0 25px}\n.u-subject{background:var(--white);border:1px solid var(--line);border-radius:17px;text-align:left;min-height:130px;padding:17px;color:var(--text)}\n.u-subject.on{border:2px solid var(--purple);padding:16px;background:var(--lav)}.u-subject:hover{border-color:var(--purple)}\n.u-subject .u-icon{display:block;font-size:26px;margin-bottom:8px}.u-subject b{display:block;font-size:14px}.u-subject small{color:var(--muted);font-size:12px;line-height:1.6}\n.u-tabs{display:flex;gap:7px;flex-wrap:wrap;margin:14px 0;padding:6px;background:var(--lav);border-radius:14px}\n.u-tabs button{border:0;border-radius:10px;padding:10px 14px;background:transparent;font-weight:700;color:var(--text);font-size:13px}\n.u-tabs button.on{background:var(--white);color:var(--purple);box-shadow:0 3px 12px #5552a218}\n.u-cats{display:flex;gap:8px;flex-wrap:wrap;margin:20px 0}\n.u-cats button{border:1px solid var(--line);background:var(--white);border-radius:99px;color:var(--text);padding:9px 13px;font-size:12px}\n.u-cats button.on{background:var(--purple);border-color:var(--purple);color:#fff}\n.u-flip{display:block;width:100%;min-height:240px;border:1px solid #d5d4f6;border-radius:21px;background:linear-gradient(155deg,var(--lav),var(--white));padding:22px;color:var(--text);cursor:pointer;text-align:center}\n.u-flip.back{background:linear-gradient(145deg,#e9f7f0,var(--white));border-color:#b6e8d1}\nbody.dark .u-flip.back{background:#23392e;border-color:#448067}\n.u-flip strong{display:block;font-weight:800;font-size:clamp(17px,3vw,26px);line-height:1.65;overflow-wrap:anywhere;margin:27px 0}\n.u-flip strong.shrink{font-size:clamp(15px,2.5vw,20px)}\n.u-flip .u-label,.u-flip .u-hint{display:block;color:var(--muted);font-size:12px}\n.u-rate{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:18px 0}\n.u-rate button{background:var(--white);border:1px solid var(--line);border-radius:12px;padding:12px 4px;color:var(--text);font-weight:700}\n.u-rate button:hover{border-color:var(--purple)}.u-rate small{display:block;font-size:11px;color:var(--muted);margin-top:3px}\n.u-option{display:block;width:100%;text-align:left;background:var(--white);color:var(--text);border:1px solid var(--line);border-radius:12px;padding:13px;margin:9px 0;line-height:1.6}\n.u-option.right{background:#e7f7ed;border-color:#58b98c;color:#145d3c}.u-option.wrong{background:#fff0ee;border-color:#dd6b5b;color:#9c3223}\n.u-option:disabled{opacity:1;cursor:default}\n.u-summary{background:var(--white);border:1px solid var(--line);border-radius:16px;margin:13px 0;padding:19px;overflow:auto}\n.u-summary table{width:100%;border-collapse:collapse}.u-summary th,.u-summary td{border-bottom:1px solid var(--line);padding:10px 7px;text-align:left;vertical-align:top;overflow-wrap:anywhere;line-height:1.55}\n.u-summary td:first-child{font-weight:700;width:32%}\n.u-meta{color:var(--muted);font-size:12px;line-height:1.65;margin:12px 0}\n.u-empty{background:var(--white);border:1px dashed var(--line);border-radius:15px;padding:30px;text-align:center;color:var(--muted)}\n.u-highlight{margin-top:25px}\n@media(max-width:640px){.u-subjects{grid-template-columns:repeat(2,minmax(0,1fr))}.u-flip{padding:16px}.u-rate{gap:5px}.u-rate button{padding:10px 3px}.u-summary{padding:12px}}\n";
const UCACHE="vocabloom-integrated-decks-v1",UROWS="vocabloom-integrated-verified-v1",UQUIZZES="vocabloom-integrated-quiz-v1";
const UICONS={acc:"📗",eco:"📊",math:"📐",eng:"📚",zh:"🀄"};
const UNAMES={acc:"Accounting",eco:"Economics",math:"Math for Life",eng:"English Vocab",zh:"Chinese"};
// VocaBloom v1 is English-only at the presentation layer; all legacy decks remain loaded.
const UACTIVE_LANGUAGE='eng';
const USTATE={decks:[],rows:[],quizzes:[],ready:false,error:"",subject:UACTIVE_LANGUAGE,cat:"all",tab:"cards",mode:"due",flip:false,browse:0,quizIndex:0,missed:false,practiceAnswers:{},practiceOffset:0,practiceQuestions:null};
function uDeck(key=USTATE.subject){return USTATE.decks.find(x=>x.key===key);}
function uVisibleDecks(){return USTATE.decks.filter(d=>d.key===UACTIVE_LANGUAGE);}

function uReadSrs(d){let o={};try{o=JSON.parse(localStorage.getItem(d.markKey+'-srs')||'{}')||{};}catch{}return {s:o.s&&typeof o.s==='object'?o.s:{},m:o.m&&typeof o.m==='object'?o.m:{day:0,newDone:0},lim:Number(o.lim)||20};}

function uStartDay(t){const day=86400000,tz=7*3600000;return Math.floor((t+tz)/day)*day-tz;}

function uCards(d){const c=d.cards.map(x=>({cat:x[0],f:x[1],b:x[2],ref:x[3]||'',mid:x[4]})),seen=new Set(c.map(x=>x.mid)),byCat=new Map(d.cats.map(x=>[x[1],x[0]])),rows=USTATE.rows.filter(x=>x.Status==='Verified'&&x.Subject===UNAMES[d.key]&&byCat.has(x.Chapter));for(const r of rows){const mid='n-'+String(r.page_id||r.url||r.Front).split('?')[0].split('/').pop();if(!r.Front||seen.has(mid))continue;seen.add(mid);c.push({cat:byCat.get(r.Chapter),f:String(r.Front),b:String(r.Back||''),ref:String(r.Ref||''),mid});}return c;}

function uSelected(d){return uCards(d).filter(x=>USTATE.cat==='all'||x.cat===USTATE.cat);}

function uQueue(d,src=uSelected(d)){const p=uReadSrs(d),now=Date.now(),day=uStartDay(now),count=p.m.day===day?Number(p.m.newDone)||0:0,learn=[],due=[],fresh=[];for(const x of src){const s=p.s[x.mid];if(!s)fresh.push(x);else if(Number(s.due||0)<=now)(s.st==='learn'?learn:due).push(x);}learn.sort((a,b)=>p.s[a.mid].due-p.s[b.mid].due);due.sort((a,b)=>p.s[a.mid].due-p.s[b.mid].due);return {learn,due,fresh,items:learn.concat(due,fresh.slice(0,Math.max(0,p.lim-count))),lim:p.lim};}

function uCurrent(d){const arr=uSelected(d);if(USTATE.mode==='browse')return arr.length?arr[((USTATE.browse%arr.length)+arr.length)%arr.length]:null;return uQueue(d,arr).items[0]||null;}

function uStats(d){const c=uCards(d),p=uReadSrs(d),seen=c.filter(x=>p.s[x.mid]),due=seen.filter(x=>p.s[x.mid].due<=Date.now());return {total:c.length,seen:seen.length,due:due.length};}

function uRich(v){return h(v).replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>');}

function uSchedule(input,rating){const now=Date.now(),DAY=86400000,MIN=60000,s={st:'learn',step:0,ease:2.5,ivl:0,lapses:0,...(input||{})};s.ts=now;const grad=i=>{s.st='rev';s.ivl=i;s.due=uStartDay(now)+i*DAY;delete s.rl;};if(s.st==='learn'){if(rating===1){s.step=0;s.due=now+MIN;}else if(rating===2)s.due=now+(s.step===0?6:10)*MIN;else if(rating===3){if(s.step+1<2){s.step++;s.due=now+10*MIN;}else grad(s.rl||1);}else grad(s.rl?Math.max(s.rl+1,2):4);}else{if(rating===1){s.lapses++;s.ease=Math.max(1.3,s.ease-.2);s.rl=Math.max(1,Math.round(s.ivl*.5));s.st='learn';s.step=1;s.due=now+10*MIN;}else if(rating===2){s.ease=Math.max(1.3,s.ease-.15);grad(Math.max(s.ivl+1,Math.round(s.ivl*1.2)));}else if(rating===3)grad(Math.max(s.ivl+1,Math.round(s.ivl*s.ease)));else{s.ease+=.15;grad(Math.max(s.ivl+1,Math.round(s.ivl*s.ease*1.3)));}}s.last=rating;return s;}

function uRate(d,r){const c=uCurrent(d);if(!c||!USTATE.flip)return;const p=uReadSrs(d),day=uStartDay(Date.now());if(p.m.day!==day){p.m.day=day;p.m.newDone=0;}if(!p.s[c.mid])p.m.newDone=(Number(p.m.newDone)||0)+1;p.s[c.mid]=uSchedule(p.s[c.mid],r);try{localStorage.setItem(d.markKey+'-srs',JSON.stringify(p));}catch{toast('บันทึกความคืบหน้าไม่ได้');return;}USTATE.flip=false;if(USTATE.mode==='browse')USTATE.browse++;render();}

function uQuizAnswers(d){let o={};try{o=JSON.parse(localStorage.getItem('study-'+d.key)||'{}')||{};}catch{}if(!o.ans||typeof o.ans!=='object')o.ans={};return o;}

function uQuiz(d){const qs=d.quiz.map((x,i)=>({id:i,cat:x[0],q:x[1],opts:x[2],right:x[3],exp:x[4]||''})),cats=new Map(d.cats.map(x=>[x[1],x[0]])),seen=new Set(qs.map(x=>String(x.id)));for(const r of USTATE.quizzes){if(r.Status!=='Verified'||r.Subject!==UNAMES[d.key]||!cats.has(r.Chapter)||!r.Question||!r.Correct)continue;const opts=[r.Correct,r['Wrong 1'],r['Wrong 2'],r['Wrong 3']].filter(Boolean);if(opts.length<2)continue;const id='n-'+String(r.page_id||r.url||r.Question).split('?')[0].split('/').pop();if(seen.has(id))continue;seen.add(id);qs.push({id,cat:cats.get(r.Chapter),q:String(r.Question),opts,right:0,exp:r.Explanation||''});}return qs;}


// Local-only vocabulary practice generated from existing English cards.
// These questions are NOT Notion Verified quizzes; answers never write to Study OS/SRS.
function uPracticeMeaning(back){
 const text=String(back||'').replace(/\*\*/g,'').trim();
 if(text.includes('|')){
  // Verified imports contain both "part of speech | Thai meaning" and
  // "Thai meaning | part of speech". Never treat a POS tag as a translation.
  const parts=text.split('|').map(x=>x.trim()),thai=/[\u0E00-\u0E7F]/;
  if(thai.test(parts[0]))return parts[0];
  if(thai.test(parts[1]||''))return parts[1];
  return '';
 }
 const first=text.split(/\r?\n/)[0]||'';
 const candidate=first.replace(/^[^\n—–:]{1,35}\s*[—–:]\s*/,'').replace(/^(?:ชนิดคำ|ตัวอย่าง)\s*:.*/,'').trim();
 // Never turn an English-only source line into a Thai-meaning quiz answer.
 return /[\u0E00-\u0E7F]/.test(candidate)?candidate:'';
}
function uPracticeContext(back){
 const text=String(back||'').replace(/\*\*/g,'').trim(),parts=text.split('|');
 let example='',translation='';
 if(parts.length>=3){
  const pair=parts.slice(2).join('|').split(' = ');
  example=pair[0].replace(/^\s*(?:Example|ตัวอย่าง)\s*:\s*/i,'').trim();
  translation=pair.slice(1).join(' = ').trim();
 }else{
  const lines=text.split(/\r?\n/),en=lines.find(x=>/^\s*(?:Example|ตัวอย่าง)\s*:/i.test(x)),th=lines.find(x=>/^\s*แปล\s*:/.test(x));
  example=en?en.replace(/^\s*(?:Example|ตัวอย่าง)\s*:\s*/i,'').trim():'';
  translation=th?th.replace(/^\s*แปล\s*:\s*/,'').trim():'';
 }
 return {example:example.slice(0,500),translation:translation.slice(0,500)};
}
// Avoid distractors that repeat any explicit Thai sense in a semicolon/slash/comma list.
function uPracticeSenses(meaning){
 return String(meaning||'').normalize('NFKC').toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g,'').split(/[,，、;；\/]/).map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean);
}
function uPracticeSharesSense(a,b){return a.some(x=>b.includes(x));}
function uPracticeStopSpeech(){
 if(typeof window==='undefined'||typeof window.speechSynthesis?.cancel!=='function')return;
 // A broken audio engine must never prevent a learner from answering or navigating.
 try{window.speechSynthesis.cancel();}catch{}
}
function uPracticeSpeak(text){
 if(!String(text||'').trim()||typeof window==='undefined'||typeof window.SpeechSynthesisUtterance!=='function'||
  typeof window.speechSynthesis?.cancel!=='function'||typeof window.speechSynthesis?.speak!=='function')return false;
 try{
  const speech=new window.SpeechSynthesisUtterance(String(text));speech.lang='en-US';speech.rate=0.9;
  window.speechSynthesis.cancel();window.speechSynthesis.speak(speech);
  return true;
 }catch{
  if(typeof toast==='function')toast('Speech is unavailable. You can continue practicing.');
  return false;
 }
}
function uPracticeQuestions(d){
 if(d.key!==UACTIVE_LANGUAGE)return [];
 // Freeze question/answer pairs for an active session even when Verified data refreshes.
 if(USTATE.practiceQuestions!==null)return USTATE.practiceQuestions;
 const seenWords=new Set(),seenMeanings=new Set(),pool=[];
 for(const c of uCards(d)){
  // Filter before deduplication so another chapter cannot hide the selected chapter's word.
  if(USTATE.cat!=='all'&&c.cat!==USTATE.cat)continue;
  const word=String(c.f||'').trim(),meaning=uPracticeMeaning(c.b);
  if(!word||!meaning||word.length>85||meaning.length>160)continue;
  const wk=word.normalize('NFKC').toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/\s+/g,' ').trim(),mk=meaning.normalize('NFKC').toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/\s+/g,' ').trim();
  if(seenWords.has(wk)||seenMeanings.has(mk))continue;
  seenWords.add(wk);seenMeanings.add(mk);
  pool.push({word,meaning,senses:uPracticeSenses(meaning),cat:c.cat,id:c.mid,context:uPracticeContext(c.b),ref:String(c.ref||'')});
 }
 if(pool.length<4)return [];
 const eligible=USTATE.cat==='all'?pool:pool.filter(x=>x.cat===USTATE.cat);
 if(eligible.length<4)return [];
 const rotated=eligible.slice(USTATE.practiceOffset%eligible.length).concat(eligible.slice(0,USTATE.practiceOffset%eligible.length));
 const round=Math.floor(USTATE.practiceOffset/10);
 const questions=rotated.slice(0,Math.min(10,eligible.length)).map((c,i)=>{
  // Distinct whole translations can still share a Thai sense ("ขึ้นอยู่กับ" vs "ขึ้นอยู่กับ; ...").
  const candidates=eligible.filter(x=>x.id!==c.id),start=(i*7+round)%candidates.length;
  const wrong=[];
  for(const option of candidates.slice(start).concat(candidates.slice(0,start))){
   if(uPracticeSharesSense(c.senses,option.senses)||wrong.some(x=>uPracticeSharesSense(x.senses,option.senses)))continue;
   wrong.push(option);
   if(wrong.length===3)break;
  }
  if(wrong.length<3)return null;
  const options=[c.meaning,...wrong.map(x=>x.meaning)],shift=(i+round)%4;
  const opts=options.slice(shift).concat(options.slice(0,shift));
  return {id:'practice-'+c.id,cat:c.cat,q:c.word,opts,right:opts.indexOf(c.meaning),context:c.context,ref:c.ref};
 }).filter(Boolean);
 if(questions.length)USTATE.practiceQuestions=questions;
 return questions;
}
function uPracticeHTML(d){
 const all=uPracticeQuestions(d),answers=USTATE.practiceAnswers;
 const correct=all.filter(q=>answers[q.id]===q.right).length;
 const answered=all.filter(q=>answers[q.id]!==undefined).length;
 const missed=answered-correct;
 const complete=all.length>0&&answered===all.length;
 const header=`<div class="panel-header"><h3 role="status" aria-live="polite" aria-atomic="true">English Vocabulary Practice · ${correct}/${answered} correct</h3><div class="pill-row"><button class="btn btn-outline" data-action="u-practice-retry" ${missed?'':'disabled'}>Retry mistakes (${missed})</button><button class="btn btn-outline" data-action="u-practice-restart">New set</button></div></div><p class="u-meta">Practice generated from existing English vocabulary · Not a Verified Notion quiz · Answers stay in this session and do not change SRS or Study OS scores. Retry mistakes starts a new round using only answered mistakes.</p>`;
 if(!all.length)return header+'<div class="u-empty">Need at least four English words with non-overlapping Thai meanings to start practice.</div>';
 USTATE.quizIndex=Math.max(0,Math.min(USTATE.quizIndex,all.length-1));
 const q=all[USTATE.quizIndex],ans=answers[q.id],done=ans!==undefined;
 const canSpeak=typeof window!=='undefined'&&typeof window.SpeechSynthesisUtterance==='function'&&typeof window.speechSynthesis?.cancel==='function'&&typeof window.speechSynthesis?.speak==='function';
 const summary=complete?`<div class="notice mt20" role="status" aria-live="polite"><b>Session complete</b> · ${correct}/${all.length} correct · ${missed} to review. ${missed?'Use Retry mistakes to review missed words.':'Use New set to practice again.'}</div>`:'';
 return header+summary+`<div class="panel"><div class="panel-header"><span class="badge">${USTATE.quizIndex+1} / ${all.length}</span><span class="question-number">Choose the Thai meaning</span></div><h2 id="u-practice-question" lang="en" style="line-height:1.6">${h(q.q)}</h2><button type="button" class="btn btn-outline" data-action="u-practice-speak" aria-label="Hear English word pronunciation" ${canSpeak?'':'disabled title="Speech unavailable on this device"'}>Listen</button>${q.opts.map((o,i)=>`<button class="u-option ${done?(i===q.right?'right':i===ans?'wrong':''):''}" data-action="u-practice-answer" data-answer="${i}" aria-describedby="u-practice-question" aria-pressed="${done&&i===ans?'true':'false'}" ${done?'disabled':''}>${'ABCD'[i]}. ${h(o)}</button>`).join('')}<p class="u-meta">Keyboard: press 1–4 to choose an answer.</p>${done?`<div class="notice mt20" role="status" aria-live="polite">${ans===q.right?'Correct':'Correct answer: '+h(q.opts[q.right])}${q.context?.example?`<p class="u-meta"><b>Source example</b><br><span lang="en">${h(q.context.example)}</span><br><button type="button" class="btn btn-outline" data-action="u-practice-example-speak" aria-label="Hear source example pronunciation" ${canSpeak?'':'disabled title="Speech unavailable on this device"'}>Listen to example</button>${q.context.translation?`<br><span lang="th">${h(q.context.translation)}</span>`:''}${q.ref?`<br>Source: ${h(q.ref)}`:''}</p>`:''}</div>`:''}<div class="pill-row mt20" style="justify-content:space-between"><button class="btn btn-outline" data-action="u-q-prev" ${USTATE.quizIndex===0?'disabled':''}>Previous</button><button class="btn btn-primary" data-action="u-q-next" ${USTATE.quizIndex===all.length-1?'disabled':''}>Next</button></div></div>`;
}

// Recover keyboard/screen-reader focus after Practice replaces its DOM.
function uPracticeRefocus(mode){
 if(typeof document==='undefined'||typeof document.querySelector!=='function')return;
 const target=document.querySelector(mode==='answer'?'#mainContent .panel .notice[role="status"]':'#u-practice-question');
 if(!target||typeof target.focus!=='function')return;
 target.setAttribute('tabindex','-1');
 target.focus({preventScroll:true});
}
function uHome(){if(!USTATE.ready)return `<div class="panel u-highlight"><h3>🃏 English Flashcards</h3><p>${USTATE.error?'ยังโหลดฐานการ์ดไม่ได้':'กำลังโหลดแฟลชการ์ดภาษาอังกฤษ...'}</p><button class="btn btn-primary" data-page="studymerge">Open cards →</button></div>`;const visible=uVisibleDecks();const total=visible.reduce((n,d)=>n+uStats(d).total,0);return `<div class="section-header"><div><h2>English Flashcards</h2><p class="subheading">${total} English cards · Original SRS history</p></div><button class="text-link" data-page="studymerge">Open cards →</button></div><div class="u-subjects">${visible.map(d=>{const t=uStats(d);return `<button class="u-subject" data-action="u-subject" data-subject="${d.key}"><span class="u-icon">${UICONS[d.key]}</span><b>${h(d.name)}</b><small>${t.total} cards · ${t.seen} studied · ${t.due} due</small></button>`}).join('')}</div>`;}

function uReview(){if(!USTATE.ready)return '';const due=uVisibleDecks().reduce((n,d)=>n+uStats(d).due,0);return `<div class="panel u-highlight"><div class="panel-header"><h3>English Flashcards</h3><span class="badge">${due} DUE</span></div><p>ทบทวนคำศัพท์ภาษาอังกฤษด้วยรอบ SRS เดิม</p><button class="btn btn-primary" data-page="studymerge">Review English cards →</button></div>`;}

function uHTML(){if(!USTATE.ready)return heading('English Flashcards','ฝึกภาษาอังกฤษด้วยแฟลชการ์ดและระบบทบทวน SRS')+`<div class="panel"><h3>${USTATE.error?'เปิดชุดแฟลชการ์ดยังไม่สำเร็จ':'กำลังโหลดชุดการ์ด...'}</h3><p>${h(USTATE.error||'อ่านข้อมูลแฟลชการ์ดภาษาอังกฤษ')}</p><button class="btn btn-outline" data-action="u-reload">ลองอีกครั้ง</button></div>`;const d=uDeck(UACTIVE_LANGUAGE);if(!d)return '<p>ไม่พบชุดการ์ด</p>';const t=uStats(d);return heading('English Flashcards','English vocabulary · Verified content · Spaced repetition')+`<div class="u-subjects">${uVisibleDecks().map(x=>{const z=uStats(x);return `<button class="u-subject ${d.key===x.key?'on':''}" data-action="u-subject" data-subject="${x.key}"><span class="u-icon">${UICONS[x.key]}</span><b>${h(x.name)}</b><small>${z.total} cards · ${z.seen} studied · ${z.due} due</small></button>`}).join('')}</div><div class="stats-grid mb24"><div class="stat-card"><div class="stat-icon purple">▤</div><div><strong>${t.total}</strong><small>Total cards</small></div></div><div class="stat-card"><div class="stat-icon orange">↻</div><div><strong>${t.due}</strong><small>Due now</small></div></div><div class="stat-card"><div class="stat-icon green">✓</div><div><strong>${t.seen}</strong><small>Reviewed</small></div></div></div><div class="u-tabs">${[['cards','🃏 Flashcards'],['practice','✎ Vocabulary Practice'],['quiz','Verified Quizzes ('+uQuiz(d).length+')'],['summary','▤ Summaries ('+d.sum.length+')']].map(([key,label])=>`<button class="${USTATE.tab===key?'on':''}" data-action="u-tab" data-tab="${key}">${label}</button>`).join('')}</div><div class="u-cats"><button class="${USTATE.cat==='all'?'on':''}" data-action="u-cat" data-cat="all">All (${t.total})</button>${d.cats.map(x=>`<button class="${USTATE.cat===x[0]?'on':''}" data-action="u-cat" data-cat="${h(x[0])}">${h(x[1])}</button>`).join('')}</div>${USTATE.tab==='cards'?uCardHTML(d):USTATE.tab==='practice'?uPracticeHTML(d):USTATE.tab==='quiz'?uQuizHTML(d):uSummaryHTML(d)}<p class="u-meta">แหล่งข้อมูล: Study OS เดิม + การ์ด/ข้อสอบ Notion สถานะ Verified · ความคืบหน้าแฟลชการ์ดใช้คีย์ในเบราว์เซอร์เดียวกับเว็บเดิม · ไม่แก้ไข Notion</p>`;}

function uCardHTML(d){const c=uCurrent(d),q=uQueue(d),all=uSelected(d),label=c?(d.cats.find(x=>x[0]===c.cat)||[])[1]||'':'';let html=`<div class="u-tabs"><button class="${USTATE.mode==='due'?'on':''}" data-action="u-mode" data-mode="due">Due + New</button><button class="${USTATE.mode==='browse'?'on':''}" data-action="u-mode" data-mode="browse">Browse all</button><button data-action="u-limit">New/day: ${q.lim}</button></div>`;if(!c)return html+`<div class="u-empty"><h3>${all.length?'วันนี้ไม่มีการ์ดครบกำหนดแล้ว':'ยังไม่มีการ์ดในหมวดนี้'}</h3><p>เลือก Browse all หรือเปลี่ยนหมวดเพื่อดูการ์ดทั้งหมด</p><button class="btn btn-primary" data-action="u-mode" data-mode="browse">Browse all →</button></div>`;const face=USTATE.flip?c.b:c.f,canSpeak=d.key==='eng'||d.key==='zh';return html+`<div class="panel"><div class="panel-header"><span class="badge">${h(label)}</span><span class="question-number">${USTATE.mode==='due'?`${q.learn.length} learning · ${q.due.length} due · ${q.fresh.length} new`:`${((USTATE.browse%all.length)+all.length)%all.length+1}/${all.length}`}</span></div><button class="u-flip ${USTATE.flip?'back':''}" data-action="u-flip"><span class="u-label">${USTATE.flip?'BACK · ANSWER':'FRONT · QUESTION'}</span><strong class="${String(face).length>130?'shrink':''}">${uRich(face)}</strong><span class="u-hint">แตะเพื่อ${USTATE.flip?'กลับไปคำถาม':'ดูเฉลย'}</span></button>${c.ref?`<p class="u-meta">${h(c.ref)}</p>`:''}${canSpeak?`<button class="btn btn-outline mt20" data-action="u-speak">♫ Listen</button>`:''}${USTATE.flip?`<div class="u-rate">${[1,2,3,4].map((r,i)=>`<button data-action="u-rate" data-rate="${r}">${['Again','Hard','Good','Easy'][i]}<small>${uSchedule(uReadSrs(d).s[c.mid],r).st==='rev'?uSchedule(uReadSrs(d).s[c.mid],r).ivl+' days':'Soon'}</small></button>`).join('')}</div>`:`<p class="footnote mt20" style="text-align:center">พลิกการ์ดแล้วให้คะแนน เพื่อบันทึกรอบทบทวน</p>`}${USTATE.mode==='browse'?`<div class="pill-row mt20" style="justify-content:space-between"><button class="btn btn-outline" data-action="u-prev">← Previous</button><button class="btn btn-outline" data-action="u-next">Next →</button></div>`:''}</div>`;}

function uQuizHTML(d){const p=uQuizAnswers(d),all=uQuiz(d),arr=all.filter(x=>(USTATE.cat==='all'||x.cat===USTATE.cat)&&(!USTATE.missed||(p.ans[x.id]!==undefined&&p.ans[x.id]!==x.right))),answered=all.filter(x=>p.ans[x.id]!==undefined),right=answered.filter(x=>p.ans[x.id]===x.right);const headingHTML=`<div class="panel-header"><h3>${right.length}/${answered.length} correct · ${all.length} total</h3><button class="btn btn-outline" data-action="u-missed">${USTATE.missed?'All questions':'Only mistakes'}</button></div>`;if(!arr.length)return headingHTML+'<div class="u-empty">ไม่มีข้อสอบตรงตัวกรองนี้</div>';USTATE.quizIndex=Math.max(0,Math.min(USTATE.quizIndex,arr.length-1));const x=arr[USTATE.quizIndex],ans=p.ans[x.id],done=ans!==undefined;return headingHTML+`<div class="panel"><div class="panel-header"><span class="badge">${USTATE.quizIndex+1} / ${arr.length}</span><span class="question-number">${h((d.cats.find(c=>c[0]===x.cat)||[])[1]||'')}</span></div><h2 style="line-height:1.6">${uRich(x.q)}</h2>${x.opts.map((o,i)=>`<button class="u-option ${done?(i===x.right?'right':i===ans?'wrong':''):''}" data-action="u-answer" data-answer="${i}" ${done?'disabled':''}>${'ABCD'[i]||i+1}. ${uRich(o)}</button>`).join('')}${done?`<div class="notice mt20">${ans===x.right?'✓ ถูกต้อง':'เฉลย: '+('ABCD'[x.right]||x.right+1)}<p>${uRich(x.exp)}</p></div>`:''}<div class="pill-row mt20" style="justify-content:space-between"><button class="btn btn-outline" data-action="u-q-prev" ${USTATE.quizIndex===0?'disabled':''}>← Previous</button><button class="btn btn-primary" data-action="u-q-next" ${USTATE.quizIndex===arr.length-1?'disabled':''}>Next →</button></div></div>`;}

function uSummaryHTML(d){const list=d.sum.filter(x=>USTATE.cat==='all'||x.cat===USTATE.cat);if(!list.length)return '<div class="u-empty">วิชานี้ยังไม่มีสรุป แต่แฟลชการ์ดสามารถใช้ทบทวนได้แล้ว</div>';return list.map(s=>`<div class="u-summary"><h3>${uRich(s.h)}</h3><table><thead><tr>${(s.head||['หัวข้อ','สรุป']).map(v=>`<th>${uRich(v)}</th>`).join('')}</tr></thead><tbody>${s.rows.map(row=>`<tr>${row.map(v=>`<td>${uRich(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>${s.tip?`<p class="u-meta">${uRich(s.tip)}</p>`:''}</div>`).join('');}

function uAction(el){const d=uDeck(UACTIVE_LANGUAGE),a=el.dataset.action;switch(a){case 'u-subject':if(el.dataset.subject!==UACTIVE_LANGUAGE)return;USTATE.subject=UACTIVE_LANGUAGE;USTATE.cat='all';USTATE.tab='cards';USTATE.mode='due';USTATE.flip=false;USTATE.browse=0;USTATE.quizIndex=0;ui.page='studymerge';render();break;case 'u-tab':if(USTATE.tab==='practice'&&el.dataset.tab!=='practice')uPracticeStopSpeech();USTATE.tab=el.dataset.tab;USTATE.flip=false;USTATE.quizIndex=0;render();break;case 'u-cat':if(USTATE.tab==='practice')uPracticeStopSpeech();USTATE.cat=el.dataset.cat;USTATE.flip=false;USTATE.browse=0;USTATE.quizIndex=0;USTATE.practiceAnswers={};USTATE.practiceQuestions=null;USTATE.practiceOffset=0;render();break;case 'u-mode':USTATE.mode=el.dataset.mode;USTATE.flip=false;USTATE.browse=0;render();break;case 'u-flip':USTATE.flip=!USTATE.flip;render();break;case 'u-rate':if(d)uRate(d,Number(el.dataset.rate));break;case 'u-prev':USTATE.browse--;USTATE.flip=false;render();break;case 'u-next':USTATE.browse++;USTATE.flip=false;render();break;case 'u-limit':if(d){const p=uReadSrs(d);p.lim=p.lim===5?10:p.lim===10?20:p.lim===20?40:5;try{localStorage.setItem(d.markKey+'-srs',JSON.stringify(p));}catch{toast('บันทึกไม่ได้');}USTATE.flip=false;render();}break;case 'u-speak':if(d&&('speechSynthesis' in window)){const c=uCurrent(d);if(!c)return;const voice=new SpeechSynthesisUtterance(c.f);voice.lang=d.key==='zh'?'zh-CN':'en-US';speechSynthesis.cancel();speechSynthesis.speak(voice);}break;case 'u-practice-speak':if(d){const q=uPracticeQuestions(d)[USTATE.quizIndex];if(q)uPracticeSpeak(q.q);}break;case 'u-practice-example-speak':if(d){const q=uPracticeQuestions(d)[USTATE.quizIndex];if(q&&USTATE.practiceAnswers[q.id]!==undefined)uPracticeSpeak(q.context?.example);}break;case 'u-practice-answer':if(d){const questions=uPracticeQuestions(d),q=questions[USTATE.quizIndex];if(!q||USTATE.practiceAnswers[q.id]!==undefined)return;const raw=el.dataset.answer;if(typeof raw!=='string'||!/^\d+$/.test(raw))return;const answer=Number(raw);if(!Number.isInteger(answer)||answer<0||answer>=q.opts.length)return;uPracticeStopSpeech();USTATE.practiceAnswers[q.id]=answer;render();uPracticeRefocus('answer');}break;case 'u-practice-retry':if(d){const missed=uPracticeQuestions(d).filter(q=>USTATE.practiceAnswers[q.id]!==undefined&&USTATE.practiceAnswers[q.id]!==q.right);if(!missed.length)return;uPracticeStopSpeech();USTATE.practiceQuestions=missed;USTATE.practiceAnswers={};USTATE.quizIndex=0;render();uPracticeRefocus('question');}break;case 'u-practice-restart':uPracticeStopSpeech();USTATE.practiceOffset+=10;USTATE.practiceAnswers={};USTATE.practiceQuestions=null;USTATE.quizIndex=0;render();uPracticeRefocus('question');break;case 'u-answer':if(d){const p=uQuizAnswers(d),questions=uQuiz(d).filter(x=>(USTATE.cat==='all'||x.cat===USTATE.cat)&&(!USTATE.missed||(p.ans[x.id]!==undefined&&p.ans[x.id]!==x.right))),q=questions[USTATE.quizIndex];if(!q||p.ans[q.id]!==undefined)return;p.ans[q.id]=Number(el.dataset.answer);p.ats=p.ats&&typeof p.ats==='object'?p.ats:{};p.ats[q.id]=Date.now();try{localStorage.setItem('study-'+d.key,JSON.stringify(p));}catch{toast('บันทึกไม่ได้');return}render();}break;case 'u-q-next':if(USTATE.tab==='practice')uPracticeStopSpeech();USTATE.quizIndex++;render();if(USTATE.tab==='practice')uPracticeRefocus('question');break;case 'u-q-prev':if(USTATE.tab==='practice')uPracticeStopSpeech();USTATE.quizIndex--;render();if(USTATE.tab==='practice')uPracticeRefocus('question');break;case 'u-missed':USTATE.missed=!USTATE.missed;USTATE.quizIndex=0;render();break;case 'u-reload':uBoot();break;}}

// Async content refresh must not strand keyboard focus when it replaces Practice DOM.
function uPracticeRefreshRender(){
 const focused=typeof document==='undefined'?null:document.activeElement;
 const main=typeof document==='undefined'?null:document.getElementById('mainContent');
 const mode=ui.page==='studymerge'&&USTATE.tab==='practice'&&main?.contains(focused)
  ?(focused?.classList?.contains('notice')?'answer':focused?.id==='u-practice-question'?'question':null)
  :null;
 render();
 if(mode)uPracticeRefocus(mode);
}
async function uBoot(){USTATE.error='';try{const cached=JSON.parse(localStorage.getItem(UCACHE)||'null');if(cached?.decks?.length===5){USTATE.decks=cached.decks;USTATE.ready=true;}}catch{}try{USTATE.rows=JSON.parse(localStorage.getItem(UROWS)||'[]')||[];}catch{}try{USTATE.quizzes=JSON.parse(localStorage.getItem(UQUIZZES)||'[]')||[];}catch{}if(['home','studymerge','review'].includes(ui.page))uPracticeRefreshRender();const requests=[['./study-decks.json','decks',UCACHE],['../data/cards.json','rows',UROWS],['../data/quiz.json','quizzes',UQUIZZES]];const results=await Promise.allSettled(requests.map(async ([url,what,cache])=>{const r=await fetch(url+'?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error(url+' '+r.status);const raw=await r.json();if(what==='decks'){if(raw.schemaVersion!==1||raw.decks?.length!==5||raw.decks.reduce((a,x)=>a+x.cards.length,0)!==757)throw Error('Deck integrity');USTATE.decks=raw.decks;USTATE.ready=true;try{localStorage.setItem(cache,JSON.stringify(raw));}catch{}}else{if(!Array.isArray(raw.rows))throw Error('Invalid rows');const good=raw.rows.filter(x=>x.Status==='Verified');USTATE[what]=good;try{localStorage.setItem(cache,JSON.stringify(good));}catch{}}}));if(results[0].status==='rejected')USTATE.error='โหลดชุดการ์ดใหม่ไม่สำเร็จ: '+String(results[0].reason);if(['home','studymerge','review'].includes(ui.page))uPracticeRefreshRender();}

// Optional hardware-keyboard shortcuts, scoped strictly to unanswered English Practice.
function uPracticeKeydown(event){
 if(ui.page!=='studymerge'||USTATE.tab!=='practice'||event.defaultPrevented||event.isComposing||
  event.repeat||event.ctrlKey||event.altKey||event.metaKey||event.shiftKey||!/^[1-4]$/.test(event.key))return;
 if(event.target?.closest?.('input,textarea,select,[contenteditable],[role="dialog"]'))return;
 // Keep number shortcuts away from navigation and any open modal.
 if(typeof document!=='undefined'){
  const modal=document.getElementById('modalLayer'),main=document.getElementById('mainContent');
  if(modal&&!modal.hidden)return;
  if(main&&event.target&&event.target!==document.body&&event.target!==document.documentElement&&!main.contains(event.target))return;
 }
 const d=uDeck(UACTIVE_LANGUAGE),q=d?uPracticeQuestions(d)[USTATE.quizIndex]:null;
 if(!q||USTATE.practiceAnswers[q.id]!==undefined)return;
 event.preventDefault();
 uAction({dataset:{action:'u-practice-answer',answer:String(Number(event.key)-1)}});
}
function uInstall(){const head=document.createElement('style');head.textContent=USTYLE;document.head.append(head);const nav=document.getElementById('sideNav');if(nav){const b=document.createElement('button');b.className='nav-item';b.setAttribute('data-page','studymerge');b.innerHTML='<span class="nav-icon">🃏</span> English Flashcards';nav.children[0]?.after(b);}const mobile=document.querySelector('.mobile-nav');if(mobile){const b=document.createElement('button');b.setAttribute('data-page','studymerge');b.textContent='Cards';mobile.children[0]?.after(b);}const baseHome=homeHTML,baseReview=reviewHTML,baseRender=render,baseHandle=handleAction;homeHTML=function(){return baseHome()+uHome();};reviewHTML=function(){return baseReview()+uReview();};render=function(){if(ui.page==='studymerge'){updateChrome();const el=document.getElementById('breadcrumbCurrent');if(el)el.textContent='English Flashcards';document.querySelectorAll('[data-page]').forEach(x=>x.classList.toggle('active',x.dataset.page==='studymerge'));document.getElementById('mainContent').innerHTML=uHTML();}else baseRender();};handleAction=function(el){if(el.dataset.action?.startsWith('u-'))return uAction(el);const result=baseHandle(el);if(el.dataset.action==='sync-notion')uBoot();return result;};document.addEventListener('keydown',uPracticeKeydown);uBoot();}
uInstall();
