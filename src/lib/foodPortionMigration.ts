import { normalizeSearch, SCORING_VERSION, type ReviewDocument, type ReviewItem } from './models.ts';
import { scoreReview } from './scoring.ts';

// The owner's named existing review: retain every original input; add only their
// requested medium portion and takeaway context. No score override is stored.
function requestedReview(r: ReviewItem) {
  return r.category === 'food' && !r.isDemo && r.portionKey === undefined &&
    normalizeSearch(r.name) === 'lap xuong doi dien say' &&
    r.taste === 10 && r.foodQuality === 9 && r.cleanliness === 8 &&
    r.space === 1 && r.priceK === 10 && r.totalScore === 9;
}
export function needsFoodPortionMigration(doc: ReviewDocument) {
  return doc.reviews.some(requestedReview);
}
export function applyFoodPortionMigration(doc: ReviewDocument): ReviewDocument {
  return { ...doc, reviews: doc.reviews.map(r => {
    if (!requestedReview(r)) return r;
    const next: ReviewItem = { ...r, mode: 'takeaway', portionKey: 'medium', scoringVersion: SCORING_VERSION };
    return { ...next, totalScore: scoreReview(next) };
  }) };
}
