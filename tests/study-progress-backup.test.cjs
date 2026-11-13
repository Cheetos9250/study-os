"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const backup = require("../scripts/study-progress-backup.js");

function storage(values, failKey) {
  return {
    getItem(key) {
      if (key === failKey) throw new Error("storage disabled");
      return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null;
    }
  };
}
const origin = "https://cheetos9250.github.io";
const timestamp = new Date("2026-11-13T09:00:00Z");

test("backups include only explicit learning keys, not sync credentials", () => {
  const input = {
    "study-acc": '{"known":["01-1"],"ans":{"01-1":true}}',
    "acc-flashcards-v1-srs": '{"s":{"01-1":{"due":123}}}',
    "econ-flashcards-v1-srs": '{"s":{}}',
    "vocabloom_mvp_v1": '{"progress":{"hello":{"seen":true}}}',
    "study-sync-key": "SECRET_SHOULD_NOT_EXPORT",
    "study-sync-progress-key-v1": "SECRET_SHOULD_NOT_EXPORT",
    "unrelated": "SECRET_SHOULD_NOT_EXPORT",
    "acc-flashcards-v1-ext": '[{"privateNote":"NOT_PROGRESS"}]'
  };
  const snapshot = backup.createSnapshot(storage(input), origin, timestamp);
  assert.deepEqual(backup.inspectSnapshot(snapshot, origin).keys, [
    "study-acc",
    "acc-flashcards-v1-srs",
    "econ-flashcards-v1-srs",
    "vocabloom_mvp_v1"
  ]);
  assert.ok(!snapshot.includes("SECRET_SHOULD_NOT_EXPORT"));
  assert.ok(!snapshot.includes("NOT_PROGRESS"));
  assert.equal(JSON.parse(snapshot).createdAt, timestamp.toISOString());
});

test("supports all five independent subject progress keys", () => {
  const input = Object.fromEntries(["acc", "eco", "math", "eng", "zh"].map(k => ["study-" + k, "{}"]));
  const snapshot = backup.createSnapshot(storage(input), origin, timestamp);
  assert.equal(backup.inspectSnapshot(snapshot, origin).count, 5);
});

test("does not silently create an empty backup when Safari data is unavailable", () => {
  assert.throws(() => backup.createSnapshot(storage({}), origin, timestamp), /No saved learning progress/);
  assert.throws(() => backup.createSnapshot(storage({ "study-acc": "{}" }, "study-acc"), origin, timestamp), /Cannot read/);
});

test("preserves corrupt raw progress bytes instead of erasing data", () => {
  const snapshot = backup.createSnapshot(storage({ "study-acc": "{broken json" }), origin, timestamp);
  assert.equal(JSON.parse(snapshot).entries["study-acc"], "{broken json");
});

test("rejects tampered or incompatible files without importing", () => {
  const good = backup.createSnapshot(storage({ "study-acc": "{}" }), origin, timestamp);
  assert.throws(() => backup.inspectSnapshot("{not-json", origin), /valid JSON/);
  assert.throws(() => backup.inspectSnapshot(good, "https://other.example"), /different site origin/);
  const unknownKey = JSON.parse(good);
  unknownKey.entries["study-sync-key"] = "secret";
  assert.throws(() => backup.inspectSnapshot(JSON.stringify(unknownKey), origin), /unexpected or malformed keys/);
  const wrongVersion = JSON.parse(good);
  wrongVersion.version = 2;
  assert.throws(() => backup.inspectSnapshot(JSON.stringify(wrongVersion), origin), /format or version/);
});

test("enforces maximum data size before download", () => {
  assert.throws(() => backup.createSnapshot(storage({ "study-acc": "a".repeat(backup.MAX_BYTES) }), origin, timestamp), /6 MB/);
});

test("backup core never writes to browser storage", () => {
  const store = {
    getItem(k) { return k === "study-acc" ? "{}" : null; },
    setItem() { throw new Error("unexpected write"); },
    removeItem() { throw new Error("unexpected deletion"); }
  };
  assert.doesNotThrow(() => backup.createSnapshot(store, origin, timestamp));
});

test("textbook answers join the main backup without PDF caches or credentials", () => {
  const key='studyos.accounting.textbook.progress.v1';
  const raw=JSON.stringify({'QS 1-1':{notes:'Dr Cash / Cr Capital\nคำตอบส่วนตัว',status:'doing',updated:'2026-11-13T14:00:00Z'}});
  const text=backup.createSnapshot(storage({[key]:raw,'study-sync-key':'EXCLUDE_SECRET','studyos-accounting-pdf-v1':'EXCLUDE_PDF'}),origin,timestamp);
  assert.equal(JSON.parse(text).entries[key],raw);
  assert.deepEqual(backup.inspectSnapshot(text,origin).keys,[key]);
  assert.doesNotMatch(text,/EXCLUDE_SECRET|EXCLUDE_PDF/);
});

test('comparison reads only allowed keys and never reveals raw answers or credentials',()=>{
 const raw='PRIVATE_ANSWER',text=backup.createSnapshot(storage({'study-acc':raw}),origin,timestamp),reads=[];
 const result=backup.compareSnapshot(text,{getItem(k){reads.push(k);assert.ok(backup.keys.includes(k));return k==='study-acc'?raw:null;},setItem(){throw Error('write');},removeItem(){throw Error('delete');}},origin);
 assert.equal(result.exactMatch,true);assert.deepEqual(result.matched,['study-acc']);
 assert.equal(reads.length,backup.keys.length);assert.doesNotMatch(JSON.stringify(result),/PRIVATE_ANSWER/);
});
test('comparison separates differing, local-only, backup-only and identical datasets',()=>{
 const text=backup.createSnapshot(storage({'study-acc':'old','study-eco':'same','study-zh':'from file'}),origin,timestamp);
 const r=backup.compareSnapshot(text,storage({'study-acc':'current','study-eco':'same','study-math':'current'}),origin);
 assert.equal(r.exactMatch,false);assert.deepEqual(r.different,['study-acc']);assert.deepEqual(r.matched,['study-eco']);assert.deepEqual(r.localOnly,['study-math']);assert.deepEqual(r.backupOnly,['study-zh']);
});
test('empty browser is not incorrectly called a matching backup',()=>{
 const text=backup.createSnapshot(storage({'studyos.accounting.textbook.progress.v1':'{}'}),origin,timestamp);
 const r=backup.compareSnapshot(text,storage({}),origin);assert.equal(r.exactMatch,false);assert.deepEqual(r.backupOnly,['studyos.accounting.textbook.progress.v1']);
 assert.equal(backup.labelForKey(r.backupOnly[0]),'Accounting textbook answers');
});
test('comparison fails closed on unreadable storage and validates files before reading storage',()=>{
 const text=backup.createSnapshot(storage({'study-acc':'{}'}),origin,timestamp);
 assert.throws(()=>backup.compareSnapshot(text,storage({},'study-acc'),origin),/Cannot read/);
 assert.throws(()=>backup.compareSnapshot(text,{getItem(){return 123;}},origin),/Invalid local/);
 assert.throws(()=>backup.compareSnapshot(text,null,origin),/unavailable/);
 assert.throws(()=>backup.compareSnapshot(text,{getItem(){throw Error('must not read');}},'https://other.example'),/different site origin/);
});
