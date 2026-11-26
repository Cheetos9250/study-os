// Ask-Gemini MCP Worker (workers/ask-gemini/worker.mjs): auth, MCP handshake, the Gemini call, and that the key never leaks.
const test=require('node:test'),assert=require('node:assert/strict'),path=require('path');
const TOKEN='t'.repeat(40),KEY='AIzaFAKEKEY_1234567890';
let W;test.before(async()=>{W=(await import(path.join(__dirname,'..','workers/ask-gemini/worker.mjs'))).default;});
function env(calls,reply){
 return {CLAUDE_MCP_TOKEN:TOKEN,GEMINI_API_KEY:KEY,
  GEMINI_FETCH:async(url,init)=>{calls.push({url,init,body:JSON.parse(init.body)});const r=reply||{status:200,body:{candidates:[{content:{parts:[{text:'Hello from Gemini'}]},finishReason:'STOP'}],modelVersion:'gemini-x'}};
   return new Response(JSON.stringify(r.body),{status:r.status});}};
}
const post=(e,body,p='/mcp/'+TOKEN,h={})=>W.fetch(new Request('https://x.workers.dev'+p,{method:'POST',headers:{'Content-Type':'application/json',...h},body:JSON.stringify(body)}),e);
const call=(e,args)=>post(e,{jsonrpc:'2.0',id:9,method:'tools/call',params:{name:'ask_gemini',arguments:args}}).then(r=>r.json());

test('rejects a wrong or missing token, non-POST, and a missing config',async()=>{
 const e=env([]);
 assert.equal((await post(e,{jsonrpc:'2.0',id:1,method:'ping'},'/mcp/'+'x'.repeat(40))).status,401);
 assert.equal((await post(e,{jsonrpc:'2.0',id:1,method:'ping'},'/mcp')).status,401);
 assert.equal((await post(e,{jsonrpc:'2.0',id:1,method:'ping'},'/mcp',{Authorization:'Bearer '+TOKEN})).status,200);
 assert.equal((await W.fetch(new Request('https://x.workers.dev/mcp/'+TOKEN),e)).status,405);
 assert.equal((await post({...e,CLAUDE_MCP_TOKEN:'short'},{jsonrpc:'2.0',id:1,method:'ping'},'/mcp/short')).status,503);
 assert.equal((await post({...e,GEMINI_API_KEY:''},{jsonrpc:'2.0',id:1,method:'ping'})).status,503);
 assert.equal((await post(e,{jsonrpc:'2.0',id:1,method:'ping'},'/other')).status,404);
});
test('initialize, notifications and tools/list follow MCP',async()=>{
 const e=env([]);
 const init=await (await post(e,{jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'t',version:'1'}}})).json();
 assert.equal(init.result.serverInfo.name,'ask-gemini');assert.equal(init.result.protocolVersion,'2025-06-18');
 assert.equal((await post(e,{jsonrpc:'2.0',method:'notifications/initialized'})).status,202);
 const list=await (await post(e,{jsonrpc:'2.0',id:2,method:'tools/list'})).json();
 assert.deepEqual(list.result.tools.map(t=>t.name),['ask_gemini']);
 assert.deepEqual(list.result.tools[0].inputSchema.required,['prompt']);
 assert.equal((await (await post(e,{jsonrpc:'2.0',id:3,method:'nope'})).json()).error.code,-32601);
 assert.equal((await (await post(e,{jsonrpc:'2.0',id:4,method:'tools/call',params:{name:'other'}})).json()).error.code,-32602);
});
test('ask_gemini sends the prompt with the key in a header and returns the text',async()=>{
 const calls=[],e=env(calls);
 const out=await call(e,{prompt:'Write a haiku',system:'Answer in Thai',temperature:0.3,max_output_tokens:500});
 assert.equal(out.result.content[0].text,'Hello from Gemini');assert.ok(!out.result.isError);
 assert.equal(calls.length,1);const c=calls[0];
 assert.match(c.url,/\/models\/gemini-flash-latest:generateContent$/);assert.ok(!c.url.includes(KEY));
 assert.equal(c.init.headers['x-goog-api-key'],KEY);
 assert.equal(c.body.contents[0].parts[0].text,'Write a haiku');
 assert.equal(c.body.systemInstruction.parts[0].text,'Answer in Thai');
 assert.deepEqual(c.body.generationConfig,{temperature:0.3,maxOutputTokens:500});
 await call(e,{prompt:'x',model:'pro'});assert.match(calls[1].url,/gemini-pro-latest/);
 assert.equal(calls[1].body.generationConfig,undefined);assert.equal(calls[1].body.systemInstruction,undefined);
});
test('errors come back as tool errors without the key; an empty prompt is rejected',async()=>{
 const bad=await call(env([],{status:400,body:{error:{message:'API key not valid: '+KEY}}}),{prompt:'hi'});
 assert.equal(bad.result.isError,true);assert.match(bad.result.content[0].text,/Gemini HTTP 400/);
 assert.ok(!JSON.stringify(bad).includes(KEY));
 const blocked=await call(env([],{status:200,body:{promptFeedback:{blockReason:'SAFETY'}}}),{prompt:'hi'});
 assert.match(blocked.result.content[0].text,/no answer \(SAFETY\)/);
 const cut=await call(env([],{status:200,body:{candidates:[{content:{parts:[{text:'think',thought:true},{text:'part'}]},finishReason:'MAX_TOKENS'}]}}),{prompt:'hi'});
 assert.equal(cut.result.content[0].text,'part\n\n[Gemini stopped early: MAX_TOKENS]');
 const empty=await call(env([]),{prompt:'  '});assert.equal(empty.error.code,-32602);
});
