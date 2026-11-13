'use strict';
// Read-only linguistic screening. Similarity is NOT a reason to block a question automatically.
const fs=require('node:fs');
const path=require('node:path');
function thaiMeaning(back){
 const text=String(back||'').replace(/\*\*/g,'').trim();
 if(text.includes('|')){
  const parts=text.split('|').map(x=>x.trim());
  return /[\u0E00-\u0E7F]/.test(parts[0])?parts[0]:/[\u0E00-\u0E7F]/.test(parts[1]||'')?parts[1]:'';
 }
 const first=text.split(/\r?\n/)[0]||'';
 const candidate=first.replace(/^[^\n—–:]{1,35}\s*[—–:]\s*/,'').replace(/^(?:ชนิดคำ|ตัวอย่าง)\s*:.*/,'').trim();
 return /[\u0E00-\u0E7F]/.test(candidate)?candidate:'';
}
function reviewKey(value){
 return String(value||'').normalize('NFKC').toLowerCase().replace(/[\u200B-\u200D\uFEFF\s,;，；、\/]/g,'').replace(/[()（）]/g,'');
}
function bigrams(text){
 const set=new Set();
 for(let i=0;i<text.length-1;i++)set.add(text.slice(i,i+2));
 return set;
}
function audit(rows){
 if(!Array.isArray(rows))throw new TypeError('Expected source rows');
 const terms=rows.filter(r=>r&&r.Subject==='English Vocab'&&r.Status==='Verified').map(r=>({
  word:String(r.Front||''),meaning:thaiMeaning(r.Back)
 })).filter(r=>r.word&&r.meaning).map(r=>({...r,key:reviewKey(r.meaning)}))
  .filter(r=>r.key).sort((a,b)=>a.word.localeCompare(b.word,'en'));
 for(const t of terms)t.grams=bigrams(t.key);
 const pairs=[];
 for(let i=0;i<terms.length;i++)for(let j=i+1;j<terms.length;j++){
  const a=terms[i],b=terms[j];
  if(a.key===b.key||Math.min(a.key.length,b.key.length)<4)continue;
  let shared=0;for(const x of a.grams)if(b.grams.has(x))shared++;
  const similarity=shared/(a.grams.size+b.grams.size-shared||1);
  const substring=a.key.includes(b.key)||b.key.includes(a.key);
  if((substring&&Math.min(a.key.length,b.key.length)>=5)||(similarity>=0.72&&shared>=3)){
   pairs.push({wordA:a.word,wordB:b.word,meaningA:a.meaning,meaningB:b.meaning,substring,similarity:Number(similarity.toFixed(3))});
  }
 }
 pairs.sort((a,b)=>Number(b.substring)-Number(a.substring)||b.similarity-a.similarity||a.wordA.localeCompare(b.wordA,'en')||a.wordB.localeCompare(b.wordB,'en'));
 return {verifiedTerms:terms.length,flaggedPairs:pairs.length,warning:'Review candidates only; do not automatically reject distractors or change Verified translations.',pairs};
}
if(require.main===module){
 const file=path.resolve(__dirname,'../../data/cards.json');
 const source=JSON.parse(fs.readFileSync(file,'utf8'));
 const report=audit(source.rows);
 const pairs=process.argv.includes('--all')?report.pairs:report.pairs.slice(0,20);
 process.stdout.write(JSON.stringify({...report,pairs},null,2)+'\n');
}
module.exports={audit,thaiMeaning,reviewKey};
