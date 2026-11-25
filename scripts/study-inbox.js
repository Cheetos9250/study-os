/* Study OS question inbox (owner, 25 Nov 2026): Gemini writes one Markdown file per day per subject in a fixed
   template, the owner's Google Drive folder collects them, the Apps Script `workers/inbox/study-os-inbox.gs`
   turns them into rows, and the course pages add the rows to the practice pool.
   This file is the single parser. The Apps Script embeds a byte-for-byte copy of the block between the
   PARSER-START / PARSER-END markers (tests/inbox-script-sync.test.cjs checks it), so keep that block plain ES5.
   Pure functions, nothing is stored here. Rows use the same keys as data/quiz.json rows. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.StudyInbox = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* PARSER-START */
  var SUBJECTS = { acc: 'Accounting', accounting: 'Accounting', eco: 'Economics', econ: 'Economics', economics: 'Economics',
    math: 'Math for Life', 'math for life': 'Math for Life' };
  function subjectName(t) { return SUBJECTS[String(t || '').toLowerCase().replace(/\s+/g, ' ').trim()] || ''; }
  function norm(t) { return String(t || '').toLowerCase().replace(/\*\*/g, '').replace(/[^a-z0-9฀-๿]+/g, ' ').trim(); }
  function hash(t) {
    var a = 5381, b = 52711, i, c;
    for (i = 0; i < t.length; i++) { c = t.charCodeAt(i); a = ((a * 33) ^ c) >>> 0; b = ((b * 31) + c) >>> 0; }
    return a.toString(36) + b.toString(36);
  }
  function clean(l) { return String(l).replace(/\r/g, '').replace(/^\s*(?:#{1,6}\s+|[-*+]\s+|>\s*)/, '').replace(/\*\*/g, '').replace(/__/g, '').trim(); }
  /* text: one Markdown file. defaults: {Subject, Chapter} (for example from the file name). → {rows, errors} */
  function parse(text, defaults) {
    var lines = String(text || '').split('\n'), rows = [], errors = [], seen = {};
    var subj = subjectName(defaults && defaults.Subject) || '', chap = (defaults && defaults.Chapter) || '';
    var cur = null, field = '', m, i, raw, l;
    function finish() {
      if (!cur) return;
      var q = cur; cur = null; field = '';
      var label = (q.q || '').slice(0, 60);
      var letters = Object.keys(q.opts).sort(), idx = 'ABCDEF'.indexOf(q.ans);
      if (!q.q) return;
      if (!q.subject) { errors.push('No Subject for: ' + label); return; }
      if (!q.chapter) { errors.push('No Chapter for: ' + label); return; }
      if (letters.length < 2) { errors.push('Fewer than 2 options: ' + label); return; }
      if (letters.length > 4) { errors.push('More than 4 options: ' + label); return; }
      if (idx < 0 || !q.opts[q.ans]) { errors.push('Answer missing or not an option: ' + label); return; }
      var k = q.subject + '|' + norm(q.q);
      if (seen[k]) return;
      seen[k] = 1;
      var right = q.opts[q.ans].trim(), wrong = letters.filter(function (x) { return x !== q.ans; }).map(function (x) { return q.opts[x].trim(); });
      var row = { Subject: q.subject, Chapter: q.chapter, Question: q.q.trim(), Correct: right,
        Explanation: (q.exp || '').trim(), Status: 'Verified', page_id: 'in' + hash(k) };
      for (var w = 0; w < wrong.length; w++) row['Wrong ' + (w + 1)] = wrong[w];
      rows.push(row);
    }
    for (i = 0; i < lines.length; i++) {
      raw = lines[i]; l = clean(raw);
      if (!l || /^-{3,}$/.test(l) || /^={3,}$/.test(l)) { if (cur && field === 'exp' && l === '') cur.exp += '\n'; continue; }
      if ((m = /^subject\s*[:：]\s*(.+)$/i.exec(l))) { subj = subjectName(m[1]) || m[1].trim(); if (cur && !cur.q) cur.subject = subj; continue; }
      if ((m = /^chapter\s*[:：]\s*(.+)$/i.exec(l))) { chap = m[1].trim(); continue; }
      if ((m = /^(?:question|q)\s*\d*\s*[:：.)]\s*(.*)$/i.exec(l))) {
        finish(); cur = { q: m[1], opts: {}, ans: '', exp: '', subject: subj, chapter: chap }; field = 'q'; continue;
      }
      if (!cur) continue;
      if ((m = /^\(?([A-F])\s*[).:：]\s*(.+)$/.exec(l))) { cur.opts[m[1]] = m[2]; field = m[1]; continue; }
      if ((m = /^(?:correct\s+)?answer\s*[:：]\s*\(?([A-F1-6])\b/i.exec(l))) {
        var a = m[1].toUpperCase(); cur.ans = /\d/.test(a) ? 'ABCDEF'.charAt(Number(a) - 1) : a; field = ''; continue;
      }
      if ((m = /^explanation\s*[:：]\s*(.*)$/i.exec(l))) { cur.exp = m[1]; field = 'exp'; continue; }
      if (field === 'q') cur.q += ' ' + l;
      else if (field === 'exp') cur.exp += (cur.exp && !/\n$/.test(cur.exp) ? ' ' : '') + l;
      else if (field && cur.opts[field] !== undefined) cur.opts[field] += ' ' + l;
    }
    finish();
    return { rows: rows, errors: errors };
  }
  /* chapter text from the file → the course's [id, label] pair; exact label, then name, then chapter number */
  function matchChapter(cats, text) {
    var t = norm(text), n, i, lab, num;
    if (!t) return null;
    for (i = 0; i < cats.length; i++) if (norm(cats[i][1]) === t) return cats[i];
    for (i = 0; i < cats.length; i++) { lab = norm(cats[i][1]).replace(/^(?:micro|macro) /, '').replace(/^\d+ /, ''); if (lab && (t.indexOf(lab) >= 0 || lab.indexOf(t) >= 0)) return cats[i]; }
    num = /(?:^|[^0-9])0*(\d{1,3})(?:[^0-9]|$)/.exec(String(text));
    if (num) { n = Number(num[1]); for (i = 0; i < cats.length; i++) { var x = /(?:^|[^0-9])0*(\d{1,3})(?:[^0-9]|$)/.exec(cats[i][1]); if (x && Number(x[1]) === n) return cats[i]; } }
    return null;
  }
  /* PARSER-END */

  /* rows of other subjects are dropped; chapters the course does not have are reported */
  function forCourse(rows, subject, cats) {
    var out = [], bad = [];
    (rows || []).forEach(function (r) {
      if (r.Subject !== subject) return;
      var hit = matchChapter(cats, r.Chapter);
      if (!hit) { bad.push(r.Chapter); return; }
      var c = {}; for (var k in r) c[k] = r[k];
      c.Chapter = hit[1]; c._inbox = true; out.push(c);
    });
    return { rows: out, unknownChapters: bad.filter(function (x, i) { return bad.indexOf(x) === i; }) };
  }
  return { parse: parse, matchChapter: matchChapter, subjectName: subjectName, forCourse: forCourse, hash: hash, norm: norm };
});
