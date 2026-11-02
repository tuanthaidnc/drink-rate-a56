/* Generated from the complete build. User data lives in IndexedDB, never here. */
const BUILD = "be2f2155cef66d1f";
const PRECACHE = ["/drink-rate-a56/","/drink-rate-a56/404.html","/drink-rate-a56/apple-touch-icon.png","/drink-rate-a56/assets/Insights-Cny1PGQQ.js","/drink-rate-a56/assets/MapSurface-AgMWWGR8.css","/drink-rate-a56/assets/MapSurface-CKiHHO37.js","/drink-rate-a56/assets/PinPicker-BAs3hRtL.js","/drink-rate-a56/assets/PlaceMap-odDSdFNN.js","/drink-rate-a56/assets/ReviewForm-t7zzP6bx.js","/drink-rate-a56/assets/ReviewJournal-DFnE1flE.js","/drink-rate-a56/assets/SpinPicker-BJXFLQqR.js","/drink-rate-a56/assets/VisitManager-BsjCzlUL.js","/drink-rate-a56/assets/WebSquareCamera-DGhSBzOQ.js","/drink-rate-a56/assets/check-DmHA6F51.js","/drink-rate-a56/assets/image-off-Bzu9mPfy.js","/drink-rate-a56/assets/index-BnHAZE3l.js","/drink-rate-a56/assets/index-CRNKGebo.js","/drink-rate-a56/assets/index-DG4nad1_.js","/drink-rate-a56/assets/index-DhHX2rfx.css","/drink-rate-a56/assets/index-DuZDE2Gb.js","/drink-rate-a56/assets/index-iFbQLlmE.js","/drink-rate-a56/assets/index.html","/drink-rate-a56/assets/maplibre-gl-worker-8FvD_6Jq.js","/drink-rate-a56/assets/photo.worker-Cl12-SpE.js","/drink-rate-a56/assets/photoProcessing-wCGvJIx4.js","/drink-rate-a56/assets/synapse-akrKn89j.js","/drink-rate-a56/assets/web-BMhp193c.js","/drink-rate-a56/assets/web-BTRJvdAF.js","/drink-rate-a56/assets/web-BiFZCFWy.js","/drink-rate-a56/assets/web-YOdHmiu0.js","/drink-rate-a56/data/admin-2025.json","/drink-rate-a56/data/map-dark.json","/drink-rate-a56/data/map-light.json","/drink-rate-a56/data/map-style-licenses.txt","/drink-rate-a56/favicon.svg","/drink-rate-a56/fonts/font-0.woff2","/drink-rate-a56/fonts/font-1.woff2","/drink-rate-a56/fonts/font-2.woff2","/drink-rate-a56/fonts/font-3.woff2","/drink-rate-a56/fonts/font-4.woff2","/drink-rate-a56/fonts/font-5.woff2","/drink-rate-a56/fonts/font-6.woff2","/drink-rate-a56/fonts/font-7.woff2","/drink-rate-a56/fonts/font-8.woff2","/drink-rate-a56/fonts/fonts.css","/drink-rate-a56/fonts/jetbrainsmono-OFL.txt","/drink-rate-a56/fonts/plusjakartasans-OFL.txt","/drink-rate-a56/icon-192.png","/drink-rate-a56/icon-512.png","/drink-rate-a56/index.html","/drink-rate-a56/licenses/README.txt","/drink-rate-a56/licenses/animate-ui.txt","/drink-rate-a56/licenses/motion-primitives.txt","/drink-rate-a56/licenses/react-bits.txt","/drink-rate-a56/licenses/shadcn-ui.txt","/drink-rate-a56/manifest.json","/drink-rate-a56/version.json"];
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
