/* How hard a practice question is in itself (owner, 24 Nov 2026): a fixed estimate from the question text, the same for
   everyone and shown before answering. It never changes with my answers (that is what Review due and Old questions do).
   Rules: computing a number (numeric options, several amounts in the stem), long stems and case texts, error-effect
   questions (over/understated, "how is ... affected") and NOT/EXCEPT wording make a question harder; a short definition
   ("what is", "is called", "means") makes it easier. Score ≤ 1 = Easy, 2–4 = Medium, ≥ 5 = Hard. Stores nothing. */
(function (root) {
  'use strict';
  var NUM = /(?:[$฿]\s?)?\d[\d,]*(?:\.\d+)?%?/g;
  function amounts(t) { return (String(t).match(NUM) || []).filter(function (n) { var v = parseFloat(n.replace(/[^\d.]/g, '')); return n.indexOf('%') >= 0 || n.indexOf('$') >= 0 || v >= 10; }).length; }
  function numeric(o) { return /^[\s$฿(−\-]*\d[\d,]*(?:\.\d+)?%?\)?\s*(?:times|days|baht|บาท|units)?\s*$/i.test(String(o)); }
  function score(q) {
    var stem = String(q.q || ''), all = stem + ' ' + String(q.prompt || ''), opts = Array.isArray(q.opts) ? q.opts : [], s = 0;
    var numOpts = opts.length && opts.filter(numeric).length >= Math.ceil(opts.length * 0.75);
    if (numOpts) s += 2;
    var n = amounts(all); s += n >= 5 ? 3 : n >= 3 ? 2 : n >= 2 ? 1 : 0;
    var len = all.length; s += len > 420 ? 2 : len > 220 ? 1 : 0;
    if (q.prompt) s += 1;
    if (/over\s?stat|under\s?stat|affect|effect on|error|mistakenly|incorrectly|instead of|สูงไป|ต่ำไป|ผิดพลาด/i.test(all)) s += 2;
    if (/\b(NOT|EXCEPT|LEAST)\b|ไม่ใช่|ยกเว้น/.test(stem)) s += 1;
    if (opts.some(function (o) { return String(o).length > 60; })) s += 1;
    if (!numOpts && n === 0 && len < 90 && /what is|what does|is called|means|refers to|is known as|คือ|หมายถึง|เรียกว่า/i.test(stem)) s -= 1;
    return s;
  }
  function level(q) { var s = score(q); return s <= 1 ? 'Easy' : s <= 4 ? 'Medium' : 'Hard'; }
  var api = { score: score, level: level };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.StudyQDiff = api;
})(typeof window !== 'undefined' ? window : null);
