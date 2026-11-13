"use strict";
(() => {
// Isolated IndexedDB course presentation store; never opens planner or legacy progress databases.
const {normalizeMetadata,defaultMetadata} = typeof module !== "undefined" && module.exports ? require("./study-os-course-metadata.js") : globalThis.StudyOSCourseMetadata;
const DATABASE="study-os-course-metadata-v1", STORE="settings", KEY="academic";
class ConflictError extends Error {constructor(){super("course metadata changed in another tab");this.name="ConflictError";}}
function requestResult(request) {
  return new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
}
function transactionDone(tx) {
  return new Promise((resolve,reject)=>{
    tx.oncomplete=()=>resolve();
    tx.onabort=()=>reject(tx.error || new Error("transaction aborted"));
    tx.onerror=()=>reject(tx.error || new Error("transaction failed"));
  });
}
async function openCourseMetadata(factory) {
  if (!factory || typeof factory.open!=="function") throw new TypeError("IndexedDB unavailable");
  const opening=factory.open(DATABASE,1);
  opening.onupgradeneeded=()=>{
    const db=opening.result;
    if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
  };
  const db=await requestResult(opening);
  const read=async()=>{
    const tx=db.transaction(STORE,"readonly");
    const record=await requestResult(tx.objectStore(STORE).get(KEY));
    await transactionDone(tx);
    if (record===undefined) return {revision:0,metadata:defaultMetadata()};
    if (!record || typeof record!=="object" || Array.isArray(record) || !Number.isSafeInteger(record.revision) || record.revision<1) throw new TypeError("corrupt metadata record");
    return {revision:record.revision,metadata:normalizeMetadata(record.metadata)};
  };
  const save=async(metadata,expectedRevision)=>{
    const normalized=normalizeMetadata(metadata);
    if (!Number.isSafeInteger(expectedRevision)||expectedRevision<0) throw new TypeError("invalid expected revision");
    const tx=db.transaction(STORE,"readwrite");
    const done=transactionDone(tx);
    try {
      const store=tx.objectStore(STORE);
      const existing=await requestResult(store.get(KEY));
      const exists=existing!==undefined;
      if (exists && (!existing || typeof existing!=="object" || Array.isArray(existing) || !Number.isSafeInteger(existing.revision) || existing.revision<1)) throw new TypeError("corrupt metadata record");
      if (exists) normalizeMetadata(existing.metadata);
      const revision=exists ? existing.revision : 0;
      if (revision!==expectedRevision) throw new ConflictError();
      await requestResult(store.put({revision:revision+1,metadata:normalized},KEY));
    } catch(error) {
      tx.abort();
      await done.catch(()=>{});
      throw error;
    }
    await done;
    return {revision:expectedRevision+1,metadata:normalized};
  };
  const reset=async(expectedRevision)=>save(defaultMetadata(),expectedRevision);
  const importBackup=async(backup,expectedRevision)=>save(normalizeMetadata(backup),expectedRevision);
  const exportBackup=async()=> (await read()).metadata;
  return {read,save,reset,importBackup,exportBackup,close:()=>db.close()};
}
const metadataStoreApi={openCourseMetadata,ConflictError,DATABASE};
if (typeof module !== "undefined" && module.exports) module.exports=metadataStoreApi;
if (typeof globalThis !== "undefined") globalThis.StudyOSCourseMetadataStore=metadataStoreApi;
})();
