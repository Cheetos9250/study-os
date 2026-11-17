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
            (record.updated !== undefined && typeof record.updated !== "string") ||
            (record.je !== undefined && (!Array.isArray(record.je) || record.je.length > 40 ||
              !record.je.every(function (r) { return Array.isArray(r) && r.length <= 4 && r.every(function (c) { return typeof c === "string"; }); }))) ||
            (record.fs !== undefined && (!Array.isArray(record.fs) || record.fs.length > 40 ||
              !record.fs.every(function (r) { return Array.isArray(r) && r.length <= 3 && r.every(function (c) { return typeof c === "string"; }); }))))
          throw new Error("Invalid accounting textbook answer data");
      }
    } else if (key === "studyos.home.v1") {
      if (value.tasks !== undefined && !Array.isArray(value.tasks)) throw new Error("Invalid home dashboard tasks");
      for (var t of (value.tasks || [])) {
        if (!object(t) || typeof t.id !== "string" || typeof t.title !== "string" || t.title.length > 80 ||
            !/^\d{4}-\d{2}-\d{2}$/.test(String(t.date)) || !["High", "Medium", "Low"].includes(t.pri) ||
            (t.done !== undefined && typeof t.done !== "boolean"))
          throw new Error("Invalid home dashboard task");
      }
      if (value.focus !== undefined && !object(value.focus)) throw new Error("Invalid home dashboard checklist");
      var jpeg = { test: function (v) { return /^data:image\/(jpeg|gif|png);base64,[A-Za-z0-9+\/=]+$/.test(v) || /^https:\/\/[^\s"'()\\<>]{4,1990}$/.test(v); } };
      if (value.avatar !== undefined && (typeof value.avatar !== "string" || !jpeg.test(value.avatar)))
        throw new Error("Invalid home dashboard avatar");
      if (value.covers !== undefined) {
        if (!object(value.covers)) throw new Error("Invalid home dashboard card images");
        for (var ck of Object.keys(value.covers))
          if (!["acc", "eco", "math", "voc", "zh"].includes(ck) || typeof value.covers[ck] !== "string" || !jpeg.test(value.covers[ck]))
            throw new Error("Invalid home dashboard card images");
      }
      if (value.cover !== undefined && (typeof value.cover !== "string" || !jpeg.test(value.cover)))
        throw new Error("Invalid home dashboard cover");
    } else if (key === "studyos.today.v1") {
      if (value.exams !== undefined && !Array.isArray(value.exams)) throw new Error("Invalid exam schedule");
      for (var ex of (value.exams || []))
        if (!object(ex) || typeof ex.id !== "string" || typeof ex.course !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(String(ex.date)) || (ex.cats !== undefined && !Array.isArray(ex.cats)))
          throw new Error("Invalid exam schedule");
      if (value.done !== undefined && !object(value.done)) throw new Error("Invalid plan progress");
      if (value.tasks !== undefined && !object(value.tasks)) throw new Error("Invalid plan progress");
      if (value.timetable !== undefined && !Array.isArray(value.timetable)) throw new Error("Invalid timetable");
      for (var cl of (value.timetable || []))
        if (!object(cl) || !Number.isInteger(cl.day) || cl.day < 0 || cl.day > 6 ||
            !/^\d{2}:\d{2}$/.test(String(cl.start)) || !/^\d{2}:\d{2}$/.test(String(cl.end)) ||
            (cl.name !== undefined && typeof cl.name !== "string"))
          throw new Error("Invalid timetable");
    } else if (key === "studyos.notes.v1") {
      for (var nk of Object.keys(value)) {
        var note = value[nk];
        if (!/^[a-z]+:[A-Za-z0-9_-]+$/.test(nk) || !object(note) || typeof note.text !== "string" ||
            (note.updated !== undefined && typeof note.updated !== "string"))
          throw new Error("Invalid lesson notes");
      }
    } else if (key === "studyos.pdfsets.v1") {
      if (!object(value.sets)) throw new Error("Invalid PDF practice answers");
      for (var ps of Object.keys(value.sets)) {
        var set = value.sets[ps];
        if (!/^p[a-z0-9]{1,12}$/.test(ps) || !object(set) || typeof set.name !== "string" ||
            !Number.isInteger(set.n) || set.n < 0 || set.n > 500 || !object(set.ans) || !object(set.key))
          throw new Error("Invalid PDF practice answers");
        for (var part of [set.ans, set.key])
          for (var qn of Object.keys(part))
            if (!/^\d{1,3}$/.test(qn) || !/^[a-e]$/.test(String(part[qn]))) throw new Error("Invalid PDF practice answers");
        if (set.notes !== undefined) {
          if (!object(set.notes)) throw new Error("Invalid PDF practice answers");
          for (var pn of Object.keys(set.notes))
            if (!/^\d{1,5}$/.test(pn) || typeof set.notes[pn] !== "string") throw new Error("Invalid PDF practice answers");
        }
      }
    } else if (key === "studyos.excel.v1") {
      if ((value.done !== undefined && !object(value.done)) || (value.ans !== undefined && !object(value.ans)))
        throw new Error("Invalid Excel lesson progress");
      for (var xs of Object.keys(value.done || {}))
        if (!/^[a-z][0-9]{1,2}$/.test(xs) || value.done[xs] !== true) throw new Error("Invalid Excel lesson progress");
      for (var xq of Object.keys(value.ans || {}))
        if (!/^x\d{1,3}$/.test(xq) || !Number.isInteger(value.ans[xq]) || value.ans[xq] < 0 || value.ans[xq] > 9)
          throw new Error("Invalid Excel lesson progress");
    } else if (key === "studyos.grades.v1") {
      if (!Array.isArray(value.courses)) throw new Error("Invalid grades data");
      for (var gc of value.courses) {
        if (!object(gc) || !Array.isArray(gc.items) || typeof gc.name !== "string") throw new Error("Invalid grades data");
        for (var gi of gc.items)
          if (!object(gi) || !Number.isFinite(Number(gi.weight)) || (gi.got !== null && gi.got !== undefined && !Number.isFinite(Number(gi.got))))
            throw new Error("Invalid grades data");
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
