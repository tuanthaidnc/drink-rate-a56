import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium } from 'playwright';
import { INITIAL_REVIEWS } from '../src/data/demo.ts';
import { createReview, validateReview } from '../src/lib/validation.ts';
import { emptyDocument } from '../src/lib/models.ts';

// CI only. Local interactive QA uses the connected browser; fixtures are synthetic.
const base = process.env.TEST_URL ?? 'http://127.0.0.1:4173/drink-rate-a56/';
const output = resolve(process.env.TEST_OUTPUT ?? resolve(tmpdir(), 'not-browser-qa'));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  ...(process.env.PLAYWRIGHT_CHANNEL === 'chromium' ? {} : { channel: 'chrome' }),
  headless: true,
  args: [
    '--enable-webgl',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
});
const results = [],
  contexts = [];
async function scenario(name, run) {
  if (process.env.TEST_PATTERN && !new RegExp(process.env.TEST_PATTERN).test(name)) return;
  const start = Date.now();
  try {
    await run();
    results.push({ name, pass: true, ms: Date.now() - start });
    console.log('PASS', name);
  } catch (e) {
    results.push({ name, pass: false, error: e.stack });
    const p = contexts.at(-1)?.pages().at(-1);
    if (p) {
      await p.screenshot({ path: resolve(output, 'failure.png') });
      await writeFile(resolve(output, 'failure.txt'), await p.locator('body').innerText());
    }
    console.error('FAIL', name, e.message);
  } finally {
    await writeFile(resolve(output, 'browser-results.json'), JSON.stringify(results, null, 2));
  }
}
function fixture(count = 6) {
  return Array.from({ length: count }, (_, i) =>
    validateReview({
      ...createReview(),
      id: `qa-${i}`,
      name: i === 0 ? 'Quán kiểm thử có tên rất dài trên màn hình nhỏ' : `Quán kiểm thử ${i + 1}`,
      category: i % 2 ? 'food' : 'drink',
      priceK: 20 + i,
      street: 'Phan Thanh',
      address: String(10 + i),
      taste: 6 + (i % 4),
      lat: 16.06528,
      lng: 108.2083,
      locationStatus: 'confirmed',
      locationSource: 'manual',
    }),
  );
}
async function setup({
  legacy = '[]',
  native = true,
  camera = 'success',
  gps = 'success',
  viewport = { width: 384, height: 824 },
  motion = 'reduce',
} = {}) {
  const context = await browser.newContext({
    viewport,
    isMobile: viewport.width < 600,
    hasTouch: viewport.width < 600,
    timezoneId: 'America/Los_Angeles',
    reducedMotion: motion,
  });
  contexts.push(context);
  await context.addInitScript(
    ({ legacy, native, camera, gps }) => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem('not_drink_food_reviews_v11', legacy);
        sessionStorage.setItem('seeded', '1');
      }
      if (!native) return;
      const c = document.createElement('canvas');
      c.width = 1600;
      c.height = 1200;
      const x = c.getContext('2d');
      x.fillStyle = '#8f7666';
      x.fillRect(0, 0, 1600, 1200);
      x.fillStyle = '#f6ead2';
      x.beginPath();
      x.arc(800, 600, 400, 0, Math.PI * 2);
      x.fill();
      window.__cameraImage = c.toDataURL('image/jpeg');
      window.__cameraMode = camera;
      window.__gpsMode = gps;
      window.__calls = [];
      window.androidBridge = {};
      window.Capacitor = {
        PluginHeaders: [
          { name: 'Camera', methods: [{ name: 'getPhoto', rtype: 'promise' }] },
          {
            name: 'Geolocation',
            methods: ['checkPermissions', 'requestPermissions', 'getCurrentPosition'].map(
              (name) => ({ name, rtype: 'promise' }),
            ),
          },
          {
            name: 'App',
            methods: [
              { name: 'addListener', rtype: 'callback' },
              { name: 'removeListener', rtype: 'promise' },
              { name: 'minimizeApp', rtype: 'promise' },
            ],
          },
          { name: 'NotDisplay', methods: [{ name: 'preferences', rtype: 'promise' }] },
        ],
        nativeCallback: (plugin, method, options, callback) => {
          if (options.eventName === 'appRestoredResult') window.__restoredCallback = callback;
          if (
            options.eventName === 'appRestoredResult' &&
            sessionStorage.getItem('restore-camera')
          ) {
            sessionStorage.removeItem('restore-camera');
            queueMicrotask(() =>
              callback({
                pluginId: 'Camera',
                methodName: 'getPhoto',
                success: true,
                data: { webPath: window.__cameraImage },
              }),
            );
          }
          return 'qa-callback';
        },
        nativePromise: async (plugin, method, options) => {
          if (plugin === 'NotDisplay') return { reducedMotion: false, refreshRate: 120 };
          if (plugin === 'Camera') {
            window.__calls.push('camera');
            window.__cameraOptions = options;
            const db = await new Promise((r) => {
              const q = indexedDB.open('not-food-drink-personal');
              q.onsuccess = () => r(q.result);
            });
            window.__persistedBeforeCamera = await new Promise((r) => {
              const q = db
                .transaction('capture-drafts')
                .objectStore('capture-drafts')
                .get('pending');
              q.onsuccess = () => r(!!q.result);
            });
            db.close();
            if (window.__cameraMode === 'cancel') throw new Error('User cancelled photos app');
            if (window.__cameraMode === 'error') throw new Error('Camera permission denied');
            return { webPath: window.__cameraImage };
          }
          if (plugin === 'Geolocation') {
            if (method === 'checkPermissions' || method === 'requestPermissions')
              return { location: 'granted', coarseLocation: 'granted' };
            window.__calls.push('gps');
            if (window.__gpsMode === 'deny') throw new Error('Permission denied');
            if (window.__gpsMode === 'deferred')
              return new Promise((r) => {
                window.__gpsResolve = () =>
                  r({ coords: { latitude: 16.06528, longitude: 108.2083, accuracy: 12 } });
              });
            return { coords: { latitude: 16.06528, longitude: 108.2083, accuracy: 12 } };
          }
          return {};
        },
      };
    },
    { legacy, native, camera, gps },
  );
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base);
  await page.getByRole('heading', { name: /Quán xá/ }).waitFor();
  return { page, context, errors };
}
async function nav(p, label) {
  await p
    .getByRole('navigation', {
      name: (await p.viewportSize()).width >= 1100 ? 'Điều hướng máy tính' : 'Điều hướng chính',
      exact: true,
    })
    .getByRole('button', { name: label, exact: true })
    .click();
}
const readDoc = (p) =>
  p.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const q = indexedDB.open('not-food-drink-personal');
        q.onsuccess = () => {
          const db = q.result,
            r = db.transaction('documents').objectStore('documents').get('current');
          r.onsuccess = () => {
            resolve(
              r.result?.blob
                ? { ...r.result, blob: { size: r.result.blob.size, type: r.result.blob.type } }
                : r.result,
            );
            db.close();
          };
          r.onerror = () => reject(r.error);
        };
      }),
  );
