/* Personal anime/vocabulary pictures. Local browser-only IndexedDB; NEVER upload to Notion, GitHub or sync. */
(function(root){
'use strict';
const DB_NAME='vocabloom-private-word-images-v1',STORE='images',MAX_BYTES=2*1024*1024;
const TYPES=new Set(['image/png','image/jpeg','image/webp']);
const urls=new Map(); // Local object URLs; never serialized into progress or backups.
let dbRequest=null,pendingWord='',observer=null,scheduled=false;
function keyFor(word){return 'en:'+String(word||'').normalize('NFKC').toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/\s+/g,' ').trim();}
async function validateImage(file){
 if(!file||!TYPES.has(file.type)||file.size<1||file.size>MAX_BYTES)throw Error('เลือกภาพ PNG, JPEG หรือ WebP ขนาดไม่เกิน 2 MB');
 const a=new Uint8Array(await file.slice(0,12).arrayBuffer());
 const png=a.length>=8&&[137,80,78,71,13,10,26,10].every((v,i)=>a[i]===v);
 const jpg=a.length>=3&&a[0]===255&&a[1]===216&&a[2]===255;
 const webp=a.length>=12&&String.fromCharCode(...a.slice(0,4))==='RIFF'&&String.fromCharCode(...a.slice(8,12))==='WEBP';
 if(!(file.type==='image/png'&&png||file.type==='image/jpeg'&&jpg||file.type==='image/webp'&&webp))throw Error('ไฟล์ภาพไม่ตรงกับประเภทที่เลือก');
 return true;
}
function db(){
 if(!dbRequest)dbRequest=new Promise((resolve,reject)=>{
  if(!root.indexedDB){reject(Error('เบราว์เซอร์นี้ไม่รองรับการเก็บภาพส่วนตัว'));return;}
  const request=root.indexedDB.open(DB_NAME,1);
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE);};
  request.onsuccess=()=>{const database=request.result;database.onversionchange=()=>database.close();resolve(database);};
  request.onerror=()=>reject(request.error||Error('เปิดที่เก็บภาพไม่สำเร็จ'));
 }).catch(e=>{dbRequest=null;throw e;});
 return dbRequest;
}
async function read(word){
 const database=await db(),key=keyFor(word);
 return new Promise((resolve,reject)=>{
  const request=database.transaction(STORE,'readonly').objectStore(STORE).get(key);
  request.onsuccess=()=>resolve(request.result||null);
  request.onerror=()=>reject(request.error||Error('อ่านภาพไม่สำเร็จ'));
 });
}
async function write(word,file){
 await validateImage(file);
 if(!keyFor(word).slice(3))throw Error('ไม่พบคำศัพท์');
 const database=await db(),key=keyFor(word);
 await new Promise((resolve,reject)=>{
  const tx=database.transaction(STORE,'readwrite');
  tx.objectStore(STORE).put(file,key);
  tx.oncomplete=resolve;
  tx.onerror=()=>reject(tx.error||Error('บันทึกภาพไม่สำเร็จ'));
  tx.onabort=()=>reject(tx.error||Error('พื้นที่เก็บภาพไม่เพียงพอ'));
 });
 clearCache(key);
}
async function remove(word){
 const database=await db(),key=keyFor(word);
 await new Promise((resolve,reject)=>{
  const tx=database.transaction(STORE,'readwrite');
  tx.objectStore(STORE).delete(key);
  tx.oncomplete=resolve;
  tx.onerror=()=>reject(tx.error||Error('ลบภาพไม่สำเร็จ'));
 });
 clearCache(key);
}
function clearCache(key){
 if(urls.has(key)){
  const url=urls.get(key);
  if(typeof url==='string')root.URL.revokeObjectURL(url);
  urls.delete(key);
 }
}
async function localUrl(word){
 const key=keyFor(word);
 if(urls.has(key))return urls.get(key);
 const request=read(word).then(blob=>{
  const url=blob?root.URL.createObjectURL(blob):null;
  urls.set(key,url);
  return url;
 }).catch(()=>{urls.delete(key);return null;});
 urls.set(key,request);
 return request;
}
function hydrateNode(node){
 if(node.dataset.privateImageState)return;
 node.dataset.privateImageState='loading';
 const word=node.dataset.privateWordImage;
 localUrl(word).then(url=>{
  if(!node.isConnected)return;
  node.dataset.privateImageState=url?'ready':'missing';
  const parent=node.closest('.word-row,.panel,.game-play-card,.lesson-card')||node.parentElement;
  if(parent)parent.querySelectorAll('[data-private-image-remove]').forEach(button=>{if(keyFor(button.dataset.privateImageRemove)===keyFor(word))button.hidden=!url;});
  if(!url)return;
  const image=document.createElement('img');
  image.alt=''; // The surrounding flashcard/word already contains readable vocabulary.
  image.loading='lazy';image.decoding='async';image.src=url;image.className='voca-private-img';
  node.replaceChildren(image);
  node.classList.add('has-private-image');
 });
}
function hydrate(){
 const main=document.getElementById('mainContent');
 if(!main)return;
 main.querySelectorAll('[data-private-word-image]:not([data-private-image-state])').forEach(node=>{
  // Hidden placeholders never intersect: populate card/lesson images directly.
  if(node.classList.contains('voca-integrated-photo')||node.classList.contains('voca-personal-lesson'))hydrateNode(node);
  else if(root.IntersectionObserver){
   if(!observer)observer=new root.IntersectionObserver(entries=>{
    for(const entry of entries)if(entry.isIntersecting){observer.unobserve(entry.target);hydrateNode(entry.target);}
   },{rootMargin:'240px'});
   observer.observe(node);
  }else hydrateNode(node);
 });
}
function schedule(){
 if(scheduled)return;
 scheduled=true;
 Promise.resolve().then(()=>{scheduled=false;hydrate();});
}
function notice(message){
 if(typeof root.toast==='function')root.toast(message);
 else if(typeof root.alert==='function')root.alert(message);
}
function repaint(){if(typeof root.render==='function')root.render();else schedule();}
function install(){
 if(typeof document==='undefined')return;
 const picker=document.createElement('input');
 picker.id='voca-private-image-picker';picker.type='file';picker.accept='image/png,image/jpeg,image/webp';picker.hidden=true;
 document.body.appendChild(picker);
 document.addEventListener('click',event=>{
  const add=event.target.closest('[data-private-image-pick]');
  const del=event.target.closest('[data-private-image-remove]');
  if(!add&&!del)return;
  event.preventDefault();event.stopPropagation();
  const word=(add?add.dataset.privateImagePick:del.dataset.privateImageRemove)||'';
  if(!word)return;
  if(add){pendingWord=word;picker.value='';picker.click();return;}
  if(typeof root.confirm==='function'&&!root.confirm('ลบเฉพาะภาพส่วนตัวของคำนี้ออกจากอุปกรณ์?'))return;
  remove(word).then(()=>{repaint();notice('ลบภาพส่วนตัวแล้ว');}).catch(e=>notice(e.message));
 },true);
 picker.addEventListener('change',async()=>{
  const file=picker.files?.[0],word=pendingWord;pendingWord='';
  if(!file||!word)return;
  try{await write(word,file);repaint();notice('บันทึกภาพส่วนตัวบนอุปกรณ์นี้แล้ว');}catch(e){notice(e.message);}
 });
 const main=document.getElementById('mainContent');
 if(main&&root.MutationObserver){new root.MutationObserver(schedule).observe(main,{childList:true,subtree:true});}
 hydrate();
}
const api={keyFor,validateImage,read,write,remove,hydrate};
root.VocaPersonalImages=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document!=='undefined')install();
})(typeof window!=='undefined'?window:globalThis);
