// ============================================================================
// QUY TẮC TẦN SUẤT ĂN / UỐNG LẠI THEO MỨC GIÁ & CHU KỲ NGÀY 5 HẰNG THÁNG (v11.0)
// - Món ăn <= 40k: Ăn lại trong tuần (2 lần/tuần)
// - Món ăn 40k - 80k: Ăn 1 lần trong tuần (1 lần/tuần)
// - Món ăn > 80k: Ăn 1 lần trong tháng (1 lần/tháng - tính từ ngày 5 hằng tháng)
// - Nước uống <= 40k: Uống lại trong tuần (2 lần/tuần)
// - Nước uống 40k - 80k: Uống 1-2 lần trong tháng (1 lần/2 tuần - tính từ ngày 5)
// - Nước uống > 80k: Chỉ thử 1-2 lần trong năm nếu có (1-2 lần/năm)
// ============================================================================

export type FreqPeriod = 'week' | 'month' | 'year';
export type FreqTierKey =
  'food_daily' | 'food_weekly' | 'food_monthly' | 'drink_daily' | 'drink_biweekly' | 'drink_rare';

export interface FreqTier {
  key: FreqTierKey;
  label: string; // Nhãn tần suất chính (VD: "2 lần/tuần")
  shortTitle: string; // Phân loại ngắn (VD: "Ăn thường xuyên")
  hint: string; // Mô tả đầy đủ
  recommendation: string; // Alias của hint
  priceRangeLabel: string;
  emoji: string;
  period: FreqPeriod;
  cycle: FreqPeriod; // Alias của period
  quota: number; // Số lần tối đa khuyến nghị trong chu kỳ
  cycleLimit: number; // Alias của quota
  tone: 'green' | 'blue' | 'amber' | 'rose';
  spinBoost: number; // Hệ số ưu tiên khi quay Vòng quay Quyết định
}

export const FREQ_TIERS: Record<FreqTierKey, FreqTier> = {
  food_daily: {
    key: 'food_daily',
    label: '2 lần/tuần',
    shortTitle: 'Ăn lại trong tuần',
    hint: 'Món ăn ≤ 40k • Có thể ăn lại trong tuần (2 lần/tuần)',
    recommendation: 'Món ăn ≤ 40k • Có thể ăn lại trong tuần (2 lần/tuần)',
    priceRangeLabel: '≤ 40k',
    emoji: '🔁',
    period: 'week',
    cycle: 'week',
    quota: 2,
    cycleLimit: 2,
    tone: 'green',
    spinBoost: 1.35,
  },
  food_weekly: {
    key: 'food_weekly',
    label: '1 lần/tuần',
    shortTitle: 'Ăn 1 lần/tuần',
    hint: 'Món ăn >40–80k • Có thể ăn 1 lần trong tuần',
    recommendation: 'Món ăn >40–80k • Có thể ăn 1 lần trong tuần',
    priceRangeLabel: '40–80k',
    emoji: '📅',
    period: 'week',
    cycle: 'week',
    quota: 1,
    cycleLimit: 1,
    tone: 'blue',
    spinBoost: 1.0,
  },
  food_monthly: {
    key: 'food_monthly',
    label: '1 lần/tháng',
    shortTitle: 'Ăn 1 lần/tháng',
    hint: 'Món ăn > 80k • Thưởng thức 1 lần/tháng (chu kỳ ngày 5)',
    recommendation: 'Món ăn > 80k • Thưởng thức 1 lần/tháng (chu kỳ ngày 5)',
    priceRangeLabel: '> 80k',
    emoji: '✨',
    period: 'month',
    cycle: 'month',
    quota: 1,
    cycleLimit: 1,
    tone: 'amber',
    spinBoost: 0.6,
  },
  drink_daily: {
    key: 'drink_daily',
    label: '2 lần/tuần',
    shortTitle: 'Uống lại trong tuần',
    hint: 'Nước ≤ 40k • Có thể uống lại trong tuần (2 lần/tuần)',
    recommendation: 'Nước ≤ 40k • Có thể uống lại trong tuần (2 lần/tuần)',
    priceRangeLabel: '≤ 40k',
    emoji: '🔁',
    period: 'week',
    cycle: 'week',
    quota: 2,
    cycleLimit: 2,
    tone: 'green',
    spinBoost: 1.35,
  },
  drink_biweekly: {
    key: 'drink_biweekly',
    label: '1–2 lần/tháng',
    shortTitle: '1–2 lần/tháng',
    hint: 'Nước >40–80k • Tối đa 2 lượt/chu kỳ tháng, gợi ý cách nhau khoảng 2 tuần',
    recommendation: 'Nước >40–80k • Tối đa 2 lượt/chu kỳ tháng, gợi ý cách nhau khoảng 2 tuần',
    priceRangeLabel: '40–80k',
    emoji: '🗓️',
    period: 'month',
    cycle: 'month',
    quota: 2,
    cycleLimit: 2,
    tone: 'blue',
    spinBoost: 0.85,
  },
  drink_rare: {
    key: 'drink_rare',
    label: '1–2 lần/năm',
    shortTitle: 'Thử 1–2 lần/năm',
    hint: 'Nước > 80k • Chỉ thử 1–2 lần trong năm nếu có dịp',
    recommendation: 'Nước > 80k • Chỉ thử 1–2 lần trong năm nếu có dịp',
    priceRangeLabel: '> 80k',
    emoji: '💎',
    period: 'year',
    cycle: 'year',
    quota: 2,
    cycleLimit: 2,
    tone: 'rose',
    spinBoost: 0.3,
  },
};

