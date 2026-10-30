import type { ReviewItem } from './models.ts';

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
