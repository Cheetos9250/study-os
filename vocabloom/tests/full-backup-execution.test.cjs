'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../unified-progress.js'),'utf8');
const decks=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../study-decks.json'),'utf8')).decks;
function extract(a,b){const i=src.indexOf(a),j=src.indexOf(b,i+a.length);assert.ok(i>=0&&j>i);return src.slice(i,j)}
const fnCode=extract('function cFullBackup(){','async function cToggleAuto(){');
async function backup(){
 const secret='SENSITIVE_FAKE_SYNC_KEY_DO_NOT_EXPORT';
 const store=new Map([['study-sync-key',secret]]);
 for(const d of decks){store.set('study-'+d.key,JSON.stringify({ans:{[d.key+'-answer']:true}}));store.set(d.markKey+'-srs',JSON.stringify({s:{[d.key+'-card']:{due:10}},m:{day:1,newDone:1}}));}
 const clicks=[],created=[],revoked=[],notifications=[];
 const document={createElement:()=>({click(){clicks.push(this.download)},remove(){}}),body:{append(){}}};
 const ctx={USTATE:{decks},CLOCAL:{device:'fake-device',days:{day:{answered:1}},studyDays:{day:{answered:2}}},data:{progress:{eng:{score:1}},days:{},custom:[],settings:{}},Blob,Date,document,URL:{createObjectURL:blob=>{created.push(blob);return 'blob:fake'},revokeObjectURL:u=>revoked.push(u)},setTimeout:fn=>fn(),cDate:()=> '2026-11-13',cSafeJSON:(key,fallback)=>{try{return JSON.parse(store.get(key))}catch{return fallback}},cCloudNotice:msg=>notifications.push(msg),structuredClone};
 new Function('ctx',`with(ctx){${fnCode};cFullBackup()}`)(ctx);
 return {clicks,created,revoked,notifications,secret,store};
}
test('Full backup exports every legacy subject and omits credential',async()=>{
 const result=await backup();assert.equal(result.clicks.length,1);assert.equal(result.created.length,1);
 const json=await result.created[0].text(),payload=JSON.parse(json);
 assert.ok(!json.includes(result.secret));assert.equal(payload.type,'vocabloom-unified-study-backup');assert.equal(payload.version,1);
 assert.deepEqual(Object.keys(payload.subjects).sort(),decks.flatMap(d=>['study-'+d.key,d.markKey+'-srs']).sort());
 for(const d of decks){assert.equal(payload.subjects['study-'+d.key].ans[d.key+'-answer'],true);assert.ok(payload.subjects[d.markKey+'-srs'].s[d.key+'-card']);}
 assert.deepEqual(result.clicks,['vocabloom-full-backup-2026-11-13.json']);
 assert.deepEqual(result.revoked,['blob:fake']);
});
