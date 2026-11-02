/* Generated from the complete build. User data lives in IndexedDB, never here. */
const BUILD = "918658a2af8e3f85";
const PRECACHE = ["/drink-rate-a56/","/drink-rate-a56/404.html","/drink-rate-a56/apple-touch-icon.png","/drink-rate-a56/assets/Insights-Crln_lEo.js","/drink-rate-a56/assets/MapSurface-AgMWWGR8.css","/drink-rate-a56/assets/MapSurface-B-ADvC9S.js","/drink-rate-a56/assets/PinPicker-BmRQ_xTQ.js","/drink-rate-a56/assets/PlaceMap-iDkSO60V.js","/drink-rate-a56/assets/ReviewForm-BvshXPVu.js","/drink-rate-a56/assets/SpinPicker-CXbaiIs9.js","/drink-rate-a56/assets/VisitManager-BWRfyY46.js","/drink-rate-a56/assets/check-xEqCy9j-.js","/drink-rate-a56/assets/index-BCHLtkbA.js","/drink-rate-a56/assets/index-DowrAfYM.js","/drink-rate-a56/assets/index-Duevnyiz.js","/drink-rate-a56/assets/index-IHhb4D1H.js","/drink-rate-a56/assets/index-L3qnWMXQ.js","/drink-rate-a56/assets/index-bxmn3-08.css","/drink-rate-a56/assets/index-yWFFnMWj.js","/drink-rate-a56/assets/index.html","/drink-rate-a56/assets/maplibre-gl-worker-8FvD_6Jq.js","/drink-rate-a56/assets/photo.worker-DmOb31tO.js","/drink-rate-a56/assets/photoProcessing-DZrGXmXb.js","/drink-rate-a56/assets/synapse-akrKn89j.js","/drink-rate-a56/assets/web-B_h8sIMb.js","/drink-rate-a56/assets/web-CE44OAwK.js","/drink-rate-a56/assets/web-CPqps5ux.js","/drink-rate-a56/assets/web-GCO_d1Or.js","/drink-rate-a56/data/admin-2025.json","/drink-rate-a56/data/map-dark.json","/drink-rate-a56/data/map-light.json","/drink-rate-a56/data/map-style-licenses.txt","/drink-rate-a56/favicon.svg","/drink-rate-a56/fonts/font-0.woff2","/drink-rate-a56/fonts/font-1.woff2","/drink-rate-a56/fonts/font-2.woff2","/drink-rate-a56/fonts/font-3.woff2","/drink-rate-a56/fonts/font-4.woff2","/drink-rate-a56/fonts/font-5.woff2","/drink-rate-a56/fonts/font-6.woff2","/drink-rate-a56/fonts/font-7.woff2","/drink-rate-a56/fonts/font-8.woff2","/drink-rate-a56/fonts/fonts.css","/drink-rate-a56/fonts/jetbrainsmono-OFL.txt","/drink-rate-a56/fonts/plusjakartasans-OFL.txt","/drink-rate-a56/icon-192.png","/drink-rate-a56/icon-512.png","/drink-rate-a56/index.html","/drink-rate-a56/licenses/README.txt","/drink-rate-a56/licenses/animate-ui.txt","/drink-rate-a56/licenses/motion-primitives.txt","/drink-rate-a56/licenses/react-bits.txt","/drink-rate-a56/licenses/shadcn-ui.txt","/drink-rate-a56/manifest.json","/drink-rate-a56/version.json"];
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