export type FrequencyTier = FreqTier;

export function getFreqTier(
  categoryOrItem: 'food' | 'drink' | { category?: 'food' | 'drink'; priceK?: number },
  maybePriceK?: number,
): FreqTier {
  let cat: 'food' | 'drink' = 'drink';
  let price = 0;

  if (typeof categoryOrItem === 'object' && categoryOrItem !== null) {
    cat = categoryOrItem.category === 'food' ? 'food' : 'drink';
    price = Number(categoryOrItem.priceK) || 0;
  } else {
    cat = categoryOrItem === 'food' ? 'food' : 'drink';
    price = Number(maybePriceK) || 0;
  }

  if (cat === 'food') {
    if (price <= 40) return FREQ_TIERS.food_daily;
    if (price <= 80) return FREQ_TIERS.food_weekly;
    return FREQ_TIERS.food_monthly;
  }
  if (price <= 40) return FREQ_TIERS.drink_daily;
  if (price <= 80) return FREQ_TIERS.drink_biweekly;
  return FREQ_TIERS.drink_rare;
}

const DAY = 24 * 60 * 60 * 1000;
export function localDayParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return { year: get('year'), month: get('month') - 1, day: get('day') };
}
const civilDate = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d) - 7 * 3600_000);
const startOfDay = (d: Date) => {
  const p = localDayParts(d);
  return civilDate(p.year, p.month, p.day);
};
/** All personal cycles use Asia/Ho_Chi_Minh, independently of the device timezone. */
export function getCycleRange(period: FreqPeriod, now = new Date()) {
  const { year: y, month: m, day: d } = localDayParts(now);
  if (period === 'week') {
    const dow = (new Date(Date.UTC(y, m, d)).getUTCDay() + 6) % 7;
    return { start: civilDate(y, m, d - dow), end: civilDate(y, m, d - dow + 7) };
  }
  if (period === 'month') {
    const month = d >= 5 ? m : m - 1;
    return { start: civilDate(y, month, 5), end: civilDate(y, month + 1, 5) };
  }
  const year = m === 0 && d < 5 ? y - 1 : y;
  return { start: civilDate(year, 0, 5), end: civilDate(year + 1, 0, 5) };
}
const fmt = (date: Date) =>
  new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
  }).format(date);

