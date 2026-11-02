import { hasConfirmedLocation, type ReviewItem, type ReviewDocument } from './models.ts';
import type { Position } from './geo.ts';
import { localDayParts } from './frequency.ts';

/** Compare content, not mount/focus events or automatically generated timestamps. */
export function reviewDraftSignature(
  review: ReviewItem,
  price: string,
  reviewedDate: string,
  firstVisit = false,
): string {
  const text = (v: string | undefined) => (v ?? '').trim();
  const normalized = price.trim().replace(',', '.');
  const amount =
    normalized === '' ? '' : Number.isFinite(Number(normalized)) ? Number(normalized) : normalized;
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
    portionKey: review.portionKey,
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

export function parseReviewPrice(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.');
  if (!/^\d+(?:\.\d{0,2})?$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) && value >= 1 && value <= 2000 ? value : null;
}

export function automaticReviewName(category: ReviewItem['category'], at: Date): string {
  const parts = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(at);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';
  const time = `${part('hour')}:${part('minute')} ${part('day')}/${part('month')}`;
  return `${category === 'food' ? 'Quán ăn' : 'Quán nước'} · ${time}`;
}

/** A late GPS result can fill a new review, never undo a later edit or deletion. */
export function completeReviewLocation(
  current: ReviewDocument,
  saved: ReviewItem,
  position: Position,
): ReviewDocument | null {
  const item = current.reviews.find((r) => r.id === saved.id);
  if (
    !item ||
    item.updatedAt !== saved.updatedAt ||
    item.lat !== null ||
    item.lng !== null ||
    item.locationSource === 'manual' ||
    !Number.isFinite(position.lat) ||
    !Number.isFinite(position.lng) ||
    Math.abs(position.lat) > 90 ||
    Math.abs(position.lng) > 180
  )
    return null;
  return {
    ...current,
    reviews: current.reviews.map((r) =>
      r.id === item.id
        ? {
            ...r,
            ...position,
            locationSource: 'gps',
            locationStatus:
              position.accuracyM !== undefined && position.accuracyM <= 150
                ? 'confirmed'
                : 'approximate',
            updatedAt: new Date().toISOString(),
          }
        : r,
    ),
  };
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