async function store(p, name, key) {
  return p.evaluate(
    ({ name, key }) =>
      new Promise((resolve) => {
        const q = indexedDB.open('not-food-drink-personal');
        q.onsuccess = () => {
          const db = q.result,
            r = db.transaction(name).objectStore(name).get(key);
          r.onsuccess = () => {
            resolve(
              r.result?.blob
                ? { ...r.result, blob: { size: r.result.blob.size, type: r.result.blob.type } }
                : r.result,
            );
            db.close();
          };
        };
      }),
    { name, key },
  );
}
async function openDetail(p, index = 0) {
  await p.locator('.album-tile').nth(index).click();
  await p.locator('.review-inspector').waitFor();
}
async function more(p) {
  const section = p.locator('.quick-more');
  if (!(await section.getAttribute('open'))) await section.locator('summary').click();
}
async function editFirst(p) {
  await openDetail(p);
  await p.getByRole('button', { name: /^Sửa / }).click();
  await p.locator('.quick-review[data-stage="score"]').waitFor();
  await more(p);
}
async function begin(p) {
  await nav(p, 'Chấm điểm');
  await p.locator('.quick-review[data-stage="score"]').waitFor();
  await p.waitForFunction(() => !document.querySelector('.quick-location .photo-spinner'));
}
async function scoreStep(p) {
  await begin(p);
  await more(p);
}
async function save(p, name) {
  if (name) {
    await more(p);
    await p.getByLabel('Tên quán', { exact: true }).fill(name);
  }
  await p.locator('#review-price').fill('31');
  await p.getByRole('button', { name: 'Lưu quán', exact: true }).click();
  await p.locator('.album-tile').waitFor();
}
async function manual(p, lat = '16.066', lng = '108.209') {
  await p.getByRole('button', { name: 'Nhập tọa độ', exact: true }).click();
  await p.getByLabel('Vĩ độ', { exact: true }).fill(lat);
  await p.getByLabel('Kinh độ', { exact: true }).fill(lng);
  await p.getByRole('button', { name: 'Đặt ghim', exact: true }).click();
}
async function tools(p) {
  await p.getByRole('button', { name: 'Tùy chọn', exact: true }).click();
  await p.getByRole('dialog', { name: 'Tùy chọn', exact: true }).waitFor();
}
async function importText(p, text) {
  await p.getByLabel('Chọn file JSON để khôi phục').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(text),
  });
}
async function noOverflow(p) {
  assert.ok(
    await p.evaluate(
      () =>
        document.documentElement.scrollWidth <= innerWidth &&
        document.querySelector('main').scrollWidth <=
          document.querySelector('main').clientWidth + 1,
    ),
  );
}
async function discard(p) {
  await more(p);
  await p.getByRole('button', { name: 'Bỏ bản nháp', exact: true }).click();
  await p.locator('.review-form').waitFor({ state: 'detached' });
}

