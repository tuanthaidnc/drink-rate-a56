import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium } from 'playwright';
import { INITIAL_REVIEWS } from '../src/data/demo.ts';
import { createReview, validateReview } from '../src/lib/validation.ts';
import { emptyDocument } from '../src/lib/models.ts';
// Automated CI regression suite. Interactive local QA uses the connected browser.
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
    console.error('FAIL', name, e.message);
    const p = contexts.at(-1)?.pages().at(-1);
    if (p) {
      await p.screenshot({ path: resolve(output, 'failure.png') });
      await writeFile(resolve(output, 'failure.txt'), await p.locator('body').innerText());
    }
    throw e;
  } finally {
    await writeFile(resolve(output, 'browser-results.json'), JSON.stringify(results, null, 2));
  }
}
async function setup({
  legacy,
  viewport = { width: 393, height: 852 },
  offline = false,
  reducedMotion = 'reduce',
} = {}) {
  const context = await browser.newContext({
    viewport,
    isMobile: viewport.width < 600,
    hasTouch: viewport.width < 600,
    timezoneId: 'America/Los_Angeles',
    reducedMotion,
    offline,
  });
  contexts.push(context);
  if (legacy !== undefined)
    await context.addInitScript((raw) => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem('not_drink_food_reviews_v11', raw);
        sessionStorage.setItem('seeded', '1');
      }
    }, legacy);
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base);
  await page.getByRole('heading', { name: /Quán xá/ }).waitFor();
  return { context, page, errors };
}
const nav = async (p, label) => {
  await p
    .getByRole('navigation', { name: 'Điều hướng chính' })
    .getByRole('button', { name: label, exact: true })
    .click();
  const index = ['Quán xá', 'Bản đồ', 'Chấm điểm', 'Thống kê'].indexOf(label);
  await p
    .locator(`.app-scene[data-screen-index="${index}"]:not([aria-hidden="true"])`)
    .or(p.getByRole('dialog', { name: 'Rời phần đang nhập?', exact: true }))
    .waitFor({ state: 'attached' });
};
const closeDialog = (p) => p.keyboard.press('Escape');
const readDoc = (p) =>
  p.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const q = indexedDB.open('not-food-drink-personal');
        q.onsuccess = () => {
          const db = q.result;
          const r = db.transaction('documents').objectStore('documents').get('current');
          r.onsuccess = () => {
            resolve(r.result);
            db.close();
          };
          r.onerror = () => reject(r.error);
        };
        q.onerror = () => reject(q.error);
      }),
  );
async function eventuallyDoc(p, check) {
  await p.waitForFunction(async (fn) => {
    const doc = await new Promise((resolve) => {
      const q = indexedDB.open('not-food-drink-personal');
      q.onsuccess = () => {
        const db = q.result;
        const r = db.transaction('documents').objectStore('documents').get('current');
        r.onsuccess = () => {
          resolve(r.result);
          db.close();
        };
      };
    });
    return new Function('d', `return (${fn})(d)`)(doc);
  }, check.toString());
}
async function assertNoOverflow(p) {
  const x = await p.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
    main: document.querySelector('main').scrollWidth,
    client: document.querySelector('main').clientWidth,
  }));
  assert.ok(x.scroll <= x.width && x.main <= x.client + 1, JSON.stringify(x));
}
async function assertButtonContrast(p, name) {
  const ratio = await p.getByRole('button', { name, exact: true }).evaluate((el) => {
    const luminance = (color) => {
      const rgb = color
        .match(/[\d.]+/g)
        .slice(0, 3)
        .map(Number)
        .map((n) => {
          const s = n / 255;
          return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        });
      return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
    };
    const style = getComputedStyle(el),
      a = luminance(style.color),
      b = luminance(style.backgroundColor);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  });
  assert.ok(ratio >= 4.5, `${name}: text contrast ${ratio.toFixed(2)} must meet 4.5:1`);
}
async function importText(p, text) {
  await p.getByLabel('Chọn file JSON để khôi phục').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(text),
  });
}

