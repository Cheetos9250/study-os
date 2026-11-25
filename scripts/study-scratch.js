/* Study OS scratchpad (owner, 22 Nov 2026): handwritten working space under each practice question (acc, eco, math).
   Drawn with Apple Pencil, finger or mouse. Saved per question in localStorage `studyos.scratch.v1`:
     { "<course>:<question id>": [ stroke, ... ] }   stroke = [width, x0, y0, x1, y1, ...]
   Coordinates are on a fixed 1000 x 400 board, so strokes scale with the screen. Ink colour follows the theme when drawn,
   it is not stored. Backed up and restored with the other progress keys; not cloud-synced.
   Pure helpers (clean, load, save) work without a DOM so they can be tested. */
(function (root) {
  'use strict';
  var KEY = 'studyos.scratch.v1', W = 1000, H = 400, MAXSTROKES = 300, MAXNUMS = 24000, MAXQ = 600, MAXBYTES = 1500000;
  function num(n) { return typeof n === 'number' && isFinite(n); }
  /* keep only well-formed strokes (also used to read old or restored data safely) */
  function clean(list) {
    if (!Array.isArray(list)) return [];
    var out = [], total = 0;
    for (var i = 0; i < list.length && out.length < MAXSTROKES; i++) {
      var s = list[i];
      if (!Array.isArray(s) || s.length < 3 || s.length % 2 === 0 || s.length > 6000) continue;
      if (!s.every(num)) continue;
      if (s[0] < 0.5 || s[0] > 40) continue;
      if (s.slice(1).some(function (v) { return v < -100 || v > 2000; })) continue;
      total += s.length; if (total > MAXNUMS) break;
      out.push(s);
    }
    return out;
  }
  function readAll(store) {
    try { var o = JSON.parse(store.getItem(KEY) || '{}'); return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; } catch (e) { return {}; }
  }
  function load(store, id) { return clean(readAll(store)[id]); }
  /* write one question's strokes and keep every other question; returns false when the browser refuses (storage full) */
  function save(store, id, strokes) {
    var all = readAll(store), list = clean(strokes);
    if (list.length) all[id] = list; else delete all[id];
    var keys = Object.keys(all); if (keys.length > MAXQ) return false;
    var text = JSON.stringify(all); if (text.length > MAXBYTES) return false;
    try { if (keys.length) store.setItem(KEY, text); else store.removeItem(KEY); return true; } catch (e) { return false; }
  }
  var api = { KEY: KEY, W: W, H: H, clean: clean, load: load, save: save, MAXSTROKES: MAXSTROKES, MAXNUMS: MAXNUMS, MAXQ: MAXQ };
  if (typeof document === 'undefined') { if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.StudyScratch = api; return; }

  /* ---------- UI ---------- */
  var CSS = '.scr{margin:12px 0 4px;border:2px solid var(--line,currentColor);border-radius:12px;overflow:hidden}'
    + '.scr-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:6px 8px;border-bottom:2px solid var(--line,currentColor)}'
    + '.scr-bar .btn{min-height:40px;padding:0 12px}.scr-bar .on{outline:3px solid var(--ink,currentColor);outline-offset:-3px}'
    + '.scr-s{margin-left:auto;font-size:12px;opacity:.75}'
    + '.scr canvas{display:block;width:100%;aspect-ratio:1000/400;background:repeating-linear-gradient(transparent 0 39px,rgba(127,127,127,.22) 39px 40px);touch-action:none;cursor:crosshair}'
    + '@media print{.scr{display:none}}';
  function css() { if (document.getElementById('scrCss')) return; var s = document.createElement('style'); s.id = 'scrCss'; s.textContent = CSS; document.head.appendChild(s); }
  var open = false, penSeen = false;
  var HAS_TT = typeof Touch !== 'undefined' && !!Touch.prototype && 'touchType' in Touch.prototype;

  function draw(cv, strokes) {
    var ctx = cv.getContext('2d'), k = cv.width / W; ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = getComputedStyle(cv).color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    strokes.forEach(function (s) {
      ctx.lineWidth = s[0] * k; ctx.beginPath(); ctx.moveTo(s[1] * k, s[2] * k);
      if (s.length === 3) ctx.lineTo(s[1] * k + 0.1, s[2] * k);
      else { for (var i = 3; i < s.length - 2; i += 2) ctx.quadraticCurveTo(s[i] * k, s[i + 1] * k, (s[i] + s[i + 2]) / 2 * k, (s[i + 1] + s[i + 3]) / 2 * k); ctx.lineTo(s[s.length - 2] * k, s[s.length - 1] * k); }
      ctx.stroke();
    });
  }
  function hit(s, x, y, r) { for (var i = 1; i < s.length; i += 2) { var dx = s[i] - x, dy = s[i + 1] - y; if (dx * dx + dy * dy <= r * r) return true; } return false; }

  /* host: empty element; id: "<course>:<question id>"; onChange(hasInk): lets the caller update its button */
  function mount(host, id, onChange) {
    css(); host.className = 'scr'; host.innerHTML = '';
    var strokes = load(localStorage, id), tool = 'pen', cur = null, timer = null, fingerSet = false;
    var fingerDraw = !penSeen;
    var bar = document.createElement('div'); bar.className = 'scr-bar';
    function btn(t, fn) { var b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.textContent = t; b.onclick = fn; bar.appendChild(b); return b; }
    var status = document.createElement('span'); status.className = 'scr-s'; status.textContent = 'Saved on this device';
    var pen = btn('Pen', function () { tool = 'pen'; mark(); }), era = btn('Eraser', function () { tool = 'eraser'; mark(); });
    var fb = btn('', function () { fingerDraw = !fingerDraw; fingerSet = true; fbtn(); });
    btn('Undo', function () { strokes.pop(); persist(); redraw(); });
    btn('Clear', function () { if (!strokes.length || confirm('Clear the scratchpad for this question?')) { strokes = []; persist(); redraw(); } });
    bar.appendChild(status);
    function fbtn() { fb.textContent = fingerDraw ? 'Finger: draws' : 'Finger: scrolls'; fb.title = 'With a pencil, fingers scroll the page. Tap to let fingers draw.'; fb.classList.toggle('on', fingerDraw); } 
    function mark() { pen.classList.toggle('on', tool === 'pen'); era.classList.toggle('on', tool === 'eraser'); } mark(); fbtn();
    var cv = document.createElement('canvas'); cv.setAttribute('aria-label', 'Scratchpad: draw your working here');
    host.append(bar, cv);
    function size() { var w = Math.max(300, Math.round(cv.clientWidth * (window.devicePixelRatio || 1))); if (cv.width !== w) { cv.width = w; cv.height = Math.round(w * H / W); } }
    function redraw() { size(); draw(cv, strokes.concat(Array.isArray(cur) ? [cur] : [])); }
    function persist() { clearTimeout(timer); timer = setTimeout(function () { var ok = save(localStorage, id, strokes); status.textContent = ok ? 'Saved on this device' : 'Not saved (storage is full)'; }, 250); if (onChange) onChange(strokes.length > 0); }
    function pt(e) { var r = cv.getBoundingClientRect(); return [Math.round((e.clientX - r.left) / r.width * W * 10) / 10, Math.round((e.clientY - r.top) / r.height * H * 10) / 10]; }
    /* Drawing core: pencil, finger (until a pencil is used) and mouse all go through start/move/up. */
    function start(x, y, w) {
      var p = pt({ clientX: x, clientY: y });
      if (tool === 'eraser') { cur = { erase: true }; erase(p); return; }
      cur = [w, p[0], p[1]]; redraw();
    }
    function move(x, y) {
      if (!cur) return; var p = pt({ clientX: x, clientY: y });
      if (cur.erase) return erase(p);
      var n = cur.length; if (n >= 3 && Math.abs(cur[n - 2] - p[0]) + Math.abs(cur[n - 1] - p[1]) < 1.5) return;
      if (cur.length < 5900) cur.push(p[0], p[1]); redraw();
    }
    function erase(p) { var n = strokes.length; strokes = strokes.filter(function (s) { return !hit(s, p[0], p[1], 14); }); if (strokes.length !== n) { persist(); redraw(); } }
    function up() { if (!cur) return; if (!cur.erase) { strokes.push(cur); persist(); } cur = null; curId = null; redraw(); }
    var curId = null;
    if (HAS_TT) {
      /* Safari on iPad: the Apple Pencil is a touch with touchType "stylus". Cancelling its touch events stops the page from
         scrolling while you write, and fingers are left alone so they scroll the page (like GoodNotes). */
      cv.style.touchAction = 'auto';
      cv.addEventListener('touchstart', function (e) {
        var st = null, any = e.changedTouches[0];
        for (var i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].touchType === 'stylus') st = e.changedTouches[i];
        if (st) { penSeen = true; if (!fingerSet) fingerDraw = false; fbtn(); e.preventDefault(); if (cur) up(); curId = st.identifier; start(st.clientX, st.clientY, Math.max(1.5, 1.2 + (st.force || 0.4) * 2.6)); return; }
        if (cur) { e.preventDefault(); return; } /* a palm resting while the pencil writes */
        if (fingerDraw) { e.preventDefault(); curId = any.identifier; start(any.clientX, any.clientY, 2.2); }
      }, { passive: false });
      cv.addEventListener('touchmove', function (e) {
        if (!cur) return; e.preventDefault();
        for (var i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === curId) move(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
      }, { passive: false });
      var tend = function (e) { if (!cur) return; for (var i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === curId) { e.preventDefault(); up(); } };
      cv.addEventListener('touchend', tend, { passive: false }); cv.addEventListener('touchcancel', tend, { passive: false });
      cv.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; e.preventDefault(); cv.setPointerCapture(e.pointerId); start(e.clientX, e.clientY, 2.2); });
    } else {
      cv.style.touchAction = 'none';
      cv.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'pen') { penSeen = true; if (!fingerSet) fingerDraw = false; fbtn(); }
        if (e.pointerType === 'touch' && !fingerDraw) return;
        e.preventDefault(); cv.setPointerCapture(e.pointerId);
        start(e.clientX, e.clientY, e.pointerType === 'pen' ? Math.max(1.5, 1.2 + (e.pressure || 0.5) * 2.4) : 2.2);
      });
    }
    cv.addEventListener('pointermove', function (e) { if (!cur || (HAS_TT && e.pointerType !== 'mouse')) return; e.preventDefault(); var evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e]; if (!evs.length) evs = [e]; evs.forEach(function (ev) { move(ev.clientX, ev.clientY); }); });
    cv.addEventListener('pointerup', function (e) { if (!HAS_TT || e.pointerType === 'mouse') up(); });
    cv.addEventListener('pointercancel', function (e) { if (!HAS_TT || e.pointerType === 'mouse') up(); });
    if (window.ResizeObserver) new ResizeObserver(redraw).observe(cv); else setTimeout(redraw, 0);
    setTimeout(redraw, 0);
    return { has: function () { return strokes.length > 0; } };
  }
  api.mount = mount; api.isOpen = function () { return open; }; api.setOpen = function (v) { open = !!v; };
  api.has = function (id) { return load(localStorage, id).length > 0; };
  root.StudyScratch = api;
})(typeof window !== 'undefined' ? window : globalThis);
