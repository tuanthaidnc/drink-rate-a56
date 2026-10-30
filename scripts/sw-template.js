/* Generated from the complete build. User data lives in IndexedDB, never here. */
const BUILD = __BUILD__;
const PRECACHE = __PRECACHE__;
const SCOPE = '/drink-rate-a56/';
const PREFIX = 'not-drink-rate-a56-';
const CACHE = PREFIX + BUILD;
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        await cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' })));
      } catch (e) {
        await caches.delete(CACHE);
        throw e;
      }
    })(),
  );
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (k) => (k.startsWith(PREFIX) || k === 'drink-reviewer-v12-clean-map') && k !== CACHE,
          )
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'STATUS')
    event.waitUntil(
      (async () => {
        const cache = await caches.open(CACHE);
        const keys = await cache.keys();
        const present = new Set(keys.map((k) => new URL(k.url).pathname));
        event.ports[0]?.postMessage({
          app: 'not-food-drink',
          build: BUILD,
          ready: PRECACHE.every((url) => present.has(url)),
        });
      })(),
    );
});
self.addEventListener('fetch', (event) => {
  const request = event.request,
    url = new URL(request.url);
  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    !url.pathname.startsWith(SCOPE)
  )
    return;
  if (url.pathname === SCOPE + 'assets/index.html') {
    event.respondWith(
      Promise.resolve(Response.redirect(new URL(SCOPE, self.location.origin).href, 302)),
    );
    return;
  }
  if (request.mode === 'navigate') {
    // An installed version always opens its matching HTML and chunks. New builds
    // become active only after the user accepts the update (or closes old clients).
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        return (await cache.match(SCOPE + 'index.html')) ?? fetch(request);
      })(),
    );
    return;
  }
  if (url.pathname === SCOPE + 'sw.js' || url.pathname === SCOPE + 'version.json') return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(url.pathname);
      if (hit) return hit;
      return fetch(request);
    })(),
  );
});
