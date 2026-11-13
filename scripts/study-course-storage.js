/* Local course save feedback and recovery. No network calls or credential access. */
(function(root,factory){
 'use strict';const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.StudyCourseStorage=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
 'use strict';
 const courses=Object.freeze({acc:'acc-flashcards-v1',eco:'econ-flashcards-v1',math:'math-flashcards-v1',eng:'eng-vocab-v1',zh:'zh-vocab-v1'});
 function courseKeys(course,mark){
  if(!Object.prototype.hasOwnProperty.call(courses,course)||courses[course]!==mark)throw Error('Unknown course storage configuration');
  return ['study-'+course,mark+'-srs',mark+'-typ'];
 }
 function createGuard(storage,keys,onChange){
  const permitted=new Set(Object.entries(courses).flatMap(([course,mark])=>courseKeys(course,mark)));
  if(!Array.isArray(keys)||!keys.length||keys.some(key=>!permitted.has(key)))throw Error('Invalid course progress configuration');
  const allowed=new Set(keys),pending=new Map();
  function notify(){if(onChange)onChange(pending.size);}
  function attempt(key,value){
   try{storage.setItem(key,value);pending.delete(key);return true;}
   catch{return false;}
  }
  return {
   write(key,value){
    if(!allowed.has(key)||typeof value!=='string')throw Error('Invalid course progress write');
    pending.set(key,value);const saved=attempt(key,value);notify();return saved;
   },
   retry(){for(const [key,value] of [...pending])attempt(key,value);notify();return pending.size===0;},
   hasPending(){return pending.size>0;},
   snapshot(backup,origin,at){
    try{return {text:backup.createSnapshot({getItem(key){return pending.has(key)?pending.get(key):storage.getItem(key);}},origin,at),partial:false};}
    catch(error){if(!pending.size)throw error;return {text:backup.createSnapshot({getItem:key=>pending.has(key)?pending.get(key):null},origin,at),partial:true};}
   }
  };
 }
 function forCourse(course,mark){
  const keys=courseKeys(course,mark);
  let panel=null,message=null,retry=null,download=null;
  function mount(){
   if(panel)return;
   panel=root.document.createElement('aside');panel.className='course-save-warning';panel.setAttribute('role','alert');panel.setAttribute('aria-live','polite');
   const title=root.document.createElement('strong');title.textContent='Unsaved learning progress';
   message=root.document.createElement('p');
   const actions=root.document.createElement('div');actions.className='course-save-actions';
   retry=root.document.createElement('button');retry.type='button';retry.textContent='Retry saving';retry.className='course-save-retry';
   download=root.document.createElement('button');download.type='button';download.textContent='Download unsaved backup';download.className='course-save-download';
   actions.append(retry,download);panel.append(title,message,actions);root.document.body.prepend(panel);
   retry.addEventListener('click',()=>{guard.retry();});
   download.addEventListener('click',()=>{
    try{
     if(!root.StudyProgressBackup)throw Error('Backup tools did not load. Keep this page open and retry.');
     const snapshot=guard.snapshot(root.StudyProgressBackup,root.location.origin,new Date());
     const text=snapshot.text;
     const url=root.URL.createObjectURL(new Blob([text],{type:'application/json'}));
     const a=root.document.createElement('a');a.href=url;a.download='study-os-unsaved-progress-'+new Date().toISOString().slice(0,10)+'.json';root.document.body.append(a);a.click();a.remove();root.setTimeout(()=>root.URL.revokeObjectURL(url),60000);
     message.textContent=(snapshot.partial?'Partial backup created with unsaved data only; other stored data could not be included.':'Backup created with your unsaved progress.')+' Save the file privately. Progress is still not saved in this browser; keep this page open and retry.';
    }catch(error){message.textContent='Cannot create backup: '+error.message;}
   });
  }
  const storage={getItem:key=>root.localStorage.getItem(key),setItem:(key,value)=>root.localStorage.setItem(key,value)};
  const guard=createGuard(storage,keys,count=>{
   if(count){mount();panel.hidden=false;message.textContent='This browser could not save '+count+' data set(s). Keep this page open. Retry saving or download a backup before leaving.';}
   else if(panel)panel.hidden=true;
  });
  root.addEventListener('beforeunload',event=>{if(guard.hasPending()){event.preventDefault();event.returnValue='';}});
  return guard;
 }
 return Object.freeze({courseKeys,createGuard,forCourse});
});
