/* WordNest pure helpers (no DOM, no storage): typo diff, CSV, confusable words, word status, bloom stage,
   goal heatmap cells and picking words for Panic Review / weakest 10. Used by wordnest-plus.js, the Chinese games
   and tests. */
(function (root) {
  'use strict';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  /* ---------- typo diff: which letters were right, missing or extra ---------- */
  function diff(typed, right) {
    var a = Array.from(String(typed || '')), b = Array.from(String(right || '')), n = a.length, m = b.length, i, j;
    var L = []; for (i = 0; i <= n; i++) { L.push(new Array(m + 1).fill(0)); }
    for (i = n - 1; i >= 0; i--) for (j = m - 1; j >= 0; j--)
      L[i][j] = a[i].toLowerCase() === b[j].toLowerCase() ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    var out = []; i = 0; j = 0;
    while (i < n && j < m) {
      if (a[i].toLowerCase() === b[j].toLowerCase()) { out.push(['=', b[j]]); i++; j++; }
      else if (L[i + 1][j] >= L[i][j + 1]) { out.push(['+', a[i]]); i++; }       // typed but not in the answer
      else { out.push(['-', b[j]]); j++; }                                          // in the answer but not typed
    }
    while (i < n) out.push(['+', a[i++]]);
    while (j < m) out.push(['-', b[j++]]);
    return out;
  }
  /* HTML: right letters plain, missing letters marked, extra letters struck through */
  function diffHTML(typed, right) {
    return diff(typed, right).map(function (p) {
      var c = p[1] === ' ' ? '&nbsp;' : esc(p[1]);
      return p[0] === '=' ? '<span class="wd-ok">' + c + '</span>' : p[0] === '-' ? '<ins class="wd-miss" title="missing">' + c + '</ins>' : '<del class="wd-extra" title="extra">' + c + '</del>';
    }).join('');
  }
  function editDistance(a, b) {
    a = String(a || '').toLowerCase(); b = String(b || '').toLowerCase();
    var prev = [], cur, i, j; for (j = 0; j <= b.length; j++) prev.push(j);
    for (i = 1; i <= a.length; i++) { cur = [i]; for (j = 1; j <= b.length; j++) cur.push(Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))); prev = cur; }
    return prev[b.length];
  }
  /* sentence check for dictation: case, spaces and punctuation do not matter */
  function normSentence(s) { return String(s || '').toLowerCase().normalize('NFKC').replace(/[’‘]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim(); }

  /* ---------- CSV (also reads Anki's tab-separated text export) ---------- */
  function csvCell(v) { v = String(v == null ? '' : v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function toCSV(rows) { return rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n') + '\r\n'; }
  function parseCSV(text) {
    text = String(text || '').replace(/^﻿/, '');
    var lines = text.split(/\r?\n/).filter(function (l) { return l.trim() && l.charAt(0) !== '#'; });     // Anki adds #separator lines
    var sample = lines.slice(0, 5).join('\n'), sep = (sample.match(/\t/g) || []).length ? '\t' : (sample.match(/;/g) || []).length > (sample.match(/,/g) || []).length ? ';' : ',';
    var rows = [], row = [], cell = '', q = false, s = lines.join('\n') + '\n', k, c;
    for (k = 0; k < s.length; k++) {
      c = s[k];
      if (q) { if (c === '"') { if (s[k + 1] === '"') { cell += '"'; k++; } else q = false; } else cell += c; }
      else if (c === '"' && cell === '') q = true;
      else if (c === sep) { row.push(cell); cell = ''; }
      else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    return rows.map(function (r) { return r.map(function (x) { return x.trim(); }); }).filter(function (r) { return r.some(Boolean); });
  }
  /* rows → {en, th, example, level} with the header row skipped; HTML tags from Anki are removed */
  function wordsFromCSV(rows) {
    var strip = function (v) { return String(v || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim(); };
    var head = rows[0] ? rows[0].map(function (x) { return x.toLowerCase(); }) : [];
    var hasHead = head.some(function (x) { return /^(word|english|front|term|en)$/.test(x); });
    var col = function (names, d) { for (var i = 0; i < head.length; i++) if (names.indexOf(head[i]) >= 0) return i; return d; };
    var iw = hasHead ? col(['word', 'english', 'front', 'term', 'en'], 0) : 0, im = hasHead ? col(['meaning', 'thai', 'back', 'definition', 'th'], 1) : 1,
      ie = hasHead ? col(['example', 'sentence'], -1) : 2, il = hasHead ? col(['level', 'cefr'], -1) : -1;
    return (hasHead ? rows.slice(1) : rows).map(function (r) {
      return { en: strip(r[iw]).toLowerCase(), th: strip(r[im]), example: ie >= 0 ? strip(r[ie]) : '', level: il >= 0 ? strip(r[il]).toUpperCase() : '' };
    }).filter(function (w) { return w.en && w.th && w.en.length <= 60; });
  }

  /* ---------- confusable words ---------- */
  /* English: same length ±1, one or two letters apart (affect/effect, adapt/adopt) */
  function confusableEn(word, all, max) {
    var w = String(word || '').toLowerCase(); if (w.length < 4 || / /.test(w)) return [];
    return all.filter(function (x) { var o = String(x || '').toLowerCase(); return o !== w && Math.abs(o.length - w.length) <= 1 && o.length >= 4 && (o[0] === w[0] || o.slice(-2) === w.slice(-2)) && editDistance(o, w) <= (w.length >= 7 ? 2 : 1); }).slice(0, max || 3);
  }
  /* Chinese: same pinyin without tones (different characters), or one character in common */
  function confusableZh(item, all, toneless, max) {
    var base = toneless(item.py).replace(/\s+/g, ''), out = [];
    all.forEach(function (x) {
      if (x.hz === item.hz) return;
      var same = toneless(x.py).replace(/\s+/g, '') === base, share = item.hz.length >= 2 && x.hz.length >= 2 && Array.from(item.hz).some(function (ch) { return x.hz.indexOf(ch) >= 0; }) && x.hz.length === item.hz.length;
      if (same || share) out.push({ w: x, why: same ? 'same sound' : 'shares a character' });
    });
    out.sort(function (a, b) { return (a.why === 'same sound' ? 0 : 1) - (b.why === 'same sound' ? 0 : 1); });
    return out.slice(0, max || 3);
  }

  /* ---------- status, bloom, heatmap, picks ---------- */
  /* English progress {id: {seen, mastered}} → counts; Chinese schedule entries → counts */
  function statusEn(ids, progress) {
    var o = { new: 0, learning: 0, mastered: 0 };
    ids.forEach(function (id) { var p = progress[id]; if (!p || !p.seen) o.new++; else if (p.mastered) o.mastered++; else o.learning++; });
    return o;
  }
  function statusZh(mids, srs) {
    var o = { new: 0, learning: 0, mastered: 0 };
    mids.forEach(function (id) { var s = srs[id]; if (!s) o.new++; else if (s.st === 'rev' && Number(s.ivl) >= 21) o.mastered++; else o.learning++; });
    return o;
  }
  /* 0 seed · 1 sprout · 2 leaves · 3 bud · 4 bloom · 5 full bloom, from how many words are learning/mastered */
  function bloomStage(st) {
    var total = st.new + st.learning + st.mastered; if (!total) return 0;
    var m = st.mastered / total, l = (st.learning + st.mastered) / total;
    return m >= 0.6 ? 5 : m >= 0.3 ? 4 : m >= 0.1 ? 3 : l >= 0.2 ? 2 : l > 0 ? 1 : 0;
  }
  var BLOOM = ['Seed', 'Sprout', 'Leaves', 'Bud', 'Bloom', 'Full bloom'];
  /* 12 weeks of days ending today, Monday-first columns: [{date, n, met}] */
  function heatCells(perDay, goal, todayKey, weeks) {
    weeks = weeks || 12; var t = new Date(todayKey + 'T12:00:00Z'), dow = (t.getUTCDay() + 6) % 7, start = new Date(t.getTime() - ((weeks - 1) * 7 + dow) * 864e5), out = [];
    for (var d = new Date(start); d <= t; d = new Date(d.getTime() + 864e5)) { var k = d.toISOString().slice(0, 10), n = perDay[k] || 0; out.push({ date: k, n: n, met: n >= goal }); }
    return out;
  }
  /* most-missed first (wrong − correct, then wrong), then the newest, then the rest */
  function pickWeak(items, n) {
    var miss = items.filter(function (x) { return x.wrong > 0; }).sort(function (a, b) { return (b.wrong - b.correct) - (a.wrong - a.correct) || b.wrong - a.wrong; });
    var seen = {}; miss.forEach(function (x) { seen[x.id] = 1; });
    var fresh = items.filter(function (x) { return !seen[x.id]; }).sort(function (a, b) { return (b.added || 0) - (a.added || 0); });
    return miss.concat(fresh).slice(0, n || 10);
  }
  var api = { diff: diff, diffHTML: diffHTML, editDistance: editDistance, normSentence: normSentence, toCSV: toCSV, parseCSV: parseCSV, wordsFromCSV: wordsFromCSV,
    confusableEn: confusableEn, confusableZh: confusableZh, statusEn: statusEn, statusZh: statusZh, bloomStage: bloomStage, BLOOM: BLOOM, heatCells: heatCells, pickWeak: pickWeak, esc: esc };
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.WordNestTools = api;
})(typeof window !== 'undefined' ? window : null);
