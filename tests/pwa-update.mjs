import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { INITIAL_REVIEWS } from '../src/data/demo.ts';
const root = resolve('build'),
  output = resolve(process.env.TEST_OUTPUT ?? resolve(tmpdir(), 'not-browser-qa'));
await mkdir(output, { recursive: true });
const currentSw = await readFile(resolve(root, 'sw.js'), 'utf8');
assert.ok(!currentSw.includes('/.git/'));
assert.ok(!currentSw.includes('/node_modules/'));
let version = 'legacy',
  failAsset = false;
const oldSw =
  "const CACHE_NAME='drink-reviewer-v12-clean-map';self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>{if(e.request.method==='GET')e.respondWith(fetch(e.request).then(r=>{if(r.status===200){const copy=r.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,copy));}return r;}).catch(()=>caches.match(e.request)));});";
const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost'),
      path = url.pathname.replace(/^\/drink-rate-a56\//, '');
    if (
      !url.pathname.startsWith('/drink-rate-a56/') ||
      path.includes('..') ||
      path.split('/').some((p) => p.startsWith('.'))
    ) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', mime[extname(path)] ?? 'text/html');
    if (path === 'sw.js') {
      res.end(
        version === 'legacy'
          ? oldSw
          : version === 'current'
            ? currentSw
            : currentSw.replace(/const BUILD\s*=\s*[^;]+;/, 'const BUILD="qa-update-2";'),
      );
      return;
    }
    if (failAsset && path.startsWith('assets/') && path.endsWith('.js')) {
      res.writeHead(503);
      res.end();
      return;
    }
    res.end(await readFile(resolve(root, path || 'index.html')));
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/drink-rate-a56/`;
const b = await chromium.launch({ channel: 'chrome', headless: true });
const c = await b.newContext({
  viewport: { width: 393, height: 852 },
  isMobile: true,
  hasTouch: true,
  reducedMotion: 'reduce',
});
const p = await c.newPage();
p.setDefaultTimeout(12000);
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));
const raw = JSON.stringify(INITIAL_REVIEWS);
await c.addInitScript((raw) => {
  if (!sessionStorage.getItem('seeded')) {
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('not_drink_food_reviews_v11', raw);
  }
}, raw);
try {
  await p.goto(base);
  await p.getByRole('heading', { name: 'Quán xá (1)', exact: true }).waitFor();
  await p.evaluate(() => navigator.serviceWorker.ready);
  await p.waitForFunction(() => !!navigator.serviceWorker.controller);
  await p.evaluate(async () => {
    const cache = await caches.open('another-personal-project-keep');
    await cache.put('/other-project-record', new Response('preserve'));
  });
  version = 'current';
  await p.evaluate(async () => {
    const r = await navigator.serviceWorker.getRegistration();
    await r.update();
  });
  await p.getByRole('button', { name: 'Cập nhật', exact: true }).waitFor({ timeout: 45000 });
  await p.getByRole('navigation').getByRole('button', { name: 'Chấm điểm', exact: true }).click();
  await p.getByLabel('Tên quán').fill('Bản nháp trước cập nhật');
  assert.equal(await p.getByRole('button', { name: 'Cập nhật', exact: true }).isDisabled(), true);
  await p.getByRole('button', { name: 'Hủy', exact: true }).click();
  await p.getByRole('button', { name: 'Bỏ bản nháp và rời màn hình', exact: true }).click();
  await Promise.all([
    p.waitForEvent('load'),
    p.getByRole('button', { name: 'Cập nhật', exact: true }).click(),
  ]);
  await p.locator('[data-offline-ready="true"]').waitFor();
  assert.equal(await p.evaluate(() => localStorage.getItem('not_drink_food_reviews_v11')), raw);
  assert.equal(await p.evaluate(() => caches.has('another-personal-project-keep')), true);
  assert.equal(await p.evaluate(() => caches.has('drink-reviewer-v12-clean-map')), false);
  // Failed next install must leave the current app/cache usable.
  version = 'next';
  failAsset = true;
  await p.evaluate(async () => {
    await (await navigator.serviceWorker.getRegistration()).update();
  });
  await p.locator('[data-pwa-error="true"]').waitFor({ timeout: 45000 });
  assert.equal(await p.getByRole('button', { name: 'Cập nhật', exact: true }).count(), 0);
  assert.equal(await p.evaluate(() => caches.has('not-drink-rate-a56-qa-update-2')), false);
  failAsset = false;
  await c.setOffline(true);
  await p.reload();
  await p.getByRole('heading', { name: 'Quán xá (1)', exact: true }).waitFor();
  await p.screenshot({ path: resolve(output, '07-pwa-update-offline.png') });
  assert.deepEqual(errors, []);
  await writeFile(
    resolve(output, 'pwa-update-results.json'),
    JSON.stringify(
      {
        pass: true,
        v12Upgrade: true,
        unsavedDraftBlocksUpdate: true,
        foreignCachePreserved: true,
        failedInstallKeepsCurrent: true,
        offlineAfterUpdate: true,
      },
      null,
      2,
    ),
  );
  console.log(
    'PASS v12 update, draft guard, scoped cache cleanup, failed install rollback and offline reload',
  );
} catch (e) {
  await writeFile(
    resolve(output, 'pwa-update-failure.txt'),
    String(e.stack) + '\n' + (await p.locator('body').innerText()),
  );
  await p.screenshot({ path: resolve(output, 'pwa-update-failure.png') });
  throw e;
} finally {
  await c.close();
  await b.close();
  await new Promise((resolve) => server.close(resolve));
}
