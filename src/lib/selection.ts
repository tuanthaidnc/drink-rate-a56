import {
  hasConfirmedLocation,
  normalizeSearch,
  type ReviewItem,
  type OpeningHours,
} from './models.ts';
import { getQuotaStatus, spinWeight } from './frequency.ts';
import { distanceKm, type Position } from './geo.ts';
export interface Filters {
  category: 'ALL' | 'food' | 'drink';
  city: string;
  ward: string;
  street: string;
  search: string;
  maxPriceK: number | null;
  minScore: number;
  radiusKm: number | null;
  onlyOpen: boolean;
  onlyAvailable: boolean;
  mode: 'ALL' | 'takeaway' | 'dinein' | 'streetfood' | 'restaurant';
  avoidDays: number;
}
export const DEFAULT_FILTERS: Filters = {
  category: 'ALL',
  city: 'ALL',
  ward: 'ALL',
  street: 'ALL',
  search: '',
  maxPriceK: null,
  minScore: 0,
  radiusKm: null,
  onlyOpen: false,
  onlyAvailable: false,
  mode: 'ALL',
  avoidDays: 0,
};
export function isOpenAt(hours: OpeningHours | undefined, now = new Date()): boolean | null {
  if (!hours) return null;
  if (now.getTime() - Date.parse(hours.checkedAt) > 30 * 86400_000) return null;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const value = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(value('weekday'));
  const time = value('hour') + ':' + value('minute');
  if (hours.from < hours.to)
    return hours.days.includes(day) && time >= hours.from && time < hours.to;
  return (
    (hours.days.includes(day) && time >= hours.from) ||
    (hours.days.includes((day + 6) % 7) && time < hours.to)
  );
}
export function filterReviews(
  items: ReviewItem[],
  f: Filters,
  position: Position | null,
  now = new Date(),
): ReviewItem[] {
  const query = normalizeSearch(f.search);
  return items.filter((r) => {
    if (r.isDemo) return false;
    if (f.category !== 'ALL' && r.category !== f.category) return false;
    if (f.city !== 'ALL' && normalizeSearch(r.city) !== normalizeSearch(f.city)) return false;
    if (f.ward !== 'ALL' && r.ward !== f.ward) return false;
    if (f.street !== 'ALL' && r.street !== f.street) return false;
    if (
      query &&
      !normalizeSearch(
        [r.name, r.street, r.ward, r.city, r.note, r.dish, r.cuisine, r.address]
          .filter(Boolean)
          .join(' '),
      ).includes(query)
    )
      return false;
    if (f.maxPriceK !== null && r.priceK > f.maxPriceK) return false;
    if (r.totalScore < f.minScore) return false;
    if (f.mode !== 'ALL' && (r.category === 'drink' ? r.mode : r.foodType) !== f.mode) return false;
    if (f.onlyAvailable && !getQuotaStatus(r, undefined, undefined, now).available) return false;
    if (f.onlyOpen && isOpenAt(r.openingHours, now) !== true) return false;
    if (
      f.radiusKm !== null &&
      (!position ||
        !hasConfirmedLocation(r) ||
        distanceKm(position, { lat: r.lat!, lng: r.lng! }) > f.radiusKm)
    )
      return false;
    if (
      f.avoidDays > 0 &&
      r.visits.some((v) => {
        const t = Date.parse(v);
        return t <= now.getTime() && now.getTime() - t < f.avoidDays * 86400_000;
      })
    )
      return false;
    return true;
  });
}
export function weightedCandidates(items: ReviewItem[], now = new Date()) {
  return items
    .filter((r) => !r.isDemo)
    .map((item) => ({
      item,
      weight: spinWeight(item.totalScore, getQuotaStatus(item, undefined, undefined, now)),
    }))
    .filter((x) => Number.isFinite(x.weight) && x.weight > 0);
}
export function chooseWeighted(
  items: ReviewItem[],
  random = Math.random,
  now = new Date(),
): ReviewItem | null {
  const pool = weightedCandidates(items, now);
  const total = pool.reduce((s, x) => s + x.weight, 0);
  if (!pool.length || total <= 0) return null;
  const n = random();
  if (!Number.isFinite(n) || n < 0 || n >= 1)
    throw new Error('Random source must return a number in [0,1).');
  let target = n * total;
  for (const x of pool) {
    if (target < x.weight) return x.item;
    target -= x.weight;
  }
  return pool[pool.length - 1].item;
}
export function describeFilters(f: Filters): string {
  return [
    f.category === 'food' ? 'Quán ăn' : f.category === 'drink' ? 'Quán nước' : 'Ăn & uống',
    f.city !== 'ALL' ? f.city : null,
    f.ward !== 'ALL' ? f.ward : null,
    f.street !== 'ALL' ? f.street : null,
    f.maxPriceK !== null ? `≤${f.maxPriceK}k` : null,
    f.minScore ? `≥${f.minScore}đ` : null,
    f.radiusKm !== null ? `≤${f.radiusKm} km` : null,
    f.onlyAvailable ? 'Còn lượt' : null,
    f.onlyOpen ? 'Đang mở (giờ đã ghi)' : null,
    f.avoidDays ? `Tránh ${f.avoidDays} ngày gần đây` : null,
    f.search ? `“${f.search.trim()}”` : null,
  ]
    .filter(Boolean)
    .join(' • ');
}
