/* Which Study OS pages are opened, counted on this device only (owner, 24 Nov 2026), so we can see which features
   are really used before changing or hiding any. Never sent anywhere by itself; the Feedback page can add a short
   summary to a message the owner chooses to send. Key studyos.usage.v1 (not backed up or synced: it is not study progress):
     { days: { "YYYY-MM-DD": { "<page>": opens } }, secs: { "YYYY-MM-DD": { "<page>": seconds } } }
   page = file name without .html, course pages add the mode (acc-prac). secs (owner, 25 Nov 2026) = seconds the page was
   visible and in use (a tap, scroll or key in the last 2 minutes), so a tablet left open does not count.
   Keeps the last 120 days. Loaded by scripts/study-nav.js on every page. */
(function (root) {
  'use strict';
  var KEY = 'studyos.usage.v1', KEEP = 120, PAGE = /^[a-z0-9-]{1,40}$/;
  function day(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function pageId(path, search) {
    var f = String(path || '').split('/').pop().toLowerCase().replace(/\.html$/, '') || 'index';
    var m = /[?&]tab=(cards|sum|prac)\b/.exec(search || '');
    if (/^(acc|eco|math|eng|zh)$/.test(f)) f += '-' + (m ? m[1] : 'cards');
    f = f.replace(/[^a-z0-9-]/g, '').slice(0, 40);
    return PAGE.test(f) ? f : 'other';
  }
  function read(store) { try { var o = JSON.parse(store.getItem(KEY) || '{}'); return o && typeof o.days === 'object' && o.days && !Array.isArray(o.days) ? o : { days: {} }; } catch (e) { return { days: {} }; } }
  function record(store, page, now) {
    var o = read(store), d = day(now), row = o.days[d] || (o.days[d] = {});
    row[page] = Math.min(9999, (row[page] || 0) + 1);
    var keys = Object.keys(o.days).sort(); while (keys.length > KEEP) delete o.days[keys.shift()];
    try { store.setItem(KEY, JSON.stringify(o)); } catch (e) {}
    return o;
  }
  /* opens per page over the last n days, most used first */
  function summary(store, n, now) {
    var o = read(store), out = {}, sec = {}, end = now || new Date(), days = 0, sd = o.secs && typeof o.secs === 'object' ? o.secs : {};
    for (var i = 0; i < n; i++) { var d = new Date(end), k; d.setDate(d.getDate() - i); k = day(d); var row = o.days[k], sr = sd[k];
      if (sr) for (var q in sr) sec[q] = (sec[q] || 0) + (Number(sr[q]) || 0);
      if (!row) continue; days++; for (var p in row) out[p] = (out[p] || 0) + row[p]; }
    var pages = Object.keys(out).map(function (p) { return [p, out[p]]; }).sort(function (a, b) { return b[1] - a[1]; });
    var times = Object.keys(sec).filter(function (p) { return sec[p] > 0; }).map(function (p) { return [p, sec[p]]; }).sort(function (a, b) { return b[1] - a[1]; });
    return { days: days, pages: pages, times: times };
  }
  /* add seconds of real use to a page for today (never more than a day) */
  function addSecs(store, page, s, now) {
    var o = read(store), d = day(now); o.secs = o.secs && typeof o.secs === 'object' && !Array.isArray(o.secs) ? o.secs : {};
    var row = o.secs[d] || (o.secs[d] = {}); row[page] = Math.min(86400, (Number(row[page]) || 0) + Math.max(0, Math.min(60, s)));
    var keys = Object.keys(o.secs).sort(); while (keys.length > KEEP) delete o.secs[keys.shift()];
    try { store.setItem(KEY, JSON.stringify(o)); } catch (e) {}
    return o;
  }
  function fmt(s) { s = Math.round(s); var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? h + ' h ' + m + ' min' : m ? m + ' min' : s + ' s'; }
  var api = { KEY: KEY, day: day, pageId: pageId, read: read, record: record, summary: summary, addSecs: addSecs, fmt: fmt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  /* every 15 s: if the page is visible and I touched it in the last 2 minutes, add the time */
  var TICK = 15000, IDLE = 120000;
  function watch(w, pid) {
    var doc = w.document, last = Date.now(), prev = Date.now();
    function act() { last = Date.now(); }
    ['pointerdown', 'touchstart', 'keydown', 'scroll', 'wheel', 'mousemove'].forEach(function (e) { w.addEventListener(e, act, { passive: true, capture: true }); });
    setInterval(function () { var now = Date.now(), dt = (now - prev) / 1000; prev = now;
      if (!doc.hidden && now - last < IDLE) { try { addSecs(w.localStorage, pid, dt); } catch (e) {} } }, TICK);
  }
  /* the backup and restore pages must leave storage untouched (CI checks it), so they are never counted */
  var SKIP = { 'progress-backup': 1, 'progress-restore': 1 };
  api.SKIP = SKIP;
  if (root && root.document) { root.StudyUsage = api; try { var pid = pageId(root.location.pathname, root.location.search); if (!SKIP[pid]) { record(root.localStorage, pid); watch(root, pid); } } catch (e) {} }
})(typeof window !== 'undefined' ? window : null);
