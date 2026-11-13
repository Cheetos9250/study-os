"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const backup = require("../scripts/study-progress-backup.js");
const recovery = require("../scripts/study-progress-restore.js");

const ORIGIN = "https://cheetos9250.github.io";
const ACC = JSON.stringify({ known: ["01-1"], ans: { "01-1": true } });
const SRS = JSON.stringify({ s: { "01-1": { due: 1 } }, m: { day: 1, newDone: 0 }, lim: 20 });
const VOC = JSON.stringify({ progress: { cat: { seen: true } }, days: {}, custom: [], notion: [], settings: { goal: 10 } });
const ENTRIES = { "study-acc": ACC, "acc-flashcards-v1-srs": SRS, "acc-flashcards-v1-typ": "1", "vocabloom_mvp_v1": VOC };

function createStorage(initial = {}, errorOnSet = null) {
  const db = new Map(Object.entries(initial));
  let writes = 0, deletes = 0;
  return {
    getItem: key => db.has(key) ? db.get(key) : null,
    setItem(key, value) {
      if (key === errorOnSet) throw Error("QuotaExceededError");
      db.set(key, String(value));
      writes++;
    },
    removeItem(key) { db.delete(key); deletes++; },
    snapshot: () => Object.fromEntries(db.entries()),
    counts: () => ({ writes, deletes })
  };
}
function snapshot(data = ENTRIES) {
  const obj = {
    getItem: key => Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null
  };
  return backup.createSnapshot(obj, ORIGIN, new Date("2026-11-13T09:00:00Z"));
}

test("preview is read-only and reports missing, identical, and conflict counts", () => {
  const storage = createStorage({ "study-acc": ACC, "vocabloom_mvp_v1": "different" });
  const result = recovery.plan(storage, snapshot(), ORIGIN);
  assert.deepEqual(result.missing, ["acc-flashcards-v1-srs", "acc-flashcards-v1-typ"]);
  assert.deepEqual(result.identical, ["study-acc"]);
  assert.deepEqual(result.conflicts, ["vocabloom_mvp_v1"]);
  assert.deepEqual(storage.counts(), { writes: 0, deletes: 0 });
});

test("restores only missing keys and leaves unrelated data and identical history untouched", () => {
  const storage = createStorage({ "study-acc": ACC, "study-sync-key": "KEEP_SECRET", "unrelated": "KEEP" });
  assert.deepEqual(recovery.restoreMissing(storage, snapshot(), ORIGIN), { restored: 3, alreadyPresent: 1 });
  assert.deepEqual(storage.counts(), { writes: 3, deletes: 0 });
  assert.equal(storage.getItem("study-sync-key"), "KEEP_SECRET");
  assert.equal(storage.getItem("unrelated"), "KEEP");
  assert.equal(storage.getItem("vocabloom_mvp_v1"), VOC);
  assert.equal(storage.getItem("study-acc"), ACC);
});

test("conflicting saved learning data refuses all writes", () => {
  const storage = createStorage({ "study-acc": "different", "study-sync-key": "DON'T TOUCH" });
  assert.throws(() => recovery.restoreMissing(storage, snapshot(), ORIGIN), /Refusing to overwrite/);
  assert.deepEqual(storage.counts(), { writes: 0, deletes: 0 });
  assert.equal(storage.getItem("study-sync-key"), "DON'T TOUCH");
});

test("quota failure rolls back keys newly added by this restore", () => {
  const storage = createStorage({ "other": "existing" }, "acc-flashcards-v1-typ");
  assert.throws(() => recovery.restoreMissing(storage, snapshot(), ORIGIN), /attempted rollback/);
  assert.deepEqual(storage.snapshot(), { other: "existing" });
});

test("no keys are changed if the backup is from a different origin", () => {
  const storage = createStorage({});
  assert.throws(() => recovery.restoreMissing(storage, snapshot(), "https://other.example"), /different site origin/);
  assert.deepEqual(storage.counts(), { writes: 0, deletes: 0 });
});

test("rejects corrupt subject history without changing storage", () => {
  const storage = createStorage({});
  const malformed = snapshot({ "study-acc": "{broken" });
  assert.throws(() => recovery.restoreMissing(storage, malformed, ORIGIN), /Malformed learning-progress/);
  assert.deepEqual(storage.counts(), { writes: 0, deletes: 0 });
});

test("rejects unsupported or maliciously added keys before any write", () => {
  const storage = createStorage({});
  const malicious = JSON.parse(snapshot());
  malicious.entries["study-sync-key"] = "secret";
  assert.throws(() => recovery.restoreMissing(storage, JSON.stringify(malicious), ORIGIN), /unexpected or malformed keys/);
  assert.deepEqual(storage.counts(), { writes: 0, deletes: 0 });
});

test("invalid SRS, vocab and preference values are rejected", () => {
  for (const entries of [
    { "acc-flashcards-v1-srs": "{}" },
    { "vocabloom_mvp_v1": '{"progress":[]}' },
    { "acc-flashcards-v1-typ": "true" }
  ]) {
    const storage = createStorage({});
    assert.throws(() => recovery.restoreMissing(storage, snapshot(entries), ORIGIN), /Invalid/);
    assert.deepEqual(storage.counts(), { writes: 0, deletes: 0 });
  }
});

test("restoring a second time is idempotent and makes no additional writes", () => {
  const storage = createStorage({});
  recovery.restoreMissing(storage, snapshot(), ORIGIN);
  const first = storage.counts().writes;
  assert.deepEqual(recovery.restoreMissing(storage, snapshot(), ORIGIN), { restored: 0, alreadyPresent: 4 });
  assert.equal(storage.counts().writes, first);
});

test("a key arriving after preview is refused without overwrite", () => {
  const storage=createStorage();const read=storage.getItem;let reads=0;
  storage.getItem=key=>{if(key==='study-acc'&&++reads===2)storage.setItem(key,'OTHER-TAB');return read(key);};
  assert.throws(()=>recovery.restoreMissing(storage,snapshot(),ORIGIN),/did not complete/);
  assert.deepEqual(storage.snapshot(),{'study-acc':'OTHER-TAB'});
});

test("a provider that writes then throws rolls back its newly written keys", () => {
  const storage=createStorage();const write=storage.setItem;
  storage.setItem=(key,value)=>{write(key,value);if(key==='acc-flashcards-v1-srs')throw Error('write then throw');};
  assert.throws(()=>recovery.restoreMissing(storage,snapshot(),ORIGIN),/attempted rollback/);
  assert.deepEqual(storage.snapshot(),{});
});

test("rollback preserves an added key subsequently changed by another tab", () => {
  const storage=createStorage();const write=storage.setItem;
  storage.setItem=(key,value)=>{if(key==='acc-flashcards-v1-srs'){write('study-acc','OTHER-TAB');throw Error('failure');}write(key,value);};
  assert.throws(()=>recovery.restoreMissing(storage,snapshot(),ORIGIN),/attempted rollback/);
  assert.deepEqual(storage.snapshot(),{'study-acc':'OTHER-TAB'});
});
