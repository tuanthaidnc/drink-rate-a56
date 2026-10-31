import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  reviewDraftSignature,
  reviewDraftIsDirty,
  parseReviewPrice,
  automaticReviewName,
} from '../../src/lib/reviewDraft.ts';
import {
  createReview,
  validateReviews,
  validateReview,
  parseBackup,
} from '../../src/lib/validation.ts';
import { emptyDocument } from '../../src/lib/models.ts';
import { INITIAL_REVIEWS } from '../../src/data/demo.ts';
import {
  applyPlaceCorrections,
  needsPlaceCorrections,
  NOT_MAP_SOURCE,
  NOT_PLACE,
} from '../../src/lib/placeCorrections.ts';
const now = new Date('2026-10-30T04:00:00Z');
test('pristine form and changes reverted to baseline are clean', () => {
  const r = createReview('drink', now),
    date = '2026-10-30';
  const baseline = reviewDraftSignature(r, '31', date);
  assert.equal(
    reviewDraftSignature({ ...r, updatedAt: new Date().toISOString() }, '31.0', date),
    baseline,
  );
  assert.equal(reviewDraftSignature({ ...r, name: '   ' }, '31', date), baseline);
  assert.notEqual(reviewDraftSignature({ ...r, name: 'Tên vừa nhập' }, '31', date), baseline);
  assert.notEqual(reviewDraftSignature({ ...r, taste: 8 }, '31', date), baseline);
  assert.notEqual(reviewDraftSignature(r, '', date), baseline);
  assert.notEqual(reviewDraftSignature(r, '31', date, true), baseline);
  assert.notEqual(reviewDraftSignature({ ...r, photoIds: ['photo-new'] }, '31', date), baseline);
  assert.equal(reviewDraftSignature(structuredClone(r), '31', date), baseline);
});
test('native recovery and form share a clean baseline for cancelled new captures', () => {
  const r = createReview('drink', now),
    date = '2026-10-30';
  assert.equal(reviewDraftIsDirty(r, structuredClone(r), '', date, false), false);
  assert.equal(reviewDraftIsDirty(r, structuredClone(r), '31', date, true), false);
  assert.equal(reviewDraftIsDirty(r, { ...r, photoIds: ['captured'] }, '', date, false), true);
  assert.equal(reviewDraftIsDirty(r, { ...r, name: 'Giữ bản nháp' }, '', date, false), true);
});

test('Nốt remap uses the user supplied Maps entity, preserving personal ratings and visits', () => {
  const reviews = validateReviews(INITIAL_REVIEWS, true, now);
  const original = structuredClone(reviews);
  reviews[0].visitLog = [{ id: 'mine', visitedAt: '2026-10-29T12:00:00Z', spentK: 31 }];
  reviews[0].visits = reviews[0].visitLog.map((v) => v.visitedAt);
  const doc = applyPlaceCorrections({ ...emptyDocument(), reviews }, now),
    not = doc.reviews.find((r) => r.id === reviews[0].id)!;
  assert.equal(not.name, 'Nốt Tea');
  assert.equal(not.address, '38');
  assert.equal(not.lat, NOT_PLACE.lat);
  assert.equal(not.lng, NOT_PLACE.lng);
  assert.equal(not.locationSource, 'research');
  assert.equal(not.totalScore, 6.5);
  assert.equal(not.placeResolution!.sourceUrl, NOT_MAP_SOURCE);
  assert.deepEqual(not.visitLog, reviews[0].visitLog);
  assert.equal(original[0].name, 'Nốt');
  assert.equal(reviews[0].lat, original[0].lat);
  assert.equal(needsPlaceCorrections(doc), false);
  assert.deepEqual(applyPlaceCorrections(doc, now), doc);
});
test('only untouched Bếp Trang demo is retired; personal content is retained', () => {
  const reviews = validateReviews(INITIAL_REVIEWS, true, now);
  const doc = applyPlaceCorrections({ ...emptyDocument(), reviews }, now);
  assert.equal(doc.reviews.length, 2);
  assert.equal(
    doc.reviews.some((r) => r.id === 'seed-food-mi-quang-hai-chau'),
    false,
  );
  for (const change of [
    { isDemo: false },
    { photoIds: ['mine'] },
    { visitLog: [{ id: 'v', visitedAt: now.toISOString() }] },
  ]) {
    const personal = { ...reviews[2], ...change };
    assert.ok(
      applyPlaceCorrections({ ...emptyDocument(), reviews: [personal] }, now).reviews.length === 1,
    );
  }
});
test('unverified Thanh Hương remains a candidate, never gets an invented confirmed pin', () => {
  const r = applyPlaceCorrections(
    { ...emptyDocument(), reviews: validateReviews([INITIAL_REVIEWS[1]], true, now) },
    now,
  ).reviews[0];
  assert.equal(r.isDemo, true);
  assert.equal(r.locationStatus, 'missing');
  assert.equal(r.lat, null);
  assert.equal(r.lng, null);
  assert.equal(r.placeResolution!.status, 'candidate');
  assert.ok(r.placeResolution!.originalAddress!.includes('Phan Thanh'));
});
test('manual confirmed pins are preserved and source evidence survives backup validation', () => {
  const r = {
    ...validateReviews([INITIAL_REVIEWS[0]], true, now)[0],
    locationSource: 'gps' as const,
    locationStatus: 'confirmed' as const,
    lat: 16.06529,
    lng: 108.20831,
  };
  const corrected = applyPlaceCorrections({ ...emptyDocument(), reviews: [r] }, now).reviews[0];
  assert.equal(corrected.lat, r.lat);
  assert.equal(corrected.locationSource, 'gps');
  const manuallyEdited = {
    ...emptyDocument(),
    settings: { placeCorrectionsVersion: 1 },
    reviews: [{ ...corrected, address: '40', placeResolution: undefined }],
  };
  assert.equal(needsPlaceCorrections(manuallyEdited), false);
  assert.equal(applyPlaceCorrections(manuallyEdited, now).reviews[0].address, '40');
  const validated = validateReview(corrected, { now });
  assert.deepEqual(validated.placeResolution, corrected.placeResolution);
  assert.throws(() =>
    validateReview(
      {
        ...corrected,
        placeResolution: { ...corrected.placeResolution, sourceUrl: 'javascript:alert(1)' },
      },
      { now },
    ),
  );
  const backup = parseBackup(
    JSON.stringify({
      app: 'not-food-drink',
      schemaVersion: 13,
      scoringVersion: '2026-10-v1',
      exportedAt: now.toISOString(),
      reviews: [corrected],
      settings: { placeCorrectionsVersion: 1 },
      media: [],
    }),
    now,
  );
  assert.equal(backup.reviews[0].placeResolution!.officialName, 'Nốt Tea');
});

test('quick scoring accepts Vietnamese decimals and uses current Vietnam time for unnamed reviews', () => {
  assert.equal(parseReviewPrice('31,5'), 31.5);
  assert.equal(parseReviewPrice(' 31.50 '), 31.5);
  assert.equal(parseReviewPrice(''), null);
  assert.equal(parseReviewPrice('1e3'), null);
  assert.equal(parseReviewPrice('-1'), null);
  assert.equal(parseReviewPrice('2000.1'), null);
  const label = automaticReviewName('food', new Date('2026-10-30T23:15:00Z'));
  assert.match(label, /^Quán ăn · /);
  assert.ok(label.includes('06:15'));
  assert.ok(label.includes('31/10'));
});
