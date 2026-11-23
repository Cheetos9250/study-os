// Study OS read-only MCP server for Gemini (and any MCP client).
// Reads the owner's synced progress from the progress Worker (GET only) and the public course data from GitHub Pages,
// and answers MCP tool calls with summaries. It never writes anything.
// Auth: the URL path carries a long read-only token (secret MCP_READ_TOKEN): POST /mcp/<token>, or POST /mcp with
// "Authorization: Bearer <token>". Changing the secret revokes every client. The sync key stays inside this Worker.
// Deployed only by .github/workflows/deploy-gemini-mcp.yml (manual, owner types DEPLOY).
import T from '../../scripts/study-today.js';
import G from '../../scripts/study-gemini.js';

export const PROGRESS_URL='https://vocabloom-progress-cas-prod.kasidit09022550.workers.dev';
export const SITE='https://cheetos9250.github.io/study-os/';
const PROTOCOL='2025-06-18',L='ABCDEFGH',COURSE_KEYS=T.COURSES.map(c=>c.key);

const enc=new TextEncoder();
function safeEqual(a,b){
 if(typeof a!=='string'||typeof b!=='string')return false;
 const x=enc.encode(a),y=enc.encode(b);let d=x.length^y.length;
 for(let i=0;i<Math.max(x.length,y.length);i++)d|=(x[i]||0)^(y[i]||0);
 return d===0;
}
const json=(body,status=200,extra={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...extra}});

async function progress(env,subject){
 const req=new Request(PROGRESS_URL+'/progress/'+subject,{headers:{'X-Sync-Key':env.PROGRESS_SYNC_KEY}});
 const r=await (env.PROGRESS&&typeof env.PROGRESS.fetch==='function'?env.PROGRESS.fetch(req):fetch(req));
 if(r.status===404)return null;
 if(!r.ok)throw Error('progress '+subject+': HTTP '+r.status);
 return r.json();
}
async function courseData(env,c){
 const f=env.SITE_FETCH||fetch;
 const r=await f(SITE+c.data,{cf:{cacheTtl:300}});
 if(!r.ok)throw Error('course data '+c.key+': HTTP '+r.status);
 return T.parseCourseData(await r.text());
}
async function load(env,keys){
 const list=T.COURSES.filter(c=>keys.includes(c.key));
 const [today,...rest]=await Promise.all([progress(env,'today').catch(()=>null),...list.map(c=>Promise.all([courseData(env,c),progress(env,c.key)]))]);
 const settings=T.loadSettings(JSON.stringify((today&&today.today)||{}));
 return {settings,courses:list.map((c,i)=>({key:c.key,name:c.name,D:rest[i][0],study:(rest[i][1]&&rest[i][1].study)||{}}))};
}
const lastActive=study=>{let m=0;for(const v of Object.values((study&&study.ats)||{})){const t=Number(v);if(t>m)m=t;}return m;};
const stamp=t=>t?new Date(t+7*3600000).toISOString().slice(0,16).replace('T',' ')+' (Bangkok)':'never';

const TOOLS=[
 {name:'get_overview',title:'Study overview',description:'Live summary of the student\'s Study OS: upcoming exams with days left, practice questions answered and % right per chapter for Accounting, Economics and Math, weak chapters, and when each subject was last practised. Call this first.',
  inputSchema:{type:'object',properties:{wrong_per_course:{type:'integer',minimum:0,maximum:20,description:'Also list this many newest wrong questions per subject (default 0).'}},additionalProperties:false},annotations:{readOnlyHint:true,openWorldHint:false}},
 {name:'get_wrong_questions',title:'Wrong questions',description:'Questions the student currently has wrong in one subject, newest first, with their answer, the correct answer and the explanation. Optional chapter filter (chapter id like c5, or part of the chapter name).',
  inputSchema:{type:'object',properties:{course:{type:'string',enum:COURSE_KEYS},chapter:{type:'string'},limit:{type:'integer',minimum:1,maximum:50}},required:['course'],additionalProperties:false},annotations:{readOnlyHint:true,openWorldHint:false}},
 {name:'get_schedule',title:'Exams and classes',description:'Upcoming exams with their chapters, and the student\'s classes for a given date (default today, Bangkok time).',
  inputSchema:{type:'object',properties:{date:{type:'string',pattern:'^\\d{4}-\\d{2}-\\d{2}$'}},additionalProperties:false},annotations:{readOnlyHint:true,openWorldHint:false}}
];

