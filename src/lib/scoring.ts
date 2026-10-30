import type { DrinkMode, FoodVenueType, VolumeKey, PlaceCategory, ReviewItem } from './models.ts';

export const VOLUME_OPTIONS: {
  key: VolumeKey;
  label: string;
  shortDesc: string;
  score: number;
}[] = [
  { key: 'very_low', label: 'Rất ít', shortDesc: 'Hụt nhiều', score: 2.0 },
  { key: 'low', label: 'Ít', shortDesc: 'Hơi thiếu', score: 4.0 },
  { key: 'medium', label: 'Vừa', shortDesc: 'Tiêu chuẩn', score: 7.0 },
  { key: 'high', label: 'Nhiều', shortDesc: 'Đầy đặn', score: 9.0 },
  { key: 'overflow', label: 'Đầy ắp', shortDesc: 'Siêu nhiều', score: 10.0 },
];

export const TAKEAWAY_PRICE_PRESETS = [
  { label: '< 20k', value: 18 },
  { label: '20-29k', value: 25 },
  { label: '30-39k', value: 31 },
  { label: '40-49k', value: 45 },
  { label: '50-65k', value: 55 },
  { label: '> 65k', value: 70 },
];

export const DINEIN_PRICE_PRESETS = [
  { label: '< 30k', value: 25 },
  { label: '30-39k', value: 35 },
  { label: '40-49k', value: 45 },
  { label: '50-65k', value: 55 },
  { label: '66-85k', value: 75 },
  { label: '> 85k', value: 95 },
];

export const STREETFOOD_PRICE_PRESETS = [
  { label: '≤ 25k', value: 25 },
  { label: '26-35k', value: 30 },
  { label: '36-50k', value: 40 },
  { label: '51-70k', value: 60 },
  { label: '71-100k', value: 85 },
  { label: '> 100k', value: 120 },
];

export const RESTAURANT_PRICE_PRESETS = [
  { label: '≤ 35k', value: 35 },
  { label: '36-55k', value: 45 },
  { label: '56-85k', value: 70 },
  { label: '86-130k', value: 100 },
  { label: '131-200k', value: 160 },
  { label: '> 200k', value: 250 },
];

// ============================================================================
// 2. CÔNG THỨC TÍNH ĐIỂM QUÁN NƯỚC & QUÁN ĂN
// ============================================================================

export function getDrinkPriceScore(
  priceK: number,
  mode: DrinkMode,
): { score: number; bracket: string } {
  if (mode === 'takeaway') {
    if (priceK < 20) return { score: 10.0, bracket: '< 20k' };
    if (priceK < 30) return { score: 8.5, bracket: '20k đến <30k' };
    if (priceK < 40) return { score: 7.0, bracket: '30k đến <40k' };
    if (priceK < 50) return { score: 5.0, bracket: '40k đến <50k' };
    if (priceK <= 65) return { score: 3.0, bracket: '50k - 65k' };
    return { score: 1.5, bracket: '> 65k' };
  } else {
    if (priceK < 30) return { score: 10.0, bracket: '< 30k' };
    if (priceK < 40) return { score: 9.0, bracket: '30k đến <40k' };
    if (priceK < 50) return { score: 7.5, bracket: '40k đến <50k' };
    if (priceK <= 65) return { score: 6.0, bracket: '50k - 65k' };
    if (priceK <= 85) return { score: 4.0, bracket: '>65k đến 85k' };
    return { score: 2.0, bracket: '> 85k' };
  }
}

export function getFoodPriceScore(
  priceK: number,
  foodType: FoodVenueType,
): { score: number; bracket: string } {
  if (foodType === 'streetfood') {
    if (priceK <= 25) return { score: 10.0, bracket: '≤ 25k' };
    if (priceK <= 35) return { score: 8.5, bracket: '>25k đến 35k' };
    if (priceK <= 50) return { score: 7.0, bracket: '>35k đến 50k' };
    if (priceK <= 70) return { score: 5.5, bracket: '>50k đến 70k' };
    if (priceK <= 100) return { score: 4.0, bracket: '>70k đến 100k' };
    return { score: 2.5, bracket: '> 100k' };
  } else {
    if (priceK <= 35) return { score: 10.0, bracket: '≤ 35k' };
    if (priceK <= 55) return { score: 8.5, bracket: '>35k đến 55k' };
    if (priceK <= 85) return { score: 7.0, bracket: '>55k đến 85k' };
    if (priceK <= 130) return { score: 5.5, bracket: '>85k đến 130k' };
    if (priceK <= 200) return { score: 4.0, bracket: '>130k đến 200k' };
    return { score: 2.5, bracket: '> 200k' };
  }
}

