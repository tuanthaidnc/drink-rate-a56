import { SCORING_VERSION, type ReviewDocument, type ReviewItem } from './models.ts';
import { scoreReview } from './scoring.ts';

// Owner-approved default for all existing food reviews. Preserve original
// criterion inputs, identity, dates, photos and visits; derive every total.
export function withDefaultFoodPortion(r: ReviewItem): ReviewItem {
  if (r.category !== 'food' || r.isDemo || r.portionKey !== undefined) return r;
  const next: ReviewItem = { ...r, portionKey: 'medium', scoringVersion: SCORING_VERSION };
  return { ...next, totalScore: scoreReview(next) };
}
export function needsFoodPortionMigration(doc: ReviewDocument) {
  return doc.reviews.some((r) => r.category === 'food' && !r.isDemo && r.portionKey === undefined);
}
export function applyFoodPortionMigration(doc: ReviewDocument): ReviewDocument {
  return {
    ...doc,
    reviews: doc.reviews.map(withDefaultFoodPortion),
  };
}
