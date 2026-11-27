/* Study OS offline state and update notice (27 Nov 2026). Loaded by study-theme.js on every page. Stores nothing.
   - Offline: a small "Offline" pill while the browser reports no network (study data is on this device, so practice and cards keep working;
     cloud sync, AI tutor and Gemini inbox pause until you are back online).
   - Update: when a new version of the site (sw.js) takes over a page that was already open, a bar offers Reload. Never reloads by itself,
     so an answer in progress is not lost. The page also asks the browser to look for a new version when you come back to it (at most hourly),
     because a Home Screen app on iPad can stay open for days. */
(function () {
  'use strict';
  if (typeof document === 'undefined' || window.StudyOffline) return;
  var pill = null, bar = null, hadController = !!(navigator.serviceWorker && navigator.serviceWorker.controller), lastCheck = 0;
  function mk(id, css) { var e = document.createElement('div'); e.id = id; e.setAttribute('role', 'status'); e.style.cssText = css; return e; }
  var BASE = 'position:fixed;left:50%;transform:translateX(-50%);z-index:90;font:700 13px/1.3 system-ui,-apple-system,"M PLUS Rounded 1c",sans-serif;background:#111;color:#fff;border:2px solid #fff;box-shadow:0 0 0 2px #111;border-radius:999px;padding:6px 14px;width:max-content;max-width:calc(100vw - 24px);text-align:center;white-space:nowrap;';
  function paintOffline() {
    var off = navigator.onLine === false;
    if (off && !pill) {
      pill = mk('studyOffline', BASE + 'top:max(8px,env(safe-area-inset-top));');
      pill.textContent = 'Offline';
      pill.title = 'Your study data is saved on this device. Practice and cards keep working. Cloud sync, AI tutor and Drive questions wait until you are online.';
      document.body.appendChild(pill);
    } else if (!off && pill) { pill.remove(); pill = null; }
    document.documentElement.toggleAttribute('data-offline', off);
  }
  function showUpdate() {
    if (bar || !document.body) return;
    bar = mk('studyUpdate', BASE + 'top:calc(max(8px,env(safe-area-inset-top)) + 38px);display:flex;gap:10px;align-items:center;');
    var t = document.createElement('span'); t.textContent = 'New version';
    var r = document.createElement('button'), l = document.createElement('button');
    var BT = 'min-height:32px;padding:0 12px;border-radius:999px;border:2px solid #fff;font:inherit;cursor:pointer;';
    r.type = l.type = 'button'; r.textContent = 'Reload'; l.textContent = 'Later';
    r.style.cssText = BT + 'background:#fff;color:#111;'; l.style.cssText = BT + 'background:none;color:#fff;';
    r.onclick = function () { location.reload(); };
    l.onclick = function () { bar.remove(); bar = null; };
    bar.appendChild(t); bar.appendChild(r); bar.appendChild(l); document.body.appendChild(bar);
  }
  function checkForUpdate() {
    var now = Date.now();
    if (!navigator.serviceWorker || now - lastCheck < 3600000) return;
    lastCheck = now;
    navigator.serviceWorker.getRegistration().then(function (reg) { if (reg && reg.update) return reg.update(); }).catch(function () {});
  }
  function init() {
    paintOffline();
    window.addEventListener('online', paintOffline); window.addEventListener('offline', paintOffline);
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('controllerchange', function () { if (hadController) showUpdate(); hadController = true; });
      document.addEventListener('visibilitychange', function () { if (!document.hidden) checkForUpdate(); });
      checkForUpdate();
    }
  }
  window.StudyOffline = { paint: paintOffline, showUpdate: showUpdate };
  if (document.body) init(); else document.addEventListener('DOMContentLoaded', init);
})();