try {
  await scenario(
    'v1 IndexedDB upgrade retains reviews, photos, snapshots and raw archives',
    async () => {
      const context = await browser.newContext({ viewport: { width: 384, height: 824 } });
      contexts.push(context);
      const p = await context.newPage();
      await p.route(base, (route) =>
        route.fulfill({
          contentType: 'text/html',
          body: '<html><body>Migration fixture</body></html>',
        }),
      );
      await p.goto(base);
      const old = emptyDocument();
      old.settings.placeCorrectionsVersion = 1;
      old.reviews = [
        validateReview({ ...createReview(), name: 'Quán đã lưu', photoIds: ['old-photo'] }),
      ];
      await p.evaluate(async (document) => {
        const db = await new Promise((resolve, reject) => {
          const q = indexedDB.open('not-food-drink-personal', 1);
          q.onupgradeneeded = () => {
            q.result.createObjectStore('documents');
            for (const name of ['photos', 'snapshots', 'archives'])
              q.result.createObjectStore(name, { keyPath: 'id' });
          };
          q.onsuccess = () => resolve(q.result);
          q.onerror = () => reject(q.error);
        });
        await new Promise((resolve, reject) => {
          const tx = db.transaction(['documents', 'photos', 'snapshots', 'archives'], 'readwrite');
          tx.objectStore('documents').put(document, 'current');
          tx.objectStore('photos').put({
            id: 'old-photo',
            blob: new Blob(['original image'], { type: 'image/webp' }),
          });
          tx.objectStore('snapshots').put({
            id: 'old-snapshot',
            createdAt: document.updatedAt,
            reason: 'before',
            document,
          });
          tx.objectStore('archives').put({ id: 'old-raw', raw: 'unchanged original' });
          tx.oncomplete = resolve;
          tx.onabort = () => reject(tx.error);
        });
        db.close();
      }, old);
      await p.unroute(base);
      await p.goto(base);
      await p.getByRole('heading', { name: 'Quán xá (1)', exact: true }).waitFor();
      assert.deepEqual(await readDoc(p), old);
      const retained = await p.evaluate(async () => {
        const db = await new Promise((resolve) => {
          const q = indexedDB.open('not-food-drink-personal');
          q.onsuccess = () => resolve(q.result);
        });
        const get = (store, key) =>
          new Promise((resolve) => {
            const q = db.transaction(store).objectStore(store).get(key);
            q.onsuccess = () => resolve(q.result);
          });
        const result = {
          version: db.version,
          capture: db.objectStoreNames.contains('capture-drafts'),
          photo: await (await get('photos', 'old-photo')).blob.text(),
          raw: (await get('archives', 'old-raw')).raw,
          snapshot: (await get('snapshots', 'old-snapshot')).document,
        };
        db.close();
        return result;
      });
      assert.equal(retained.version, 2);
      assert.equal(retained.capture, true);
      assert.equal(retained.photo, 'original image');
      assert.equal(retained.raw, 'unchanged original');
      assert.deepEqual(retained.snapshot, old);
    },
  );

  await scenario('legacy migration preserves source and remaps only verified places', async () => {
    const { page: p } = await setup({ legacy: JSON.stringify(INITIAL_REVIEWS) });
    const d = await readDoc(p);
    assert.equal(d.reviews.length, 2);
    assert.equal(d.reviews[0].name, 'Nốt Tea');
    assert.equal(d.reviews[0].totalScore, 6.5);
    assert.equal(d.reviews[0].address, '38');
    assert.equal(d.reviews[0].lat, 16.06528);
    assert.equal(d.reviews[1].isDemo, true);
    assert.equal(
      await p.evaluate(() => localStorage.getItem('not_drink_food_reviews_v11')),
      JSON.stringify(INITIAL_REVIEWS),
    );
  });
  await scenario(
    'automatic camera opens once; cancel stays clean and never starts GPS',
    async () => {
      const { page: p } = await setup({ camera: 'cancel' });
      await nav(p, 'Chấm điểm');
      await p.getByRole('heading', { name: 'Chụp ảnh', exact: true }).waitFor();
      await p.waitForFunction(() => !document.querySelector('.capture-processing'));
      assert.deepEqual(await p.evaluate(() => window.__calls), ['camera']);
      assert.equal(await p.evaluate(() => window.__persistedBeforeCamera), true);
      assert.equal(await p.getByLabel('Tên quán').count(), 0);
      await nav(p, 'Thống kê');
      await p.locator('.stat-grid').waitFor();
      assert.equal(await p.getByRole('dialog').count(), 0);
      assert.equal((await readDoc(p)).reviews.length, 0);
    },
  );
  await scenario(
    'late restored camera cancellation does not mark an empty form dirty',
    async () => {
      const { page: p } = await setup({ camera: 'cancel' });
      await nav(p, 'Chấm điểm');
      await p.waitForFunction(() => !document.querySelector('.capture-processing'));
      const original = createReview();
      const date = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(original.createdAt));
      await p.evaluate(
        async ({ original, date }) => {
          const db = await new Promise((r) => {
            const q = indexedDB.open('not-food-drink-personal');
            q.onsuccess = () => r(q.result);
          });
          await new Promise((r) => {
            const t = db.transaction('capture-drafts', 'readwrite');
            t.objectStore('capture-drafts').put(
              {
                original,
                isEdit: false,
                draft: original,
                price: '',
                reviewDate: date,
                firstVisit: false,
                photos: [],
                recoveryId: 'qa-cancel-recovery',
                stage: 'capture',
              },
              'pending',
            );
            t.oncomplete = r;
          });
          db.close();
          window.__restoredCallback({
            pluginId: 'Camera',
            methodName: 'getPhoto',
            success: false,
            error: { message: 'User cancelled photos app' },
          });
        },
        { original, date },
      );
      await p.getByRole('heading', { name: 'Chụp ảnh', exact: true }).waitFor();
      await nav(p, 'Thống kê');
      await p.locator('.stat-grid').waitFor();
      assert.equal(await p.getByRole('dialog').count(), 0);
      assert.equal((await readDoc(p)).reviews.length, 0);
    },
  );
  await scenario(
    'one photo, price only, three sliders and automatic timestamp finish a review',
    async () => {
      const { page: p, errors } = await setup();
      await begin(p);
      assert.deepEqual(await p.evaluate(() => window.__calls), ['camera', 'gps']);
      assert.equal(await p.locator('.quick-sliders [role=slider]').count(), 3);
      assert.equal(await p.locator('input[type=date]').count(), 0);
      assert.equal(await p.getByText('Giờ mở cửa', { exact: true }).count(), 0);
      assert.equal(await p.getByRole('button', { name: 'Dùng vị trí này' }).count(), 0);
      await p.locator('#review-price').fill('31,5');
      await p.locator('#review-price').press('Enter');
      assert.equal((await readDoc(p)).reviews.length, 0);
      const before = Date.now();
      await p.getByRole('button', { name: 'Lưu quán' }).click();
      await p.locator('.album-tile').waitFor();
      const r = (await readDoc(p)).reviews[0];
      assert.equal(r.priceK, 31.5);
      assert.equal(r.photoIds.length, 1);
      assert.match(r.name, /^Quán nước · /);
      assert.equal(r.lat, 16.06528);
      assert.ok(
        Date.parse(r.reviewedAt) >= before - 1000 && Date.parse(r.reviewedAt) <= Date.now() + 1000,
      );
      const photo = await store(p, 'photos', r.photoIds[0]);
      assert.ok(photo.blob.size <= 300000);
      assert.equal(photo.blob.type, 'image/webp');
      assert.equal(await store(p, 'capture-drafts', 'pending'), undefined);
      await p.reload();
      await p.locator('.album-cover img').waitFor();
      await openDetail(p);
      await p.getByRole('button', { name: `Xem Ảnh tại ${r.name}`, exact: true }).click();
      await p.locator('.photo-full').waitFor();
      await p.keyboard.press('Escape');
      await p.locator('.photo-full').waitFor({ state: 'detached' });
      assert.deepEqual(errors, []);
    },
  );
  await scenario(
    'camera failure allows one library image without a mandatory location step',
    async () => {
      const { page: p } = await setup({ camera: 'error' });
      await nav(p, 'Chấm điểm');
      await p.getByRole('alert').filter({ hasText: 'Camera chưa được cho phép' }).waitFor();
      assert.equal(await p.getByRole('button', { name: 'Lưu quán' }).count(), 0);
      const image = await p.evaluate(() => window.__cameraImage.split(',')[1]);
      await p
        .getByLabel('Chọn ảnh món ăn hoặc đồ uống')
        .setInputFiles({
          name: 'photo.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from(image, 'base64'),
        });
      await p.locator('.quick-review[data-stage=score]').waitFor();
      await save(p);
    },
  );
  await scenario('GPS failure does not block saving; map correction remains optional', async () => {
    const { page: p } = await setup({ gps: 'deny' });
    const lookups = [];
    p.on('request', (r) => {
      if (/nominatim/.test(r.url())) lookups.push(r.url());
    });
    await begin(p);
    await save(p);
    const r = (await readDoc(p)).reviews[0];
    assert.equal(r.lat, null);
    assert.equal(r.locationStatus, 'missing');
    assert.deepEqual(lookups, []);
  });
  await scenario('manual pin wins over late GPS and map has no two-finger overlay', async () => {
    const { page: p } = await setup({ gps: 'deferred' });
    await nav(p, 'Chấm điểm');
    await p.waitForFunction(() => !!window.__gpsResolve);
    await p.getByRole('button', { name: 'Chỉnh vị trí quán' }).click();
    await manual(p);
    await p.getByRole('button', { name: 'Dùng vị trí này' }).click();
    await p.getByRole('dialog').waitFor({ state: 'detached' });
    await p.evaluate(() => window.__gpsResolve());
    await save(p);
    const r = (await readDoc(p)).reviews[0];
    assert.equal(r.lat, 16.066);
    assert.equal(r.locationSource, 'manual');
    await nav(p, 'Bản đồ');
    await p.locator('.map-surface').waitFor();
    assert.equal(await p.locator('.maplibregl-cooperative-gesture-screen').count(), 0);
    assert.equal(await p.getByText(/Use two fingers/).count(), 0);
  });
  await scenario('retaking replaces the single photo; cancelled retake preserves it', async () => {
    const { page: p } = await setup();
    await begin(p);
    await more(p);
    assert.equal(await p.getByLabel('Chọn ảnh món ăn hoặc đồ uống').getAttribute('multiple'), null);
    await save(p);
    const first = (await readDoc(p)).reviews[0];
    await editFirst(p);
    await p.evaluate(() => {
      window.__cameraMode = 'cancel';
    });
    await p.getByRole('button', { name: 'Chụp lại ảnh' }).click();
    await p.waitForFunction(() => !document.querySelector('.quick-photo-busy'));
    assert.equal(await p.locator('.quick-photo img').count(), 1);
    await p.evaluate(() => {
      window.__cameraMode = 'success';
    });
    await p.getByRole('button', { name: 'Chụp lại ảnh' }).click();
    await p.waitForFunction(() => !document.querySelector('.quick-photo-busy'));
    await p.getByRole('button', { name: 'Cập nhật đánh giá' }).click();
    await p.locator('.album-tile').waitFor();
    const after = (await readDoc(p)).reviews[0];
    assert.equal(after.photoIds.length, 1);
    assert.notEqual(after.photoIds[0], first.photoIds[0]);
    assert.ok((await store(p, 'photos', first.photoIds[0])).blob.size > 0);
  });
  await scenario(
    'existing photo-free reviews edit without camera/GPS; tab changes keep typed drafts',
    async () => {
      const old = fixture(1),
        { page: p } = await setup({ legacy: JSON.stringify(old) });
      await editFirst(p);
      assert.deepEqual(await p.evaluate(() => window.__calls), []);
      await p.getByLabel('Tên quán').fill('Giữ tên khi đổi tab');
      await nav(p, 'Thống kê');
      await p.locator('.stat-grid').waitFor();
      assert.equal(await p.getByRole('dialog').count(), 0);
      await nav(p, 'Chấm điểm');
      await more(p);
      assert.equal(await p.getByLabel('Tên quán').inputValue(), 'Giữ tên khi đổi tab');
      await p.getByRole('button', { name: 'Cập nhật đánh giá' }).click();
      await p.locator('.album-tile').waitFor();
      const r = (await readDoc(p)).reviews[0];
      assert.equal(r.lat, old[0].lat);
      assert.equal(r.photoIds.length, 0);
    },
  );
  await scenario(
    'new draft survives tab navigation and restart without another camera',
    async () => {
      const { page: p } = await setup();
      await scoreStep(p);
      await p.getByLabel('Tên quán').fill('Bản nháp khôi phục');
      await p.locator('#review-price').fill('25,5');
      await nav(p, 'Quán xá');
      assert.equal(await p.getByRole('dialog').count(), 0);
      await nav(p, 'Chấm điểm');
      await more(p);
      assert.equal(await p.locator('#review-price').inputValue(), '25,5');
      const deadline = Date.now() + 15000;
      let persisted;
      do {
        persisted = await store(p, 'capture-drafts', 'pending');
        if (persisted?.draft.name === 'Bản nháp khôi phục' && persisted.price === '25,5') break;
        await new Promise((r) => setTimeout(r, 50));
      } while (Date.now() < deadline);
      assert.equal(persisted?.draft.name, 'Bản nháp khôi phục');
      await p.reload();
      await p.locator('.quick-review[data-stage=score]').waitFor();
      await more(p);
      assert.equal(await p.getByLabel('Tên quán').inputValue(), 'Bản nháp khôi phục');
      assert.equal(await p.locator('#review-price').inputValue(), '25,5');
      assert.deepEqual(await p.evaluate(() => window.__calls), []);
      await p.getByRole('button', { name: 'Lưu quán' }).click();
      await p.locator('.album-tile').waitFor();
      assert.equal((await readDoc(p)).reviews[0].photoIds.length, 1);
    },
  );
  await scenario('interrupted native camera restores directly to quick scoring', async () => {
    const { page: p } = await setup({ camera: 'cancel' }),
      original = createReview();
    await p.evaluate(async (original) => {
      const db = await new Promise((r) => {
        const q = indexedDB.open('not-food-drink-personal');
        q.onsuccess = () => r(q.result);
      });
      await new Promise((r) => {
        const t = db.transaction('capture-drafts', 'readwrite');
        t.objectStore('capture-drafts').put(
          {
            original,
            isEdit: false,
            draft: { ...original, name: 'Giữ tên trước camera' },
            price: '22',
            reviewDate: original.createdAt.slice(0, 10),
            firstVisit: false,
            photos: [],
            recoveryId: 'qa-death',
            stage: 'capture',
          },
          'pending',
        );
        t.oncomplete = r;
      });
      db.close();
      sessionStorage.setItem('restore-camera', '1');
    }, original);
    await p.reload();
    await p.locator('.quick-review[data-stage=score]').waitFor();
    await more(p);
    assert.equal(await p.getByLabel('Tên quán').inputValue(), 'Giữ tên trước camera');
    assert.equal(await p.locator('#review-price').inputValue(), '22');
    assert.equal((await readDoc(p)).reviews.length, 0);
  });
  await scenario(
    'four food sliders and optional metadata never expose review date or hours inputs',
    async () => {
      const { page: p } = await setup();
      await begin(p);
      await p.getByRole('radio', { name: 'Ăn', exact: true }).click();
      assert.equal(await p.locator('.quick-sliders [role=slider]').count(), 4);
      await more(p);
      assert.equal(await p.locator('input[type=date],input[type=time]').count(), 0);
      assert.equal(await p.getByText('Giờ mở cửa', { exact: true }).count(), 0);
      await p
        .getByLabel('Chọn ảnh món ăn hoặc đồ uống')
        .setInputFiles({
          name: 'broken.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('broken'),
        });
      await p.getByRole('alert').filter({ hasText: 'Ảnh bị lỗi' }).waitFor();
      assert.equal(await p.locator('.quick-photo img').count(), 1);
    },
  );
  await scenario(
    'invalid decimal and failed transaction keep draft; retry saves exactly once',
    async () => {
      const { page: p } = await setup();
      await scoreStep(p);
      await p.getByLabel('Tên quán').fill('Giữ khi lỗi');
      await p.locator('#review-price').fill('-1');
      await p.getByRole('button', { name: 'Lưu quán' }).click();
      await p.getByRole('alert').waitFor();
      assert.equal((await readDoc(p)).reviews.length, 0);
      await p.locator('#review-price').fill('31,5');
      await p.evaluate(() => {
        window.__tx = IDBDatabase.prototype.transaction;
        IDBDatabase.prototype.transaction = function (names, mode, ...rest) {
          if (
            mode === 'readwrite' &&
            Array.from(typeof names === 'string' ? [names] : names).includes('documents')
          )
            throw new DOMException('QA quota', 'QuotaExceededError');
          return window.__tx.call(this, names, mode, ...rest);
        };
      });
      await p.getByRole('button', { name: 'Lưu quán' }).click();
      await p.getByRole('alert').filter({ hasText: 'Chưa lưu thay đổi' }).waitFor();
      assert.equal(await p.getByLabel('Tên quán').inputValue(), 'Giữ khi lỗi');
      await p.evaluate(() => {
        IDBDatabase.prototype.transaction = window.__tx;
      });
      await p.getByRole('button', { name: 'Lưu quán' }).click();
      await p.locator('.album-tile').waitFor();
      assert.equal((await readDoc(p)).reviews.length, 1);
    },
  );
  await scenario('stale edit cannot revive a deleted review', async () => {
    const { page: p } = await setup({ legacy: JSON.stringify(fixture(1)) });
    await editFirst(p);
    await p.getByLabel('Tên quán').fill('Không hồi sinh');
    await p.evaluate(async () => {
      const db = await new Promise((r) => {
        const q = indexedDB.open('not-food-drink-personal');
        q.onsuccess = () => r(q.result);
      });
      await new Promise((r) => {
        const t = db.transaction('documents', 'readwrite'),
          s = t.objectStore('documents'),
          q = s.get('current');
        q.onsuccess = () =>
          s.put({ ...q.result, reviews: [], revision: 'external-delete' }, 'current');
        t.oncomplete = r;
      });
      db.close();
    });
    await p.getByRole('button', { name: 'Cập nhật đánh giá' }).click();
    await p.getByRole('alert').waitFor();
    assert.equal((await readDoc(p)).reviews.length, 0);
  });
  await scenario(
    'square covers, density, finite pagination, long names and aligned dock across breakpoints',
    async () => {
      const { page: p, errors } = await setup({
        legacy: JSON.stringify(fixture(53)),
        camera: 'cancel',
        motion: 'no-preference',
      });
      const geometry = [];
      for (const width of [320, 360, 384, 412, 768, 1365]) {
        await p.setViewportSize({ width, height: width > 1100 ? 900 : 824 });
        await p.locator('.album-tile').first().waitFor();
        await p.waitForTimeout(600);
        assert.equal(await p.locator('.album-entry').count(), 24);
        const boxes = await p.locator('.album-cover').evaluateAll((es) =>
          es.map((e) => {
            const r = e.getBoundingClientRect(),
              s = getComputedStyle(e);
            return {
              w: r.width,
              h: r.height,
              b: [s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth],
            };
          }),
        );
        assert.ok(boxes.every((r) => Math.abs(r.w - r.h) < 1 && r.b.every((b) => b === '1px')));
        await noOverflow(p);
        if (width < 1100) {
          const dock = await p.locator('.bottom-dock').evaluate((e) =>
            [...e.querySelectorAll('button')].map((b) => {
              const i = b.querySelector('.nav-icon').getBoundingClientRect(),
                l = b.querySelector('.nav-label').getBoundingClientRect(),
                r = b.getBoundingClientRect();
              return { w: i.width, h: i.height, y: l.y, bottom: l.bottom, buttonBottom: r.bottom };
            }),
          );
          assert.ok(
            dock.every(
              (r) =>
                Math.abs(r.w - r.h) < 0.5 &&
                Math.abs(r.y - dock[0].y) < 0.5 &&
                r.bottom <= r.buttonBottom + 1,
            ),
          );
        }
        geometry.push({ width, cover: boxes[0], entries: 24 });
        if ([384, 1365].includes(width))
          await p.screenshot({ path: resolve(output, `album-${width}.png`) });
      }
      await p.setViewportSize({ width: 384, height: 824 });
      await p.getByRole('button', { name: 'Hiển thị ảnh nhỏ' }).click();
      assert.equal(await p.locator('.album-grid').getAttribute('data-density'), 'small');
      await p.getByRole('button', { name: 'Trang sau' }).click();
      assert.equal(await p.locator('.album-entry').count(), 24);
      await p.getByRole('button', { name: 'Trang sau' }).click();
      assert.equal(await p.locator('.album-entry').count(), 5);
      await p.getByRole('button', { name: 'Mở tìm kiếm' }).click();
      await p.getByRole('searchbox').fill('Quán kiểm thử 2');
      await p.waitForFunction(() => !document.querySelector('.album-pagination'));
      await noOverflow(p);
      assert.deepEqual(errors, []);
      await writeFile(resolve(output, 'album-geometry.json'), JSON.stringify(geometry, null, 2));
    },
  );
  await scenario(
    'rapid navigation, average contrast, detail and theme remain stable with motion enabled',
    async () => {
      const { page: p, errors } = await setup({
        legacy: JSON.stringify(fixture()),
        camera: 'cancel',
        motion: 'no-preference',
      });
      for (const label of ['Thống kê', 'Quán xá', 'Bản đồ', 'Thống kê', 'Quán xá']) {
        await nav(p, label);
        assert.ok((await p.locator('.app-scene').count()) <= 1);
      }
      await p.locator('.album-tile').first().waitFor();
      await p.waitForTimeout(550);
      await openDetail(p);
      await p.keyboard.press('Escape');
      await p.locator('.review-inspector').waitFor({ state: 'detached' });
      await nav(p, 'Thống kê');
      await p.locator('[data-stat="average"]').waitFor();
      const expected = (await readDoc(p)).reviews.reduce((s, r) => s + r.totalScore, 0) / 6;
      assert.equal(await p.locator('[data-stat="average"]').innerText(), expected.toFixed(1));
      for (let i = 0; i < 2; i++) {
        await p.locator('.theme-toggle').click();
        await p.waitForTimeout(350);
        const ratio = await p.locator('[data-stat="average"]').evaluate((e) => {
          const lum = (c) => {
            const a = c
              .match(/[\d.]+/g)
              .slice(0, 3)
              .map(Number)
              .map((x) => {
                x /= 255;
                return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
              });
            return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
          };
          const a = lum(getComputedStyle(e).color),
            b = lum(getComputedStyle(e.parentElement).backgroundColor);
          return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        });
        assert.ok(ratio >= 4.5);
        await noOverflow(p);
      }
      assert.equal(await p.locator('.app-scene').count(), 1);
      assert.deepEqual(errors, []);
    },
  );
  await scenario(
    'web user gesture opens capture before lazy form mounts; cancel stays clean',
    async () => {
      const { page: p } = await setup({ native: false });
      const chooser = p.waitForEvent('filechooser');
      await nav(p, 'Chấm điểm');
      const c = await chooser;
      await c.setFiles([]);
      await p.getByRole('heading', { name: 'Chụp ảnh', exact: true }).waitFor();
      await nav(p, 'Quán xá');
      await p.locator('.review-form').waitFor({ state: 'detached' });
      assert.equal(await p.getByRole('dialog').count(), 0);
    },
  );
  await scenario(
    'photo backup round trip survives explicit empty replacement and preserves retained media',
    async () => {
      const { page: p } = await setup({ native: false, legacy: JSON.stringify(fixture(1)) });
      await p.evaluate(async () => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        canvas.getContext('2d').fillRect(0, 0, 64, 64);
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
        const db = await new Promise((resolve) => {
          const q = indexedDB.open('not-food-drink-personal');
          q.onsuccess = () => resolve(q.result);
        });
        await new Promise((resolve) => {
          const t = db.transaction(['documents', 'photos'], 'readwrite'),
            s = t.objectStore('documents'),
            q = s.get('current');
          q.onsuccess = () => {
            q.result.reviews[0].photoIds = ['qa-backup-photo'];
            s.put(q.result, 'current');
            t.objectStore('photos').put({ id: 'qa-backup-photo', blob });
          };
          t.oncomplete = resolve;
        });
        db.close();
      });
      await p.reload();
      await p.locator('.album-cover img').waitFor();
      await tools(p);
      const download = p.waitForEvent('download');
      await p.getByRole('button', { name: 'Xuất JSON', exact: true }).click();
      const backup = JSON.parse(await readFile(await (await download).path(), 'utf8'));
      assert.equal(backup.reviews.length, 1);
      assert.equal(backup.media.length, 1);
      assert.ok(backup.media[0].dataUrl.startsWith('data:image/png;base64,'));
      await importText(p, '[]');
      await p.getByLabel(/Thay toàn bộ/).check();
      await p.getByLabel(/Tôi đã kiểm tra file/).check();
      await p.getByRole('button', { name: 'Xác nhận khôi phục' }).click();
      await p
        .getByRole('dialog', { name: 'Nhập dữ liệu', exact: true })
        .waitFor({ state: 'detached' });
      assert.equal((await readDoc(p)).reviews.length, 0);
      await importText(p, JSON.stringify(backup));
      await p.getByRole('button', { name: 'Xác nhận khôi phục' }).click();
      await p.waitForFunction(() => document.querySelectorAll('[role=dialog]').length === 1);
      const restored = (await readDoc(p)).reviews;
      assert.equal(restored[0].name, backup.reviews[0].name);
      assert.equal(restored[0].photoIds.length, 1);
      assert.ok((await store(p, 'photos', restored[0].photoIds[0])).blob.size > 0);
      assert.ok((await store(p, 'photos', 'qa-backup-photo')).blob.size > 0);
    },
  );
  await scenario('delete has a working undo and preserves original review', async () => {
    const { page: p } = await setup({ legacy: JSON.stringify(fixture(1)) });
    const before = await readDoc(p);
    await openDetail(p);
    await p.getByRole('button', { name: 'Xóa quán', exact: true }).click();
    await p.getByRole('button', { name: 'Xóa quán này', exact: true }).click();
    await p.getByRole('heading', { name: 'Quán xá (0)', exact: true }).waitFor();
    await p.getByRole('button', { name: 'Hoàn tác xóa quán', exact: true }).click();
    await p.locator('.album-tile').waitFor();
    assert.deepEqual((await readDoc(p)).reviews, before.reviews);
  });
  await scenario('shared category/search filters drive album, map and insights', async () => {
    const { page: p } = await setup({ legacy: JSON.stringify(fixture()) });
    await p.getByRole('radio', { name: /Quán ăn/ }).click();
    assert.equal(await p.locator('.album-entry').count(), 3);
    await nav(p, 'Thống kê');
    await p.locator('[data-stat="average"]').waitFor();
    const doc = await readDoc(p),
      foods = doc.reviews.filter((r) => r.category === 'food');
    assert.equal(
      await p.locator('[data-stat="average"]').innerText(),
      (foods.reduce((s, r) => s + r.totalScore, 0) / 3).toFixed(1),
    );
    await nav(p, 'Bản đồ');
    await p.getByRole('radio', { name: /Quán ăn/ }).waitFor();
    await nav(p, 'Quán xá');
    await p.locator('.album-entry').first().waitFor();
    assert.equal(await p.locator('.album-entry').count(), 3);
  });
  await scenario('offline PWA retains reviews, lazy routes and manual-photo fallback', async () => {
    const {
      page: p,
      context,
      errors,
    } = await setup({ native: false, legacy: JSON.stringify(fixture(1)) });
    await p.locator('[data-offline-ready="true"]').waitFor({ timeout: 45000 });
    const before = await readDoc(p);
    await context.setOffline(true);
    await p.reload();
    await p.locator('.album-tile').waitFor();
    await nav(p, 'Thống kê');
    await p.locator('.stat-grid').waitFor();
    await nav(p, 'Quán xá');
    await p.locator('.album-tile').waitFor();
    await editFirst(p);
    await p.getByRole('button', { name: 'Đà Nẵng', exact:true }).click();
    await p
      .getByRole('button', { name: /Phường Thanh Khê/ })
      .first()
      .waitFor();
    await noOverflow(p);
    assert.deepEqual(await readDoc(p), before);
    assert.deepEqual(errors, []);
  });
  await scenario(
    'map safely renders HTML-looking names and reduced motion remains functional',
    async () => {
      const f = fixture(1);
      f[0].name = '<img src=x onerror=alert(1)> <script>bad()</script>';
      const { page: p, errors } = await setup({ legacy: JSON.stringify(f) });
      await nav(p, 'Bản đồ');
      await p.locator('.map-surface').waitFor();
      assert.equal(await p.locator('.map-marker img').count(), 0);
      await noOverflow(p);
      assert.deepEqual(errors, []);
    },
  );
} finally {
  for (const c of contexts) await c.close();
  await browser.close();
}
console.log(`${results.filter((r) => r.pass).length}/${results.length} scenarios passed`);
if (results.some((r) => !r.pass)) process.exitCode = 1;