try {
  let primary;
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
  await scenario(
    'camera cancel, capture, preview and process-death draft recovery through the native bridge',
    async () => {
      const context = await browser.newContext({
        viewport: { width: 384, height: 824 },
        isMobile: true,
        hasTouch: true,
        reducedMotion: 'reduce',
      });
      contexts.push(context);
      await context.addInitScript(() => {
        const c = document.createElement('canvas');
        c.width = 1600;
        c.height = 1200;
        const x = c.getContext('2d');
        x.fillStyle = '#d7ff3f';
        x.fillRect(0, 0, c.width, c.height);
        window.__cameraImage = c.toDataURL('image/jpeg');
        window.__cancelCamera = true;
        window.androidBridge = {};
        window.Capacitor = {
          PluginHeaders: [
            { name: 'Camera', methods: [{ name: 'getPhoto', rtype: 'promise' }] },
            {
              name: 'App',
              methods: [
                { name: 'addListener', rtype: 'callback' },
                { name: 'removeListener', rtype: 'promise' },
              ],
            },
            { name: 'NotDisplay', methods: [{ name: 'preferences', rtype: 'promise' }] },
          ],
          nativeCallback: async (plugin, method, options, callback) => {
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
            if (plugin !== 'Camera') return {};
            window.__cameraOptions = options;
            const db = await new Promise((resolve) => {
              const q = indexedDB.open('not-food-drink-personal');
              q.onsuccess = () => resolve(q.result);
            });
            window.__persistedBeforeCamera = await new Promise((resolve) => {
              const q = db
                .transaction('capture-drafts')
                .objectStore('capture-drafts')
                .get('pending');
              q.onsuccess = () => resolve(!!q.result);
            });
            db.close();
            if (window.__cancelCamera) throw new Error('User cancelled photos app');
            return { webPath: window.__cameraImage };
          },
        };
      });
      const p = await context.newPage();
      await p.goto(base);
      await p.getByRole('heading', { name: 'Quán xá (0)', exact: true }).waitFor();
      await nav(p, 'Chấm điểm');
      await p.getByRole('button', { name: 'Chụp', exact: true }).click();
      await p
        .getByRole('status')
        .filter({ hasText: 'Đang xử lý ảnh' })
        .waitFor({ state: 'detached' });
      assert.equal(await p.evaluate(() => window.__persistedBeforeCamera), true);
      assert.equal(await p.getByRole('alert').count(), 0);
      await nav(p, 'Quán xá');
      assert.equal(await p.getByRole('dialog').count(), 0);
      await nav(p, 'Chấm điểm');
      await p.getByLabel('Tên quán').fill('Quán chụp ảnh');
      await p.evaluate(() => {
        window.__cancelCamera = false;
      });
      await p.getByRole('button', { name: 'Chụp', exact: true }).click();
      await p.locator('.photo-grid img').waitFor();
      assert.equal((await readDoc(p)).reviews.length, 0);
      const options = await p.evaluate(() => window.__cameraOptions);
      assert.equal(options.saveToGallery, false);
      assert.equal(options.correctOrientation, true);
      await p.getByRole('button', { name: 'Xem Ảnh trải nghiệm 1', exact: true }).click();
      await p.getByRole('dialog', { name: 'Ảnh trải nghiệm 1', exact: true }).waitFor();
      await assertNoOverflow(p);
      await closeDialog(p);
      await p.getByRole('dialog').waitFor({ state: 'detached' });
      await p.getByRole('button', { name: 'Lưu đánh giá & vị trí', exact: true }).click();
      await p.getByRole('heading', { name: 'Quán xá (1)', exact: true }).waitFor();
      const saved = await readDoc(p);
      const measured = await p.evaluate(async (id) => {
        const db = await new Promise((resolve) => {
          const q = indexedDB.open('not-food-drink-personal');
          q.onsuccess = () => resolve(q.result);
        });
        const photo = await new Promise((resolve) => {
          const q = db.transaction('photos').objectStore('photos').get(id);
          q.onsuccess = () => resolve(q.result);
        });
        db.close();
        const bitmap = await createImageBitmap(photo.blob);
        const dimensions = [bitmap.width, bitmap.height];
        bitmap.close();
        return { bytes: photo.blob.size, type: photo.blob.type, dimensions };
      }, saved.reviews[0].photoIds[0]);
      assert.ok(measured.bytes <= 300000);
      assert.equal(measured.type, 'image/webp');
      assert.ok(Math.max(...measured.dimensions) <= 1400);
      await p.evaluate(async (original) => {
        const db = await new Promise((resolve) => {
          const q = indexedDB.open('not-food-drink-personal');
          q.onsuccess = () => resolve(q.result);
        });
        await new Promise((resolve, reject) => {
          const tx = db.transaction('capture-drafts', 'readwrite');
          tx.objectStore('capture-drafts').put(
            {
              original,
              isEdit: true,
              draft: { ...original, note: 'Ghi chú chưa lưu' },
              price: String(original.priceK),
              reviewDate: original.reviewedAt.slice(0, 10),
              firstVisit: false,
              photos: [],
              recoveryId: 'interrupted-capture',
            },
            'pending',
          );
          tx.oncomplete = resolve;
          tx.onabort = () => reject(tx.error);
        });
        db.close();
        sessionStorage.setItem('restore-camera', '1');
      }, saved.reviews[0]);
      await p.reload();
      await p.getByRole('heading', { name: 'Sửa đánh giá', exact: true }).waitFor();
      await p.locator('.photo-grid img').nth(1).waitFor();
      assert.deepEqual(await readDoc(p), saved);
      await p.getByRole('button', { name: 'Lưu đánh giá & vị trí', exact: true }).click();
      await p.getByRole('heading', { name: 'Quán xá (1)', exact: true }).waitFor();
      const restored = await readDoc(p);
      assert.equal(restored.reviews[0].photoIds.length, 2);
      assert.equal(restored.reviews[0].note, 'Ghi chú chưa lưu');
      assert.equal(restored.reviews[0].totalScore, saved.reviews[0].totalScore);
      await writeFile(
        resolve(output, 'camera-bridge-results.json'),
        JSON.stringify(
          {
            pass: true,
            source: 'Synthetic native bridge, not hardware camera',
            measured,
            cancelIsClean: true,
            interruptedDraftPreserved: true,
          },
          null,
          2,
        ),
      );
    },
  );
  await scenario(
    'v12 migration preserves raw source, remaps verified Nốt and retires only Bếp Trang sample',
    async () => {
      primary = await setup({ legacy: JSON.stringify(INITIAL_REVIEWS) });
      const { page: p, errors } = primary;
      await p.getByRole('heading', { name: 'Quán xá (1)', exact: true }).waitFor();
      const d = await readDoc(p);
      assert.equal(d.reviews.length, 2);
      assert.equal(d.reviews.filter((r) => r.isDemo).length, 1);
      assert.equal(d.reviews[0].totalScore, 6.5);
      assert.equal(d.reviews[0].locationStatus, 'confirmed');
      assert.equal(d.reviews[0].name, 'Nốt Tea');
      assert.equal(d.reviews[0].address, '38');
      assert.equal(d.reviews[0].lat, 16.06528);
      assert.equal(d.reviews[0].lng, 108.2083);
      assert.equal(d.reviews[1].locationStatus, 'missing');
      assert.equal(
        await p.evaluate(() => localStorage.getItem('not_drink_food_reviews_v11')),
        JSON.stringify(INITIAL_REVIEWS),
      );
      await p.screenshot({ path: resolve(output, '01-mobile-list.png') });
      await assertNoOverflow(p);
      assert.deepEqual(errors, []);
    },
  );
  await scenario(
    'pristine and reverted forms leave freely; only real changes require confirmation',
    async () => {
      const p = primary.page;
      await nav(p, 'Chấm điểm');
      await p.getByRole('heading', { name: 'Chấm điểm', exact: true }).waitFor();
      await assertButtonContrast(p, 'Lưu quán');
      await nav(p, 'Quán xá');
      await p.getByRole('button', { name: 'Đổi sang giao diện sáng', exact: true }).click();
      await nav(p, 'Chấm điểm');
      await assertButtonContrast(p, 'Lưu quán');
      await nav(p, 'Quán xá');
      await p.getByRole('button', { name: 'Đổi sang giao diện tối', exact: true }).click();
      await nav(p, 'Chấm điểm');
      await nav(p, 'Bản đồ');
      assert.equal(await p.getByRole('dialog').count(), 0);
      await nav(p, 'Chấm điểm');
      await p.getByLabel('Tên quán').fill('Tên tạm');
      await p.getByLabel('Tên quán').fill('');
      await p.getByRole('slider', { name: 'Hương vị đồ uống', exact: true }).press('ArrowRight');
      await p.getByRole('slider', { name: 'Hương vị đồ uống', exact: true }).press('ArrowLeft');
      await nav(p, 'Thống kê');
      assert.equal(await p.getByRole('dialog').count(), 0);
      await nav(p, 'Chấm điểm');
      await p.getByLabel('Tên quán').fill('Bản nháp cần giữ');
      await nav(p, 'Quán xá');
      await p.getByRole('dialog', { name: 'Rời phần đang nhập?' }).waitFor();
      await p.getByRole('button', { name: 'Tiếp tục nhập', exact: true }).click();
      assert.equal(await p.getByLabel('Tên quán').inputValue(), 'Bản nháp cần giữ');
      await p.getByLabel('Tên quán').fill('');
      await nav(p, 'Quán xá');
      assert.equal(await p.getByRole('dialog').count(), 0);
      await p.locator('.review-card>.review-summary').click();
      await p.getByRole('button', { name: 'Sửa đánh giá', exact: true }).click();
      await nav(p, 'Thống kê');
      assert.equal(await p.getByRole('dialog').count(), 0);
      await nav(p, 'Quán xá');
      if (await p.locator('.review-card').evaluate((el) => el.dataset.expanded === 'true'))
        await p.locator('.review-card>.review-summary').click();
    },
  );
  await scenario(
    'spin keeps zero and single eligible pool, chosen place does not consume visit',
    async () => {
      const p = primary.page;
      await p.getByRole('button', { name: 'Ăn gì?', exact: true }).click();
      await p.getByText('0 quán hợp lệ, còn lượt gợi ý', { exact: true }).waitFor();
      assert.equal(await p.getByRole('button', { name: 'QUAY', exact: true }).count(), 0);
      await p.getByLabel('Ưu tiên quán đáng quay lại (từ 7,5 điểm)').uncheck();
      await p.getByText('1 quán hợp lệ, còn lượt gợi ý', { exact: true }).waitFor();
      await p.getByRole('button', { name: 'CHỌN', exact: true }).click();
      await p.getByRole('button', { name: 'Chọn quán này', exact: true }).click();
      assert.equal((await readDoc(p)).reviews[0].visitLog.length, 0);
      await p.locator('.review-card>.review-summary').click();
    },
  );
  await scenario('shared category filter drives list, map, insights and spin', async () => {
    const p = primary.page;
    await p.getByRole('radio', { name: 'Quán ăn (0)', exact: true }).click();
    await p.getByRole('heading', { name: 'Quán xá (0)', exact: true }).waitFor();
    await nav(p, 'Bản đồ');
    await p.getByText('0 quán · 0 ghim xác nhận', { exact: true }).waitFor();
    await nav(p, 'Thống kê');
    await p.locator('.stat-grid').waitFor();
    assert.equal(await p.locator('.stat-grid .panel').first().locator('strong').innerText(), '0');
    await p.getByRole('button', { name: 'Ăn gì?', exact: true }).click();
    await p.getByText('0 quán hợp lệ, còn lượt gợi ý', { exact: true }).waitFor();
    await closeDialog(p);
    await p.getByRole('radio', { name: 'Tất cả (1)', exact: true }).click();
  });
  await scenario('bad JSON and invalid negative price cannot overwrite data', async () => {
    const p = primary.page,
      before = await readDoc(p);
    await importText(p, '[{"name":"bad"}]');
    await p.getByRole('alert').waitFor();
    assert.deepEqual(await readDoc(p), before);
    assert.equal(await p.getByRole('dialog').count(), 0);
    await nav(p, 'Chấm điểm');
    await p.getByLabel('Tên quán').fill('Quán kiểm thử riêng');
    await p.locator('#review-price').fill('-10');
    await p.getByRole('heading', { name: 'Chấm điểm', exact: true }).click();
    await p.getByRole('button', { name: 'Lưu quán', exact: true }).click();
    await p.getByRole('alert').first().waitFor();
    assert.deepEqual(await readDoc(p), before);
    await p.locator('#review-price').fill('29.5');
    await p.getByLabel('Món nên gọi / món đã thử').fill('Ô long ít đường');
    await p.getByLabel('Ghi chú trải nghiệm').fill('Dữ liệu kiểm thử trong hồ sơ Chrome riêng');
    await p.getByRole('button', { name: 'Lưu đánh giá & vị trí', exact: true }).click();
    await p.getByRole('heading', { name: 'Quán xá (2)', exact: true }).waitFor();
    assert.equal(
      (await readDoc(p)).reviews.find((r) => r.name === 'Quán kiểm thử riêng').priceK,
      29.5,
    );
  });
  await scenario(
    'visit CRUD records actual spend, date uses Vietnam, delete can be undone',
    async () => {
      const p = primary.page;
      await p
        .getByRole('button', { name: 'Lượt ghé & tiền', exact: true })
        .filter({ visible: true })
        .first()
        .click();
      const dialog = p.getByRole('dialog');
      await dialog.getByLabel(/Tiền thực trả/).fill('35.5');
      await dialog.getByRole('button', { name: 'Ghi nhận đã ghé', exact: true }).click();
      await eventuallyDoc(p, (d) =>
        d.reviews.some((r) => r.visitLog.some((v) => v.spentK === 35.5)),
      );
      await dialog.getByRole('button', { name: 'Sửa lượt ghé', exact: true }).first().click();
      await dialog.getByLabel(/Tiền thực trả/).fill('36');
      await dialog.getByRole('button', { name: 'Lưu sửa lượt ghé', exact: true }).click();
      await eventuallyDoc(p, (d) => d.reviews.some((r) => r.visitLog.some((v) => v.spentK === 36)));
      await dialog.getByRole('button', { name: 'Bỏ lượt ghi nhầm', exact: true }).first().click();
      await p.getByRole('button', { name: 'Bỏ lượt này', exact: true }).click();
      await p.getByRole('button', { name: 'Hoàn tác bỏ lượt ghé', exact: true }).click();
      await eventuallyDoc(p, (d) => d.reviews.some((r) => r.visitLog.some((v) => v.spentK === 36)));
      await closeDialog(p);
    },
  );
  await scenario('export, explicit empty replacement, reload empty, restore snapshot', async () => {
    const p = primary.page;
    await nav(p, 'Thống kê');
    const downloading = p.waitForEvent('download');
    await p.getByRole('button', { name: 'Xuất JSON', exact: true }).click();
    const download = await downloading;
    await download.saveAs(resolve(output, 'roundtrip-backup.json'));
    const backup = JSON.parse(await readFile(await download.path(), 'utf8'));
    assert.equal(backup.reviews.length, 3);
    assert.ok(backup.reviews.some((r) => r.visitLog.length));
    await importText(p, '[]');
    const dialog = p.getByRole('dialog');
    await dialog.getByLabel(/Thay toàn bộ/).check();
    assert.equal(
      await dialog.getByRole('button', { name: 'Xác nhận khôi phục' }).isDisabled(),
      true,
    );
    await dialog.getByLabel(/Tôi đã kiểm tra file/).check();
    await dialog.getByRole('button', { name: 'Xác nhận khôi phục' }).click();
    await eventuallyDoc(p, (d) => d.reviews.length === 0);
    await p.reload();
    await nav(p, 'Thống kê');
    assert.equal((await readDoc(p)).reviews.length, 0);
    await p.getByText(/Dự phòng/).click();
    await p.getByRole('button').filter({ hasText: 'Khôi phục JSON (thay thế)' }).first().click();
    await p.getByRole('button', { name: 'Khôi phục bản này', exact: true }).click();
    await eventuallyDoc(p, (d) => d.reviews.length === 3);
  });
  await scenario(
    'animated Radix modal traps focus, Escape restores focus, phone 360px light theme and 200% text',
    async () => {
      const p = primary.page;
      await p.setViewportSize({ width: 360, height: 800 });
      await p.getByRole('button', { name: 'Đổi sang giao diện sáng' }).click();
      await p.getByRole('button', { name: 'Bộ lọc', exact: true }).click();
      await p.keyboard.press('Tab');
      assert.equal(
        await p.evaluate(() =>
          document.querySelector('[role="dialog"]').contains(document.activeElement),
        ),
        true,
      );
      await p.screenshot({ path: resolve(output, '02-mobile-light-filters.png') });
      await closeDialog(p);
      await p.waitForFunction(
        () => document.querySelector('.search-row > button') === document.activeElement,
      );
      assert.equal(
        await p
          .getByRole('button', { name: 'Bộ lọc', exact: true })
          .evaluate((el) => el === document.activeElement),
        true,
      );
      await assertNoOverflow(p);
      await p.addStyleTag({ content: 'html,body,#root {font-size:28px !important}' });
      await assertNoOverflow(p);
    },
  );
  await scenario(
    'fresh empty profile stays empty through reload; corrupt legacy offers raw recovery',
    async () => {
      const { page: p } = await setup({ legacy: '[]' });
      await p.getByRole('button', { name: 'Chấm quán đầu tiên', exact: true }).waitFor();
      await p.reload();
      assert.equal((await readDoc(p)).reviews.length, 0);
      await p.getByRole('button', { name: 'Quán minh họa', exact: true }).click();
      const examples = p.getByRole('dialog', { name: 'Quán minh họa' });
      await examples.getByRole('heading', { name: 'Nốt Tea', exact: true }).waitFor();
      assert.equal(await examples.getByText(/Bếp Trang/).count(), 0);
      await examples
        .locator('.panel')
        .filter({ hasText: 'Bánh Canh Cá Lóc Thanh Hương' })
        .getByRole('button', { name: 'Chấm lại theo trải nghiệm của tôi', exact: true })
        .click();
      await p.locator('.form-address>summary').click();
      assert.equal(await p.getByLabel('Đường / phố / kiệt').inputValue(), '');
      await p.getByText('Chưa ghim', { exact: true }).waitFor();
      await p.getByRole('button', { name: 'Hủy', exact: true }).click();
      assert.equal(await p.getByRole('dialog').count(), 0);
      const c = await browser.newContext();
      contexts.push(c);
      await c.addInitScript(() => localStorage.setItem('not_drink_food_reviews_v11', '{bad'));
      const q = await c.newPage();
      await q.goto(base);
      await q.getByRole('heading', { name: 'Cần khôi phục dữ liệu', exact: true }).waitFor();
      await q
        .getByRole('button', { name: 'Tải nguyên dữ liệu gốc để giữ lại', exact: true })
        .waitFor();
      assert.equal(
        await q.evaluate(() => localStorage.getItem('not_drink_food_reviews_v11')),
        '{bad',
      );
    },
  );
  await scenario(
    'precache is complete; offline reload and every lazy screen keep data',
    async () => {
      const { page: p, context, errors } = await setup({ legacy: JSON.stringify(INITIAL_REVIEWS) });
      await p.locator('[data-offline-ready="true"]').waitFor({ timeout: 45000 });
      const before = await readDoc(p);
      await context.setOffline(true);
      await p.reload();
      await p.getByRole('heading', { name: 'Quán xá (1)', exact: true }).waitFor();
      assert.deepEqual(await readDoc(p), before);
      await nav(p, 'Thống kê');
      await p.locator('.stat-grid').waitFor();
      await nav(p, 'Chấm điểm');
      await p.locator('.form-address>summary').click();
      await p.getByRole('button', { name: 'Chọn từ danh mục', exact: true }).click();
      await p
        .getByRole('button', { name: /Phường Thanh Khê/ })
        .first()
        .waitFor();
      await closeDialog(p);
      await p.getByRole('button', { name: 'Hủy', exact: true }).click();
      assert.equal(await p.getByRole('dialog').count(), 0);
      await nav(p, 'Bản đồ');
      await p.getByRole('region', { name: 'Điều khiển bản đồ', exact: true }).waitFor();
      await p.screenshot({ path: resolve(output, '03-mobile-offline-map.png') });
      assert.deepEqual(errors, []);
      await p.goto(new URL('assets/index.html', base).href);
      await p.getByRole('heading', { name: 'Quán xá (1)', exact: true }).waitFor();
      assert.equal(new URL(p.url()).pathname, '/drink-rate-a56/');
    },
  );
  await scenario('desktop layout and primary flows have no JavaScript exceptions', async () => {
    const { page: p, errors } = await setup({
      legacy: JSON.stringify(INITIAL_REVIEWS),
      viewport: { width: 1365, height: 900 },
    });
    await p.getByRole('heading', { name: 'Quán xá (1)', exact: true }).waitFor();
    await p.screenshot({ path: resolve(output, '04-desktop.png') });
    await assertNoOverflow(p);
    assert.deepEqual(errors, []);
  });
  await scenario(
    'photo backup round-trip and duplicate import preserve images in retained snapshots',
    async () => {
      const { page: p } = await setup({ legacy: '[]' });
      await nav(p, 'Chấm điểm');
      await p.getByLabel('Tên quán').fill('Quán có ảnh');
      const image = await p.evaluate(() => {
        const c = document.createElement('canvas');
        c.width = 80;
        c.height = 60;
        const x = c.getContext('2d');
        x.fillStyle = '#10b981';
        x.fillRect(0, 0, 80, 60);
        return c.toDataURL('image/png').split(',')[1];
      });
      await p.getByLabel('Thêm ảnh món ăn hoặc quán').setInputFiles({
        name: 'dish.png',
        mimeType: 'image/png',
        buffer: Buffer.from(image, 'base64'),
      });
      await p.locator('.photo-grid img').waitFor();
      await p.getByRole('button', { name: 'Lưu đánh giá & vị trí', exact: true }).click();
      await p.getByRole('heading', { name: 'Quán xá (1)', exact: true }).waitFor();
      const before = await readDoc(p);
      assert.equal(before.reviews[0].photoIds.length, 1);
      await nav(p, 'Thống kê');
      const dl = p.waitForEvent('download');
      await p.getByRole('button', { name: 'Xuất JSON', exact: true }).click();
      const backup = JSON.parse(await readFile(await (await dl).path(), 'utf8'));
      assert.equal(backup.media.length, 1);
      assert.ok(backup.media[0].dataUrl.startsWith('data:image/webp;base64,'));
      await importText(p, JSON.stringify(backup));
      await p.getByRole('button', { name: 'Xác nhận khôi phục', exact: true }).click();
      await p.getByRole('dialog').waitFor({ state: 'detached' });
      assert.deepEqual((await readDoc(p)).reviews, before.reviews);
      await importText(p, '[]');
      await p.getByLabel(/Thay toàn bộ/).check();
      await p.getByLabel(/Tôi đã kiểm tra file/).check();
      await p.getByRole('button', { name: 'Xác nhận khôi phục' }).click();
      await eventuallyDoc(p, (d) => d.reviews.length === 0);
      await importText(p, JSON.stringify(backup));
      await p.getByRole('button', { name: 'Xác nhận khôi phục' }).click();
      await eventuallyDoc(p, (d) => d.reviews.length === 1);
      const after = await readDoc(p);
      assert.notEqual(after.reviews[0].photoIds[0], before.reviews[0].photoIds[0]);
      assert.equal(
        await p.evaluate(async (id) => {
          const q = await new Promise((resolve) => {
            const r = indexedDB.open('not-food-drink-personal');
            r.onsuccess = () => resolve(r.result);
          });
          return await new Promise((resolve) => {
            const r = q.transaction('photos').objectStore('photos').get(id);
            r.onsuccess = () => {
              q.close();
              resolve(!!r.result?.blob?.size);
            };
          });
        }, before.reviews[0].photoIds[0]),
        true,
      );
      await nav(p, 'Quán xá');
      if (!(await p.locator('.review-card').evaluate((el) => el.dataset.expanded === 'true')))
        await p.locator('.review-card>.review-summary').click();
      await p.locator('.review-card img').waitFor();
      await p.screenshot({ path: resolve(output, '05-photo-review.png') });
    },
  );
  await scenario(
    'failed IndexedDB transaction keeps draft and old document; retry persists once',
    async () => {
      const { page: p } = await setup({ legacy: '[]' }),
        before = await readDoc(p);
      await p.evaluate(() => {
        window.__idbTransaction = IDBDatabase.prototype.transaction;
        IDBDatabase.prototype.transaction = function (stores, mode, ...rest) {
          const tx = window.__idbTransaction.call(this, stores, mode, ...rest);
          if (
            mode === 'readwrite' &&
            Array.from(typeof stores === 'string' ? [stores] : stores).includes('documents')
          )
            queueMicrotask(() => tx.abort());
          return tx;
        };
      });
      await nav(p, 'Chấm điểm');
      await p.getByLabel('Tên quán').fill('Bản nháp khi hết dung lượng');
      await p.getByRole('button', { name: 'Lưu đánh giá & vị trí', exact: true }).click();
      await p.getByText('Chưa lưu thay đổi.', { exact: true }).waitFor();
      assert.deepEqual(await readDoc(p), before);
      assert.equal(await p.getByLabel('Tên quán').inputValue(), 'Bản nháp khi hết dung lượng');
      assert.equal(await p.getByText('Đã lưu', { exact: true }).count(), 0);
      await p.evaluate(() => {
        IDBDatabase.prototype.transaction = window.__idbTransaction;
      });
      await p.getByRole('button', { name: 'Lưu đánh giá & vị trí', exact: true }).click();
      await eventuallyDoc(p, (d) => d.reviews.length === 1);
    },
  );
  await scenario(
    'two windows preserve concurrent visits and reject a stale review edit',
    async () => {
      const fixture = [{ ...INITIAL_REVIEWS[0], name: 'Quán hai cửa sổ' }];
      const { context, page: a } = await setup({ legacy: JSON.stringify(fixture) });
      const b = await context.newPage();
      b.setDefaultTimeout(12000);
      await b.goto(base);
      await b.getByRole('navigation').waitFor();
      for (const p of [a, b]) {
        await p.locator('.review-card>.review-summary').click();
        await p.getByRole('button', { name: 'Lượt ghé & tiền', exact: true }).click();
      }
      await a.getByLabel(/Tiền thực trả/).fill('20');
      await b.getByLabel(/Tiền thực trả/).fill('21');
      await Promise.all([
        a.getByRole('button', { name: 'Ghi nhận đã ghé', exact: true }).click(),
        b.getByRole('button', { name: 'Ghi nhận đã ghé', exact: true }).click(),
      ]);
      await eventuallyDoc(a, (d) => d.reviews[0].visitLog.length === 2);
      await closeDialog(a);
      await closeDialog(b);
      for (const p of [a, b])
        await p.getByRole('button', { name: 'Sửa đánh giá', exact: true }).click();
      await a.getByLabel('Ghi chú trải nghiệm').fill('Ghi chú được lưu đầu tiên');
      await b.getByLabel('Ghi chú trải nghiệm').fill('Bản nháp xung đột phải được giữ');
      await a.getByRole('button', { name: 'Lưu cập nhật quán', exact: true }).click();
      await a.getByRole('heading', { name: 'Quán xá (1)', exact: true }).waitFor();
      await b.getByRole('button', { name: 'Lưu cập nhật quán', exact: true }).click();
      await b.getByText('Chưa lưu thay đổi.', { exact: true }).waitFor();
      const d = await readDoc(a);
      assert.equal(d.reviews[0].note, 'Ghi chú được lưu đầu tiên');
      assert.equal(d.reviews[0].visitLog.length, 2);
      assert.equal(
        await b.getByLabel('Ghi chú trải nghiệm').inputValue(),
        'Bản nháp xung đột phải được giữ',
      );
    },
  );
  await scenario('map marker handles HTML-looking names as plain text', async () => {
    const fixture = [
      {
        ...INITIAL_REVIEWS[0],
        name: '<img src=x onerror="window.__xss=1">',
        locationStatus: 'confirmed',
        locationSource: 'manual',
      },
    ];
    const { page: p, errors } = await setup({ legacy: JSON.stringify(fixture) });
    await nav(p, 'Bản đồ');
    await p.locator('.place-pin').waitFor();
    assert.equal(await p.locator('.place-pin img').count(), 0);
    assert.ok((await p.locator('.place-pin').innerText()).includes('<img'));
    assert.equal(await p.evaluate(() => window.__xss), undefined);
    const mapLayout = await p.evaluate(() => {
      const marker = document.querySelector('.place-pin').getBoundingClientRect();
      const dock = document.querySelector('.bottom-dock').getBoundingClientRect();
      return {
        markerBottom: marker.bottom,
        dockTop: dock.top,
        toolbarHeight: document.querySelector('.map-toolbar').getBoundingClientRect().height,
      };
    });
    assert.ok(
      mapLayout.markerBottom < mapLayout.dockTop,
      `The initial pin is hidden by navigation: ${JSON.stringify(mapLayout)}`,
    );
    assert.ok(
      mapLayout.toolbarHeight <= 86,
      `Map controls consume too much space: ${JSON.stringify(mapLayout)}`,
    );
    assert.equal(
      await p.getByRole('heading', { name: 'Bản đồ trong bộ lọc', exact: true }).count(),
      0,
    );
    await p.getByRole('button', { name: 'Chấm ghim mới', exact: true }).click();
    await p.getByRole('button', { name: 'Dừng chấm ghim', exact: true }).waitFor();
    await p.getByRole('button', { name: 'Dừng chấm ghim', exact: true }).click();
    await p.screenshot({ path: resolve(output, '06-confirmed-map.png') });
    assert.deepEqual(errors, []);
  });
  await scenario(
    'motion is visibly active, scoring rolls, touch sparks run only on interaction, copy stays compact',
    async () => {
      const { page: p, errors } = await setup({
        legacy: JSON.stringify(INITIAL_REVIEWS),
        reducedMotion: 'no-preference',
      });
      const copy = await p.locator('main').innerText();
      for (const text of [
        'Trải nghiệm của riêng bạn',
        'Sẵn sàng dùng ngoại tuyến',
        'Cách chấm điểm',
        'NỐT 15.0.0',
      ])
        assert.ok(!copy.includes(text), text);
      const selectedFilter = p.locator('.category-tabs button[data-state="on"]');
      assert.notEqual(
        await selectedFilter.evaluate((e) => getComputedStyle(e).backgroundColor),
        'rgba(0, 0, 0, 0)',
        'Selected filter must carry its own readable background',
      );
      assert.ok(
        (await p
          .locator('.bottom-dock button')
          .first()
          .evaluate((e) => parseFloat(getComputedStyle(e).fontSize))) >= 11,
      );
      // Observe before the click so protocol scheduling cannot miss a short
      // entrance animation on a busy runner. Still require real painted frames.
      const transformSamples = p.evaluate(async () => {
        const samples = [];
        for (let i = 0; i < 75; i++) {
          await new Promise(requestAnimationFrame);
          const el = document.querySelector('.app-scene');
          if (el) samples.push(getComputedStyle(el).transform);
        }
        return [...new Set(samples)];
      });
      await nav(p, 'Chấm điểm');
      const transforms = await transformSamples;
      assert.ok(
        transforms.length > 3,
        'Screen transition must contain visible intermediate positions',
      );
      await p.getByRole('heading', { name: 'Chấm điểm', exact: true }).click();
      const sparks = await p.locator('.spark-stage canvas[aria-hidden="true"]').count();
      assert.ok(sparks > 0, 'A fresh interaction must render a real React Bits burst');
      const scoreSamples = p.evaluate(async () => {
        const samples = [];
        for (let i = 0; i < 40; i++) {
          await new Promise(requestAnimationFrame);
          samples.push(
            document.querySelector('.live-score .score [data-motion="number"] [aria-hidden="true"]')
              ?.textContent,
          );
        }
        return [...new Set(samples)];
      });
      await p.getByRole('slider', { name: 'Hương vị đồ uống', exact: true }).press('ArrowRight');
      const values = await scoreSamples;
      assert.ok(values.filter(Boolean).length > 2, 'Score must roll through intermediate values');
      assert.equal(
        (await readDoc(p)).reviews[0].totalScore,
        6.5,
        'Draft animation must not alter stored scores',
      );
      await p.emulateMedia({ reducedMotion: 'reduce' });
      await p.waitForFunction(() => document.querySelectorAll('.spark-stage canvas').length === 0);
      await p.getByRole('button', { name: 'Hủy', exact: true }).click();
      await p.getByRole('button', { name: 'Bỏ bản nháp và rời màn hình', exact: true }).click();
      assert.equal(
        await p.locator('.spark-stage canvas').count(),
        0,
        'Reduced motion must suppress click sparks',
      );
      await p.emulateMedia({ reducedMotion: 'no-preference' });
      await nav(p, 'Chấm điểm');
      await p.getByRole('heading', { name: 'Chấm điểm', exact: true }).click();
      assert.ok(
        await p.locator('.spark-stage canvas[aria-hidden="true"]').count(),
        'Motion must resume when the preference is restored',
      );
      await nav(p, 'Quán xá');
      await assertNoOverflow(p);
      assert.deepEqual(errors, []);
      await writeFile(
        resolve(output, 'motion-results.json'),
        JSON.stringify(
          {
            pass: true,
            distinctScreenFrames: transforms.length,
            distinctScoreValues: values.length,
            touchSparks: sparks,
            reducedMotionRespected: true,
            compactCopy: true,
          },
          null,
          2,
        ),
      );
      await p.screenshot({ path: resolve(output, '08-kinetic-ui.png') });
    },
  );
  await scenario(
    'rapid tab changes never retain old screens; average contrast and dial geometry survive every breakpoint',
    async () => {
      const fixture = Array.from({ length: 5 }, (_, i) => ({
        ...INITIAL_REVIEWS[0],
        id: `layout-${i}`,
        isDemo: false,
        name:
          i === 0
            ? 'Quán có tên rất dài để kiểm tra bố cục trên điện thoại nhỏ'
            : `Quán kiểm thử ${i + 1}`,
        taste: [7, 8, 6, 9, 7.5][i],
      }));
      const { page: p, errors } = await setup({
        legacy: JSON.stringify(fixture),
        reducedMotion: 'no-preference',
      });
      const results = [];
      for (const width of [320, 360, 393, 412, 768, 1365]) {
        await p.setViewportSize({ width, height: width > 1100 ? 900 : 852 });
        const navigation = p.getByRole('navigation', {
          name: width >= 1100 ? 'Điều hướng máy tính' : 'Điều hướng chính',
          exact: true,
        });
        for (const label of [
          'Thống kê',
          'Quán xá',
          'Bản đồ',
          'Thống kê',
          'Quán xá',
          'Chấm điểm',
          'Quán xá',
          'Thống kê',
        ]) {
          await navigation.getByRole('button', { name: label, exact: true }).click();
          await p.waitForTimeout(30);
          assert.ok(
            (await p.locator('.app-scene').count()) <= 1,
            'Never paint two app routes in one frame',
          );
        }
        await p.locator('.app-scene[data-screen-index="3"]:not([aria-hidden="true"])').waitFor();
        await p.waitForTimeout(500);
        assert.equal(await p.locator('.app-scene').count(), 1);
        assert.equal(
          await p.locator('.app-scene[inert]').count(),
          0,
          'Every old screen must unmount',
        );
        const value = await p.locator('[data-stat="average"]').innerText();
        const expected = (await readDoc(p)).reviews.reduce((sum, r) => sum + r.totalScore, 0) / 5;
        assert.equal(value, expected.toFixed(1));
        const contrast = await p.locator('[data-stat="average"]').evaluate((element) => {
          const luminance = (color) => {
            const rgb = color
              .match(/[\d.]+/g)
              .slice(0, 3)
              .map(Number)
              .map((v) => {
                const n = v / 255;
                return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
              });
            return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
          };
          const fg = luminance(getComputedStyle(element).color),
            bg = luminance(getComputedStyle(element.parentElement).backgroundColor);
          return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
        });
        assert.ok(contrast >= 4.5, `Average score contrast ${contrast}`);
        await assertNoOverflow(p);
        if ([393, 1365].includes(width))
          await p.screenshot({ path: resolve(output, `09-stats-${width}.png`) });
        await navigation.getByRole('button', { name: 'Quán xá', exact: true }).click();
        await p.locator('.app-scene[data-screen-index="0"]:not([aria-hidden="true"])').waitFor();
        await p.waitForTimeout(550);
        const circles = await p.locator('.score-dial').evaluateAll((elements) =>
          elements
            .filter((e) => e.getBoundingClientRect().width > 0)
            .map((e) => {
              const r = e.getBoundingClientRect(),
                matrix = e.querySelector('svg').getScreenCTM();
              return {
                width: r.width,
                height: r.height,
                scaleX: Math.hypot(matrix.a, matrix.b),
                scaleY: Math.hypot(matrix.c, matrix.d),
              };
            }),
        );
        for (const circle of circles) {
          assert.ok(Math.abs(circle.width - circle.height) < 1, JSON.stringify(circle));
          assert.ok(
            Math.abs(circle.scaleX - circle.scaleY) < 0.01,
            'SVG circle may not stretch into an ellipse',
          );
        }
        await navigation.getByRole('button', { name: 'Chấm điểm', exact: true }).click();
        await p.getByLabel('Tên quán', { exact: true }).waitFor();
        await p.waitForTimeout(350);
        const formCircle = await p.locator('.dial-mini').boundingBox();
        assert.ok(Math.abs(formCircle.width - formCircle.height) < 1);
        await assertNoOverflow(p);
        if (width === 393) await p.screenshot({ path: resolve(output, '10-form-393.png') });
        await navigation.getByRole('button', { name: 'Quán xá', exact: true }).click();
        await p.locator('.app-scene[data-screen-index="0"]:not([aria-hidden="true"])').waitFor();
        results.push({
          width,
          average: value,
          contrast,
          circles: circles.length,
          routes: 1,
          formCircle,
        });
      }
      await p.setViewportSize({ width: 393, height: 852 });
      await p.getByRole('button', { name: 'Đổi sang giao diện sáng', exact: true }).click();
      await nav(p, 'Thống kê');
      assert.equal(
        await p
          .locator('.stat-average')
          .evaluate(
            (e) => getComputedStyle(e).color === getComputedStyle(e.querySelector('strong')).color,
          ),
        true,
      );
      await p.screenshot({ path: resolve(output, '11-stats-light-393.png') });
      assert.deepEqual(errors, []);
      await writeFile(
        resolve(output, 'layout-regression.json'),
        JSON.stringify({ pass: true, results }, null, 2),
      );
    },
  );
  await scenario(
    'dock keeps a circular review action and aligned labels at every text size',
    async () => {
      const { page: p, errors } = await setup({ reducedMotion: 'no-preference' });
      const measurements = [];
      for (const width of [320, 360, 384, 393, 412, 768]) {
        await p.setViewportSize({ width, height: 852 });
        for (const fontSize of [12, 15.6, 24]) {
          const style = await p.addStyleTag({
            content: `.bottom-dock button {font-size:${fontSize}px !important}`,
          });
          for (const label of ['Quán xá', 'Chấm điểm', 'Thống kê', 'Bản đồ']) {
            await nav(p, label);
            await p.waitForTimeout(300);
            const geometry = await p.locator('.bottom-dock').evaluate((dock) => {
              const box = dock.getBoundingClientRect();
              return {
                viewport: { width: innerWidth, height: innerHeight },
                clearance: parseFloat(
                  getComputedStyle(document.querySelector('.app-main')).paddingBottom,
                ),
                dockHeight: box.height,
                dock: { x: box.x, y: box.y, right: box.right, bottom: box.bottom },
                items: Array.from(dock.querySelectorAll('button')).map((button) => {
                  const b = button.getBoundingClientRect(),
                    icon = button.querySelector('.nav-icon').getBoundingClientRect(),
                    caption = button.querySelector('.nav-label'),
                    text = caption.getBoundingClientRect();
                  return {
                    label: button.textContent,
                    width: b.width,
                    height: b.height,
                    iconWidth: icon.width,
                    iconHeight: icon.height,
                    textY: text.y,
                    textBottom: text.bottom,
                    buttonBottom: b.bottom,
                    textWidth: caption.clientWidth,
                    textScrollWidth: caption.scrollWidth,
                  };
                }),
              };
            });
            assert.ok(geometry.dock.x >= 0 && geometry.dock.right <= width + 1);
            assert.ok(geometry.dock.bottom <= geometry.viewport.height + 1);
            assert.ok(
              geometry.clearance >= geometry.dockHeight + 20,
              `Content is covered by the dock: ${JSON.stringify(geometry)}`,
            );
            for (const item of geometry.items) {
              assert.ok(
                item.width >= 48 && item.height >= 48,
                `Touch target ${JSON.stringify(item)}`,
              );
              assert.ok(
                Math.abs(item.iconWidth - item.iconHeight) < 0.5,
                `Circle ${JSON.stringify(item)}`,
              );
              assert.ok(
                Math.abs(item.textY - geometry.items[0].textY) < 0.5,
                `Caption alignment ${JSON.stringify(geometry.items)}`,
              );
              assert.ok(
                item.textBottom <= item.buttonBottom + 1,
                `Caption is clipped ${JSON.stringify(item)}`,
              );
              assert.ok(
                item.textScrollWidth <= item.textWidth + 1,
                `Caption overflows ${JSON.stringify(item)}`,
              );
            }
            measurements.push({ width, fontSize, tab: label, geometry });
          }
          if (width === 384 && fontSize === 12)
            await p.screenshot({ path: resolve(output, '12-dock-384.png') });
          if (width === 320 && fontSize === 24)
            await p.screenshot({ path: resolve(output, '13-dock-large-text-320.png') });
          await style.evaluate((element) => element.remove());
        }
        await assertNoOverflow(p);
      }
      assert.deepEqual(errors, []);
      await p.setViewportSize({ width: 384, height: 852 });
      await p.getByRole('button', { name: 'Đổi sang giao diện sáng', exact: true }).click();
      await nav(p, 'Chấm điểm');
      const lightReviewContrast = await p
        .locator('.bottom-dock button[data-nav-tab="review"]')
        .evaluate((button) => {
          const luminance = (color) => {
            const c = color
              .match(/[\d.]+/g)
              .slice(0, 3)
              .map(Number)
              .map((v) => {
                const n = v / 255;
                return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
              });
            return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
          };
          const fg = luminance(getComputedStyle(button).color),
            bg = luminance(
              getComputedStyle(button.querySelector('.nav-indicator')).backgroundColor,
            );
          return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
        });
      assert.ok(lightReviewContrast >= 4.5, `Light review caption contrast ${lightReviewContrast}`);
      await writeFile(
        resolve(output, 'dock-regression.json'),
        JSON.stringify({ pass: true, lightReviewContrast, measurements }, null, 2),
      );
    },
  );
} finally {
  for (const c of contexts) await c.close();
  await browser.close();
  console.log('Artifacts:', output);
}
