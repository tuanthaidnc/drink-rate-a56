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
  | 'food_daily'
  | 'food_weekly'
  | 'food_monthly'
  | 'drink_daily'
  | 'drink_biweekly'
  | 'drink_rare';

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
    hint: 'Món ăn 40–80k • Có thể ăn 1 lần trong tuần',
    recommendation: 'Món ăn 40–80k • Có thể ăn 1 lần trong tuần',
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
    label: '1 lần/2 tuần',
    shortTitle: '1–2 lần/tháng',
    hint: 'Nước 40–80k • Uống 1–2 lần/tháng (1 lần/2 tuần)',
    recommendation: 'Nước 40–80k • Uống 1–2 lần/tháng (1 lần/2 tuần)',
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
  maybePriceK?: number
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
const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

/**
 * Tính chu kỳ hiện tại:
 * - 'week': Thứ Hai → Chủ Nhật
 * - 'month': Bắt đầu từ ngày 05 hằng tháng → hết ngày 04 tháng kế tiếp
 * - 'year': Bắt đầu từ 05/01 hằng năm → 04/01 năm kế tiếp
 */
export function getCycleRange(period: FreqPeriod, now = new Date()) {
  const today = startOfDay(now);
  if (period === 'week') {
    const dow = (today.getDay() + 6) % 7; // Thứ Hai = 0
    const start = new Date(today.getTime() - dow * DAY);
    return { start, end: new Date(start.getTime() + 7 * DAY) };
  }
  if (period === 'month') {
    const y = today.getFullYear();
    const m = today.getMonth();
    const start =
      today.getDate() >= 5 ? new Date(y, m, 5) : new Date(y, m - 1, 5);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 5);
    return { start, end };
  }
  const y = today.getFullYear();
  const jan5 = new Date(y, 0, 5);
  const start = today >= jan5 ? jan5 : new Date(y - 1, 0, 5);
  return { start, end: new Date(start.getFullYear() + 1, 0, 5) };
}

const fmt = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

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
    | 'food'
    | 'drink'
    | { category?: 'food' | 'drink'; priceK?: number; visits?: string[] },
  maybePriceK?: number,
  maybeVisits?: string[],
  now = new Date()
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
    return !Number.isNaN(t) && t >= start.getTime() && t < end.getTime();
  }).length;
  const remaining = Math.max(0, tier.quota - used);
  const periodName =
    tier.period === 'week' ? 'tuần' : tier.period === 'month' ? 'tháng' : 'năm';
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
        : `Đủ ${tier.quota}/${tier.quota} lượt ${periodName}`,
  };
}

export function getMonthCycleInfo(now = new Date()) {
  const { start, end } = getCycleRange('month', now);
  const lastDay = new Date(end.getTime() - DAY);
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / DAY));
  const elapsedDays = Math.max(
    1,
    Math.min(totalDays, Math.round((startOfDay(now).getTime() - start.getTime()) / DAY) + 1)
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
  if (!q.available) return 0;
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
