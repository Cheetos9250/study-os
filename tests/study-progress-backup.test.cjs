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
