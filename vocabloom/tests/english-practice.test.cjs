'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),src=fs.readFileSync(path.join(root,'vocabloom/study-integration.js'),'utf8');
const deck=JSON.parse(fs.readFileSync(path.join(root,'vocabloom/study-decks.json'),'utf8')).decks.find(d=>d.key==='eng');
function extract(a,b){let i=src.indexOf(a),j=src.indexOf(b,i+a.length);assert.ok(i>=0&&j>i);return src.slice(i,j);}
const pure=extract('function uPracticeMeaning(back){','function uHome(){');
function run(offset=0,cat='all'){
 return new Function('deck','offset','cat',`const UACTIVE_LANGUAGE='eng',USTATE={practiceOffset:offset,practiceAnswers:{},practiceQuestions:null,quizIndex:0,cat};const uCards=d=>d.cards.map(x=>({cat:x[0],f:x[1],b:x[2],mid:x[4]}));${pure};return {questions:uPracticeQuestions(deck),meaning:uPracticeMeaning};`)(deck,offset,cat);
}
test('Generated practice produces ten answerable English-only questions with unique meanings',()=>{
 const {questions}=run();assert.equal(questions.length,10);
 for(const q of questions){assert.ok(q.id.startsWith('practice-'));assert.equal(q.opts.length,4);assert.equal(new Set(q.opts).size,4);assert.ok(q.right>=0&&q.right<4);assert.ok(q.opts[q.right]);}
 assert.deepEqual(questions,run().questions,'Same source and offset must be deterministic');
 assert.notDeepEqual(questions.map(q=>q.id),run(10).questions.map(q=>q.id));
});
test('Practice meaning extracts both legacy and news vocabulary formats',()=>{
 const {meaning}=run();
 assert.equal(meaning('n | ความหมาย | A sample sentence.'),'ความหมาย');
 assert.equal(meaning('แสร้งทำ | v | Example: Children pretend to be artists.'),'แสร้งทำ');
 assert.equal(meaning('ความหลงใหล | n | Example: Art is his passion.'),'ความหลงใหล');
 assert.equal(meaning('n | v | Example: malformed'),'');
 assert.equal(meaning('n — preservation\nExample: Preservation protects buildings.'),'','English-only multiline text is not a Thai answer');
 assert.equal(meaning('Example: The company filed a report.\nแปล: บริษัทส่งรายงาน'),'','Example lines are not answer meanings');
 assert.equal(meaning('n — การอนุรักษ์'+String.fromCharCode(10)+'Example: Preservation protects buildings.'),'การอนุรักษ์');
 assert.equal(meaning('**ความผิดพลาด**'+String.fromCharCode(10)+'ชนิดคำ: n.'+String.fromCharCode(10)+'ตัวอย่าง: A mistake.'),'ความผิดพลาด');
});
test('Practice is session-only and never uses legacy quiz or SRS write actions',()=>{
 assert.match(src,/practiceAnswers:\{\},practiceOffset:0/);
 assert.match(src,/case 'u-practice-answer'/);
 const action=extract("case 'u-practice-answer':","case 'u-answer':");
 assert.doesNotMatch(action,/localStorage|cCloudSync|uRate|cApplySubject|fetch\(/);
 assert.match(src,/Not a Verified Notion quiz/);
 assert.match(src,/Verified Quizzes/);
 assert.match(src,/case 'u-practice-restart'/);
});

test('Chapter filter limits generated practice to the chosen English category',()=>{
 const all=run().questions;
 const selected=run(0,'e1').questions;
 assert.ok(selected.length>=4);
 assert.ok(selected.every(q=>q.cat==='e1'));
 assert.ok(all.some(q=>q.cat!=='e1')||all.length===10);
 assert.deepEqual(run(0,'not-a-category').questions,[]);
 assert.ok(src.includes("USTATE.practiceAnswers={};USTATE.practiceQuestions=null;USTATE.practiceOffset=0;render();"));
});

test('Active practice snapshot stays stable if source cards change mid-session',()=>{
 const evaluate=new Function('deck',`const UACTIVE_LANGUAGE='eng',USTATE={practiceOffset:0,practiceAnswers:{},practiceQuestions:null,quizIndex:0,cat:'all'};let cards=deck.cards.map(x=>({cat:x[0],f:x[1],b:x[2],mid:x[4]}));const uCards=()=>cards;${pure};const first=uPracticeQuestions(deck);const saved=JSON.stringify(first);cards=cards.slice().reverse().map(c=>({...c,f:'UPDATED '+c.f,b:'changed'}));const stable=uPracticeQuestions(deck);USTATE.practiceQuestions=null;const fresh=uPracticeQuestions(deck);return {saved,stable:JSON.stringify(stable),fresh:JSON.stringify(fresh)};`)(deck);
 assert.equal(evaluate.saved,evaluate.stable,'Question text/options must not change during active session');
 assert.notEqual(evaluate.saved,evaluate.fresh,'New session should reflect updated source data');
 assert.match(src,/case 'u-practice-restart':USTATE\.practiceOffset\+=10;USTATE\.practiceAnswers=\{\};USTATE\.practiceQuestions=null;/);
});

test('Practice answer actions are isolated from SRS and legacy quiz storage',()=>{
 const actions=extract('function uAction(el){','async function uBoot(){');
 const result=new Function('deck',`const UACTIVE_LANGUAGE='eng',USTATE={practiceOffset:0,practiceAnswers:{},practiceQuestions:null,quizIndex:0,cat:'all',tab:'practice',flip:false,browse:0};const ui={page:'studymerge'};const localStorage={setItem(){throw Error('Practice must never write storage')},getItem(){throw Error('Practice must never read storage')}};const uCards=d=>d.cards.map(x=>({cat:x[0],f:x[1],b:x[2],mid:x[4]}));const uDeck=()=>deck;let renders=0;const render=()=>{renders++};const toast=()=>{};${pure}${actions}
 const first=uPracticeQuestions(deck)[0],right=first.right;
 uAction({dataset:{action:'u-practice-answer',answer:String(right)}});
 const once=USTATE.practiceAnswers[first.id];
 uAction({dataset:{action:'u-practice-answer',answer:String((right+1)%4)}});
 const twice=USTATE.practiceAnswers[first.id];
 uAction({dataset:{action:'u-tab',tab:'cards'}});
 uAction({dataset:{action:'u-tab',tab:'practice'}});
 const afterTab=USTATE.practiceAnswers[first.id];
 uAction({dataset:{action:'u-practice-restart'}});
 return {once,twice,afterTab,right,afterRestart:Object.keys(USTATE.practiceAnswers).length,snapshotCleared:USTATE.practiceQuestions===null,renders};
 `)(deck);
 assert.equal(result.once,result.right);
 assert.equal(result.twice,result.right,'Duplicate answer must not overwrite existing answer');
 assert.equal(result.afterTab,result.right,'Switching tabs should preserve active practice answer');
 assert.equal(result.afterRestart,0);
 assert.equal(result.snapshotCleared,true);
 assert.ok(result.renders>=3);
});

test('Actual practice actions reject missing, empty, negative, non-numeric and out-of-range answers',()=>{
 const actions=extract('function uAction(el){','async function uBoot(){');
 const out=new Function('deck',`const UACTIVE_LANGUAGE='eng',USTATE={practiceOffset:0,practiceAnswers:{},practiceQuestions:null,quizIndex:0,cat:'all',tab:'practice',flip:false,browse:0};const ui={page:'studymerge'};const localStorage={setItem(){throw Error('Unexpected write')},getItem(){throw Error('Unexpected read')}};const uCards=d=>d.cards.map(x=>({cat:x[0],f:x[1],b:x[2],mid:x[4]}));const uDeck=()=>deck;let renders=0;const render=()=>{renders++};const toast=()=>{};${pure}${actions}
const q=uPracticeQuestions(deck)[0];for(const raw of [undefined,'','-1','NaN','4','Infinity','0.0',' 0'])uAction({dataset:{action:'u-practice-answer',answer:raw}});const before=Object.keys(USTATE.practiceAnswers).length;uAction({dataset:{action:'u-practice-answer',answer:String(q.right)}});return {before,after:USTATE.practiceAnswers[q.id],right:q.right,renders};`)(deck);
 assert.equal(out.before,0);assert.equal(out.after,out.right);assert.equal(out.renders,1);
});

test('Actual chapter switching clears stale answers, snapshot and offset',()=>{
 const actions=extract('function uAction(el){','async function uBoot(){');
 const out=new Function('deck',`const UACTIVE_LANGUAGE='eng',USTATE={practiceOffset:0,practiceAnswers:{},practiceQuestions:null,quizIndex:0,cat:'all',tab:'practice',flip:false,browse:0};const ui={page:'studymerge'};const localStorage={setItem(){throw Error('Unexpected write')},getItem(){throw Error('Unexpected read')}};const uCards=d=>d.cards.map(x=>({cat:x[0],f:x[1],b:x[2],mid:x[4]}));const uDeck=()=>deck;const render=()=>{};const toast=()=>{};${pure}${actions}
const q=uPracticeQuestions(deck)[0];uAction({dataset:{action:'u-practice-answer',answer:String(q.right)}});uAction({dataset:{action:'u-practice-restart'}});uPracticeQuestions(deck);uAction({dataset:{action:'u-cat',cat:'e1'}});const cleared={answers:Object.keys(USTATE.practiceAnswers).length,snapshot:USTATE.practiceQuestions,offset:USTATE.practiceOffset,cat:USTATE.cat};const filtered=uPracticeQuestions(deck);uAction({dataset:{action:'u-cat',cat:'not-a-category'}});return {cleared,filtered:filtered.map(x=>x.cat),empty:uPracticeQuestions(deck)};`)(deck);
 assert.deepEqual(out.cleared,{answers:0,snapshot:null,offset:0,cat:'e1'});
 assert.ok(out.filtered.length>=4&&out.filtered.every(c=>c==='e1'));
 assert.deepEqual(out.empty,[]);
});

test('Practice HTML escapes malicious vocabulary and option strings',()=>{
 const html=new Function('deck',`const UACTIVE_LANGUAGE='eng',USTATE={practiceOffset:0,practiceAnswers:{},practiceQuestions:null,quizIndex:0,cat:'all'};const uCards=()=>[{cat:'e1',f:'<img src=x onerror=alert(1)>',b:'ความหมาย<script>alert(1)</script>',mid:'bad'},...deck.cards.slice(0,8).map(x=>({cat:x[0],f:x[1],b:x[2],mid:x[4]}))];const h=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');${pure}return uPracticeHTML(deck);`)(deck);
 assert.ok(html.includes('&lt;img'));assert.ok(html.includes('&lt;script'));
 assert.ok(!html.includes('<img src=x'));assert.ok(!html.includes('<script>'));
});

test('Practice exposes question, selected answer and feedback to assistive technologies',()=>{
 const html=new Function('deck',`const UACTIVE_LANGUAGE='eng',USTATE={practiceOffset:0,practiceAnswers:{},practiceQuestions:null,quizIndex:0,cat:'all'};const uCards=d=>d.cards.map(x=>({cat:x[0],f:x[1],b:x[2],mid:x[4]}));const h=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');${pure}const before=uPracticeHTML(deck);const q=uPracticeQuestions(deck)[0];USTATE.practiceAnswers[q.id]=q.right;const after=uPracticeHTML(deck);return {before,after};`)(deck);
 assert.match(html.before,/role="status" aria-live="polite"/);
 assert.match(html.before,/id="u-practice-question"/);
 assert.match(html.before,/aria-describedby="u-practice-question"/);
 assert.match(html.before,/aria-pressed="false"/);
 assert.match(html.after,/aria-pressed="true"/);
 assert.match(html.after,/role="status" aria-live="polite">Correct/);
});

test('Selected chapter retains words and meanings duplicated in an earlier chapter',()=>{
 const cards=[['a','shared','ความหมายหนึ่ง','', 'a1'],['a','another','ความหมายสอง','','a2'],
 ['b','shared','ความหมายหนึ่ง','','b1'],['b','another','ความหมายสอง','','b2'],
 ['b','third','ความหมายสาม','','b3'],['b','fourth','ความหมายสี่','','b4']];
 const d={key:'eng',cards};
 const questions=new Function('deck',`const UACTIVE_LANGUAGE='eng',USTATE={cat:'b',practiceQuestions:null,practiceOffset:0};const uCards=d=>d.cards.map(x=>({cat:x[0],f:x[1],b:x[2],mid:x[4]}));${pure}return uPracticeQuestions(deck);`)(d);
 assert.equal(questions.length,4);
 assert.ok(questions.every(q=>q.cat==='b'));
 assert.deepEqual(questions.map(q=>q.id),['practice-b1','practice-b2','practice-b3','practice-b4']);
});

test('Retry mistakes freezes only incorrect answered questions and never touches storage',()=>{
 const actions=extract('function uAction(el){','async function uBoot(){');
 const out=new Function('deck',`const UACTIVE_LANGUAGE='eng',USTATE={practiceOffset:0,practiceAnswers:{},practiceQuestions:null,quizIndex:0,cat:'all'};const ui={};const localStorage={getItem(){throw Error('Unexpected read')},setItem(){throw Error('Unexpected write')}};const uCards=d=>d.cards.map(x=>({cat:x[0],f:x[1],b:x[2],mid:x[4]}));const uDeck=()=>deck;let renders=0;const render=()=>renders++;${pure}${actions}
 const first=uPracticeQuestions(deck);uAction({dataset:{action:'u-practice-retry'}});const noOp=renders===0;
 USTATE.practiceAnswers[first[0].id]=first[0].right;
 USTATE.practiceAnswers[first[1].id]=(first[1].right+1)%4;
 USTATE.practiceAnswers[first[3].id]=(first[3].right+1)%4;
 USTATE.quizIndex=9;uAction({dataset:{action:'u-practice-retry'}});
 const retry=uPracticeQuestions(deck),cleared=Object.keys(USTATE.practiceAnswers).length;
 USTATE.practiceAnswers[retry[0].id]=retry[0].right;uAction({dataset:{action:'u-practice-retry'}});
 return {noOp,first,retry,cleared,index:USTATE.quizIndex,remaining:uPracticeQuestions(deck),answers:USTATE.practiceAnswers};`)(deck);
 assert.ok(out.noOp);
 assert.deepEqual(out.retry,[out.first[1],out.first[3]],'Keep exact prompt/options from answered mistakes');
 assert.equal(out.cleared,0);assert.equal(out.index,0);
 assert.deepEqual(out.remaining,out.retry,'No mistakes in retry must not reset the round');
 assert.equal(Object.keys(out.answers).length,1);
});

test('Practice feedback uses source examples/translation from all three legacy formats',()=>{
 const context=new Function(pure+'return uPracticeContext')();
 assert.deepEqual(context('v | ปรับตัว | Example: We adapt quickly. = เราปรับตัวเร็ว'),{example:'We adapt quickly.',translation:'เราปรับตัวเร็ว'});
 assert.deepEqual(context('n — ข่าว\nExample: Read the news.\nแปล: อ่านข่าว'),{example:'Read the news.',translation:'อ่านข่าว'});
 assert.deepEqual(context('**ความผิดพลาด**\nชนิดคำ: n.\nตัวอย่าง: I made a mistake.'),{example:'I made a mistake.',translation:''});
 assert.deepEqual(context('No example supplied'),{example:'',translation:''});
});
test('Source context is hidden before answering and escaped in feedback afterwards',()=>{
 const out=new Function('deck',`const UACTIVE_LANGUAGE='eng',USTATE={cat:'all',practiceOffset:0,practiceQuestions:null,practiceAnswers:{},quizIndex:0};const uCards=d=>d.cards.map(x=>({cat:x[0],f:x[1],b:x[2],mid:x[4],ref:x[3]}));const h=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');${pure}const before=uPracticeHTML(deck),q=uPracticeQuestions(deck)[0];q.context={example:'<img src=x onerror=alert(1)>',translation:'<script>แปล</script>'};q.ref='<svg onload=alert(1)>';USTATE.practiceAnswers[q.id]=q.right;return {before,after:uPracticeHTML(deck)};`)(deck);
 assert.doesNotMatch(out.before,/Source example/);
 assert.match(out.after,/Source example/);assert.match(out.after,/lang="en"/);assert.match(out.after,/lang="th"/);
 assert.match(out.after,/&lt;img/);assert.match(out.after,/&lt;script/);assert.match(out.after,/&lt;svg/);
 assert.doesNotMatch(out.after,/<img|<script|<svg/);
});

test('Large practice pools retain correct distinct options after deterministic distractor rotation',()=>{
 const out=new Function(`const UACTIVE_LANGUAGE='eng',USTATE={cat:'all',practiceOffset:0,practiceQuestions:null};const cards=Array.from({length:1000},(_,i)=>({f:'word'+i,b:'n | ความหมาย'+i+' | Example '+i,cat:'large',mid:'large-'+i}));const uCards=()=>cards;${pure}const first=uPracticeQuestions({key:'eng'});USTATE.practiceOffset=10;USTATE.practiceQuestions=null;return {first,next:uPracticeQuestions({key:'eng'})};`)();
 assert.equal(out.first.length,10);assert.equal(out.next.length,10);
 for(const q of [...out.first,...out.next]){assert.equal(q.opts.length,4);assert.equal(new Set(q.opts).size,4);assert.equal(q.opts[q.right],'ความหมาย'+q.q.slice(4));}
 assert.ok(out.next.every(q=>!out.first.some(old=>old.id===q.id)));
});

test('Practice collapses whitespace-equivalent Thai meanings and headwords before choosing distractors',()=>{
 const cards=[
  {cat:'e1',f:'alpha',b:'n | การ พัฒนา',mid:'a'},
  {cat:'e1',f:'beta',b:'n | การ  พัฒนา',mid:'b'},
  {cat:'e1',f:'gamma',b:'n | ความรู้',mid:'c'},
  {cat:'e1',f:'delta',b:'n | ความเข้าใจ',mid:'d'},
  {cat:'e1',f:'epsilon',b:'n | ความสำเร็จ',mid:'e'},
  {cat:'e1',f:'  ALPHA  ',b:'n | ความแตกต่าง',mid:'f'}
 ];
 const questions=new Function('cards',`const UACTIVE_LANGUAGE='eng',USTATE={cat:'all',practiceOffset:0,practiceQuestions:null};const uCards=()=>cards;${pure}return uPracticeQuestions({key:'eng'});`)(cards);
 assert.equal(questions.length,4);
 assert.ok(!questions.some(q=>q.q==='beta'||q.q.trim()==='ALPHA'));
 for(const q of questions)assert.equal(new Set(q.opts.map(x=>x.normalize('NFKC').replace(/\s+/g,' ').trim())).size,4);
});

test('Invisible Unicode separators cannot create duplicate Thai distractors',()=>{
 const cards=[
  {cat:'e1',f:'alpha',b:'n | การพัฒนา',mid:'a'},
  {cat:'e1',f:'beta',b:'n | การ\u200Bพัฒนา',mid:'b'},
  {cat:'e1',f:'gamma',b:'n | ความรู้',mid:'c'},
  {cat:'e1',f:'delta',b:'n | ความเข้าใจ',mid:'d'},
  {cat:'e1',f:'epsilon',b:'n | ความสำเร็จ',mid:'e'},
  {cat:'e1',f:'al\u200Bpha',b:'n | ความแตกต่าง',mid:'f'}
 ];
 const questions=new Function('cards',`const UACTIVE_LANGUAGE='eng',USTATE={cat:'all',practiceOffset:0,practiceQuestions:null};const uCards=()=>cards;${pure}return uPracticeQuestions({key:'eng'});`)(cards);
 assert.equal(questions.length,4);
 assert.ok(!questions.some(q=>q.q==='beta'||q.q.includes('al\u200Bpha')));
});


test('Practice avoids ambiguous Thai distractors sharing an explicit slash or semicolon sense',()=>{
 const cards=[
  {cat:'e1',f:'hinge on',b:'v | ขึ้นอยู่กับ',mid:'sense-1'},
  {cat:'e1',f:'contingent on',b:'adj | ขึ้นอยู่กับ; มีเงื่อนไขว่า',mid:'sense-2'},
  {cat:'e1',f:'alpha',b:'n | ความรู้',mid:'sense-3'},
  {cat:'e1',f:'beta',b:'n | ความเข้าใจ',mid:'sense-4'},
  {cat:'e1',f:'gamma',b:'n | ความพยายาม',mid:'sense-5'},
  {cat:'e1',f:'delta',b:'n | ความสำเร็จ',mid:'sense-6'},
  {cat:'e1',f:'epsilon',b:'n | การเรียนรู้',mid:'sense-7'}
 ];
 const evaluate=new Function('cards',"const UACTIVE_LANGUAGE='eng',USTATE={cat:'all',practiceOffset:0,practiceQuestions:null};const uCards=()=>cards;"+pure+"return {questions:uPracticeQuestions({key:'eng'}),senses:uPracticeSenses};");
 const result=evaluate(cards);
 assert.equal(result.questions.length,7);
 for(const q of result.questions){
  assert.equal(q.opts.length,4);
  const all=q.opts.map(result.senses);
  for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){
   assert.ok(!all[i].some(s=>all[j].includes(s)),'Overlapping Thai sense for '+q.q);
  }
 }
 const hinge=result.questions.find(q=>q.q==='hinge on');
 const contingent=result.questions.find(q=>q.q==='contingent on');
 assert.ok(hinge&&contingent);
 assert.ok(!hinge.opts.includes('ขึ้นอยู่กับ; มีเงื่อนไขว่า'));
 assert.ok(!contingent.opts.includes('ขึ้นอยู่กับ'));
});


