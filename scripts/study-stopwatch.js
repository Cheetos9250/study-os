/* Practice stopwatch (owner, 24 Nov 2026): a small pill at the top right of acc/eco/math practice.
   Tap to start / pause, the ↺ button resets. Shows the time and how many questions were answered since the start
   (counted from the page's own answers in study-<course>; read-only). Stores nothing. */
(function () {
  'use strict';
  if (!/[?&]tab=prac\b/.test(location.search) || typeof D === 'undefined' || !D || !D.key) return;
  var KEY = 'study-' + D.key, base = 0, startAt = 0, running = false, ans0 = 0, tick = 0;
  function answered() { try { var s = JSON.parse(localStorage.getItem(KEY) || '{}'); return Object.keys((s && s.ans) || {}).length; } catch (e) { return 0; } }
  function elapsed() { return base + (running ? Date.now() - startAt : 0); }
  function fmt(ms) { var t = Math.floor(ms / 1000), h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, s = t % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : String(m).padStart(2, '0')) + ':' + String(s).padStart(2, '0'); }
  var st = document.createElement('style');
  st.textContent = '#swBox{position:fixed;z-index:71;top:calc(12px + env(safe-area-inset-top));right:max(16px,env(safe-area-inset-right));display:flex;gap:6px;align-items:center}'
    + '#swBox button{min-height:44px;border:2px solid var(--ink,#16161b);border-radius:999px;background:var(--paper,#fff);color:var(--ink,#16161b);font:800 15px var(--ui,system-ui);padding:0 14px;cursor:pointer;font-variant-numeric:tabular-nums}'
    + '#swBox button.on{background:var(--ink,#16161b);color:var(--paper,#fff)}#swBox #swReset{padding:0;width:44px}';
  document.head.appendChild(st);
  var box = document.createElement('div'); box.id = 'swBox';
  box.innerHTML = '<button type="button" id="swMain" aria-label="Start stopwatch">⏱ Timer</button><button type="button" id="swReset" aria-label="Reset stopwatch" hidden>↺</button>';
  document.body.appendChild(box);
  var main = box.querySelector('#swMain'), reset = box.querySelector('#swReset');
  function paint() {
    var n = Math.max(0, answered() - ans0), ms = elapsed();
    if (!running && !ms) { main.textContent = '⏱ Timer'; main.classList.remove('on'); reset.hidden = true; return; }
    main.textContent = (running ? '⏸ ' : '▶ ') + fmt(ms) + ' · ' + n + ' q' + (n && ms > 60000 ? ' · ' + Math.round(ms / 1000 / n) + 's/q' : '');
    main.classList.toggle('on', running); reset.hidden = false;
    main.setAttribute('aria-label', (running ? 'Pause' : 'Resume') + ' stopwatch, ' + fmt(ms) + ', ' + n + ' questions');
  }
  main.onclick = function () {
    if (running) { base = elapsed(); running = false; clearInterval(tick); }
    else { if (!base) ans0 = answered(); startAt = Date.now(); running = true; tick = setInterval(paint, 1000); }
    paint();
  };
  reset.onclick = function () { running = false; base = 0; clearInterval(tick); paint(); };
  paint();
})();
