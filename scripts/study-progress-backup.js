/*
 * Read-only, user-triggered backup of Study OS / VocaBloom progress on one browser origin.
 * Never export sync credentials, unrelated localStorage keys, or IndexedDB planner data.
 * No import/restore or network behavior.
 */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StudyProgressBackup = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var VERSION = 1;
  var MAX_BYTES = 6 * 1024 * 1024;
  var COURSES = Object.freeze({
    acc: "acc-flashcards-v1",
    eco: "econ-flashcards-v1",
    math: "math-flashcards-v1",
    eng: "eng-vocab-v1",
    zh: "zh-vocab-v1"
  });
  var KEYS = Object.freeze(
    Object.keys(COURSES).flatMap(function (course) {
      var mark = COURSES[course];
      return ["study-" + course, mark + "-srs", mark + "-typ"];
    }).concat(["vocabloom_mvp_v1", "studyos.accounting.textbook.progress.v1"])
  );
  var ALLOWED = new Set(KEYS);

  function byteLength(str) {
    return new TextEncoder().encode(str).length;
  }

  function createSnapshot(storage, origin, at) {
    if (!storage || typeof storage.getItem !== "function") throw new Error("Safari storage is unavailable.");
    if (typeof origin !== "string" || !/^https?:\/\/[^/]+$/.test(origin))
      throw new Error("Invalid site origin.");
    var entries = Object.create(null);
    for (var i = 0; i < KEYS.length; i++) {
      var k = KEYS[i], value;
      try {
        value = storage.getItem(k);
      } catch (_) {
        throw new Error("Cannot read Safari storage. No backup was created.");
      }
      if (value !== null) {
        if (typeof value !== "string") throw new Error("Invalid progress data type.");
        entries[k] = value;
      }
    }
    if (Object.keys(entries).length === 0)
      throw new Error("No saved learning progress was found on this browser origin.");
    var timestamp = at instanceof Date ? at : new Date();
    if (!Number.isFinite(timestamp.getTime())) throw new Error("Invalid backup date.");
    var payload = {
      format: "study-os-progress-local-backup",
      version: VERSION,
      origin: origin,
      createdAt: timestamp.toISOString(),
      entries: entries
    };
    var text = JSON.stringify(payload, null, 2);
    if (byteLength(text) > MAX_BYTES) throw new Error("Backup exceeds the 6 MB safety limit.");
    return text;
  }

  function inspectSnapshot(text, currentOrigin) {
    if (typeof text !== "string" || byteLength(text) > MAX_BYTES)
      throw new Error("Not a supported backup file (maximum 6 MB).");
    var value;
    try { value = JSON.parse(text); }
    catch (_) { throw new Error("Backup is not valid JSON."); }
    if (!value || Array.isArray(value) || typeof value !== "object" ||
        value.format !== "study-os-progress-local-backup" || value.version !== VERSION)
      throw new Error("Unrecognized backup format or version.");
    if (typeof value.origin !== "string" || !/^https?:\/\/[^/]+$/.test(value.origin) ||
        (currentOrigin && currentOrigin !== value.origin))
      throw new Error("This backup belongs to a different site origin.");
    if (typeof value.createdAt !== "string" || !Number.isFinite(Date.parse(value.createdAt)))
      throw new Error("Invalid backup timestamp.");
    if (!value.entries || typeof value.entries !== "object" || Array.isArray(value.entries))
      throw new Error("Backup entries are missing.");
    var names = Object.keys(value.entries);
    if (!names.length || names.some(function (k) {
      return !ALLOWED.has(k) || typeof value.entries[k] !== "string";
    })) throw new Error("Backup contains unexpected or malformed keys.");
    return { count: names.length, keys: names, origin: value.origin, createdAt: value.createdAt };
  }

  return { VERSION: VERSION, MAX_BYTES: MAX_BYTES, keys: KEYS.slice(), createSnapshot: createSnapshot,
    inspectSnapshot: inspectSnapshot };
});
