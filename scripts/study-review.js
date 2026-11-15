/* Study OS quiz review: spaced repetition for practice questions (Leitner boxes).
   State lives inside the existing quiz key `study-<course>` as `rv: {questionId: [box, dueMs]}`,
   so it is already in backups and restore keeps it (restore checks `known` and `ans` only).
   A wrong answer comes back tomorrow; each correct answer moves the question to a longer gap. */
(function (root) {
  var DAY = 86400000, TZ = 7 * 3600000;               // days start at midnight Bangkok, like the flashcards
  var GAPS = [1, 3, 7, 14, 30];                        // days until the next review, per box
  function sod(t) { return Math.floor((t + TZ) / DAY) * DAY - TZ; }
  function valid(e) { return Array.isArray(e) && e.length === 2 && isFinite(e[0]) && isFinite(e[1]); }
  /* box and due time after answering; `prev` is the current [box, due] or undefined */
  function next(prev, correct, now) {
    var box = correct ? (valid(prev) ? Math.min(prev[0] + 1, GAPS.length - 1) : 1) : 0;
    return [box, sod(now) + GAPS[box] * DAY];
  }
  function record(store, id, correct, now) {
    store.rv = store.rv && typeof store.rv === 'object' ? store.rv : {};
    store.rv[id] = next(store.rv[id], correct, now);
    return store.rv[id];
  }
  /* give questions answered before this feature a schedule: wrong ones are due now, right ones 3 days after they were answered */
  function seed(store, questions, now) {
    var ans = store.ans || {}, ats = store.ats || {}, changed = false;
    store.rv = store.rv && typeof store.rv === 'object' ? store.rv : {};
    for (var i = 0; i < questions.length; i++) {
      var q = questions[i];
      if (ans[q.id] === undefined || valid(store.rv[q.id])) continue;
      store.rv[q.id] = ans[q.id] === q.right ? [1, sod(ats[q.id] || now) + GAPS[1] * DAY] : [0, sod(now)];
      changed = true;
    }
    return changed;
  }
  function isDue(store, id, now) {
    var e = store.rv && store.rv[id];
    return valid(e) && store.ans && store.ans[id] !== undefined && e[1] <= now;
  }
  function dueIds(store, now) {
    return Object.keys((store && store.rv) || {}).filter(function (id) { return isDue(store, id, now); });
  }
  /* due count from the raw localStorage string (Today, Practice) */
  function countRaw(raw, now) {
    try { var s = JSON.parse(raw || 'null'); return s && typeof s === 'object' ? dueIds(s, now).length : 0; }
    catch (e) { return 0; }
  }
  var api = { GAPS: GAPS, sod: sod, next: next, record: record, seed: seed, isDue: isDue, dueIds: dueIds, countRaw: countRaw };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.StudyReview = api;
})(typeof window !== 'undefined' ? window : this);
