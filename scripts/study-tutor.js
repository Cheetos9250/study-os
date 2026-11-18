/* AI tutor helpers for tutor.html (pure functions, testable in Node).
   Two kinds of provider, both called straight from the browser with the owner's own key:
   - 'gemini': Google AI Studio (Gemini API), POST {base}/models/{model}:generateContent, key in x-goog-api-key;
   - 'openai': any OpenAI-compatible chat API, e.g. OpenRouter or Nous Research (Hermes models),
     POST {base}/chat/completions, key as Authorization: Bearer.
   The key lives only on this device (studyos.tutor.v1, or sessionStorage when "remember" is off). It is never
   backed up, synced or put in a link. Chats stay in sessionStorage for the current visit only. */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.StudyTutor=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const KEY='studyos.tutor.v1',SKEY='studyos.tutor.key',CHAT='studyos.tutor.chat.v1';
 const PROVIDERS={
  gemini:{label:'Gemini (Google AI Studio)',base:'https://generativelanguage.googleapis.com/v1beta',model:'gemini-flash-latest',keyHelp:'Get a free key at aistudio.google.com → Get API key.'},
  openai:{label:'Hermes / OpenAI-compatible',base:'https://openrouter.ai/api/v1',model:'nousresearch/hermes-4-70b',keyHelp:'For Hermes, an OpenRouter key (openrouter.ai → Keys) or a Nous Research API key with its base URL.'}
 };
 const MAX_TURNS=24,MAX_NOTES=9000;
 function clean(s,max){return String(s==null?'':s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').slice(0,max||200);}
 function baseUrl(s){s=clean(s,300).trim().replace(/\/+$/,'');return /^https:\/\/[a-z0-9.-]+(:\d+)?(\/[\w\-./~%]*)?$/i.test(s)?s:'';}
 /* settings without the key; unknown fields dropped */
 function normalize(raw){
  const o=raw&&typeof raw==='object'?raw:{},out={provider:o.provider==='openai'?'openai':'gemini',remember:o.remember!==false};
  for(const p of Object.keys(PROVIDERS)){const s=o[p]&&typeof o[p]==='object'?o[p]:{};
   out[p]={base:baseUrl(s.base)||PROVIDERS[p].base,model:clean(s.model,120).trim()||PROVIDERS[p].model,key:clean(s.key,400).trim()};}
  return out;
 }
 /* "Course notes" for the system prompt: the chosen chapter's summary from data/courses/<course>.js */
 function notes(D,cat){
  if(!D||!Array.isArray(D.sum))return '';
  const label=id=>((D.cats||[]).find(c=>c[0]===id)||[id,id])[1];
  let out='';
  for(const s of D.sum){if(cat&&s.cat!==cat)continue;
   let t='## '+label(s.cat)+' · '+s.h+'\n';
   if(Array.isArray(s.rows))t+=s.rows.map(r=>'- '+r[0]+': '+r[1]).join('\n')+'\n';
   if(s.tip)t+='Tip: '+s.tip+'\n';
   if(out.length+t.length>MAX_NOTES)break;out+=t;}
  return out.replace(/\*\*/g,'');
 }
 function system(o){
  o=o||{};
  let s='You are a patient tutor for a first-year university student in Thailand'+(o.course?' studying '+o.course:'')+(o.chapter?', chapter: '+o.chapter:'')+'.\n'
  +'- Reply in the language the student writes in (Thai or English). Keep technical terms in English, with Thai in brackets when it helps.\n'
  +'- Teach the method step by step and check the student\'s working; point out the exact step that went wrong.\n'
  +'- Journal entries: a markdown table | Date | Account | Debit | Credit |. Financial statements: a markdown table. Show the arithmetic.\n'
  +'- Use plain markdown only (paragraphs, lists, **bold**, pipe tables). No LaTeX, no HTML.\n'
  +'- Keep answers short unless asked for more. If you are not sure, say so instead of guessing.\n'
  +'- For homework or graded work, guide with hints and let the student do the final step.';
  if(o.notes)s+='\n\nCourse notes the student is studying (use them; say when the question goes beyond them):\n'+o.notes;
  return s;
 }
 /* messages: [{role:'user'|'assistant', text, image?:{mime,data(base64)}}] → fetch arguments */
 function request(cfg,sys,messages){
  const p=cfg.provider==='openai'?'openai':'gemini',c=cfg[p],msgs=(messages||[]).slice(-MAX_TURNS);
  if(!c||!c.key)throw new Error('Add your API key first (Settings).');
  if(p==='gemini'){
   const contents=msgs.map(m=>({role:m.role==='assistant'?'model':'user',parts:[...(m.image?[{inline_data:{mime_type:m.image.mime,data:m.image.data}}]:[]),{text:m.text||' '}]}));
   return {url:c.base+'/models/'+encodeURIComponent(c.model.replace(/^models\//,''))+':generateContent',
    init:{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':c.key},
     body:JSON.stringify({systemInstruction:{parts:[{text:sys}]},contents,generationConfig:{temperature:0.4}})}};
  }
  const messagesO=[{role:'system',content:sys}].concat(msgs.map(m=>m.image&&m.role==='user'
   ?{role:'user',content:[{type:'text',text:m.text||' '},{type:'image_url',image_url:{url:'data:'+m.image.mime+';base64,'+m.image.data}}]}
   :{role:m.role==='assistant'?'assistant':'user',content:m.text||' '}));
  return {url:c.base+'/chat/completions',
   init:{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+c.key,'X-Title':'Study OS'},
    body:JSON.stringify({model:c.model,messages:messagesO,temperature:0.4})}};
 }
 /* response JSON → reply text, or throws with the provider's own message */
 function reply(provider,status,j){
  const err=j&&(j.error&&(j.error.message||j.error.status||j.error.code)||j.message);
  if(status<200||status>=299){
   const hint=status===401||status===403?' Check the API key.':status===404?' Check the model name.':status===429?' Free quota reached for now; wait a minute (per-minute limit) or try again tomorrow (daily limit).':status>=500?' Google\'s servers are busy; try again in a minute.':'';
   throw new Error('The AI service answered '+status+(err?': '+clean(err,300):'')+'.'+hint);
  }
  let t='';
  if(provider==='gemini'){const cand=j&&j.candidates&&j.candidates[0];
   t=cand&&cand.content&&Array.isArray(cand.content.parts)?cand.content.parts.map(x=>x.text||'').join(''):'';
   if(!t&&cand&&cand.finishReason)throw new Error('No answer (stopped: '+clean(cand.finishReason,40)+').');
   if(!t&&j&&j.promptFeedback&&j.promptFeedback.blockReason)throw new Error('The question was blocked ('+clean(j.promptFeedback.blockReason,40)+').');
  }else{const ch=j&&j.choices&&j.choices[0],m=ch&&ch.message;
   t=m?(typeof m.content==='string'?m.content:Array.isArray(m.content)?m.content.map(x=>x.text||'').join(''):''):'';}
  if(!t)throw new Error(err?clean(err,300):'The AI service sent an empty answer.');
  return t.replace(/<think>[\s\S]*?<\/think>\s*/g,'').trim();
 }
 /* model list: GET with the key; returns ids */
 function modelsRequest(cfg){
  const p=cfg.provider==='openai'?'openai':'gemini',c=cfg[p];
  return p==='gemini'?{url:c.base+'/models?pageSize=200',init:{headers:{'x-goog-api-key':c.key}}}
   :{url:c.base+'/models',init:{headers:c.key?{'Authorization':'Bearer '+c.key}:{}}};
 }
 function models(provider,j){
  if(provider==='gemini')return ((j&&j.models)||[]).filter(m=>!m.supportedGenerationMethods||m.supportedGenerationMethods.includes('generateContent')).map(m=>String(m.name||'').replace(/^models\//,'')).filter(Boolean);
  return ((j&&j.data)||[]).map(m=>String(m.id||'')).filter(Boolean);
 }
 /* Newest stable model to fall back on when the saved one is retired (Gemini answers 404):
    the highest gemini-<version>-flash without a suffix, else gemini-flash-latest, else any plain Flash model. */
 function pickModel(provider,ids){
  ids=(ids||[]).map(String);
  if(provider!=='gemini')return '';
  const ver=id=>{const m=/^gemini-(\d+(?:\.\d+)?)-flash$/.exec(id);return m?parseFloat(m[1]):-1;};
  const stable=ids.filter(id=>ver(id)>=0).sort((a,b)=>ver(b)-ver(a));
  if(stable.length)return stable[0];
  if(ids.includes('gemini-flash-latest'))return 'gemini-flash-latest';
  return ids.find(id=>/flash/.test(id)&&!/(lite|image|tts|live|audio|embed|thinking|exp)/.test(id))||'';
 }
 /* A different model to answer with when the current one is busy (503) or its free quota is used up (429):
    each model has its own quota. Prefers another plain Flash, then Flash-Lite, newest first. */
 function backupModel(provider,ids,current){
  if(provider!=='gemini')return '';
  ids=(ids||[]).map(String).filter(id=>id!==current);
  const ver=(id,re)=>{const m=re.exec(id);return m?parseFloat(m[1]):-1;};
  const flash=/^gemini-(\d+(?:\.\d+)?)-flash$/,lite=/^gemini-(\d+(?:\.\d+)?)-flash-lite$/;
  const by=re=>ids.filter(id=>ver(id,re)>=0).sort((a,b)=>ver(b,re)-ver(a,re));
  return by(flash)[0]||(ids.includes('gemini-flash-latest')?'gemini-flash-latest':'')||by(lite)[0]||(ids.includes('gemini-flash-lite-latest')?'gemini-flash-lite-latest':'');
 }
 /* quick actions: prompts in Thai so answers come back in Thai */
 function quick(kind,o){
  o=o||{};const where=o.topic?'เรื่อง '+o.topic:o.chapter?'บท '+o.chapter+(o.course?' วิชา '+o.course:''):(o.course?'วิชา '+o.course:'เรื่องที่ผมกำลังเรียน');
  const n=Math.min(20,Math.max(1,parseInt(o.n,10)||5));
  if(kind==='explain')return 'อธิบาย'+where+'ให้เข้าใจง่าย ๆ: ประเด็นหลัก สูตรหรือหลักการที่ต้องจำ และตัวอย่างสั้น ๆ 1 ข้อ';
  if(kind==='quiz')return 'ตั้งคำถามปรนัย 4 ตัวเลือกจาก'+where+' ทีละข้อ รวม '+n+' ข้อ ถามข้อเดียวแล้วรอผมตอบก่อน แล้วค่อยเฉลยพร้อมเหตุผลและถามข้อต่อไป';
  if(kind==='summary')return 'สรุป'+where+'เป็นข้อ ๆ สั้น ๆ สำหรับทบทวนก่อนสอบ ใส่สูตรและคำศัพท์สำคัญ (English) ไม่เกิน 1 หน้า';
  if(kind==='example')return 'ยกโจทย์ตัวอย่างแบบที่ออกสอบจาก'+where+' 1 ข้อ แล้วเฉลยละเอียดทีละขั้น';
  if(kind==='check')return 'ช่วยตรวจคำตอบ/วิธีทำของผม บอกว่าถูกหรือผิดตรงขั้นไหน และวิธีแก้'+(o.topic?':\n'+o.topic:' (ผมจะส่งให้ในข้อความนี้หรือรูปที่แนบ)');
  if(kind==='mistakes')return 'จุดที่นักศึกษามักทำผิดใน'+where+' มีอะไรบ้าง บอกวิธีจำหรือวิธีเช็กคำตอบให้ไม่พลาด';
  if(kind==='plan'){const ex=(o.exams||[]).map(e=>'- '+e.name+': '+e.date+' (อีก '+e.days+' วัน)').join('\n');
   return 'ช่วยจัดแผนอ่านหนังสือรายวันจนถึงวันสอบ ให้เหมาะกับเวลาที่เหลือ บอกว่าวันไหนควรอ่านบทไหนและทำแบบฝึกหัดอะไร'+(ex?'\nวันสอบของผม:\n'+ex:'');}
  return '';
 }
 /* typed commands in the chat box: /quiz 10 inventory, /explain, /summary, /example, /check <working>, /mistakes, /plan, /new, /help */
 const COMMANDS=[['/explain','[topic]','Explain the chapter (or a topic)'],['/quiz','[number] [topic]','Multiple-choice quiz, one question at a time'],
  ['/summary','[topic]','Short summary to review before the exam'],['/example','[topic]','One exam-style problem, solved step by step'],
  ['/check','<your working>','Check your answer or working (or attach a photo)'],['/mistakes','[topic]','Common mistakes and how to avoid them'],
  ['/plan','','Daily study plan to your exams (uses Calendar exam dates)'],['/new','','Start a new chat'],['/help','','Show these commands']];
 function command(text){
  const m=/^\/([a-z]+)\b\s*([\s\S]*)$/i.exec(String(text||'').trim());if(!m)return null;
  const name=m[1].toLowerCase(),rest=m[2].trim();
  if(name==='new'||name==='help')return {action:name};
  if(name==='quiz'){const k=/^(\d{1,2})\b\s*([\s\S]*)$/.exec(rest);return {kind:'quiz',n:k?k[1]:'',topic:k?k[2].trim():rest};}
  if(['explain','summary','example','check','mistakes','plan'].includes(name))return {kind:name,topic:rest};
  return {action:'unknown',name};
 }
 function help(){return '**Commands** (type in the box, then Send)\n\n| Command | What it does |\n|---|---|\n'+COMMANDS.map(c=>'| '+c[0]+(c[1]?' '+c[1]:'')+' | '+c[2]+' |').join('\n')+'\n\nPick a subject and chapter first so the tutor reads your course notes. Example: /quiz 10 inventory';}
 return {KEY,SKEY,CHAT,PROVIDERS,MAX_TURNS,COMMANDS,normalize,notes,system,request,reply,modelsRequest,models,baseUrl,pickModel,backupModel,quick,command,help};
});
