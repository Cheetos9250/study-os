/* Study OS service worker: lets the site open offline (also as a Home Screen app).
   - Network first for every same-origin page, script, style, data file and image: online you always get the
     newest deploy; the copy is kept so the same file opens offline.
   - Never touches study data in browser storage (a service worker cannot read it anyway).
   - Never caches data/config.json or anything from another origin (Workers, fonts, CDNs): those go straight
     to the network, untouched.
   - New deploy: a changed sw.js installs, skips waiting and claims open pages; old caches are deleted. */
'use strict';
const VERSION = 'studyos-v1';
const CACHE = VERSION + '-files';
const CORE = [
  './', 'index.html', 'flashcards.html', 'practice.html', 'hub.html', 'calendar.html', 'grades.html', 'stats.html',
  'acc.html', 'eco.html', 'math.html', 'eng.html', 'zh.html', 'excel.html',
  'pdf-sets.html', 'tutor.html', 'classroom.html', 'progress-backup.html', 'progress-restore.html', 'vocabloom/index.html',
  'manifest.webmanifest', 'data/quiz.json', 'data/cards.json', 'data/accounting-textbook-index.json',
  'data/textbook-sos/ch5.json', 'data/textbook-sos/ch6.json', 'data/textbook-sos/ch7.json',
  'data/textbook-sos/ch8.json', 'data/textbook-sos/ch9.json'
];
const SKIP = /\/data\/config\.json$/;
const FILE = /\.(html|js|css|json|webmanifest|png|svg|ico|jpg|jpeg|gif|webp|woff2?)$/i;

function sameOrigin(url) { return url.origin === self.location.origin; }
function wanted(req) {
  if (req.method !== 'GET') return false;
  const url = new URL(req.url);
  if (!sameOrigin(url) || SKIP.test(url.pathname)) return false;
  return req.mode === 'navigate' || FILE.test(url.pathname) || url.pathname.endsWith('/');
}

/* Precache the core pages and the same-origin scripts/styles/icons each page links, so a first offline visit works. */
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const extra = new Set();
    await Promise.all(CORE.map(async path => {
      try {
        const res = await fetch(path, { cache: 'no-cache' });
        if (!res.ok) return;
        await cache.put(path, res.clone());
        if (!/\.html$|\/$/.test(path)) return;
        const html = await res.text(), base = new URL(path, self.location.href);
        for (const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
          const u = new URL(m[1], base);
          if (sameOrigin(u) && FILE.test(u.pathname) && !SKIP.test(u.pathname)) extra.add(u.href);
        }
      } catch (e) { /* offline during install: runtime caching fills in later */ }
    }));
    await Promise.all([...extra].map(async href => {
      try { const res = await fetch(href, { cache: 'no-cache' }); if (res.ok) await cache.put(href, res); } catch (e) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) if (name.startsWith('studyos-') && name !== CACHE) await caches.delete(name);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (!wanted(req)) return; // config.json, other origins, POST/PUT: browser default, never cached
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(req);
      if (res.ok && res.type === 'basic') cache.put(req, res.clone()).catch(() => {});
      return res;
    } catch (err) {
      const hit = await cache.match(req) || await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === 'navigate') {
        const home = await cache.match('index.html');
        if (home) return home;
      }
      throw err;
    }
  })());
});
