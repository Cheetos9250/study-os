/* How full this device's localStorage is (28 Nov 2026). Safari gives a site about 5 MB of localStorage; when it is
   full, new answers cannot be saved. Pure read: it only measures key and value lengths, never parses, changes or
   sends any data. Stores nothing (the "dismissed" flag is sessionStorage, this visit only).
   - StudyStorage.usage(storage) → { bytes, limit, ratio, top: [[key, bytes], …] } (bytes = UTF-16, 2 per character,
     which is how WebKit counts its quota, so the number is on the safe side).
   - Loaded by scripts/study-nav.js on every page: above WARN (80 %) it shows one small dismissible bar with a link to
     progress-backup.html#storage, where the full meter lives. */
(function (root) {
  'use strict';
  var LIMIT = 5 * 1024 * 1024, WARN = 0.8, SKEY = 'studyos.storage.warned';
  function usage(store) {
    var out = { bytes: 0, limit: LIMIT, ratio: 0, top: [] }, rows = [];
    try {
      for (var i = 0; i < store.length; i++) {
        var k = store.key(i); if (k == null) continue;
        var v = store.getItem(k) || '', b = (k.length + v.length) * 2;
        out.bytes += b; rows.push([k, b]);
      }
    } catch (e) { return out; }
    rows.sort(function (a, b) { return b[1] - a[1]; });
    out.top = rows.slice(0, 8); out.ratio = out.bytes / LIMIT;
    return out;
  }
  function fmt(b) { return b >= 1048576 ? (b / 1048576).toFixed(2) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
  function warn(doc, win) {
    try {
      if (win.sessionStorage.getItem(SKEY)) return null;
      var u = usage(win.localStorage); if (u.ratio < WARN) return null;
      var bar = doc.createElement('div'); bar.className = 'storage-warn'; bar.setAttribute('role', 'status');
      bar.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(76px + env(safe-area-inset-bottom));z-index:60;max-width:560px;margin:0 auto;display:flex;gap:10px;align-items:center;padding:10px 12px;border:2px solid currentColor;border-radius:10px;background:var(--panel,#fff);color:var(--ink,#16161b);font:600 14px/1.35 system-ui,sans-serif';
      var t = doc.createElement('span'); t.style.flex = '1';
      t.textContent = 'Storage on this device is ' + Math.round(u.ratio * 100) + '% full (' + fmt(u.bytes) + ' of about 5 MB). Back up now; new answers may not save when it is full.';
      var a = doc.createElement('a'); a.href = 'progress-backup.html#storage'; a.textContent = 'See what uses it';
      a.style.cssText = 'min-height:44px;display:inline-flex;align-items:center;font-weight:700';
      var x = doc.createElement('button'); x.type = 'button'; x.textContent = '✕'; x.setAttribute('aria-label', 'Dismiss');
      x.style.cssText = 'min-width:44px;min-height:44px;border:0;background:none;color:inherit;font-size:18px';
      x.onclick = function () { try { win.sessionStorage.setItem(SKEY, '1'); } catch (e) {} bar.remove(); };
      bar.appendChild(t); bar.appendChild(a); bar.appendChild(x); doc.body.appendChild(bar);
      return bar;
    } catch (e) { return null; }
  }
  var api = { usage: usage, fmt: fmt, warn: warn, LIMIT: LIMIT, WARN: WARN };
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) {
    root.StudyStorage = api;
    var go = function () { if (!/progress-backup\.html$/.test(root.location.pathname)) warn(root.document, root); };
    if (root.document.body) go(); else root.document.addEventListener('DOMContentLoaded', go);
  }
})(typeof window !== 'undefined' ? window : null);
