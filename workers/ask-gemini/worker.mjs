// Ask-Gemini MCP server: lets Claude (a claude.ai custom connector, or any MCP client) hand a writing or coding task
// to Google Gemini and get the answer back. It has no storage and reads no Study OS data.
// Auth: a long token (secret CLAUDE_MCP_TOKEN) in the path: POST /mcp/<token>, or POST /mcp with "Authorization: Bearer <token>".
// The Gemini API key (secret GEMINI_API_KEY) stays inside this Worker and is never returned.
// Deployed only by .github/workflows/deploy-ask-gemini.yml (manual, owner types DEPLOY).

export const GEMINI='https://generativelanguage.googleapis.com/v1beta/';
// "-latest" aliases follow Google's newest Flash / Pro model, so the Worker does not need an update when models change.
export const MODELS={flash:'gemini-flash-latest',pro:'gemini-pro-latest'};
const FALLBACK={'gemini-flash-latest':['gemini-flash-lite-latest'],'gemini-pro-latest':['gemini-flash-latest']},BUSY=new Set([429,500,503,504]);
const PROTOCOL='2025-06-18',MAX_PROMPT=200000,TIMEOUT_MS=240000;

const enc=new TextEncoder();
function safeEqual(a,b){
 if(typeof a!=='string'||typeof b!=='string')return false;
 const x=enc.encode(a),y=enc.encode(b);let d=x.length^y.length;
 for(let i=0;i<Math.max(x.length,y.length);i++)d|=(x[i]||0)^(y[i]||0);
 return d===0;
}
const json=(body,status=200,extra={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...extra}});

const TOOLS=[
 {name:'ask_gemini',title:'Ask Gemini',
  description:'Send a task to Google Gemini and return its answer as text. Use it to delegate writing, drafting, translation, brainstorming or coding to Gemini, or to get a second opinion. Gemini sees only what you put in prompt (and system); it has no memory between calls, so include all context it needs. model "flash" (default) is fast; "pro" is stronger for hard reasoning or long code.',
  inputSchema:{type:'object',properties:{
   prompt:{type:'string',description:'The full task for Gemini, with every piece of context it needs.'},
   system:{type:'string',description:'Optional instructions for how Gemini should answer (role, language, format).'},
   model:{type:'string',enum:['flash','pro'],description:'Default flash.'},
   temperature:{type:'number',minimum:0,maximum:2,description:'Optional. Lower = more exact, higher = more creative.'},
   max_output_tokens:{type:'integer',minimum:16,maximum:65536,description:'Optional cap on the answer length.'}},
   required:['prompt'],additionalProperties:false},
  annotations:{readOnlyHint:true,openWorldHint:true}}
];

class RpcError extends Error{constructor(code,message){super(message);this.code=code;}}

export async function askGemini(env,args){
 const a=args&&typeof args==='object'?args:{};
 const prompt=typeof a.prompt==='string'?a.prompt.trim():'';
 if(!prompt)throw new RpcError(-32602,'prompt is required');
 if(prompt.length>MAX_PROMPT)throw new RpcError(-32602,'prompt is longer than '+MAX_PROMPT+' characters');
 const model=MODELS[a.model]||(env.GEMINI_MODEL&&/^[a-z0-9.-]{3,60}$/.test(env.GEMINI_MODEL)?env.GEMINI_MODEL:MODELS.flash);
 const body={contents:[{role:'user',parts:[{text:prompt}]}]};
 if(typeof a.system==='string'&&a.system.trim())body.systemInstruction={parts:[{text:a.system.trim().slice(0,MAX_PROMPT)}]};
 const gc={};
 if(typeof a.temperature==='number'&&a.temperature>=0&&a.temperature<=2)gc.temperature=a.temperature;
 if(Number.isInteger(a.max_output_tokens)&&a.max_output_tokens>=16)gc.maxOutputTokens=Math.min(65536,a.max_output_tokens);
 if(Object.keys(gc).length)body.generationConfig=gc;
 const f=env.GEMINI_FETCH||fetch,wait=env.RETRY_WAIT||(ms=>new Promise(res=>setTimeout(res,ms)));
 // Busy (429/500/503/504): wait and retry once, then fall back to the next model in the chain.
 const chain=[model,...(FALLBACK[model]||[])],started=Date.now();
 let r,data=null,used=model,lastErr='',busyErr='';
 for(const m of chain){
  for(let attempt=0;attempt<2;attempt++){
   const left=TIMEOUT_MS-(Date.now()-started);if(left<=1000)break;
   const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),left);
   try{r=await f(GEMINI+'models/'+m+':generateContent',{method:'POST',signal:ctl.signal,
    headers:{'Content-Type':'application/json','x-goog-api-key':env.GEMINI_API_KEY},body:JSON.stringify(body)});}
   catch(e){throw Error(e&&e.name==='AbortError'?'Gemini took longer than '+TIMEOUT_MS/1000+' s':'could not reach Gemini');}
   finally{clearTimeout(timer);}
   data=null;try{data=await r.json();}catch{}
   used=m;
   if(r.ok)break;
   const msg=data&&data.error&&typeof data.error.message==='string'?data.error.message:'';
   // never echo anything that could contain the key
   lastErr='Gemini HTTP '+r.status+(msg?': '+msg.split(env.GEMINI_API_KEY).join('[key]').slice(0,300):'');
   if(!BUSY.has(r.status)){if(m===model)throw Error(lastErr);lastErr=busyErr||lastErr;break;}
   busyErr=busyErr||lastErr;
   if(attempt===0)await wait(1500);
  }
  if(r&&r.ok)break;
 }
 if(!r||!r.ok)throw Error(lastErr||'Gemini did not answer');
 const model_=used;
 const c=data&&Array.isArray(data.candidates)?data.candidates[0]:null;
 const text=c&&c.content&&Array.isArray(c.content.parts)?c.content.parts.filter(p=>p&&typeof p.text==='string'&&!p.thought).map(p=>p.text).join(''):'';
 if(!text){
  const why=(data&&data.promptFeedback&&data.promptFeedback.blockReason)||(c&&c.finishReason)||'no text';
  throw Error('Gemini returned no answer ('+why+')');
 }
 const end=c.finishReason&&c.finishReason!=='STOP'?'\n\n[Gemini stopped early: '+c.finishReason+']':'';
 return {text:text+end,model:(data&&data.modelVersion)||model_};
}

