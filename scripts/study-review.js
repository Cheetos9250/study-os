/* Study OS quiz review: spaced repetition for practice questions, scheduled by FSRS-5 (27 Nov 2026; before: Leitner boxes 1/3/7/14/30/90 days).
   State lives inside the existing quiz key `study-<course>`:
   - `rv: {questionId: [box, dueMs]}` is unchanged (same shape, same meaning for everything that reads it: Review due, Old questions,
     Retired, Today, Stats, sync). `box` is now derived from the FSRS interval, `dueMs` is the FSRS due day.
   - `fsrs: {questionId: [stability, difficulty, lastMs, dueMs]}` is the extra FSRS memory state. It is optional: a question without one
     (or whose `dueMs` no longer matches `rv`, e.g. changed by an older app version) gets its state derived from `rv` + `ats` on the next
     answer, so no existing progress is read as lost. Rollback = `rollback(store)` (or just ignore `fsrs`; old code never reads it).
   Answers are binary: wrong = Again (1), right = Good (3). Target retention 90%. */
(function (root) {
  var DAY = 86400000, TZ = 7 * 3600000;               // days start at midnight Bangkok, like the flashcards
  var GAPS = [1, 3, 7, 14, 30, 90];                    // days until the next review, per box
  var RETIRE = 4;                                      // 4 correct in a row: retired (30, then 90 days away)
  var OLD = 1;                                         // 1 correct answer: an "old question" (owner, 25 Nov 2026; before: 2 in a row)
  var W = [0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621]; // FSRS-5 default weights
  var DECAY = -0.5, FACTOR = 19 / 81, RETENTION = 0.9, MAXIV = 365, SCHEDULER = 'fsrs';
  function clampD(d) { return Math.min(10, Math.max(1, d)); }
  function d0(g) { return W[4] - Math.exp(W[5] * (g - 1)) + 1; }
  function retrievability(t, s) { return Math.pow(1 + FACTOR * Math.max(0, t) / s, DECAY); }
  function interval(s, r) { return s / FACTOR * (Math.pow(r || RETENTION, 1 / DECAY) - 1); }
  function sod(t) { return Math.floor((t + TZ) / DAY) * DAY - TZ; }
  function valid(e) { return Array.isArray(e) && e.length === 2 && isFinite(e[0]) && isFinite(e[1]); }
  /* box and due time after answering; `prev` is the current [box, due] or undefined */
  function next(prev, correct, now) {
    var box = correct ? (valid(prev) ? Math.min(prev[0] + 1, GAPS.length - 1) : 1) : 0;
    return [box, sod(now) + GAPS[box] * DAY];
  }
  /* box from an interval in days: keeps the old meaning (>= 1 old question, >= 4 retired = a month or more away) */
  function boxOf(days) { return days >= 90 ? 5 : days >= 30 ? 4 : days >= 14 ? 3 : days >= 7 ? 2 : 1; }
  function validF(f) { return Array.isArray(f) && f.length === 4 && f.every(isFinite) && f[0] > 0 && f[1] >= 1 && f[1] <= 10; }
  /* FSRS state for a question that has none yet, from its old [box, due] and answer time; changes nothing in the store.
     box 0 (wrong): short memory (0.5 day), hard (7); box k >= 1: stability = the Leitner gap it was waiting for. */
  function migrate(store, id, now) {
    var e = store.rv && store.rv[id]; if (!valid(e)) return null;
    var box = Math.max(0, Math.min(GAPS.length - 1, Math.round(e[0])));
    var last = (store.ats && store.ats[id]) || (e[1] - (GAPS[box] || 1) * DAY);
    if (!isFinite(last) || last > now) last = now;
    return box === 0 ? [W[11], 7, last, e[1]] : [GAPS[box], 5, last, e[1]];
  }
  function stateOf(store, id, now) {
    var f = store.fsrs && store.fsrs[id], e = store.rv && store.rv[id];
    if (validF(f) && valid(e) && f[3] === e[1]) return f;           // still matches rv: nobody else changed the schedule
    return migrate(store, id, now);
  }
  function review(f, correct, now) {
    var s, d;
    if (!f) { s = correct ? W[2] : W[0]; d = clampD(d0(correct ? 3 : 1)); }
    else {
      var t = Math.max(0, (now - f[2]) / DAY), r = retrievability(t, f[0]);
      d = f[1] + (-W[6] * ((correct ? 3 : 1) - 3)) * (10 - f[1]) / 9;
      d = clampD(W[7] * d0(4) + (1 - W[7]) * d);
      s = correct
        ? f[0] * (1 + Math.exp(W[8]) * (11 - d) * Math.pow(f[0], -W[9]) * (Math.exp((1 - r) * W[10]) - 1))
        : Math.min(f[0], W[11] * Math.pow(d, -W[12]) * (Math.pow(f[0] + 1, W[13]) - 1) * Math.exp((1 - r) * W[14]));
    }
    s = Math.max(0.1, s);
    var days = correct ? Math.min(MAXIV, Math.max(1, Math.round(interval(s)))) : 1; // a wrong answer always comes back tomorrow
    return { f: [s, d, now, sod(now) + days * DAY], days: days };
  }
  /* answer a question: returns the new [box, due] and keeps `store.fsrs` in step. `opts.legacy` uses the old Leitner boxes. */
  function record(store, id, correct, now, opts) {
    store.rv = store.rv && typeof store.rv === 'object' ? store.rv : {};
    if ((opts && opts.legacy) || SCHEDULER !== 'fsrs') { store.rv[id] = next(store.rv[id], correct, now); return store.rv[id]; }
    var r = review(stateOf(store, id, now), correct, now);
    store.fsrs = store.fsrs && typeof store.fsrs === 'object' ? store.fsrs : {};
    store.fsrs[id] = r.f;
    store.rv[id] = [correct ? boxOf(r.days) : 0, r.f[3]];
    return store.rv[id];
  }
  /* back to plain Leitner: drops only the FSRS memory; `rv` stays valid as it is */
  function rollback(store) { var had = !!store.fsrs; delete store.fsrs; return had; }
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
  /* old question: answered right at least OLD times in a row (OLD = 1 since 25 Nov 2026; the box counts the streak; a wrong answer resets it to 0).
     Old questions leave the normal deck and Review due; they wait in the "Old questions" view until answered wrong. */
  function isOld(store, id) {
    var e = store.rv && store.rv[id];
    return valid(e) && e[0] >= OLD && store.ans && store.ans[id] !== undefined;
  }
  function oldRaw(raw) {
    try { var s = JSON.parse(raw || 'null'); if (!s || typeof s !== 'object') return 0;
      return Object.keys(s.rv || {}).filter(function (id) { return isOld(s, id); }).length; }
    catch (e) { return 0; }
  }
  function isDue(store, id, now) {
    var e = store.rv && store.rv[id];
    return valid(e) && e[0] < OLD && store.ans && store.ans[id] !== undefined && e[1] <= now;
  }
  /* retired: answered correctly enough times in a row; hidden from the normal deck until its next (rare) review is due */
  function isRetired(store, id, now) {
    var e = store.rv && store.rv[id];
    return valid(e) && e[0] >= RETIRE && e[1] > now && store.ans && store.ans[id] !== undefined;
  }
  function retiredRaw(raw, now) {
    try { var s = JSON.parse(raw || 'null'); if (!s || typeof s !== 'object') return 0;
      return Object.keys(s.rv || {}).filter(function (id) { return isRetired(s, id, now); }).length; }
    catch (e) { return 0; }
  }
  function dueIds(store, now) {
    return Object.keys((store && store.rv) || {}).filter(function (id) { return isDue(store, id, now); });
  }
  /* due count from the raw localStorage string (Today, Practice) */
  function countRaw(raw, now) {
    try { var s = JSON.parse(raw || 'null'); return s && typeof s === 'object' ? dueIds(s, now).length : 0; }
    catch (e) { return 0; }
  }
  var api = { fsrsWeights: W, retrievability: retrievability, interval: interval, boxOf: boxOf, migrate: migrate, stateOf: stateOf, rollback: rollback, GAPS: GAPS, RETIRE: RETIRE, OLD: OLD, isOld: isOld, oldRaw: oldRaw, isRetired: isRetired, retiredRaw: retiredRaw, sod: sod, next: next, record: record, seed: seed, isDue: isDue, dueIds: dueIds, countRaw: countRaw };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.StudyReview = api;
})(typeof window !== 'undefined' ? window : this);
