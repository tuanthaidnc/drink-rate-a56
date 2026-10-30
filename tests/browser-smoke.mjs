import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium } from 'playwright';
import { INITIAL_REVIEWS } from '../src/data/demo.ts';
import { createReview, validateReview } from '../src/lib/validation.ts';
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
async function setup({ legacy, viewport = { width: 393, height: 852 }, offline = false } = {}) {
  const context = await browser.newContext({
    viewport,
    isMobile: viewport.width < 600,
    hasTouch: viewport.width < 600,
    timezoneId: 'America/Los_Angeles',
    reducedMotion: 'reduce',
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
const nav = (p, label) =>
  p
    .getByRole('navigation', { name: 'Điều hướng chính' })
    .getByRole('button', { name: label, exact: true })
    .click();
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
      await p.getByRole('heading', { name: 'Chấm điểm quán', exact: true }).waitFor();
      await assertButtonContrast(p, 'Lưu quán');
      await p.getByRole('button', { name: 'Đổi sang giao diện sáng', exact: true }).click();
      await assertButtonContrast(p, 'Lưu quán');
      await p.getByRole('button', { name: 'Đổi sang giao diện tối', exact: true }).click();
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
      await p.locator('.review-card>summary').click();
      await p.getByRole('button', { name: 'Sửa đánh giá', exact: true }).click();
      await nav(p, 'Thống kê');
      assert.equal(await p.getByRole('dialog').count(), 0);
      await nav(p, 'Quán xá');
      if (await p.locator('.review-card').evaluate((el) => el.open))
        await p.locator('.review-card>summary').click();
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
      await p.locator('.review-card>summary').click();
    },
  );
  await scenario('shared category filter drives list, map, insights and spin', async () => {
    const p = primary.page;
    await p.getByRole('radio', { name: 'Quán ăn (0)', exact: true }).click();
    await p.getByRole('heading', { name: 'Quán xá (0)', exact: true }).waitFor();
    await nav(p, 'Bản đồ');
    await p.getByText('0 quán · 0 ghim xác nhận', { exact: true }).waitFor();
    await nav(p, 'Thống kê');
    await p.getByRole('heading', { name: 'Thống kê theo bộ lọc' }).waitFor();
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
    await p.getByRole('heading', { name: 'Chấm điểm quán', exact: true }).click();
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
    await p.getByRole('button', { name: 'Xuất bản sao JSON', exact: true }).click();
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
    await p.getByText(/Bản dự phòng tự động trên thiết bị/).click();
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
      await p.getByText('Sẵn sàng dùng ngoại tuyến', { exact: true }).waitFor({ timeout: 45000 });
      const before = await readDoc(p);
      await context.setOffline(true);
      await p.reload();
      await p.getByRole('heading', { name: 'Quán xá (1)', exact: true }).waitFor();
      assert.deepEqual(await readDoc(p), before);
      await nav(p, 'Thống kê');
      await p.getByRole('heading', { name: 'Thống kê theo bộ lọc' }).waitFor();
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
      await p.getByRole('heading', { name: 'Bản đồ trong bộ lọc' }).waitFor();
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
      await p.getByRole('button', { name: 'Xuất bản sao JSON', exact: true }).click();
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
      if (!(await p.locator('.review-card').evaluate((el) => el.open)))
        await p.locator('.review-card>summary').click();
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
      assert.equal(
        await p.getByText('Đã lưu trải nghiệm trên thiết bị.', { exact: true }).count(),
        0,
      );
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
        await p.locator('.review-card>summary').click();
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
    await p.screenshot({ path: resolve(output, '06-confirmed-map.png') });
    assert.deepEqual(errors, []);
  });
} finally {
  for (const c of contexts) await c.close();
  await browser.close();
  console.log('Artifacts:', output);
}
