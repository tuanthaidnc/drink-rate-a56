import { hasConfirmedLocation, type ReviewItem } from './models.ts';
import { localDayParts } from './frequency.ts';

/** Compare content, not mount/focus events or automatically generated timestamps. */
export function reviewDraftSignature(
  review: ReviewItem,
  price: string,
  reviewedDate: string,
  firstVisit = false,
): string {
  const text = (v: string | undefined) => (v ?? '').trim();
  const amount = price.trim() === '' ? '' : Number.isFinite(Number(price)) ? Number(price) : price;
  return JSON.stringify({
    category: review.category,
    name: text(review.name),
    city: review.city,
    ward: review.ward,
    street: text(review.street),
    address: text(review.address),
    provinceCode: review.provinceCode,
    wardCode: review.wardCode,
    price: amount,
    taste: review.taste,
    space: review.space,
    mode: review.mode,
    volumeKey: review.volumeKey,
    packaging: review.packaging,
    foodType: review.foodType,
    cleanliness: review.cleanliness,
    foodQuality: review.foodQuality,
    note: text(review.note),
    dish: text(review.dish),
    cuisine: text(review.cuisine),
    reviewedDate,
    firstVisit,
    lat: review.lat,
    lng: review.lng,
    locationStatus: review.locationStatus,
    locationSource: review.locationSource,
    photoIds: review.photoIds,
    openingHours: review.openingHours,
  });
}

/** The native recovery callback and the form must derive exactly the same state. */
export function reviewDraftIsDirty(
  initial: ReviewItem,
  draft: ReviewItem,
  price: string,
  reviewedDate: string,
  isEdit: boolean,
  firstVisit = false,
): boolean {
  const p = localDayParts(new Date(initial.reviewedAt ?? initial.createdAt));
  const initialDate = `${p.year}-${String(p.month + 1).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
  return (
    reviewDraftSignature(draft, price, reviewedDate, firstVisit) !==
      reviewDraftSignature(initial, isEdit ? String(initial.priceK) : '', initialDate) ||
    (!isEdit && !initial.isDemo && hasConfirmedLocation(initial))
  );
}
