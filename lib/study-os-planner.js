(function(root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.StudyOSPlanner = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function() {
  "use strict";
  const SUBJECTS = Object.freeze({acc:"Accounting",eco:"Economics",math:"Mathematics"});
  const DB_NAME = "study-os-planner-v1";
  const STORE = "sessions";
  const isObject = value => value && typeof value === "object" && !Array.isArray(value);
  function validDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const time = Date.parse(value + "T00:00:00Z");
    return Number.isFinite(time) && new Date(time).toISOString().slice(0,10) === value;
  }
  function fields(input) {
    if (!isObject(input) || !Object.hasOwn(SUBJECTS,input.subject)) throw new TypeError("invalid subject");
    if (typeof input.title !== "string" || !input.title.trim() || input.title.trim().length > 160) throw new TypeError("invalid title");
    if (!validDate(input.date)) throw new TypeError("invalid date");
    if (!Number.isInteger(input.minutes) || input.minutes < 1 || input.minutes > 240) throw new TypeError("invalid minutes");
    return {subject:input.subject,title:input.title.trim(),date:input.date,minutes:input.minutes};
  }
  function validateSession(value) {
    if (!isObject(value) || value.schemaVersion !== 1 || typeof value.id !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(value.id)) throw new TypeError("invalid session identity/version");
    fields(value);
    if (typeof value.done !== "boolean" || !Number.isSafeInteger(value.revision) || value.revision < 1) throw new TypeError("invalid session revision/status");
    for (const key of ["createdAt","updatedAt"]) {
      if (!Number.isSafeInteger(value[key]) || value[key] < 0 || value[key] > 8640000000000000) throw new TypeError("invalid timestamp");
    }
    if (value.updatedAt < value.createdAt) throw new TypeError("invalid timestamp order");
    return value;
  }
  function createSession(input, id, now = Date.now()) {
    return Object.freeze(validateSession({schemaVersion:1,id,...fields(input),done:false,revision:1,createdAt:now,updatedAt:now}));
  }
  function reviseSession(previous, patch, expectedRevision, now = Date.now()) {
    validateSession(previous);
    if (previous.revision !== expectedRevision) {
      const error = new Error("session changed in another tab"); error.name = "ConflictError"; throw error;
    }
    if (!isObject(patch) || Object.keys(patch).some(key => !["subject","title","date","minutes","done"].includes(key))) throw new TypeError("invalid edit fields");
    const candidate = {...previous,...patch};
    return Object.freeze(validateSession({...candidate,...fields(candidate),revision:previous.revision+1,updatedAt:Math.max(now,previous.updatedAt)}));
  }
  function bangkokDate(time = Date.now()) {
    if (!Number.isFinite(time)) throw new TypeError("invalid time");
    return new Date(time + 7*60*60*1000).toISOString().slice(0,10);
  }
  function summarizeDate(sessions, date) {
    if (!Array.isArray(sessions) || !validDate(date)) throw new TypeError("invalid plan summary");
    const selected = sessions.map(validateSession).filter(item => item.date === date);
    return Object.freeze({count:selected.length,done:selected.filter(item => item.done).length,
      plannedMinutes:selected.reduce((sum,item) => sum+item.minutes,0),
      completedPlannedMinutes:selected.filter(item => item.done).reduce((sum,item) => sum+item.minutes,0)});
  }
  function openPlanner(factory) {
    return new Promise((resolve,reject) => {
      if (!factory || typeof factory.open !== "function") { reject(new Error("planner storage unavailable")); return; }
      let request;
      try { request = factory.open(DB_NAME,1); } catch(error) { reject(error); return; }
      let abandoned = false;
      request.onblocked = () => { abandoned = true; reject(new Error("planner database blocked")); };
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE,{keyPath:"id"});
      };
      request.onerror = () => reject(request.error || new Error("planner open failed"));
      request.onsuccess = () => {
        const db = request.result;
        if (abandoned) { db.close(); return; }
        db.onversionchange = () => db.close();
        function transact(mode, operation) {
          return new Promise((resolveTransaction,rejectTransaction) => {
            let tx, result, failure;
            const fail = error => { failure = error; try { tx.abort(); } catch { rejectTransaction(error); } };
            try {
              tx = db.transaction(STORE,mode);
              tx.oncomplete = () => resolveTransaction(result);
              tx.onabort = () => rejectTransaction(failure || tx.error || new Error("planner transaction aborted"));
              tx.onerror = () => { failure = failure || tx.error; };
              operation(tx.objectStore(STORE),value => { result = value; },fail);
            } catch(error) { if (tx) fail(error); else rejectTransaction(error); }
          });
        }
        resolve(Object.freeze({
          close: () => db.close(),
          list: () => transact("readonly",(store,done,fail) => {
            const query = store.getAll();
            query.onsuccess = () => { try { done(query.result.map(validateSession).sort((a,b) => a.date.localeCompare(b.date) || a.createdAt-b.createdAt || a.id.localeCompare(b.id))); } catch(error) { fail(error); } };
          }),
          add: (input,id,now = Date.now()) => {
            let record;
            try { record = createSession(input,id,now); } catch(error) { return Promise.reject(error); }
            return transact("readwrite",(store,done) => { store.add(record); done(record); });
          },
          update: (id,patch,revision,now = Date.now()) => transact("readwrite",(store,done,fail) => {
            const query = store.get(id);
            query.onsuccess = () => {
              try {
                const next = reviseSession(query.result,patch,revision,now);
                store.put(next); done(next);
              } catch(error) { fail(error); }
            };
          }),
        }));
      };
    });
  }
  return Object.freeze({SUBJECTS,DB_NAME,STORE,validDate,validateSession,createSession,reviseSession,bangkokDate,summarizeDate,openPlanner});
});