export function calculateDrinkScore(params: {
  mode: DrinkMode;
  taste: number;
  priceK: number;
  volumeKey: VolumeKey;
  packaging: number;
  space: number;
}) {
  const { score: priceScore, bracket: priceBracket } = getDrinkPriceScore(
    params.priceK,
    params.mode,
  );
  const volumeObj = VOLUME_OPTIONS.find((v) => v.key === params.volumeKey) || VOLUME_OPTIONS[1];
  const volumeScore = volumeObj.score;

  if (params.mode === 'takeaway') {
    // Take-away: Vị 50% + Giá 25% + Thể tích 20% + Vỏ ly 5% = 100%
    // Quán Nốt: 7*0.5 + 7*0.25 + 4*0.2 + 9*0.05 = 6.50 / 10
    const total =
      params.taste * 0.5 + priceScore * 0.25 + volumeScore * 0.2 + params.packaging * 0.05;
    return {
      total: Math.round(total * 100) / 100,
      priceScore,
      priceBracket,
      volumeScore,
    };
  } else {
    // Ngồi lại: Vị 35% + Không gian 20% + Giá 20% + Thể tích 20% + Vỏ ly 5% = 100%
    const total =
      params.taste * 0.35 +
      params.space * 0.2 +
      priceScore * 0.2 +
      volumeScore * 0.2 +
      params.packaging * 0.05;
    return {
      total: Math.round(total * 100) / 100,
      priceScore,
      priceBracket,
      volumeScore,
    };
  }
}

export function calculateFoodScore(params: {
  foodType: FoodVenueType;
  taste: number;
  foodQuality: number;
  cleanliness: number;
  space: number;
  priceK: number;
}) {
  const { score: priceScore, bracket: priceBracket } = getFoodPriceScore(
    params.priceK,
    params.foodType,
  );

  if (params.foodType === 'streetfood') {
    // Quán ăn Vỉa hè: Độ ngon 40% + Chất lượng đồ ăn 25% + Sạch sẽ 15% + Giá 15% + Không gian 5% = 100%
    const total =
      params.taste * 0.4 +
      params.foodQuality * 0.25 +
      params.cleanliness * 0.15 +
      priceScore * 0.15 +
      params.space * 0.05;
    return {
      total: Math.round(total * 100) / 100,
      priceScore,
      priceBracket,
    };
  } else {
    // Quán ăn Ngồi quán / Nhà hàng: Độ ngon 35% + Chất lượng đồ ăn 25% + Sạch sẽ 15% + Không gian 15% + Giá 10% = 100%
    const total =
      params.taste * 0.35 +
      params.foodQuality * 0.25 +
      params.cleanliness * 0.15 +
      params.space * 0.15 +
      priceScore * 0.1;
    return {
      total: Math.round(total * 100) / 100,
      priceScore,
      priceBracket,
    };
  }
}

export function getTierStyle(score: number, category: PlaceCategory = 'drink') {
  const actionVerb = category === 'food' ? 'Ăn' : 'Uống';
  if (score >= 8.5) {
    return {
      rankLabel: 'Quán ruột • Ưu tiên #1',
      shortLabel: 'Quán ruột',
      verdict: `Đỉnh chóp! Chắc chắn quay lại ${actionVerb.toLowerCase()}`,
      isTop: true,
    };
  }
  if (score >= 7.5) {
    return {
      rankLabel: `Đáng ${actionVerb.toLowerCase()} lại • Ưu tiên cao`,
      shortLabel: `Đáng ${actionVerb.toLowerCase()} lại`,
      verdict: 'Chất lượng tốt, đáng quay lại',
      isTop: true,
    };
  }
  if (score >= 6.8) {
    return {
      rankLabel: 'Khá ổn • Tiện đường ghé',
      shortLabel: 'Khá ổn',
      verdict: 'Trải nghiệm ổn, tiện đường sẽ ghé',
      isTop: false,
    };
  }
  if (score >= 6.0) {
    return {
      rankLabel: `${actionVerb} cho biết • Không ưu tiên`,
      shortLabel: 'Không ưu tiên',
      verdict: `${actionVerb} cho biết, không ưu tiên quay lại`,
      isTop: false,
    };
  }
  return {
    rankLabel: 'Không quay lại • Né gấp',
    shortLabel: 'Né gấp',
    verdict: 'Trải nghiệm kém so với giá tiền',
    isTop: false,
  };
}

export function getSliderReaction(val: number) {
  if (val >= 9) return 'Xuất sắc';
  if (val >= 7.5) return 'Rất tốt';
  if (val >= 6) return 'Khá ổn';
  if (val >= 4.5) return 'Tạm ổn';
  return 'Kém';
}

export function scoreReview(
  item: Pick<
    ReviewItem,
    | 'category'
    | 'mode'
    | 'taste'
    | 'priceK'
    | 'volumeKey'
    | 'packaging'
    | 'space'
    | 'foodType'
    | 'foodQuality'
    | 'cleanliness'
  >,
): number {
  return item.category === 'food'
    ? calculateFoodScore(item).total
    : calculateDrinkScore(item).total;
}
