/* Generated from the complete build. User data lives in IndexedDB, never here. */
const BUILD = "abf38da050e82513";
const PRECACHE = ["/drink-rate-a56/","/drink-rate-a56/404.html","/drink-rate-a56/apple-touch-icon.png","/drink-rate-a56/assets/Insights-Bd4dh2dI.js","/drink-rate-a56/assets/MapSurface-AgMWWGR8.css","/drink-rate-a56/assets/MapSurface-Po-JTGvu.js","/drink-rate-a56/assets/PinPicker-DqEE09fV.js","/drink-rate-a56/assets/PlaceMap-Mb3r0Pvu.js","/drink-rate-a56/assets/ReviewForm-B8xaEL6i.js","/drink-rate-a56/assets/SpinPicker-BjiKTLg_.js","/drink-rate-a56/assets/VisitManager-oiFEKIZS.js","/drink-rate-a56/assets/check-BYYFogCn.js","/drink-rate-a56/assets/index-Bqw7PFZ0.js","/drink-rate-a56/assets/index-C8CrdxWt.js","/drink-rate-a56/assets/index-Cf0HpVck.css","/drink-rate-a56/assets/index-DkKc6BiH.js","/drink-rate-a56/assets/index-kLx3sV2M.js","/drink-rate-a56/assets/index-ot7_mnCO.js","/drink-rate-a56/assets/index.html","/drink-rate-a56/assets/maplibre-gl-worker-8FvD_6Jq.js","/drink-rate-a56/assets/synapse-akrKn89j.js","/drink-rate-a56/assets/web-BtEzE86o.js","/drink-rate-a56/assets/web-C0WShaWa.js","/drink-rate-a56/assets/web-CRbmSXLI.js","/drink-rate-a56/assets/web-DaHKoWas.js","/drink-rate-a56/data/admin-2025.json","/drink-rate-a56/data/map-dark.json","/drink-rate-a56/data/map-light.json","/drink-rate-a56/data/map-style-licenses.txt","/drink-rate-a56/favicon.svg","/drink-rate-a56/fonts/font-0.woff2","/drink-rate-a56/fonts/font-1.woff2","/drink-rate-a56/fonts/font-2.woff2","/drink-rate-a56/fonts/font-3.woff2","/drink-rate-a56/fonts/font-4.woff2","/drink-rate-a56/fonts/font-5.woff2","/drink-rate-a56/fonts/font-6.woff2","/drink-rate-a56/fonts/font-7.woff2","/drink-rate-a56/fonts/font-8.woff2","/drink-rate-a56/fonts/fonts.css","/drink-rate-a56/fonts/jetbrainsmono-OFL.txt","/drink-rate-a56/fonts/plusjakartasans-OFL.txt","/drink-rate-a56/icon-192.png","/drink-rate-a56/icon-512.png","/drink-rate-a56/index.html","/drink-rate-a56/licenses/README.txt","/drink-rate-a56/licenses/animate-ui.txt","/drink-rate-a56/licenses/motion-primitives.txt","/drink-rate-a56/licenses/react-bits.txt","/drink-rate-a56/licenses/shadcn-ui.txt","/drink-rate-a56/manifest.json","/drink-rate-a56/version.json"];
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
