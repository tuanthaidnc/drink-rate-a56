import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { INITIAL_REVIEWS } from '../../src/data/demo.ts';
import {
  createReview,
  validateReview,
  validateReviews,
  validateVisit,
  parseBackup,
  validateBackupPhoto,
} from '../../src/lib/validation.ts';
import {
  calculateDrinkScore,
  calculateFoodScore,
  getDrinkPriceScore,
  scoreReview,
} from '../../src/lib/scoring.ts';
import { getCycleRange, getQuotaStatus, getFreqTier, spinWeight } from '../../src/lib/frequency.ts';
import {
  DEFAULT_FILTERS,
  filterReviews,
  chooseWeighted,
  weightedCandidates,
  isOpenAt,
} from '../../src/lib/selection.ts';
import { directionsUrl, distanceKm } from '../../src/lib/geo.ts';
import { readLegacy, RecoveryError } from '../../src/lib/storage.ts';
import { emptyDocument } from '../../src/lib/models.ts';
const now = new Date('2026-10-30T04:00:00Z');
const item = (extra: object = {}) =>
  validateReview({ ...createReview('drink', now), name: 'Nốt', ...extra }, { now });

test('original Nốt anchor and four weighted formulas stay intact', () => {
  const r = validateReviews(INITIAL_REVIEWS, true, now)[0];
  assert.equal(r.totalScore, 6.5);
  assert.equal(calculateDrinkScore({ ...r, mode: 'dinein', space: 8 }).total, 7.1);
  assert.equal(
    calculateFoodScore({
      foodType: 'streetfood',
      taste: 8,
      foodQuality: 7,
      cleanliness: 6,
      space: 5,
      priceK: 30,
    }).total,
    7.38,
  );
  assert.equal(
    calculateFoodScore({
      foodType: 'restaurant',
      taste: 8,
      foodQuality: 7,
      cleanliness: 6,
      space: 5,
      priceK: 30,
    }).total,
    7.2,
  );
  for (const category of ['drink', 'food'] as const) {
    const top = item({
      category,
      taste: 10,
      space: 10,
      foodQuality: 10,
      cleanliness: 10,
      packaging: 10,
      volumeKey: 'overflow',
      priceK: 10,
    });
    assert.equal(scoreReview(top), 10);
  }
});
test('decimal price ranges are continuous', () => {
  assert.equal(getDrinkPriceScore(29.5, 'takeaway').score, 8.5);
  assert.equal(getDrinkPriceScore(39.5, 'takeaway').score, 7);
  assert.equal(getDrinkPriceScore(49.5, 'dinein').score, 7.5);
});
test('invalid import fails as a whole; score always derives from inputs', () => {
  for (const bad of [
    { name: '' },
    { priceK: -10 },
    { taste: 11 },
    { taste: NaN },
    { lat: 200 },
    { lat: 16, lng: null },
    { locationStatus: 'confirmed' },
    { volumeKey: 'huge' },
    { visitLog: [{ id: 'x', visitedAt: '2026-02-30T00:00:00Z' }] },
  ])
    assert.throws(() => item(bad));
  assert.throws(() => parseBackup('['));
  assert.throws(() =>
    parseBackup(JSON.stringify([INITIAL_REVIEWS[0], { id: 'x', name: 'x' }]), now),
  );
  const r = item({ totalScore: 1000 });
  assert.equal(r.totalScore, scoreReview(r));
  assert.throws(() => validateReviews([r, r], false, now));
  assert.throws(() => validateVisit({ id: 'v', visitedAt: '2099-01-01T00:00:00Z' }, now));
  assert.throws(() =>
    parseBackup(JSON.stringify({ app: 'not-food-drink', schemaVersion: 99 }), now),
  );
});
test('legacy migration preserves original text, never re-seeds [] and distinguishes edited food examples', () => {
  const old = JSON.stringify(INITIAL_REVIEWS),
    storage = { getItem: (key: string) => (key === 'not_drink_food_reviews_v11' ? old : null) };
  const migrated = readLegacy(storage)!;
  assert.equal(migrated.raw, old);
  assert.equal(migrated.reviews.filter((r) => r.isDemo).length, 2);
  assert.equal(migrated.reviews[0].locationStatus, 'approximate');
  assert.deepEqual(
    readLegacy({ getItem: (key) => (key === 'not_drink_food_reviews_v11' ? '[]' : old) })!.reviews,
    [],
  );
  assert.equal(
    validateReviews([{ ...INITIAL_REVIEWS[1], note: 'Tôi đã tự chấm lại' }], true, now)[0].isDemo,
    false,
  );
  assert.throws(() => readLegacy({ getItem: () => '{bad' }), RecoveryError);
  assert.equal(emptyDocument().reviews.length, 0);
});
test('date-only legacy visits use midnight Vietnam and remain countable before 7 AM', () => {
  const r = validateReviews(
    [{ ...INITIAL_REVIEWS[0], visits: ['2026-11-05'] }],
    true,
    new Date('2026-11-04T17:01:00Z'),
  )[0];
  assert.equal(r.visitLog[0].visitedAt, '2026-11-04T17:00:00.000Z');
  assert.equal(getQuotaStatus(r, undefined, undefined, new Date('2026-11-04T17:01:00Z')).used, 1);
});
test('cycles reset on Monday / fifth / January fifth in Vietnam independently of machine TZ', () => {
  assert.equal(
    getCycleRange('month', new Date('2026-11-04T16:59:59Z')).start.toISOString(),
    '2026-10-04T17:00:00.000Z',
  );
  assert.equal(
    getCycleRange('month', new Date('2026-11-04T17:00:00Z')).start.toISOString(),
    '2026-11-04T17:00:00.000Z',
  );
  assert.equal(
    getCycleRange('week', new Date('2026-11-01T17:00:00Z')).start.toISOString(),
    '2026-11-01T17:00:00.000Z',
  );
  assert.equal(
    getCycleRange('year', new Date('2027-01-04T16:59:59Z')).start.toISOString(),
    '2026-01-04T17:00:00.000Z',
  );
  assert.equal(
    getCycleRange('year', new Date('2027-01-04T17:00:00Z')).start.toISOString(),
    '2027-01-04T17:00:00.000Z',
  );
  assert.equal(getFreqTier('food', 40).quota, 2);
  assert.equal(getFreqTier('food', 40.5).quota, 1);
  assert.equal(getFreqTier('drink', 60).period, 'month');
  assert.equal(getFreqTier('drink', 60).quota, 2);
  assert.equal(getFreqTier('drink', 81).period, 'year');
  assert.equal(
    getQuotaStatus({ ...item(), visits: ['2026-10-31T00:00:00Z'] }, undefined, undefined, now).used,
    0,
  );
});
test('spin respects zero / one / exhausted pools with no filter broadening or division by zero', () => {
  const a = item({ id: 'a' }),
    b = item({ id: 'b', isDemo: true }),
    spent = { ...a, visits: [now.toISOString(), now.toISOString()] };
  assert.equal(
    chooseWeighted([], () => 0, now),
    null,
  );
  assert.equal(
    chooseWeighted([b], () => 0, now),
    null,
  );
  assert.equal(
    chooseWeighted([spent], () => 0, now),
    null,
  );
  assert.equal(chooseWeighted([a, b], () => 0, now)!.id, 'a');
  assert.equal(chooseWeighted([a, b], () => 0.999999, now)!.id, 'a');
  assert.equal(spinWeight(NaN, getQuotaStatus(a, undefined, undefined, now)), 0);
  assert.deepEqual(weightedCandidates([spent], now), []);
  assert.throws(() => chooseWeighted([a], () => 1, now));
});
test('shared filters search Vietnamese, exclude examples and require actual pins and GPS for proximity', () => {
  const a = item({
      id: 'a',
      name: 'Nốt Phan Thanh',
      note: 'Trà ô long',
      priceK: 31,
      lat: 16.06,
      lng: 108.2,
      locationStatus: 'confirmed',
    }),
    b = item({ id: 'b', priceK: 50 }),
    demo = item({ id: 'd', isDemo: true });
  const list = [a, b, demo],
    pos = { lat: 16.06, lng: 108.2 };
  assert.deepEqual(
    filterReviews(list, { ...DEFAULT_FILTERS, search: 'tra o long', maxPriceK: 40 }, null, now).map(
      (r) => r.id,
    ),
    ['a'],
  );
  assert.equal(filterReviews(list, { ...DEFAULT_FILTERS, radiusKm: 1 }, null, now).length, 0);
  assert.deepEqual(
    filterReviews(list, { ...DEFAULT_FILTERS, radiusKm: 1 }, pos, now).map((r) => r.id),
    ['a'],
  );
  assert.equal(filterReviews(list, { ...DEFAULT_FILTERS, category: 'food' }, pos, now).length, 0);
  assert.equal(
    filterReviews(
      [{ ...a, visits: [now.toISOString()] }],
      { ...DEFAULT_FILTERS, avoidDays: 3 },
      null,
      now,
    ).length,
    0,
  );
  assert.equal(
    filterReviews(
      [{ ...a, visits: [now.toISOString(), now.toISOString()] }],
      { ...DEFAULT_FILTERS, onlyAvailable: true },
      null,
      now,
    ).length,
    0,
  );
});
test('opening hours support overnight Vietnam and expire after thirty days', () => {
  const hours = { days: [4], from: '22:00', to: '02:00', checkedAt: '2026-10-29T00:00:00Z' };
  assert.equal(isOpenAt(hours, new Date('2026-10-29T16:00:00Z')), true);
  assert.equal(isOpenAt(hours, new Date('2026-10-29T18:00:00Z')), true);
  assert.equal(isOpenAt(hours, new Date('2026-10-29T20:00:00Z')), false);
  assert.equal(isOpenAt(hours, new Date('2026-12-04T16:00:00Z')), null);
  assert.equal(isOpenAt(undefined, now), null);
});
test('directions use confirmed coordinates only and distance is real great-circle distance', () => {
  const a = item({ lat: 16, lng: 108, locationStatus: 'confirmed' });
  assert.match(directionsUrl(a), /destination=16%2C108/);
  assert.match(directionsUrl({ ...a, locationStatus: 'approximate' }), /maps\/search/);
  assert.equal(distanceKm({ lat: 16, lng: 108 }, { lat: 16, lng: 108 }), 0);
  assert.ok(Math.abs(distanceKm({ lat: 0, lng: 0 }, { lat: 0, lng: 1 }) - 111.195) < 0.01);
});
test('backup validates photos by content, rejects missing media and does not estimate unknown spend', () => {
  assert.throws(() => validateBackupPhoto({ id: 'x', dataUrl: 'data:image/webp;base64,SGVsbG8=' }));
  const r = item({ photoIds: ['missing'] });
  assert.throws(() =>
    parseBackup(
      JSON.stringify({
        app: 'not-food-drink',
        schemaVersion: 13,
        scoringVersion: '2026-10-v1',
        exportedAt: now.toISOString(),
        reviews: [r],
        settings: {},
        media: [],
      }),
      now,
    ),
  );
  const visit = validateVisit({ id: 'v', visitedAt: now.toISOString() }, now);
  assert.equal(visit.spentK, undefined);
  assert.equal(validateVisit({ ...visit, spentK: 0 }, now).spentK, 0);
});
test('administrative snapshot contains 34 unique provinces, 3321 unique coded subdivisions', () => {
  const data = JSON.parse(
    readFileSync(new URL('../../public/data/admin-2025.json', import.meta.url), 'utf8'),
  );
  assert.equal(data.provinces.length, 34);
  assert.equal(new Set(data.provinces.map((p: any) => p.code)).size, 34);
  const wards = data.provinces.flatMap((p: any) => p.wards);
  assert.equal(wards.length, 3321);
  assert.equal(new Set(wards.map((p: any) => p.code)).size, 3321);
});