test('Ambiguous four-word pool fails closed with an accurate empty-state message',()=>{
 const cards=[
  {cat:'e1',f:'hinge on',b:'v | ขึ้นอยู่กับ',mid:'small-1'},
  {cat:'e1',f:'contingent on',b:'adj | ขึ้นอยู่กับ; มีเงื่อนไขว่า',mid:'small-2'},
  {cat:'e1',f:'knowledge',b:'n | ความรู้',mid:'small-3'},
  {cat:'e1',f:'understanding',b:'n | ความเข้าใจ',mid:'small-4'}
 ];
 const evaluate=new Function('cards',"const UACTIVE_LANGUAGE='eng',USTATE={cat:'all',practiceOffset:0,practiceQuestions:null,practiceAnswers:{},quizIndex:0};const uCards=()=>cards;const h=x=>String(x);"+pure+"return {questions:uPracticeQuestions({key:'eng'}),html:uPracticeHTML({key:'eng'})};");
 const out=evaluate(cards);
 assert.equal(out.questions.length,0,'Do not fabricate a fourth unambiguous option');
 assert.match(out.html,/non-overlapping Thai meanings/);
 assert.doesNotMatch(out.html,/data-action="u-practice-answer"/);
});


test('Practice session completion appears only after every answer and reports retry count',()=>{
 const evaluate=new Function('deck',"const UACTIVE_LANGUAGE='eng',USTATE={cat:'all',practiceOffset:0,practiceQuestions:null,practiceAnswers:{},quizIndex:0};const uCards=d=>d.cards.map(x=>({cat:x[0],f:x[1],b:x[2],mid:x[4],ref:x[3]}));const h=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');"+pure+
 "const questions=uPracticeQuestions(deck),before=uPracticeHTML(deck);for(let i=0;i<questions.length-1;i++)USTATE.practiceAnswers[questions[i].id]=questions[i].right;const partial=uPracticeHTML(deck);const last=questions[questions.length-1];USTATE.practiceAnswers[last.id]=(last.right+1)%4;const finished=uPracticeHTML(deck);USTATE.practiceQuestions=[last];USTATE.practiceAnswers={};const retry=uPracticeHTML(deck);return {total:questions.length,before,partial,finished,retry};");
 const out=evaluate(deck);
 assert.equal(out.total,10);
 assert.doesNotMatch(out.before,/Session complete/);
 assert.doesNotMatch(out.partial,/Session complete/);
 assert.match(out.finished,/Session complete/);
 assert.match(out.finished,/9\/10 correct/);
 assert.match(out.finished,/1 to review/);
 assert.match(out.finished,/Use Retry mistakes/);
 assert.doesNotMatch(out.retry,/Session complete/);
});
test('Perfect practice round shows a summary without suggesting mistake review',()=>{
 const out=new Function('deck',"const UACTIVE_LANGUAGE='eng',USTATE={cat:'all',practiceOffset:0,practiceQuestions:null,practiceAnswers:{},quizIndex:0};const uCards=d=>d.cards.map(x=>({cat:x[0],f:x[1],b:x[2],mid:x[4],ref:x[3]}));const h=x=>String(x);"+pure+
 "const questions=uPracticeQuestions(deck);for(const q of questions)USTATE.practiceAnswers[q.id]=q.right;return uPracticeHTML(deck);")(deck);
 assert.match(out,/Session complete/);
 assert.match(out,/10\/10 correct/);
 assert.match(out,/0 to review/);
 assert.match(out,/Use New set/);
});


