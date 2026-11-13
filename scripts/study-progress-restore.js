/*
 * Explicit, additive-only Safari progress recovery.
 * Builds on scripts/study-progress-backup.js. No automatic import or remote calls.
 * On any conflict, refuse ALL writes; on partial failures, roll back keys added here.
 */
(function (root, factory) {
  "use strict";
  var backup = typeof module === "object" && module.exports
    ? require("./study-progress-backup.js")
    : root && root.StudyProgressBackup;
  var api = factory(backup);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StudyProgressRestore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (backup) {
  "use strict";
  if (!backup) throw new Error("StudyProgressBackup is required");

  function object(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }
  function requireProgressValue(key, raw) {
    if (key.endsWith("-typ")) {
      if (raw !== "0" && raw !== "1") throw new Error("Invalid typing preference in backup");
      return;
    }
    var value;
    try { value = JSON.parse(raw); }
    catch (_) { throw new Error("Malformed learning-progress data: " + key); }
    if (!object(value)) throw new Error("Malformed learning-progress data: " + key);

    if (key.startsWith("study-")) {
      if (!Array.isArray(value.known) || !object(value.ans))
        throw new Error("Invalid quiz-history structure: " + key);
    } else if (key.endsWith("-srs")) {
      if (!object(value.s) || !object(value.m))
        throw new Error("Invalid spaced-repetition data: " + key);
    } else if (key === "studyos.accounting.textbook.progress.v1") {
      for (var id of Object.keys(value)) {
        var record = value[id];
        if (!id || ["__proto__", "constructor", "prototype"].includes(id) || !object(record) ||
            (record.status !== undefined && !["new", "doing", "done"].includes(record.status)) ||
            (record.notes !== undefined && typeof record.notes !== "string") ||
            (record.updated !== undefined && typeof record.updated !== "string"))
          throw new Error("Invalid accounting textbook answer data");
      }
    } else if (key === "vocabloom_mvp_v1") {
      if (!object(value.progress) || !object(value.days) ||
          !Array.isArray(value.custom) || !object(value.settings))
        throw new Error("Invalid VocaBloom progress data");
    } else {
      throw new Error("Unknown progress key");
    }
  }

  function readEntries(text, origin) {
    backup.inspectSnapshot(text, origin);
    var snapshot = JSON.parse(text);
    var entries = snapshot.entries;
    for (var key of Object.keys(entries)) requireProgressValue(key, entries[key]);
    return entries;
  }

  function plan(storage, text, currentOrigin) {
    if (!storage || typeof storage.getItem !== "function")
      throw new Error("Browser storage is unavailable");
    var entries = readEntries(text, currentOrigin);
    var missing = [], identical = [], conflicts = [];
    for (var key of Object.keys(entries)) {
      var current;
      try { current = storage.getItem(key); }
      catch (_) { throw new Error("Unable to read Safari progress; no restore attempted"); }
      if (current === null) missing.push(key);
      else if (current === entries[key]) identical.push(key);
      else conflicts.push(key);
    }
    return { missing: missing, identical: identical, conflicts: conflicts };
  }

  function restoreMissing(storage, text, currentOrigin) {
    if (!storage || typeof storage.setItem !== "function" || typeof storage.removeItem !== "function")
      throw new Error("Writable browser storage is unavailable");
    var entries = readEntries(text, currentOrigin);
    var before = plan(storage, text, currentOrigin);
    if (before.conflicts.length)
      throw new Error("Existing progress differs. Refusing to overwrite any data.");

    var wrote = [];
    try {
      for (var key of before.missing) {
        // Recheck each key immediately before writing. A value appearing in the
        // meantime must never be overwritten.
        if (storage.getItem(key) !== null)
          throw new Error("Progress changed during restore; stopped without overwriting.");
        wrote.push(key); // also covers storage providers that write then throw
        storage.setItem(key, entries[key]);
        if (storage.getItem(key) !== entries[key])
          throw new Error("Restore read-back failed.");
      }
      return { restored: wrote.length, alreadyPresent: before.identical.length };
    } catch (_) {
      for (var i = wrote.length - 1; i >= 0; i--) {
        var key = wrote[i];
        // Never remove a value concurrently updated after our write.
        try {
          if (storage.getItem(key) === entries[key]) storage.removeItem(key);
        } catch (ignored) { /* Partial restore is reported; manual inspection required. */ }
      }
      throw new Error("Restore did not complete; attempted rollback of newly added entries. Check stored progress before retrying.");
    }
  }
  return { plan: plan, restoreMissing: restoreMissing };
});
