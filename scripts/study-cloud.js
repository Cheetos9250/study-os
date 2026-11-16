/* Study OS cloud sync for the core pages (Today, Calendar, Practice, …).
   Syncs every course (quiz answers, review schedule, flashcards) and the planner settings
   (studyos.today.v1: exams, plan ticks, timetable) with the owner's own Progress Worker
   (data/config.json → progress_api). Compare-and-set: every write sends If-Match with the revision
   it read, retries on conflict, and merges item by item, so two devices never overwrite each other.
   Local data is always written first by the pages; this script only merges and fills in.
   Storage it adds (not backed up, like the other study-sync-* keys):
   - study-sync-today-base-v1: the planner settings as last synced, for a three-way merge;
   - study-sync-last-v1: time and result of the last sync. */
(function (root) {
  'use strict';
  var PROGRESS_LSK = 'study-sync-progress-key-v1', AUTOK = 'study-sync-auto-v1',
      BASEK = 'study-sync-today-base-v1', LASTK = 'study-sync-last-v1', TODAYK = 'studyos.today.v1', NOTESK = 'studyos.notes.v1',
      MAXB = 340000;
  var J = function (v) { return JSON.stringify(v === undefined ? null : v); };
  var obj = function (v) { return !!v && typeof v === 'object' && !Array.isArray(v); };

  /* ---------- pure merges (exported for tests) ---------- */
  /* course progress: the same rules as the course pages' own sync engine, plus the review schedule */
  function mergeCourse(a, b) {
    var A = a.study || {}, B = b.study || {}, out = { study: { ans: {}, ats: {}, rst: 0, known: [], rv: {} }, srs: { s: {}, m: { day: 0, newDone: 0 } } };
    var rst = Math.max(A.rst || 0, B.rst || 0); out.study.rst = rst;
    var ids = {}; Object.keys(A.ans || {}).concat(Object.keys(B.ans || {})).forEach(function (id) { ids[id] = 1; });
    Object.keys(ids).forEach(function (id) {
      var ha = A.ans && A.ans[id] !== undefined, hb = B.ans && B.ans[id] !== undefined;
      var ta = (A.ats || {})[id] || 0, tb = (B.ats || {})[id] || 0;
      var useA = ha && (!hb || ta >= tb), t = useA ? ta : tb;
      if (rst && t < rst) return;
      out.study.ans[id] = useA ? A.ans[id] : B.ans[id]; out.study.ats[id] = t;
      var rv = useA ? (A.rv || {})[id] : (B.rv || {})[id]; if (rv) out.study.rv[id] = rv;
    });
    var known = {}; (A.known || []).concat(B.known || []).forEach(function (k) { known[k] = 1; });
    out.study.known = Object.keys(known);
    var SA = (a.srs || {}).s || {}, SB = (b.srs || {}).s || {};
    Object.keys(SA).concat(Object.keys(SB)).forEach(function (id) {
      var x = SA[id], y = SB[id];
      out.srs.s[id] = !x ? y : !y ? x : ((x.ts || 0) >= (y.ts || 0) ? x : y);
    });
    var MA = (a.srs || {}).m || { day: 0, newDone: 0 }, MB = (b.srs || {}).m || { day: 0, newDone: 0 };
    out.srs.m = MA.day > MB.day ? MA : MB.day > MA.day ? MB : { day: MA.day, newDone: Math.max(MA.newDone || 0, MB.newDone || 0) };
    return out;
  }
  /* three-way merge of one map: keep the side that changed since the last sync; if both changed, this device wins */
  function merge3map(base, local, remote) {
    var out = {}, seen = {}, keys = Object.keys(remote).concat(Object.keys(local));
    keys.forEach(function (k) {
      if (seen[k]) return; seen[k] = 1;
      var hasB = base && Object.prototype.hasOwnProperty.call(base, k), hasL = Object.prototype.hasOwnProperty.call(local, k), hasR = Object.prototype.hasOwnProperty.call(remote, k);
      var b = hasB ? J(base[k]) : null, l = hasL ? J(local[k]) : null, r = hasR ? J(remote[k]) : null;
      if (!hasB) { out[k] = hasL ? local[k] : remote[k]; return; }               // new on one side (or first sync)
      if (!hasL) { if (r !== b) out[k] = remote[k]; return; }                    // deleted here: keep only a remote edit
      if (!hasR) { if (l !== b) out[k] = local[k]; return; }                     // deleted there: keep only a local edit
      out[k] = l === b ? remote[k] : local[k];
    });
    return out;
  }
  /* notes ({key: {text, updated}}): three-way per note; if both devices edited the same note, the newer edit wins */
  function mergeNotes(base, local, remote) {
    var out = merge3map(base, local, remote);
    Object.keys(out).forEach(function (k) {
      var l = local[k], r = remote[k], b = base && base[k];
      if (l && r && J(l) !== J(r) && (!b || (J(l) !== J(b) && J(r) !== J(b))))
        out[k] = String(r.updated || '') > String(l.updated || '') ? r : l;
    });
    return out;
  }
  function byId(list) { var m = {}; (list || []).forEach(function (x) { if (x && x.id) m[x.id] = x; }); return m; }
  function values(m) { return Object.keys(m).map(function (k) { return m[k]; }); }
  /* planner settings: exams and timetable merge per entry id; plan ticks per day; reminders per key */
  function mergeToday(base, local, remote) {
    var b = base || null, out = {};
    ['exams', 'timetable'].forEach(function (k) {
      if (!Array.isArray(remote[k])) { out[k] = local[k]; return; }
      out[k] = values(merge3map(b && Array.isArray(b[k]) ? byId(b[k]) : null, byId(local[k]), byId(remote[k])));
    });
    ['done', 'tasks'].forEach(function (k) {
      out[k] = merge3map(b && obj(b[k]) ? b[k] : null, obj(local[k]) ? local[k] : {}, obj(remote[k]) ? remote[k] : {});
    });
    return out;
  }

  /* ---------- browser part ---------- */
  if (typeof window === 'undefined') { module.exports = { mergeCourse: mergeCourse, mergeToday: mergeToday, merge3map: merge3map, mergeNotes: mergeNotes }; return; }
  var T = root.StudyToday;
  var ls = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  };
  var api = '', ready = null, busy = false, dirtyTimer = null, status = null, listeners = [];
  function cfg() {
    if (ready) return ready;
    ready = fetch('data/config.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : {}; }).then(function (j) {
      var original = String(j.api || '').replace(/\/+$/, ''), next = String(j.progress_api || '').replace(/\/+$/, '');
      api = next && next !== original ? next : '';                                  // never the legacy study-api Worker
      return api;
    }).catch(function () { return ''; });
    return ready;
  }
  function key() {
    try { var e = JSON.parse(ls.get(PROGRESS_LSK) || 'null'); return e && e.endpoint === api && typeof e.key === 'string' ? e.key.trim() : ''; }
    catch (e) { return ''; }
  }
  var autoOn = function () { var v = ls.get(AUTOK); if (v === null && key()) { ls.set(AUTOK, '1'); return true; } return v === '1'; };
  function last() { try { return JSON.parse(ls.get(LASTK) || 'null'); } catch (e) { return null; } }
  function note(ok, msg) { status = { t: Date.now(), ok: ok, msg: msg || '' }; ls.set(LASTK, J(status)); listeners.forEach(function (f) { try { f(status); } catch (e) {} }); }
  function subjects() {
    var list = [{ id: 'today' }];
    (T ? T.COURSES.concat(T.LANGS) : []).forEach(function (c) { if (c.key && c.mark) list.push({ id: c.key, mark: c.mark }); });
    return list;
  }
  function readCourse(s) {
    var rs = ls.get('study-' + s.id), rf = ls.get(s.mark + '-srs'), st = {}, sr = {};
    try { st = JSON.parse(rs || '{}') || {}; } catch (e) {}
    try { sr = JSON.parse(rf || '{}') || {}; } catch (e) {}
    return { raw: J([rs, rf]), st: st, sr: sr,
      value: { study: { ans: st.ans || {}, ats: st.ats || {}, rst: st.rst || 0, known: st.known || [], rv: st.rv || {} }, srs: { s: sr.s || {}, m: sr.m || { day: 0, newDone: 0 } } } };
  }
  function writeCourse(s, cur, merged) {
    var st = Object.assign({}, cur.st, { ans: merged.study.ans, ats: merged.study.ats, rst: merged.study.rst, known: merged.study.known, rv: merged.study.rv });
    var sr = Object.assign({}, cur.sr, { s: merged.srs.s, m: merged.srs.m });
    if (J(cur.value.study) !== J(merged.study)) ls.set('study-' + s.id, J(st));
    if (J(cur.value.srs) !== J(merged.srs) && (Object.keys(merged.srs.s).length || cur.sr.s)) ls.set(s.mark + '-srs', J(sr));
  }
  function syncOne(s) {
    var url = api + '/progress/' + s.id, hdr = { 'X-Sync-Key': key(), 'Content-Type': 'application/json' }, attempt = 0;
    function round() {
      if (++attempt > 6) throw Error('data kept changing; try again');
      return fetch(url, { headers: hdr, cache: 'no-store' }).then(function (r) {
        if (r.status === 401) { var e = Error('wrong sync key'); e.auth = true; throw e; }
        if (!r.ok) throw Error('read failed (HTTP ' + r.status + ')');
        var rev = r.headers.get('X-Sync-Revision') || '';
        if (!/^"[0-9]+"$/.test(rev)) throw Error('server sent no revision; nothing was written');
        return r.json().then(function (remote) {
          if (!obj(remote)) throw Error('server data is invalid');
          var cur, body, after;
          if (s.id === 'today') {
            var raw = ls.get(TODAYK), local = T.loadSettings(raw), base = null, nraw = ls.get(NOTESK), lnotes = {};
            try { base = JSON.parse(ls.get(BASEK) || 'null'); } catch (e) {}
            try { var pn = JSON.parse(nraw || '{}'); if (obj(pn)) lnotes = pn; } catch (e) {}
            var rt = obj(remote.today) ? remote.today : {};
            var merged = mergeToday(base, local, rt);
            var notes = mergeNotes(base && obj(base.notes) ? base.notes : null, lnotes, obj(rt.notes) ? rt.notes : {});
            body = { today: Object.assign({}, merged, { notes: notes }) };
            if (new TextEncoder().encode(J(body)).length > MAXB) throw Error('planner and notes are over 340 KB, too large to sync');
            after = function () {
              if (ls.get(TODAYK) !== raw || ls.get(NOTESK) !== nraw) return 'retry';
              var ch = false;
              if (J(local) !== J(merged)) { ls.set(TODAYK, J(merged)); ch = true; }
              if (J(lnotes) !== J(notes)) { ls.set(NOTESK, J(notes)); ch = true; }
              ls.set(BASEK, J(body.today));
              return ch;
            };
          } else {
            cur = readCourse(s);
            var m2 = mergeCourse(cur.value, remote);
            body = m2;
            after = function () { if (readCourse(s).raw !== cur.raw) return 'retry'; writeCourse(s, cur, m2); return J(cur.value) !== J(m2); };
          }
          var same = J(remote) === J(body);
          var put = same ? Promise.resolve({ ok: true, status: 200 }) : fetch(url, { method: 'PUT', headers: Object.assign({ 'If-Match': rev }, hdr), body: J(body) });
          return put.then(function (p) {
            if (p.status === 409 || p.status === 412) return round();
            if (!p.ok) throw Error('write failed (HTTP ' + p.status + ')');
            var res = after();
            if (res === 'retry') return round();                               // this device changed meanwhile: merge again
            return res;
          });
        });
      });
    }
    return round();
  }
  function syncAll(why) {
    return cfg().then(function () {
      if (!api || !key() || busy || !T) return null;
      busy = true;
      var list = subjects(), changed = [], i = 0;
      function step() {
        if (i >= list.length) return null;
        var s = list[i++];
        return syncOne(s).then(function (c) { if (c) changed.push(s.id); return step(); });
      }
      return step().then(function () {
        busy = false; note(true);
        if (changed.length) try { root.dispatchEvent(new CustomEvent('studycloud:applied', { detail: { subjects: changed, why: why } })); } catch (e) {}
        return changed;
      }, function (e) {
        busy = false;
        if (e && e.auth) try { localStorage.removeItem(PROGRESS_LSK); } catch (x) {}
        note(false, String(e && e.message || e));
        return null;
      });
    });
  }
  function setKey() {
    var k = '';
    try { k = (root.prompt('Paste your sync key (the PROGRESS_SYNC_KEY you saved in GitHub).\n\nUse the same key on every device. It is stored only in this browser.') || '').trim(); } catch (e) {}
    if (!k) return Promise.resolve(null);
    if (!ls.set(PROGRESS_LSK, J({ endpoint: api, key: k }))) { note(false, 'could not save the key on this device'); return Promise.resolve(null); }
    ls.set(AUTOK, '1');                                                       // the owner asked for automatic sync
    return syncAll('key');
  }
  function dirty() { if (!autoOn()) return; clearTimeout(dirtyTimer); dirtyTimer = setTimeout(function () { syncAll('change'); }, 15000); }
  function ago(t) { var s = Math.round((Date.now() - t) / 1000); return s < 60 ? 'just now' : s < 3600 ? Math.round(s / 60) + ' min ago' : new Date(t).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  function label() {
    if (!api) return 'Cloud sync is not set up yet';
    if (!key()) return 'Sync key not set on this device';
    var l = status || last();
    if (busy) return 'Syncing…';
    if (!l) return autoOn() ? 'Auto sync on' : 'Auto sync off';
    return l.ok ? 'Synced ' + ago(l.t) : 'Sync failed: ' + l.msg;
  }
  /* small dialog opened from the nav's Cloud sync button */
  function open() {
    cfg().then(function () {
      var d = document.getElementById('cloudDlg');
      if (!d) {
        d = document.createElement('dialog'); d.id = 'cloudDlg';
        d.setAttribute('aria-labelledby', 'cloudTitle');
        d.style.cssText = 'max-width:min(420px,calc(100vw - 32px));border:3px solid var(--ink,#111);border-radius:10px;padding:18px 18px 16px;background:var(--panel,#fff);color:var(--text,#111);font:500 15px/1.5 var(--ui,system-ui)';
        document.body.appendChild(d);
        d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
      }
      var btn = 'min-height:44px;padding:0 14px;border:2.5px solid var(--ink,#111);border-radius:8px;background:var(--panel,#fff);color:var(--text,#111);font:700 14px var(--ui,system-ui);cursor:pointer';
      function paint() {
        var has = !!(api && key());
        d.innerHTML = '<h2 id="cloudTitle" style="margin:0 0 6px;font:700 22px var(--num,serif)">Cloud sync</h2>'
          + '<p id="cloudMsg" role="status" style="margin:0 0 12px;color:var(--muted,#555)">' + label().replace(/</g, '&lt;') + '</p>'
          + (api ? '<p style="margin:0 0 14px;font-size:13px;color:var(--muted,#555)">Quiz answers, review schedule, flashcards, notes, exams, plan ticks and the timetable sync automatically: when a page opens, after changes and every few minutes.</p>' : '<p style="margin:0 0 14px;font-size:13px;color:var(--muted,#555)">The sync server has not been switched on for this site yet.</p>')
          + '<div style="display:flex;flex-wrap:wrap;gap:8px">'
          + (api ? (has ? '<button type="button" data-a="now" style="' + btn + ';background:var(--ink,#111);color:var(--paper,#fff)">Sync now</button><button type="button" data-a="auto" aria-pressed="' + autoOn() + '" style="' + btn + '">Auto sync: ' + (autoOn() ? 'on' : 'off') + '</button><button type="button" data-a="key" style="' + btn + '">Change key</button>' : '<button type="button" data-a="key" style="' + btn + ';background:var(--ink,#111);color:var(--paper,#fff)">Set sync key</button>') : '')
          + '<button type="button" data-a="close" style="' + btn + '">Close</button></div>';
        d.querySelectorAll('button').forEach(function (b) {
          b.onclick = function () {
            var a = b.getAttribute('data-a');
            if (a === 'close') return d.close();
            if (a === 'auto') { ls.set(AUTOK, autoOn() ? '0' : '1'); return paint(); }
            var p = a === 'key' ? setKey() : syncAll('manual');
            paint(); p.then(paint);
          };
        });
      }
      paint();
      if (d.showModal && !d.open) d.showModal(); else d.setAttribute('open', '');
    });
  }
  root.StudyCloud = { open: open, syncAll: syncAll, dirty: dirty, label: label, onStatus: function (f) { listeners.push(f); }, mergeCourse: mergeCourse, mergeToday: mergeToday };
  /* automatic: on open, when the page comes back, every 5 minutes, and before the page is hidden after a change */
  cfg().then(function () {
    if (!api || !key() || !autoOn()) return;
    setTimeout(function () { syncAll('open'); }, 1500);
    setInterval(function () { if (!document.hidden) syncAll('timer'); }, 300000);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { if (dirtyTimer) { clearTimeout(dirtyTimer); dirtyTimer = null; syncAll('hide'); } }
      else { var l = last(); if (!l || Date.now() - l.t > 60000) syncAll('show'); }
    });
  });
})(typeof window !== 'undefined' ? window : this);
