import test from 'node:test';
import assert from 'node:assert/strict';
import { createReview, validateReview, parseBackup } from '../../src/lib/validation.ts';
import { emptyDocument, LEGACY_SCORING_VERSION } from '../../src/lib/models.ts';
import { calculateFoodScore } from '../../src/lib/scoring.ts';
import { applyFoodPortionMigration } from '../../src/lib/foodPortionMigration.ts';
import { adjacentMonth, journalDay, journalGroups, monthCells } from '../../src/lib/journal.ts';
test('food portion rebalances takeaway and dine-in; the existing sausage inputs derive exactly nine', () => {
  const original = validateReview({
    ...createReview('food'),
    name: 'Lạp xưởng đối diện Say',
    taste: 10,
    foodQuality: 9,
    cleanliness: 8,
    space: 1,
    priceK: 10,
    portionKey: undefined,
    scoringVersion: LEGACY_SCORING_VERSION,
  });
  assert.equal(original.totalScore, 9);
  const other = validateReview({ ...original, id: 'other', name: 'Một quán khác' });
  const doc = { ...emptyDocument(), reviews: [original, other] };
  const next = applyFoodPortionMigration(doc);
  assert.equal(next.reviews[0].totalScore, 9);
  assert.equal(next.reviews[0].portionKey, 'medium');
  for (const key of [
    'taste',
    'foodQuality',
    'cleanliness',
    'space',
    'priceK',
    'reviewedAt',
    'photoIds',
  ] as const)
    assert.deepEqual(next.reviews[0][key], original[key]);
  assert.deepEqual(next.reviews[1], other);
  assert.deepEqual(applyFoodPortionMigration(next), next);
  assert.equal(
    calculateFoodScore({ ...original, portionKey: 'medium', mode: 'takeaway' }).total,
    9,
  );
  assert.equal(calculateFoodScore({ ...original, portionKey: 'low', mode: 'takeaway' }).total, 8.4);
  for (const mode of ['takeaway', 'dinein'] as const) {
    assert.equal(
      calculateFoodScore({
        ...original,
        mode,
        taste: 10,
        foodQuality: 10,
        cleanliness: 10,
        space: 10,
        portionKey: 'overflow',
      }).total,
      10,
    );
  }
});
test('legacy backup keeps completed scores and unknown portion instead of inventing a rating', () => {
  const original = validateReview({
    ...createReview('food'),
    name: 'Cũ',
    portionKey: undefined,
    scoringVersion: LEGACY_SCORING_VERSION,
  });
  const oldBackup = {
    app: 'not-food-drink',
    schemaVersion: 13,
    scoringVersion: LEGACY_SCORING_VERSION,
    exportedAt: new Date().toISOString(),
    reviews: [original],
    settings: {},
    media: [],
  };
  const next = parseBackup(JSON.stringify(oldBackup));
  assert.equal(next.reviews[0].totalScore, original.totalScore);
  assert.equal(next.reviews[0].portionKey, undefined);
  assert.equal(next.reviews[0].scoringVersion, LEGACY_SCORING_VERSION);
});
test('journal uses Vietnam calendar days and existing reviews only', () => {
  assert.equal(journalDay('2026-11-01T18:00:00Z'), '2026-11-02');
  const r = { ...createReview(), name: 'Thật', reviewedAt: '2026-11-01T18:00:00Z' };
  const groups = journalGroups([r, { ...r, id: 'demo', isDemo: true }]);
  assert.equal(groups.size, 1);
  assert.equal(groups.get('2026-11-02')?.length, 1);
  assert.equal(monthCells('2026-02').filter(Boolean).length, 28);
  assert.equal(monthCells('2028-02').filter(Boolean).length, 29);
  assert.equal(monthCells('2026-11')[6], '2026-11-01');
  assert.equal(adjacentMonth('2026-12', 1), '2027-01');
  assert.equal(adjacentMonth('2026-01', -1), '2025-12');
});
