/* Study OS note images: paste or pick pictures into a note.
   - A note lists its pictures as ids in studyos.notes.v1 (`imgs`, newest last), so the list is backed up and syncs with the note.
   - The pictures themselves (shrunk to at most 1400 px, JPEG) live in IndexedDB `studyos-note-images-v1` on this device
     and are uploaded to the owner's sync Worker (`/img/<id>`, id = first 32 hex of SHA-256 of the data URL), then fetched
     on other devices when a note needs them. Nothing is sent without the sync key.
   - Pages call StudyNoteImages.mount(host, getKey, textarea): host gets an "Add image" button and the thumbnails; pasting an
     image into the textarea adds it too. Call .refresh(host) after the note key changes. */
(function (root) {
  'use strict';
  var NOTES = 'studyos.notes.v1', DB = 'studyos-note-images-v1', STORE = 'img', MAXSIDE = 1400, MAXN = 40, ID = /^[a-f0-9]{32}$/;
  function validIds(a) { return Array.isArray(a) ? a.filter(function (x) { return typeof x === 'string' && ID.test(x); }).slice(-MAXN) : []; }
  /* keep a note's pictures when its text is saved; drop the entry only when both are empty (used by every note writer) */
  function withText(old, text, updated) {
    var imgs = validIds(old && old.imgs);
    if (!String(text || '').trim() && !imgs.length) return null;
    var n = { text: String(text || ''), updated: updated };
    if (imgs.length) n.imgs = imgs;
    return n;
  }
  if (typeof window === 'undefined') { module.exports = { withText: withText, validIds: validIds }; return; }

  function all() { try { var o = JSON.parse(localStorage.getItem(NOTES) || '{}'); return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; } catch (e) { return {}; } }
  function idsOf(key) { var n = all()[key]; return validIds(n && n.imgs); }
  function setIds(key, ids) {
    var notes = all(), n = notes[key] || { text: '' };
    n = Object.assign({}, n, { updated: new Date().toISOString() });
    ids = validIds(ids); if (ids.length) n.imgs = ids; else delete n.imgs;
    if (!String(n.text || '').trim() && !ids.length) delete notes[key]; else notes[key] = n;
    try { localStorage.setItem(NOTES, JSON.stringify(notes)); } catch (e) { return false; }
    if (root.StudyCloud && root.StudyCloud.dirty) root.StudyCloud.dirty();
    return true;
  }
  /* ---------- IndexedDB ---------- */
  var dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise(function (res, rej) {
      if (!('indexedDB' in root)) return rej(Error('no IndexedDB'));
      var r = indexedDB.open(DB, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(STORE, { keyPath: 'id' }); };
      r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); };
    });
    return dbp;
  }
  function tx(mode, fn) { return db().then(function (d) { return new Promise(function (res, rej) { var t = d.transaction(STORE, mode), s = t.objectStore(STORE), out = fn(s); t.oncomplete = function () { res(out && out.result !== undefined ? out.result : out); }; t.onerror = function () { rej(t.error); }; }); }); }
  function get(id) { return db().then(function (d) { return new Promise(function (res) { var r = d.transaction(STORE).objectStore(STORE).get(id); r.onsuccess = function () { res(r.result || null); }; r.onerror = function () { res(null); }; }); }); }
  function put(rec) { return tx('readwrite', function (s) { s.put(rec); }); }
  function pending() { return db().then(function (d) { return new Promise(function (res) { var out = [], r = d.transaction(STORE).objectStore(STORE).openCursor(); r.onsuccess = function () { var c = r.result; if (!c) return res(out); if (!c.value.up) out.push(c.value); c.continue(); }; r.onerror = function () { res(out); }; }); }); }
  /* ---------- images ---------- */
  function sha32(text) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('').slice(0, 32);
    });
  }
  function shrink(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        var s = Math.min(1, MAXSIDE / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.naturalWidth * s)); c.height = Math.max(1, Math.round(img.naturalHeight * s));
        var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
        var q = 0.8, out = c.toDataURL('image/jpeg', q);
        while (out.length > 1400000 && q > 0.35) { q -= 0.15; out = c.toDataURL('image/jpeg', q); }
        res(out);
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(Error('Could not read the image')); };
      img.src = url;
    });
  }
  function add(key, file) {
    if (!key || !file || !/^image\//.test(file.type)) return Promise.resolve(false);
    if (idsOf(key).length >= MAXN) return Promise.reject(Error('A note holds up to ' + MAXN + ' pictures'));
    return shrink(file).then(function (data) {
      return sha32(data).then(function (id) {
        return put({ id: id, data: data, up: false, at: Date.now() }).then(function () {
          var ids = idsOf(key).filter(function (x) { return x !== id; }); ids.push(id);
          setIds(key, ids); upload(); return id;
        });
      });
    });
  }
  function remove(key, id) { return setIds(key, idsOf(key).filter(function (x) { return x !== id; })); }
  /* ---------- sync with the Worker (only with progress_api and the sync key, through StudyCloud) ---------- */
  var busy = false;
  function creds() { return root.StudyCloud && root.StudyCloud.creds ? root.StudyCloud.creds() : Promise.resolve(null); }
  function upload() {
    if (busy) return Promise.resolve(); busy = true;
    return creds().then(function (c) {
      if (!c) return;
      return pending().then(function (list) {
        return list.reduce(function (p, r) {
          return p.then(function () {
            return fetch(c.api + '/img/' + r.id, { method: 'PUT', headers: { 'X-Sync-Key': c.key, 'Content-Type': 'text/plain' }, body: r.data })
              .then(function (x) { if (x.ok) return put(Object.assign({}, r, { up: true })); }).catch(function () {});
          });
        }, Promise.resolve());
      });
    }).catch(function () {}).then(function () { busy = false; });
  }
  function fetchMissing(id) {
    return creds().then(function (c) {
      if (!c) return null;
      return fetch(c.api + '/img/' + id, { headers: { 'X-Sync-Key': c.key }, cache: 'no-store' }).then(function (x) { return x.ok ? x.text() : null; }).then(function (data) {
        if (!data || !/^data:image\/(jpeg|png|webp);base64,/.test(data)) return null;
        return sha32(data).then(function (h) { if (h !== id) return null; return put({ id: id, data: data, up: true, at: Date.now() }).then(function () { return data; }); });
      });
    }).catch(function () { return null; });
  }
  function load(id) { return get(id).then(function (r) { return r ? r.data : fetchMissing(id); }).catch(function () { return fetchMissing(id); }); }
  /* ---------- UI ---------- */
  var CSS = '.ni{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px 12px}'
    + '.ni[hidden]{display:none}'
    + '.ni .ni-add{min-height:40px;padding:0 12px;border:2.5px solid var(--ink,currentColor);border-radius:6px;background:transparent;color:inherit;font:700 14px inherit;cursor:pointer;display:inline-flex;align-items:center;gap:6px}'
    + '.ni .ni-add svg{width:18px;height:18px}'
    + '.ni .ni-t{position:relative;width:min(100%,520px);min-height:72px;border:2px solid var(--ink,currentColor);border-radius:6px;overflow:hidden;background:#fff;padding:0;cursor:zoom-in}'
    + '.ni .ni-t img{width:100%;height:auto;max-height:300px;object-fit:contain;display:block;cursor:zoom-in}'
    + '.ni .ni-t.miss{display:grid;place-items:center;height:72px;font-size:11px;color:#777;cursor:default}'
    + '.ni .ni-x{position:absolute;top:2px;right:2px;box-sizing:border-box;width:24px!important;height:24px!important;min-width:0!important;min-height:0!important;margin:0;border-radius:50%!important;border:0!important;background:rgba(0,0,0,.65)!important;color:#fff!important;font:700 15px/24px system-ui!important;cursor:pointer;padding:0!important;display:block}'
    + '.ni .ni-s{font-size:12px;opacity:.75}'
    + '#niView{position:fixed;inset:0;z-index:120;background:rgba(0,0,0,.88);display:grid;place-items:center;padding:16px;cursor:zoom-out}'
    + '#niView img{max-width:100%;max-height:100%;object-fit:contain;background:#fff}'
    + '@media print{.ni .ni-add,.ni .ni-x{display:none}}';
  var CAM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="15" rx="2"/><circle cx="12" cy="12.5" r="3.5"/><path d="M8 5l1.5-2h5L16 5"/></svg>';
  function css() { if (document.getElementById('niCss')) return; var s = document.createElement('style'); s.id = 'niCss'; s.textContent = CSS; document.head.appendChild(s); }
  function view(src) { var v = document.createElement('div'); v.id = 'niView'; v.setAttribute('role', 'dialog'); v.setAttribute('aria-label', 'Picture'); v.innerHTML = '<img alt="Note picture">'; v.firstChild.src = src; v.onclick = function () { v.remove(); }; document.addEventListener('keydown', function k(e) { if (e.key === 'Escape') { v.remove(); document.removeEventListener('keydown', k); } }); document.body.appendChild(v); }
  function render(host) {
    var key = host.__niKey ? host.__niKey() : '', ids = key ? idsOf(key) : [];
    host.innerHTML = '';
    var pick = document.createElement('input'); pick.type = 'file'; pick.accept = 'image/*'; pick.multiple = true; pick.hidden = true;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'ni-add'; b.innerHTML = CAM + '<span>Add image</span>'; b.title = 'Add a picture (you can also paste one into the note)';
    b.onclick = function () { pick.click(); };
    pick.onchange = function () { var fs = Array.prototype.slice.call(pick.files || []); pick.value = ''; addMany(host, fs); };
    host.append(b, pick);
    ids.forEach(function (id) {
      var t = document.createElement('div'); t.className = 'ni-t';
      var x = document.createElement('button'); x.type = 'button'; x.className = 'ni-x'; x.setAttribute('aria-label', 'Remove picture'); x.textContent = '×';
      x.onclick = function (e) { e.stopPropagation(); if (root.confirm('Remove this picture from the note?')) { remove(key, id); render(host); } };
      t.appendChild(x); host.appendChild(t);
      load(id).then(function (src) {
        if (!src) { t.classList.add('miss'); t.insertAdjacentText('afterbegin', 'Not synced yet'); return; }
        var im = new Image(); im.alt = 'Note picture (tap to enlarge)'; im.loading = 'lazy'; im.src = src; im.tabIndex = 0; im.onclick = function () { view(src); }; im.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); view(src); } }; t.insertBefore(im, x);
      });
    });
  }
  function addMany(host, files) {
    var key = host.__niKey(), s = document.createElement('span'); s.className = 'ni-s'; s.textContent = 'Adding…'; host.appendChild(s);
    return files.reduce(function (p, f) { return p.then(function () { return add(key, f); }); }, Promise.resolve())
      .then(function () { render(host); }, function (e) { s.textContent = String(e && e.message || e); });
  }
  function mount(host, getKey, textarea) {
    css(); host.classList.add('ni'); host.__niKey = getKey; render(host);
    if (textarea) textarea.addEventListener('paste', function (e) {
      var items = Array.prototype.slice.call((e.clipboardData && e.clipboardData.files) || []).filter(function (f) { return /^image\//.test(f.type); });
      if (!items.length) return;
      e.preventDefault(); addMany(host, items);
    });
    return host;
  }
  addEventListener('studycloud:applied', function () { document.querySelectorAll('.ni').forEach(function (h) { if (h.__niKey) render(h); }); upload(); });
  setTimeout(upload, 3000);
  root.StudyNoteImages = { mount: mount, refresh: render, add: add, withText: withText, validIds: validIds, upload: upload };
})(typeof window !== 'undefined' ? window : this);
