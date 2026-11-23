/* Which Study OS pages are opened, counted on this device only (owner, 24 Nov 2026), so we can see which features
   are really used before changing or hiding any. Never sent anywhere by itself; the Feedback page can add a short
   summary to a message the owner chooses to send. Key studyos.usage.v1 (not backed up or synced: it is not study progress):
     { days: { "YYYY-MM-DD": { "<page>": opens } } }   page = file name without .html, course pages add the mode (acc-prac)
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
    var o = read(store), out = {}, end = now || new Date(), days = 0;
    for (var i = 0; i < n; i++) { var d = new Date(end); d.setDate(d.getDate() - i); var row = o.days[day(d)]; if (!row) continue; days++; for (var p in row) out[p] = (out[p] || 0) + row[p]; }
    return { days: days, pages: Object.keys(out).map(function (p) { return [p, out[p]]; }).sort(function (a, b) { return b[1] - a[1]; }) };
  }
  var api = { KEY: KEY, day: day, pageId: pageId, read: read, record: record, summary: summary };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  /* the backup and restore pages must leave storage untouched (CI checks it), so they are never counted */
  var SKIP = { 'progress-backup': 1, 'progress-restore': 1 };
  api.SKIP = SKIP;
  if (root && root.document) { root.StudyUsage = api; try { var pid = pageId(root.location.pathname, root.location.search); if (!SKIP[pid]) record(root.localStorage, pid); } catch (e) {} }
})(typeof window !== 'undefined' ? window : null);
