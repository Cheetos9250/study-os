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
  gemini:{label:'Gemini (Google AI Studio)',base:'https://generativelanguage.googleapis.com/v1beta',model:'gemini-2.5-flash',keyHelp:'Get a free key at aistudio.google.com → Get API key.'},
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
   const hint=status===401||status===403?' Check the API key.':status===404?' Check the model name.':status===429?' Rate limit or free quota reached; wait a minute or check your plan.':'';
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
 return {KEY,SKEY,CHAT,PROVIDERS,MAX_TURNS,normalize,notes,system,request,reply,modelsRequest,models,baseUrl};
});