test('New set varies distractors and option order even for exactly five or ten cards',()=>{
 const evaluate=new Function('size',"const UACTIVE_LANGUAGE='eng',USTATE={cat:'all',practiceOffset:0,practiceQuestions:null,practiceAnswers:{}};const uCards=()=>Array.from({length:size},(_,i)=>({cat:'e1',f:'word'+i,b:'n | ความหมาย'+i,mid:'id'+i}));"+pure+
 "const first=uPracticeQuestions({key:'eng'});USTATE.practiceOffset+=10;USTATE.practiceQuestions=null;const second=uPracticeQuestions({key:'eng'});return {first,second};");
 for(const size of [5,10]){
  const {first,second}=evaluate(size);
  assert.equal(first.length,size);assert.equal(second.length,size);
  assert.deepEqual(first.map(q=>q.id),second.map(q=>q.id),'Small pool keeps all cards, not a fabricated new set');
  assert.ok(first.some((q,i)=>JSON.stringify(q.opts)!==JSON.stringify(second[i].opts)),
    'New set should change visible choices for '+size+' words');
  for(const q of [...first,...second]){
   assert.equal(q.opts.length,4);
   assert.equal(new Set(q.opts).size,4);
   assert.equal(q.opts[q.right],'ความหมาย'+q.q.slice(4));
  }
 }
 assert.deepEqual(evaluate(5),evaluate(5),'Same round and source remain deterministic');
});