export interface QuotaStatus {
  tier: FreqTier;
  used: number;
  remaining: number;
  available: boolean;
  resetLabel: string; // VD: "Mở lại 05/11"
  resetText: string; // Alias của resetLabel
  cycleLabel: string; // VD: "Chu kỳ 05/10 → 04/11"
  statusBadgeText: string; // VD: "Còn 2/2 lượt tuần"
}

export function getQuotaStatus(
  categoryOrItem:
    'food' | 'drink' | { category?: 'food' | 'drink'; priceK?: number; visits?: string[] },
  maybePriceK?: number,
  maybeVisits?: string[],
  now = new Date(),
): QuotaStatus {
  let cat: 'food' | 'drink' = 'drink';
  let price = 0;
  let visits: string[] = [];

  if (typeof categoryOrItem === 'object' && categoryOrItem !== null) {
    cat = categoryOrItem.category === 'food' ? 'food' : 'drink';
    price = Number(categoryOrItem.priceK) || 0;
    visits = Array.isArray(categoryOrItem.visits) ? categoryOrItem.visits : [];
  } else {
    cat = categoryOrItem === 'food' ? 'food' : 'drink';
    price = Number(maybePriceK) || 0;
    visits = Array.isArray(maybeVisits) ? maybeVisits : [];
  }

  const tier = getFreqTier(cat, price);
  const { start, end } = getCycleRange(tier.period, now);
  const used = visits.filter((v) => {
    const t = new Date(v).getTime();
    return !Number.isNaN(t) && t >= start.getTime() && t < end.getTime() && t <= now.getTime();
  }).length;
  const remaining = Math.max(0, tier.quota - used);
  const periodName = tier.period === 'week' ? 'tuần' : tier.period === 'month' ? 'tháng' : 'năm';
  const lastDay = new Date(end.getTime() - DAY);
  const resetText =
    tier.period === 'week'
      ? `Reset T2 (${fmt(end)})`
      : tier.period === 'month'
        ? `Reset ngày 5 (${fmt(end)})`
        : `Reset 05/01/${end.getFullYear()}`;

  return {
    tier,
    used,
    remaining,
    available: remaining > 0,
    resetLabel: resetText,
    resetText,
    cycleLabel: `${fmt(start)} → ${fmt(lastDay)}`,
    statusBadgeText:
      remaining > 0
        ? `Còn ${remaining}/${tier.quota} lượt/${periodName}`
        : `Đã ghé ${used}/${tier.quota} lượt ${periodName}`,
  };
}

export function getMonthCycleInfo(now = new Date()) {
  const { start, end } = getCycleRange('month', now);
  const lastDay = new Date(end.getTime() - DAY);
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / DAY));
  const elapsedDays = Math.max(
    1,
    Math.min(totalDays, Math.round((startOfDay(now).getTime() - start.getTime()) / DAY) + 1),
  );
  return {
    label: `${fmt(start)} → ${fmt(lastDay)}`,
    nextReset: fmt(end),
    elapsedDays,
    totalDays,
  };
}

/** Trọng số thông minh cho Vòng quay Quyết định: ưu tiên quán điểm cao + còn nhiều lượt + tần suất phù hợp */
export function spinWeight(score10: number, q: QuotaStatus) {
  if (!q.available || !Number.isFinite(score10) || score10 < 0 || score10 > 10) return 0;
  const scoreFactor = Math.pow(Math.max(0.5, score10 - 4.8), 2.1);
  const freshness = 0.55 + 0.45 * (q.remaining / q.tier.quota);
  return Math.max(0.05, scoreFactor * freshness * q.tier.spinBoost);
}

export const TONE_CLASSES: Record<FreqTier['tone'], string> = {
  green: 'bg-emerald-500/14 text-emerald-500 border-emerald-500/35',
  blue: 'bg-sky-500/14 text-sky-500 border-sky-500/35',
  amber: 'bg-amber-500/15 text-amber-500 border-amber-500/40',
  rose: 'bg-rose-500/15 text-rose-400 border-rose-500/35',
};
