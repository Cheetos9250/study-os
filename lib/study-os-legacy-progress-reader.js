(function(root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.StudyOSProgress = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function() {
"use strict";
// Pure read-only legacy parser: accepts snapshots, never touches browser storage.
const KEYS = Object.freeze({acc:"acc-flashcards-v1",eco:"econ-flashcards-v1",math:"math-flashcards-v1"});
function parseLegacyProgress(subject, snapshot) {
  if (!Object.hasOwn(KEYS, subject)) throw new TypeError("unsupported academic subject");
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) throw new TypeError("snapshot must be an object");
  const raw = snapshot["study-" + subject];
  const srsRaw = snapshot[KEYS[subject] + "-srs"];
  function parse(value, label) {
    if (value === undefined || value === null) return null;
    if (typeof value !== "string") throw new TypeError(label + " must be a JSON string");
    let parsed;
    try { parsed = JSON.parse(value); } catch { throw new TypeError(label + " invalid JSON"); }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new TypeError(label + " invalid object");
    return parsed;
  }
  const study = parse(raw, "study");
  const srs = parse(srsRaw, "srs");
  const ans = study?.ans;
  const known = study?.known;
  const s = srs?.s;
  if (ans !== undefined && (!ans || typeof ans !== "object" || Array.isArray(ans))) throw new TypeError("invalid answer map");
  if (known !== undefined && (!Array.isArray(known) || !known.every(id => typeof id === "string"))) throw new TypeError("invalid known IDs");
  if (s !== undefined && (!s || typeof s !== "object" || Array.isArray(s))) throw new TypeError("invalid SRS map");
  if (ans && !Object.values(ans).every(value => Number.isInteger(value) && value >= 0)) throw new TypeError("invalid answer selection");
  if (s && !Object.values(s).every(value => value && typeof value === "object" && !Array.isArray(value))) throw new TypeError("invalid SRS record");
  return Object.freeze({
    subject,
    studyObserved: study !== null,
    srsObserved: srs !== null,
    legacyKnownCount: known ? new Set(known).size : null,
    answeredQuestionCount: ans ? Object.keys(ans).length : null,
    scheduledCardCount: s ? Object.keys(s).length : null,
    quizAccuracyPercent: null,
    reviewCoveragePercent: null,
  });
}
return Object.freeze({ KEYS, parseLegacyProgress });

});
