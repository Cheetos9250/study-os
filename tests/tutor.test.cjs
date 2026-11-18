/* AI tutor (tutor.html + scripts/study-tutor.js): Gemini or any OpenAI-compatible API (Hermes), key on this device only. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const A=require('../scripts/study-tutor.js'),R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('settings keep the key per provider, drop junk and refuse non-https base URLs',()=>{
  const c=A.normalize({provider:'openai',openai:{base:'http://evil.example/v1',model:'',key:' k1 '},gemini:{key:'g'},x:1});
  assert.equal(c.provider,'openai');assert.equal(c.openai.base,A.PROVIDERS.openai.base);assert.equal(c.openai.model,'nousresearch/hermes-4-70b');
  assert.equal(c.openai.key,'k1');assert.equal(c.gemini.key,'g');assert.equal(c.x,undefined);assert.equal(c.remember,true);
  assert.equal(A.normalize({}).provider,'gemini');assert.equal(A.baseUrl('https://openrouter.ai/api/v1/'),'https://openrouter.ai/api/v1');
});
test('Gemini request: key in a header (never the URL), system prompt, photo as inline data',()=>{
  const c=A.normalize({gemini:{key:'SECRET'}});
  const r=A.request(c,'SYS',[{role:'user',text:'hi',image:{mime:'image/jpeg',data:'AAAA'}},{role:'assistant',text:'yo'}]);
  assert.match(r.url,/^https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-2\.5-flash:generateContent$/);
  assert.doesNotMatch(r.url,/SECRET/);assert.equal(r.init.headers['x-goog-api-key'],'SECRET');
  const b=JSON.parse(r.init.body);assert.equal(b.systemInstruction.parts[0].text,'SYS');
  assert.deepEqual(b.contents.map(x=>x.role),['user','model']);assert.equal(b.contents[0].parts[0].inline_data.data,'AAAA');
  assert.equal(A.reply('gemini',200,{candidates:[{content:{parts:[{text:'A'},{text:'B'}]}}]}),'AB');
  assert.throws(()=>A.reply('gemini',429,{error:{message:'quota'}}),/429: quota\. Rate limit/);
  assert.throws(()=>A.request(A.normalize({}),'S',[]),/API key/);
});
test('Hermes / OpenAI-compatible request: bearer key, system message first, reasoning tags removed',()=>{
  const c=A.normalize({provider:'openai',openai:{key:'K',base:'https://openrouter.ai/api/v1'}});
  const r=A.request(c,'SYS',[{role:'user',text:'q'}]);
  assert.equal(r.url,'https://openrouter.ai/api/v1/chat/completions');assert.equal(r.init.headers.Authorization,'Bearer K');
  const b=JSON.parse(r.init.body);assert.equal(b.model,'nousresearch/hermes-4-70b');assert.deepEqual(b.messages.map(m=>m.role),['system','user']);
  assert.equal(A.reply('openai',200,{choices:[{message:{content:'<think>x</think>\nAnswer'}}]}),'Answer');
  assert.deepEqual(A.models('openai',{data:[{id:'nousresearch/hermes-4-405b'}]}),['nousresearch/hermes-4-405b']);
  assert.deepEqual(A.models('gemini',{models:[{name:'models/gemini-x',supportedGenerationMethods:['generateContent']},{name:'models/emb',supportedGenerationMethods:['embedContent']}]}),['gemini-x']);
});
test('course notes come from the chosen chapter and stay short',()=>{
  const T=require('../scripts/study-today.js'),D=T.parseCourseData(R('data/courses/acc.js'));
  const n=A.notes(D,'c5');assert.ok(n.length>100&&n.length<=9000);assert.match(n,/05 Merchandising/);assert.doesNotMatch(n,/01 Business/);
  const s=A.system({course:'Accounting',chapter:'05',notes:n});assert.match(s,/Debit \| Credit/);assert.match(s,/Thai or English/);
});
test('the page keeps the key out of backups, links and the repo',()=>{
  const h=R('tutor.html');
  assert.match(h,/scripts\/study-tutor\.js/);assert.match(h,/type="password" id="key"/);assert.match(h,/not<\/b> backed up/);
  assert.doesNotMatch(h,/AIza[0-9A-Za-z_-]{20,}|sk-or-[0-9a-z-]{20,}/);
  assert.doesNotMatch(R('scripts/study-progress-backup.js'),/studyos\.tutor/);
  assert.match(R('scripts/study-nav.js'),/\{href:'tutor\.html',label:'AI tutor',icon:'tutor'\}/);
  assert.doesNotMatch(h,/location\.(hash|search)[^;]*key/i);
});