async function rpc(env,msg){
 if(!msg||msg.jsonrpc!=='2.0'||typeof msg.method!=='string')return {jsonrpc:'2.0',id:msg&&msg.id!==undefined?msg.id:null,error:{code:-32600,message:'Invalid request'}};
 const isNote=msg.id===undefined;
 try{
  let result;
  switch(msg.method){
   case 'initialize':result={protocolVersion:(msg.params&&typeof msg.params.protocolVersion==='string')?msg.params.protocolVersion:PROTOCOL,capabilities:{tools:{listChanged:false}},
    serverInfo:{name:'ask-gemini',title:'Ask Gemini',version:'1.0.0'},instructions:'One tool, ask_gemini: delegate a writing or coding task to Google Gemini and get its answer. Gemini has no memory between calls; put all context in the prompt. Check its answer before using it.'};break;
   case 'ping':result={};break;
   case 'tools/list':result={tools:TOOLS};break;
   case 'tools/call':{const p=msg.params||{};
    if(p.name!=='ask_gemini')throw new RpcError(-32602,'Unknown tool: '+p.name);
    try{const out=await askGemini(env,p.arguments);result={content:[{type:'text',text:out.text}],_meta:{model:out.model}};}
    catch(e){if(e instanceof RpcError)throw e;result={content:[{type:'text',text:'Ask Gemini failed: '+e.message}],isError:true};}
    break;}
   default:if(isNote)return null;throw new RpcError(-32601,'Method not found');
  }
  return isNote?null:{jsonrpc:'2.0',id:msg.id,result};
 }catch(e){return isNote?null:{jsonrpc:'2.0',id:msg.id,error:{code:e.code||-32603,message:e.message}};}
}

export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==='/health')return json({ok:true});
  const m=url.pathname.match(/^\/mcp(?:\/([A-Za-z0-9_-]{1,200}))?\/?$/);
  if(!m)return json({error:'Not found'},404);
  if(typeof env.CLAUDE_MCP_TOKEN!=='string'||env.CLAUDE_MCP_TOKEN.length<32||typeof env.GEMINI_API_KEY!=='string'||!env.GEMINI_API_KEY)return json({error:'Not configured'},503);
  const auth=(request.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');
  if(!safeEqual(m[1]||auth,env.CLAUDE_MCP_TOKEN))return json({error:'Unauthorized'},401);
  if(request.method!=='POST')return json({error:'Method not allowed'},405,{Allow:'POST'});
  let body;try{body=JSON.parse(await request.text());}catch{return json({jsonrpc:'2.0',id:null,error:{code:-32700,message:'Parse error'}},400);}
  if(Array.isArray(body)){const out=(await Promise.all(body.map(x=>rpc(env,x)))).filter(Boolean);return out.length?json(out):new Response(null,{status:202});}
  const out=await rpc(env,body);
  return out?json(out):new Response(null,{status:202});
 }
};
