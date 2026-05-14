/**
 * ⚡ Arpit | sw.js — OS MiniBook 2026 Service Worker
 * Cache-first strategy for full offline capability
 */

const CACHE_NAME  = 'os-minibook-v4';
const RUNTIME_CACHE = 'os-minibook-runtime-v1';
const ASSETS = [
  './',
  './index.html',
  './chapters/unit1.html',
  './chapters/unit2.html',
  './chapters/unit3.html',
  './chapters/unit4.html',
  './chapters/unit5.html',
  './chapters/unit6.html',
  './chapters/gate-extra.html',
  './exams/unit-papers.html',
  './exams/full-papers.html',
  './progress.html',
  './assets/css/main.css',
  './assets/css/components.css',
  './assets/css/animations.css',
  './assets/css/timer.css',
  './assets/js/state.js',
  './assets/js/core.js',
  './assets/js/modes.js',
  './assets/js/tts.js',
  './assets/js/print.js',
  './assets/js/notes.js',
  './assets/js/glossary.js',
  './assets/js/timer.js',
  './assets/js/timer-settings.js',
  './assets/js/timer-analytics.js',
  './assets/js/timer-notifications.js',
  './assets/js/timer-ui.js',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap'
];

function isCacheableResponse(response) {
  return response && response.status === 200 && response.type !== 'opaque';
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html');
}

/* ── INSTALL: Pre-cache all assets ───────────────────────── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Cache individually so one failure doesn't block all
        return Promise.allSettled(
          ASSETS.map(url => cache.add(url).catch(err => console.warn('SW cache miss:', url, err)))
        );
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

/* ── ACTIVATE: Clean up old caches ──────────────────────── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== RUNTIME_CACHE).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── FETCH: Cache-first, network fallback ────────────────── */
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and non-http requests
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request)
        .then(response => {
          if (isCacheableResponse(response)) {
            const clone = response.clone();
            caches.open(event.request.mode === 'navigate' ? CACHE_NAME : RUNTIME_CACHE)
              .then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => null);

      if (cached) {
        // Keep cached responses fresh in the background when possible.
        event.waitUntil(networkFetch);
        return cached;
      }

      return networkFetch.then(response => {
        if (response) return response;
        if (isNavigationRequest(event.request)) return caches.match('./index.html');
        return undefined;
      });
    })
  );
});

/* ── BACKGROUND SYNC: Notify clients of updates ─────────── */
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clients => clients.forEach(client => client.postMessage({ type: 'SW_SKIP_WAITING' })))
    );
  }
});