test('Practice refocus targets new feedback and the next question without scrolling',()=>{
 const makeNode=()=>({attributes:{},calls:[],setAttribute(k,v){this.attributes[k]=v},focus(opts){this.calls.push(opts)}});
 const feedback=makeNode(),question=makeNode();
 const document={querySelector(selector){return selector.includes('.notice')?feedback:selector==='#u-practice-question'?question:null}};
 const focus=new Function('document',pure+'return uPracticeRefocus;')(document);
 focus('answer');
 focus('question');
 assert.equal(feedback.attributes.tabindex,'-1');
 assert.equal(question.attributes.tabindex,'-1');
 assert.deepEqual(feedback.calls,[{preventScroll:true}]);
 assert.deepEqual(question.calls,[{preventScroll:true}]);
 const noDocument=new Function('document',pure+'return uPracticeRefocus;')(undefined);
 assert.doesNotThrow(()=>noDocument('answer'));
});


test('Async content refresh preserves focused feedback/question without hijacking other controls',()=>{
 const start=src.indexOf('function uPracticeRefreshRender(){'),end=src.indexOf('async function uBoot(){',start);
 assert.ok(start>=0&&end>start);
 const events=[],ui={page:'studymerge'},USTATE={tab:'practice'};
 const document={activeElement:null,getElementById(){return {contains(el){return Boolean(el)}}}};
 const refresh=new Function('document','ui','USTATE','render','uPracticeRefocus',src.slice(start,end)+'return uPracticeRefreshRender;')
  (document,ui,USTATE,()=>events.push('render'),mode=>events.push(mode));
 document.activeElement={id:'',classList:{contains:name=>name==='notice'}};
 refresh();
 assert.deepEqual(events,['render','answer']);
 events.length=0;
 document.activeElement={id:'u-practice-question',classList:{contains:()=>false}};
 refresh();
 assert.deepEqual(events,['render','question']);
 events.length=0;
 document.activeElement={id:'other-button',classList:{contains:()=>false}};
 refresh();
 assert.deepEqual(events,['render'],'Do not steal focus from unrelated buttons');
 events.length=0;
 ui.page='home';refresh();
 assert.deepEqual(events,['render']);
 assert.doesNotThrow(()=>new Function('ui','USTATE','render','uPracticeRefocus',
  src.slice(start,end)+'return uPracticeRefreshRender;')(ui,USTATE,()=>{},()=>{})());
});
