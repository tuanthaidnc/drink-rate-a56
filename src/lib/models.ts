export const SCHEMA_VERSION = 13 as const;
export const SCORING_VERSION = '2026-10-v1' as const;
export const APP_VERSION = '16.0.0';
export type PlaceCategory = 'drink' | 'food';
export type DrinkMode = 'takeaway' | 'dinein';
export type FoodVenueType = 'streetfood' | 'restaurant';
export type VolumeKey = 'very_low' | 'low' | 'medium' | 'high' | 'overflow';
export type LocationStatus = 'confirmed' | 'approximate' | 'missing';
export interface Visit {
  id: string;
  visitedAt: string;
  spentK?: number;
  dish?: string;
  note?: string;
}
export interface RatingSnapshot {
  reviewedAt: string;
  totalScore: number;
  priceK: number;
  taste: number;
  scoringVersion: string;
}
export interface OpeningHours {
  days: number[]; // Sunday=0, evaluated in Asia/Ho_Chi_Minh.
  from: string;
  to: string;
  checkedAt: string;
}
export interface ReviewItem {
  id: string;
  category: PlaceCategory;
  name: string;
  city: string;
  ward: string;
  street: string;
  provinceCode?: string;
  wardCode?: string;
  address?: string;
  priceK: number;
  taste: number;
  space: number;
  totalScore: number;
  note: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  lat: number | null;
  lng: number | null;
  locationStatus: LocationStatus;
  locationSource?: 'manual' | 'gps' | 'legacy' | 'research';
  placeResolution?: {
    status: 'verified' | 'candidate';
    officialName: string;
    sourceUrl: string;
    checkedAt: string;
    originalAddress?: string;
  };
  accuracyM?: number;
  mode: DrinkMode;
  volumeKey: VolumeKey;
  packaging: number;
  foodType: FoodVenueType;
  cleanliness: number;
  foodQuality: number;
  visits: string[]; // Compatibility projection of visitLog; never edited separately.
  visitLog: Visit[];
  ratingHistory: RatingSnapshot[];
  dish?: string;
  cuisine?: string;
  photoIds: string[];
  openingHours?: OpeningHours;
  isDemo: boolean;
  scoringVersion: string;
}
export interface Settings {
  placeCorrectionsVersion?: number;
  monthlyBudgetK?: number;
  reducedMotion?: boolean;
}
export interface ReviewDocument {
  schemaVersion: typeof SCHEMA_VERSION;
  revision: string;
  updatedAt: string;
  reviews: ReviewItem[];
  settings: Settings;
}
export interface PhotoData {
  id: string;
  blob: Blob;
}
export interface BackupPhoto {
  id: string;
  dataUrl: string;
}
export interface BackupFile {
  app: 'not-food-drink';
  schemaVersion: typeof SCHEMA_VERSION;
  scoringVersion: typeof SCORING_VERSION;
  exportedAt: string;
  reviews: ReviewItem[];
  settings: Settings;
  media: BackupPhoto[];
}
export function newId(prefix = 'id') {
  return `${prefix}-${crypto.randomUUID()}`;
}
export function emptyDocument(): ReviewDocument {
  return {
    schemaVersion: SCHEMA_VERSION,
    revision: newId('revision'),
    updatedAt: new Date().toISOString(),
    reviews: [],
    settings: {},
  };
}
export function hasConfirmedLocation(
  item: Pick<ReviewItem, 'lat' | 'lng' | 'locationStatus'>,
): boolean {
  return (
    item.locationStatus === 'confirmed' &&
    typeof item.lat === 'number' &&
    Number.isFinite(item.lat) &&
    item.lat >= -90 &&
    item.lat <= 90 &&
    typeof item.lng === 'number' &&
    Number.isFinite(item.lng) &&
    item.lng >= -180 &&
    item.lng <= 180
  );
}
export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}
export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}