async function callTool(env,name,args,now){
 args=args&&typeof args==='object'?args:{};
 if(name==='get_overview'){
  const n=Math.max(0,Math.min(20,Number(args.wrong_per_course)||0));
  const {settings,courses}=await load(env,COURSE_KEYS);
  let md=G.buildContext({now,exams:settings.exams,wrongPerCourse:n,courses,goal:' '});
  md=md.replace(/\n## What I want from you[\s\S]*$/,'\n');
  md+='\n## Last practice\n\n'+courses.map(c=>'- '+c.name+': '+stamp(lastActive(c.study))).join('\n')+'\n';
  return md;
 }
 if(name==='get_wrong_questions'){
  if(!COURSE_KEYS.includes(args.course))throw new RpcError(-32602,'course must be one of '+COURSE_KEYS.join(', '));
  const {courses}=await load(env,[args.course]);const c=courses[0],s=G.courseStats(c.D,c.study);
  const ch=String(args.chapter||'').toLowerCase().trim(),lim=Math.max(1,Math.min(50,Number(args.limit)||15));
  const list=s.wrong.filter(w=>!ch||w.q[0].toLowerCase()===ch||w.label.toLowerCase().includes(ch));
  if(!list.length)return c.name+': no wrong questions'+(ch?' in "'+args.chapter+'"':'')+' right now.';
  const clean=t=>String(t==null?'':t).replace(/\*\*/g,'').trim();
  return '# '+c.name+': wrong questions ('+Math.min(lim,list.length)+' of '+list.length+')\n\n'+list.slice(0,lim).map((w,i)=>{const o=Array.isArray(w.q[2])?w.q[2]:[];
   return (i+1)+'. ['+w.label+'] '+clean(w.q[1])+'\n'+o.map((t,k)=>'   '+L[k]+') '+clean(t)).join('\n')+'\n   Student answered: '+L[w.a]+' · Correct: '+L[w.q[3]]+(w.q[4]?'\n   Explanation: '+clean(w.q[4]):'');}).join('\n\n')+'\n';
 }
 if(name==='get_schedule'){
  const {settings,courses}=await load(env,COURSE_KEYS);
  const date=/^\d{4}-\d{2}-\d{2}$/.test(String(args.date||''))?args.date:T.dayKey(now);
  const labels={};courses.forEach(c=>{labels[c.key]=Object.fromEntries(c.D.cats);});
  const ex=settings.exams.map(e=>({e,d:T.daysUntil(e.date,now)})).filter(x=>x.d>=0).sort((a,b)=>a.d-b.d);
  const cls=T.classesOn(settings.timetable,date);
  return '# Schedule\n\n## Upcoming exams\n\n'+(ex.length?ex.map(({e,d})=>'- '+e.title+': '+e.date+' (in '+d+' days)'+((e.cats||[]).length?'. Chapters: '+e.cats.map(id=>(labels[e.course]||{})[id]||id).join(', '):'')).join('\n'):'- None left.')
   +'\n\n## Classes on '+date+'\n\n'+(cls.length?cls.sort((a,b)=>a.start.localeCompare(b.start)).map(x=>'- '+x.start+'–'+x.end+' '+x.name+(x.code?' ('+x.code+')':'')).join('\n'):'- No classes.')+'\n';
 }
 throw new RpcError(-32602,'Unknown tool: '+name);
}
class RpcError extends Error{constructor(code,message){super(message);this.code=code;}}

async function rpc(env,msg,now){
 if(!msg||msg.jsonrpc!=='2.0'||typeof msg.method!=='string')return {jsonrpc:'2.0',id:msg&&msg.id!==undefined?msg.id:null,error:{code:-32600,message:'Invalid request'}};
 const isNote=msg.id===undefined;
 try{
  let result;
  switch(msg.method){
   case 'initialize':result={protocolVersion:(msg.params&&typeof msg.params.protocolVersion==='string')?msg.params.protocolVersion:PROTOCOL,capabilities:{tools:{listChanged:false}},
    serverInfo:{name:'study-os',title:'Study OS',version:'1.0.0'},instructions:'Read-only access to one student\'s Study OS progress (exams, chapter accuracy, wrong questions, timetable). Use get_overview first. Data is as fresh as the student\'s last cloud sync.'};break;
   case 'ping':result={};break;
   case 'tools/list':result={tools:TOOLS};break;
   case 'tools/call':{const p=msg.params||{};
    try{result={content:[{type:'text',text:await callTool(env,p.name,p.arguments,now)}]};}
    catch(e){if(e instanceof RpcError)throw e;result={content:[{type:'text',text:'Could not read Study OS: '+e.message}],isError:true};}
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
  if(typeof env.MCP_READ_TOKEN!=='string'||env.MCP_READ_TOKEN.length<32||typeof env.PROGRESS_SYNC_KEY!=='string')return json({error:'Not configured'},503);
  const auth=(request.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');
  if(!safeEqual(m[1]||auth,env.MCP_READ_TOKEN))return json({error:'Unauthorized'},401);
  if(request.method==='GET'||request.method==='DELETE')return json({error:'Method not allowed'},405,{Allow:'POST'});
  if(request.method!=='POST')return json({error:'Method not allowed'},405,{Allow:'POST'});
  let body;try{body=JSON.parse(await request.text());}catch{return json({jsonrpc:'2.0',id:null,error:{code:-32700,message:'Parse error'}},400);}
  const now=Date.now();
  if(Array.isArray(body)){const out=(await Promise.all(body.map(x=>rpc(env,x,now)))).filter(Boolean);return out.length?json(out):new Response(null,{status:202});}
  const out=await rpc(env,body,now);
  return out?json(out):new Response(null,{status:202});
 }
};
