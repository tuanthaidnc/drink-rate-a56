import React, { useState, useMemo, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Trash2,
  Edit3,
  BarChart3,
  Sparkles,
  Search,
  ChevronRight,
  Download,
  Upload,
  Calculator,
  X,
  Check,
  SlidersHorizontal,
  Sun,
  Moon,
  Flame,
  Navigation,
  Map as MapIcon,
  Utensils,
  CupSoda,
  RefreshCw,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  cn,
  type AppTheme,
  syncStatusBarThemeColor,
  applyThemeWithTransition,
  Shine,
  MotionEffect,
  CountingNumber,
  RippleButton,
  MotionSegmented,
  AnimatedProgress,
  AutoHeight,
  AmbientGlowBackground,
  CategoryScoreBadge,
  StarRatingBadge,
  scoreToStars,
} from './components/animate-ui/primitives';
import {
  VIETNAM_34_PROVINCES_DATA,
  VIETNAM_34_PROVINCE_NAMES,
  getProvinceInfo,
  getWardsForCity,
  getStreetsForCityAndWard,
  resolveCoordinates,
  fetchLiveOsmStreetsAndWards,
  geocodeAddressOsm,
} from './data/vietnamLocations2025';
import { MapExplorer } from './components/MapExplorer';
import { SmartSpinModal } from './components/SmartSpinModal';
import { MapPinPickerModal } from './components/MapPinPickerModal';
import {
  getFreqTier,
  getQuotaStatus,
  getMonthCycleInfo,
  TONE_CLASSES,
  type FrequencyTier,
} from './lib/frequency';

// ============================================================================
// 1. MÔ HÌNH DỮ LIỆU ĐỒNG BỘ: QUÁN NƯỚC (DRINK) & QUÁN ĂN (FOOD) + TỌA ĐỘ BẢN ĐỒ
// ============================================================================

export type PlaceCategory = 'drink' | 'food';
export type DrinkMode = 'takeaway' | 'dinein';
export type FoodVenueType = 'streetfood' | 'restaurant';
export type VolumeKey = 'very_low' | 'low' | 'medium' | 'high' | 'overflow';

export interface ReviewItem {
  id: string;
  category: PlaceCategory;
  name: string;
  city: string;
  ward: string;
  street: string;
  // Thuộc tính chung
  priceK: number;
  taste: number; // 1 - 10 (Độ ngon / Hương vị)
  space: number; // 1 - 10 (Không gian quán / chỗ ngồi)
  totalScore: number; // Thang 10
  note: string;
  createdAt: string;
  lat: number;
  lng: number;
  // Thuộc tính riêng Quán nước
  mode: DrinkMode;
  volumeKey: VolumeKey;
  packaging: number; // 1 - 10 (Chất liệu vỏ ly)
  // Thuộc tính riêng Quán ăn
  foodType?: FoodVenueType; // 'streetfood' (Vỉa hè) | 'restaurant' (Quán ngồi)
  cleanliness?: number; // 1 - 10 (Độ sạch sẽ / Vệ sinh)
  foodQuality?: number; // 1 - 10 (Chất lượng đồ ăn & Khẩu phần)
  // Lịch sử ghé quán (Hỗ trợ theo dõi tần suất chu kỳ ngày 5)
  visits?: string[];
}

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
  mode: DrinkMode
): { score: number; bracket: string } {
  if (mode === 'takeaway') {
    if (priceK < 20) return { score: 10.0, bracket: '< 20k' };
    if (priceK <= 29) return { score: 8.5, bracket: '20k - 29k' };
    if (priceK <= 39) return { score: 7.0, bracket: '30k - 39k' };
    if (priceK <= 49) return { score: 5.0, bracket: '40k - 49k' };
    if (priceK <= 65) return { score: 3.0, bracket: '50k - 65k' };
    return { score: 1.5, bracket: '> 65k' };
  } else {
    if (priceK < 30) return { score: 10.0, bracket: '< 30k' };
    if (priceK <= 39) return { score: 9.0, bracket: '30k - 39k' };
    if (priceK <= 49) return { score: 7.5, bracket: '40k - 49k' };
    if (priceK <= 65) return { score: 6.0, bracket: '50k - 65k' };
    if (priceK <= 85) return { score: 4.0, bracket: '66k - 85k' };
    return { score: 2.0, bracket: '> 85k' };
  }
}

export function getFoodPriceScore(
  priceK: number,
  foodType: FoodVenueType
): { score: number; bracket: string } {
  if (foodType === 'streetfood') {
    if (priceK <= 25) return { score: 10.0, bracket: '≤ 25k' };
    if (priceK <= 35) return { score: 8.5, bracket: '26k - 35k' };
    if (priceK <= 50) return { score: 7.0, bracket: '36k - 50k' };
    if (priceK <= 70) return { score: 5.5, bracket: '51k - 70k' };
    if (priceK <= 100) return { score: 4.0, bracket: '71k - 100k' };
    return { score: 2.5, bracket: '> 100k' };
  } else {
    if (priceK <= 35) return { score: 10.0, bracket: '≤ 35k' };
    if (priceK <= 55) return { score: 8.5, bracket: '36k - 55k' };
    if (priceK <= 85) return { score: 7.0, bracket: '56k - 85k' };
    if (priceK <= 130) return { score: 5.5, bracket: '86k - 130k' };
    if (priceK <= 200) return { score: 4.0, bracket: '131k - 200k' };
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
    params.mode
  );
  const volumeObj =
    VOLUME_OPTIONS.find((v) => v.key === params.volumeKey) || VOLUME_OPTIONS[1];
  const volumeScore = volumeObj.score;

  if (params.mode === 'takeaway') {
    // Take-away: Vị 50% + Giá 25% + Thể tích 20% + Vỏ ly 5% = 100%
    // Quán Nốt: 7*0.5 + 7*0.25 + 4*0.2 + 9*0.05 = 6.50 / 10
    const total =
      params.taste * 0.5 +
      priceScore * 0.25 +
      volumeScore * 0.2 +
      params.packaging * 0.05;
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
    params.foodType
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

export function getTierStyle(
  score: number,
  category: PlaceCategory = 'drink'
) {
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

// ============================================================================
// 3. DỮ LIỆU MẪU CHUẨN HÓA (QUÁN NƯỚC NỐT + QUÁN ĂN ĐÀ NẴNG)
// ============================================================================

const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: 'seed-not-phan-thanh-dn',
    category: 'drink',
    name: 'Nốt',
    city: 'Đà Nẵng',
    ward: 'Thanh Khê',
    street: 'Phan Thanh',
    mode: 'takeaway',
    priceK: 31,
    taste: 7,
    packaging: 9,
    volumeKey: 'low',
    space: 6,
    totalScore: 6.5,
    note: 'Chất liệu vỏ ly xịn (9/10), vị ổn (7/10) nhưng lượng đồ uống ít so với mức giá 31k.',
    createdAt: '2026-10-26',
    lat: 16.0618,
    lng: 108.2088,
  },
  {
    id: 'seed-food-banh-canh-phan-thanh',
    category: 'food',
    name: 'Bánh Canh Cá Lóc Thanh Hương',
    city: 'Đà Nẵng',
    ward: 'Thanh Khê',
    street: 'Phan Thanh',
    mode: 'dinein',
    foodType: 'streetfood',
    priceK: 25,
    taste: 8.5,
    foodQuality: 8.5,
    cleanliness: 8.0,
    space: 7.5,
    volumeKey: 'high',
    packaging: 8,
    totalScore: 8.6,
    note: 'Nước dùng đậm đà, cá lóc tươi chắc thịt, tô đầy đặn 25k ngay đường Phan Thanh.',
    createdAt: '2026-10-26',
    lat: 16.0641,
    lng: 108.2095,
  },
  {
    id: 'seed-food-mi-quang-hai-chau',
    category: 'food',
    name: 'Mì Quảng Bếp Trang',
    city: 'Đà Nẵng',
    ward: 'Hải Châu',
    street: 'Lê Duẩn',
    mode: 'dinein',
    foodType: 'restaurant',
    priceK: 45,
    taste: 8.5,
    foodQuality: 9.0,
    cleanliness: 9.0,
    space: 8.5,
    volumeKey: 'high',
    packaging: 9,
    totalScore: 8.7,
    note: 'Không gian quán sạch đẹp, rau sống tươi sạch, tô mì đầy ắp tôm thịt trứng.',
    createdAt: '2026-10-26',
    lat: 16.0688,
    lng: 108.2145,
  },
];

const STORAGE_KEY_REVIEWS = 'not_drink_food_reviews_v11';
const LEGACY_STORAGE_KEYS = [
  'not_drink_food_reviews_v9',
  'not_drink_reviews_v5_34tinh',
  'not_drink_reviews_v4_34provinces',
];

function migrateAndLoadReviews(): ReviewItem[] {
  try {
    const savedV11 = localStorage.getItem(STORAGE_KEY_REVIEWS);
    if (savedV11) {
      const parsed = JSON.parse(savedV11);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: ReviewItem) => {
          const coords =
            item.lat && item.lng
              ? { lat: item.lat, lng: item.lng }
              : resolveCoordinates(item.city, item.ward, item.street, item.name);
          return {
            ...item,
            category: item.category || 'drink',
            foodType: item.foodType || 'streetfood',
            cleanliness: item.cleanliness ?? 8,
            foodQuality: item.foodQuality ?? 8,
            visits: Array.isArray(item.visits) ? item.visits : [],
            lat: coords.lat,
            lng: coords.lng,
          };
        });
      }
    }

    // Migrate from previous v5/v4 storage if present
    for (const key of LEGACY_STORAGE_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const migrated: ReviewItem[] = parsed.map((item: ReviewItem) => {
            const coords = resolveCoordinates(
              item.city || 'Đà Nẵng',
              item.ward || 'Thanh Khê',
              item.street || 'Phan Thanh',
              item.name
            );
            return {
              ...item,
              category: item.category || 'drink',
              foodType: item.foodType || 'streetfood',
              cleanliness: item.cleanliness ?? 8,
              foodQuality: item.foodQuality ?? 8,
              lat: item.lat || coords.lat,
              lng: item.lng || coords.lng,
            };
          });
          // Bổ sung 2 quán ăn mẫu nếu dữ liệu cũ chỉ mới có quán nước
          const hasFood = migrated.some((x) => x.category === 'food');
          if (!hasFood) {
            return [
              ...migrated,
              ...INITIAL_REVIEWS.filter((x) => x.category === 'food'),
            ];
          }
          return migrated;
        }
      }
    }
  } catch {
    // ignore parse errors
  }
  return INITIAL_REVIEWS;
}

export function App() {
  // --- Theme State (Dark & Light) ---
  const [theme, setTheme] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem('not_app_theme_v8') as AppTheme | null;
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // ignore
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    syncStatusBarThemeColor(theme);
  }, [theme]);

  // --- Virtual Keyboard & Input Focus Sync (Hỗ trợ interactive-widget=resizes-content trên Android) ---
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const maxViewportHeightRef = React.useRef<number>(
    typeof window !== 'undefined' ? window.innerHeight : 800
  );

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handleViewportChange = () => {
      document.documentElement.style.setProperty('--vvh', `${vv.height}px`);
      document.documentElement.style.setProperty('--vvo', `${vv.offsetTop}px`);
      if (vv.height > maxViewportHeightRef.current) {
        maxViewportHeightRef.current = vv.height;
      }
      const baselineHeight = Math.max(
        window.innerHeight,
        maxViewportHeightRef.current
      );
      const keyboardVisible = baselineHeight - vv.height > 110;
      setIsKeyboardOpen(keyboardVisible);
    };

    handleViewportChange();
    vv.addEventListener('resize', handleViewportChange);
    vv.addEventListener('scroll', handleViewportChange);
    window.addEventListener('resize', handleViewportChange);
    return () => {
      vv.removeEventListener('resize', handleViewportChange);
      vv.removeEventListener('scroll', handleViewportChange);
      window.removeEventListener('resize', handleViewportChange);
    };
  }, []);

  useEffect(() => {
    const isTextEntryElement = (el: HTMLElement | null) => {
      if (!el) return false;
      if (el.tagName === 'TEXTAREA') return true;
      if (el.tagName === 'INPUT') {
        const type = ((el as HTMLInputElement).type || 'text').toLowerCase();
        return !['range', 'checkbox', 'radio', 'file', 'button', 'submit'].includes(
          type
        );
      }
      return false;
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (isTextEntryElement(target)) {
        setIsInputFocused(true);
        setTimeout(() => {
          target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 180);
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        const active = document.activeElement as HTMLElement | null;
        if (!isTextEntryElement(active)) {
          setIsInputFocused(false);
        }
      }, 100);
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const isTyping = isInputFocused || isKeyboardOpen;

  // --- Reviews Data ---
  const [reviews, setReviews] = useState<ReviewItem[]>(migrateAndLoadReviews);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(reviews));
    } catch {
      // ignore
    }
  }, [reviews]);

  // --- Navigation & Modals ---
  const [activeTab, setActiveTab] = useState<
    'list' | 'map' | 'form' | 'insights'
  >('list');
  const [mapFocusId, setMapFocusId] = useState<string | null>(null);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [showSpinModal, setShowSpinModal] = useState(false);
  const [showPinPickerModal, setShowPinPickerModal] = useState(false);
  const [customCoords, setCustomCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(
    'seed-not-phan-thanh-dn'
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  };

  const handleLogVisit = (itemId: string) => {
    const nowIso = new Date().toISOString();
    let updatedName = '';
    let updatedQuotaInfo: ReturnType<typeof getQuotaStatus> | null = null;

    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === itemId) {
          const nextVisits = [...(r.visits || []), nowIso];
          const updated = { ...r, visits: nextVisits };
          updatedName = r.name;
          updatedQuotaInfo = getQuotaStatus(updated);
          return updated;
        }
        return r;
      })
    );

    if (updatedQuotaInfo) {
      showToast(
        `✓ Đã ghé "${updatedName}" (-1 lượt)! Còn ${updatedQuotaInfo.remaining}/${updatedQuotaInfo.tier.cycleLimit} lượt chu kỳ này.`
      );
    }
  };

  // --- Filters (List Tab) ---
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<
    'ALL' | PlaceCategory
  >('ALL');
  const [selectedCity, setSelectedCity] = useState<string>('Đà Nẵng');
  const [selectedWard, setSelectedWard] = useState<string>('ALL');
  const [selectedStreet, setSelectedStreet] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<
    'score_desc' | 'taste_desc' | 'price_asc'
  >('score_desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // --- Evaluation Form State (Quán nước & Quán ăn) ---
  const [formCategory, setFormCategory] = useState<PlaceCategory>('drink');
  const [name, setName] = useState('');
  const [city, setCity] = useState('Đà Nẵng');
  const [ward, setWard] = useState('Thanh Khê');
  const [street, setStreet] = useState('Phan Thanh');
  // Drink specific
  const [mode, setMode] = useState<DrinkMode>('takeaway');
  const [volumeKey, setVolumeKey] = useState<VolumeKey>('low');
  const [packaging, setPackaging] = useState<number>(9);
  // Food specific
  const [foodType, setFoodType] = useState<FoodVenueType>('streetfood');
  const [foodQuality, setFoodQuality] = useState<number>(8.5);
  const [cleanliness, setCleanliness] = useState<number>(8.0);
  // Shared
  const [priceK, setPriceK] = useState<number>(31);
  const [taste, setTaste] = useState<number>(7);
  const [space, setSpace] = useState<number>(7.5);
  const [note, setNote] = useState('');

  // --- Official Location Picker Modal State (34 Tỉnh/Thành -> Phường/Xã -> Đường) ---
  const [isLocPickerOpen, setIsLocPickerOpen] = useState(false);
  const [locStep, setLocStep] = useState<'city' | 'ward' | 'street'>('ward');
  const [locSearch, setLocSearch] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [liveOsmStreets, setLiveOsmStreets] = useState<string[]>([]);
  const [isSyncingOsm, setIsSyncingOsm] = useState(false);

  // Tự động đồng bộ thêm đường/phố từ OpenStreetMap khi mở chọn Đường
  useEffect(() => {
    if (!isLocPickerOpen) return;
    let cancelled = false;
    setIsSyncingOsm(true);
    fetchLiveOsmStreetsAndWards(city, ward)
      .then((res) => {
        if (!cancelled && res.streets.length > 0) {
          setLiveOsmStreets(res.streets);
        }
      })
      .finally(() => {
        if (!cancelled) setIsSyncingOsm(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isLocPickerOpen, city, ward]);

  const wardOptionsForCurrentCity = useMemo(() => {
    const base = getWardsForCity(city);
    const fromReviews = reviews
      .filter((r) => r.city === city)
      .map((r) => r.ward);
    return Array.from(new Set([...base, ...fromReviews]));
  }, [city, reviews]);

  const streetOptionsForCurrentCityAndWard = useMemo(() => {
    const base = getStreetsForCityAndWard(city, ward);
    const fromReviews = reviews
      .filter((r) => r.city === city && (!ward || r.ward === ward))
      .map((r) => r.street);
    return Array.from(new Set([...base, ...liveOsmStreets, ...fromReviews]));
  }, [city, ward, liveOsmStreets, reviews]);

  // --- Live Calculation ---
  const liveCalc = useMemo(() => {
    if (formCategory === 'food') {
      const res = calculateFoodScore({
        foodType,
        taste,
        foodQuality,
        cleanliness,
        space,
        priceK: Number(priceK) || 0,
      });
      return {
        total: res.total,
        priceScore: res.priceScore,
        priceBracket: res.priceBracket,
        volumeScore: foodQuality,
      };
    }
    return calculateDrinkScore({
      mode,
      taste,
      priceK: Number(priceK) || 0,
      volumeKey,
      packaging,
      space,
    });
  }, [
    formCategory,
    mode,
    foodType,
    taste,
    foodQuality,
    cleanliness,
    priceK,
    volumeKey,
    packaging,
    space,
  ]);

  const liveTier = useMemo(
    () => getTierStyle(liveCalc.total, formCategory),
    [liveCalc.total, formCategory]
  );

  // --- Hierarchical Filter Options ---
  const filterCities = useMemo(() => {
    const set = new Set<string>(['Đà Nẵng']);
    reviews.forEach((r) => set.add(r.city));
    return ['ALL', ...Array.from(set)];
  }, [reviews]);

  const filterWards = useMemo(() => {
    const set = new Set<string>();
    reviews
      .filter((r) => selectedCity === 'ALL' || r.city === selectedCity)
      .forEach((r) => set.add(r.ward));
    return ['ALL', ...Array.from(set)];
  }, [reviews, selectedCity]);

  const filterStreets = useMemo(() => {
    const set = new Set<string>();
    reviews
      .filter(
        (r) =>
          (selectedCity === 'ALL' || r.city === selectedCity) &&
          (selectedWard === 'ALL' || r.ward === selectedWard)
      )
      .forEach((r) => set.add(r.street));
    return ['ALL', ...Array.from(set)];
  }, [reviews, selectedCity, selectedWard]);

  const filteredReviews = useMemo(() => {
    return reviews
      .filter((r) => {
        if (
          selectedCategoryFilter !== 'ALL' &&
          r.category !== selectedCategoryFilter
        )
          return false;
        if (selectedCity !== 'ALL' && r.city !== selectedCity) return false;
        if (selectedWard !== 'ALL' && r.ward !== selectedWard) return false;
        if (selectedStreet !== 'ALL' && r.street !== selectedStreet)
          return false;
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchName = r.name.toLowerCase().includes(q);
          const matchStreet = r.street.toLowerCase().includes(q);
          const matchWard = r.ward.toLowerCase().includes(q);
          const matchNote = r.note.toLowerCase().includes(q);
          if (!matchName && !matchStreet && !matchWard && !matchNote)
            return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'score_desc') return b.totalScore - a.totalScore;
        if (sortBy === 'taste_desc') return b.taste - a.taste;
        if (sortBy === 'price_asc') return a.priceK - b.priceK;
        return 0;
      });
  }, [
    reviews,
    selectedCategoryFilter,
    selectedCity,
    selectedWard,
    selectedStreet,
    sortBy,
    searchQuery,
  ]);

  // --- Handlers ---
  const resetForm = (nextCat?: PlaceCategory) => {
    const targetCat = nextCat || formCategory;
    setEditingId(null);
    setCustomCoords(null);
    setFormCategory(targetCat);
    setName('');
    setMode('takeaway');
    setFoodType('streetfood');
    setPriceK(targetCat === 'food' ? 30 : 31);
    setTaste(7.5);
    setPackaging(8);
    setVolumeKey('medium');
    setFoodQuality(8.0);
    setCleanliness(8.0);
    setSpace(7.5);
    setNote('');
  };

  const handleSaveReview = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      showToast('Vui lòng nhập tên quán trước khi lưu');
      const el = document.getElementById('shop-name-input');
      el?.focus();
      return;
    }

    const cleanCity = city.trim() || 'Đà Nẵng';
    const cleanWard =
      ward.trim().replace(/^Phường\s+/i, '') || 'Thanh Khê';
    const cleanStreet =
      street.trim().replace(/^Đường\s+/i, '') || 'Phan Thanh';

    // Tính toán tọa độ tức thì hoặc lấy tọa độ ghim thủ công của người dùng
    const fallbackCoords = resolveCoordinates(
      cleanCity,
      cleanWard,
      cleanStreet,
      cleanName
    );

    const finalLat = customCoords ? customCoords.lat : fallbackCoords.lat;
    const finalLng = customCoords ? customCoords.lng : fallbackCoords.lng;

    const existingItem = editingId ? reviews.find((r) => r.id === editingId) : null;
    const newItemId = editingId || `place-${Date.now()}`;
    const newItem: ReviewItem = {
      id: newItemId,
      category: formCategory,
      name: cleanName,
      city: cleanCity,
      ward: cleanWard,
      street: cleanStreet,
      mode,
      foodType,
      priceK: Number(priceK) || 0,
      taste,
      packaging,
      volumeKey,
      foodQuality,
      cleanliness,
      space,
      totalScore: liveCalc.total,
      note: note.trim(),
      createdAt: existingItem ? existingItem.createdAt : new Date().toISOString().split('T')[0],
      visits: existingItem ? existingItem.visits : [],
      lat: finalLat,
      lng: finalLng,
    };

    if (editingId) {
      setReviews((prev) =>
        prev.map((r) => (r.id === editingId ? newItem : r))
      );
      showToast(`Đã cập nhật "${cleanName}" (${liveCalc.total}đ)`);
    } else {
      setReviews((prev) => [newItem, ...prev]);
      showToast(`Đã lưu "${cleanName}" (${liveCalc.total}đ)`);
    }

    // Nếu người dùng CHƯA ghim thủ công, geocode bất đồng bộ bằng OpenStreetMap để ghim chuẩn xác hơn
    if (!customCoords) {
      geocodeAddressOsm(cleanName, cleanStreet, cleanWard, cleanCity).then(
        (osmCoords) => {
          if (osmCoords) {
            setReviews((prev) =>
              prev.map((r) =>
                r.id === newItemId
                  ? { ...r, lat: osmCoords.lat, lng: osmCoords.lng }
                  : r
              )
            );
          }
        }
      );
    }

    setSelectedCity(cleanCity);
    setSelectedWard('ALL');
    setSelectedStreet('ALL');
    setExpandedCardId(newItem.id);
    resetForm();
    setActiveTab('list');
  };

  const handleEdit = (item: ReviewItem) => {
    setEditingId(item.id);
    if (item.lat && item.lng) {
      setCustomCoords({ lat: item.lat, lng: item.lng });
    } else {
      setCustomCoords(null);
    }
    setFormCategory(item.category || 'drink');
    setName(item.name);
    setCity(item.city);
    setWard(item.ward);
    setStreet(item.street);
    setMode(item.mode);
    setFoodType(item.foodType || 'streetfood');
    setPriceK(item.priceK);
    setTaste(item.taste);
    setPackaging(item.packaging ?? 8);
    setVolumeKey(item.volumeKey || 'medium');
    setFoodQuality(item.foodQuality ?? 8);
    setCleanliness(item.cleanliness ?? 8);
    setSpace(item.space ?? 7.5);
    setNote(item.note);
    setActiveTab('form');
  };

  const handleDelete = (id: string, shopName: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    showToast(`Đã xóa "${shopName}"`);
  };

  const handleOpenDirectionsExternal = (item: {
    name: string;
    street: string;
    ward: string;
    city: string;
    lat: number;
    lng: number;
  }) => {
    const query = encodeURIComponent(
      `${item.name}, Đường ${item.street}, Phường ${item.ward}, ${item.city}, Việt Nam`
    );
    const url = `https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=two-wheeler`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleViewOnMap = (item: ReviewItem) => {
    setMapFocusId(item.id);
    setActiveTab('map');
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(reviews, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `not-food-drink-index-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải file sao lưu JSON');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result));
        if (Array.isArray(parsed)) {
          setReviews(parsed);
          showToast(`Đã khôi phục ${parsed.length} quán`);
        }
      } catch {
        showToast('File JSON không hợp lệ');
      }
    };
    reader.readAsText(file);
  };

  const activeFilterSummary = useMemo(() => {
    const parts: string[] = [];
    parts.push(selectedCity === 'ALL' ? '34 Tỉnh/Thành' : selectedCity);
    if (selectedWard !== 'ALL') parts.push(`P. ${selectedWard}`);
    if (selectedStreet !== 'ALL') parts.push(`Đ. ${selectedStreet}`);
    return parts.join(' • ');
  }, [selectedCity, selectedWard, selectedStreet]);

  const currentProvinceInfo = useMemo(() => getProvinceInfo(city), [city]);

  return (
    <div className="pwa-app-shell">
      <AmbientGlowBackground theme={theme} />

      {/* ====================================================================
       * 1. LOCKED STICKY HEADER (KHÔNG BAO GIỜ TRÔI KHI CUỘN HOẶC MỞ BÀN PHÍM)
       * ================================================================== */}
      <header className="shrink-0 z-30 theme-header">
        <div className="max-w-[440px] mx-auto px-3.5 py-2.5 space-y-2">
          {/* Top Brand + Theme Switcher (Tối / Sáng) + Formula Modal */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <motion.div
                whileTap={{ rotate: -15, scale: 0.9 }}
                className="w-8.5 h-8.5 rounded-xl theme-surface-elevated flex items-center justify-center shrink-0 border border-[var(--border-active)]"
              >
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M7 9H17L15.8 19.2C15.69 20.22 14.82 21 13.8 21H10.2C9.18 21 8.31 20.22 8.2 19.2L7 9Z"
                    stroke="var(--accent)"
                    strokeWidth="2"
                  />
                  <path
                    d="M5.5 9H18.5"
                    stroke="var(--text-primary)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 9V4L15 2.5"
                    stroke="var(--accent-bright)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="10.5" cy="16.5" r="1.1" fill="var(--accent)" />
                  <circle cx="13.5" cy="17" r="1.1" fill="var(--accent)" />
                </svg>
              </motion.div>

              <div className="min-w-0">
                <h1 className="text-sm font-extrabold tracking-tight text-[var(--text-primary)] leading-none">
                  NỐT
                </h1>
                <p className="text-[9.5px] font-mono font-bold text-[var(--accent)] tracking-wider uppercase mt-1 leading-none whitespace-nowrap">
                  FOOD & DRINK
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* 2-Mode Theme Switcher: Tối / Sáng */}
              <div
                role="group"
                aria-label="Chế độ giao diện"
                className="flex items-center p-0.5 rounded-xl theme-surface-elevated"
              >
                {(
                  [
                    {
                      id: 'dark',
                      label: 'Tối',
                      icon: <Moon className="w-3 h-3" />,
                    },
                    {
                      id: 'light',
                      label: 'Sáng',
                      icon: <Sun className="w-3 h-3" />,
                    },
                  ] as const
                ).map((t) => {
                  const active = theme === t.id;
                  return (
                    <motion.button
                      key={t.id}
                      type="button"
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) =>
                        applyThemeWithTransition(t.id, setTheme, e)
                      }
                      className={cn(
                        'flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer select-none whitespace-nowrap',
                        active
                          ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-extrabold shadow-xs'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      )}
                    >
                      {t.icon}
                      <span>{t.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Smart Spin Wheel Button: Hôm nay Ăn / Uống gì? */}
              <RippleButton
                type="button"
                onClick={() => setShowSpinModal(true)}
                className="h-8 px-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] flex items-center gap-1 text-[11px] font-extrabold shadow-xs whitespace-nowrap cursor-pointer"
                title="Vòng quay Quyết định: Hôm nay Ăn / Uống gì?"
              >
                <span className="text-xs">🎡</span>
                <span>Ăn gì?</span>
              </RippleButton>

              {/* Formula Reference Button */}
              <RippleButton
                type="button"
                onClick={() => setShowFormulaModal(true)}
                className="h-8 px-2 rounded-xl theme-surface-elevated flex items-center gap-1 text-[11px] font-bold text-[var(--text-primary)] whitespace-nowrap"
                title="Xem hệ thống công thức chấm điểm"
              >
                <Calculator className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                <span className="hidden sm:inline">Công thức</span>
              </RippleButton>
            </div>
          </div>

          {/* Locked Sub-bar for List Tab: Category Switch + Search + Area Filter */}
          {activeTab === 'list' && (
            <div className="space-y-1.5 pt-0.5">
              {/* Quick Category Pills: Tất cả | Quán nước | Quán ăn */}
              <div className="flex items-center gap-1.5">
                {(
                  [
                    {
                      k: 'ALL',
                      label: `Tất cả (${reviews.length})`,
                      icon: null,
                    },
                    {
                      k: 'drink',
                      label: `Quán nước (${reviews.filter((x) => x.category === 'drink').length})`,
                      icon: <CupSoda className="w-3.5 h-3.5" />,
                    },
                    {
                      k: 'food',
                      label: `Quán ăn (${reviews.filter((x) => x.category === 'food').length})`,
                      icon: <Utensils className="w-3.5 h-3.5" />,
                    },
                  ] as const
                ).map((cat) => {
                  const active = selectedCategoryFilter === cat.k;
                  return (
                    <button
                      key={cat.k}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(cat.k)}
                      className={cn(
                        'flex-1 h-8 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer whitespace-nowrap',
                        active
                          ? cat.k === 'food'
                            ? 'bg-orange-500 text-white border-orange-400 shadow-xs'
                            : 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--border-active)] shadow-xs'
                          : 'theme-surface-elevated text-[var(--text-secondary)]'
                      )}
                    >
                      {cat.icon}
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm tên quán ăn/nước, đường, phường..."
                    className="w-full h-9 pl-8 pr-7 rounded-xl theme-surface-elevated text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--border-active)] transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-0.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <RippleButton
                  type="button"
                  onClick={() => setIsFilterDrawerOpen((v) => !v)}
                  className={cn(
                    'h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold shrink-0 border transition-colors',
                    isFilterDrawerOpen ||
                      selectedWard !== 'ALL' ||
                      selectedStreet !== 'ALL'
                      ? 'bg-[var(--accent-soft)] border-[var(--border-active)] text-[var(--accent)]'
                      : 'theme-surface-elevated text-[var(--text-secondary)]'
                  )}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Khu vực</span>
                </RippleButton>
              </div>
            </div>
          )}

          {/* Locked Live Score Bar on Form Tab (Tự động ẩn khi đang gõ tên quán/ghi chú để mở rộng vùng nhìn) */}
          {activeTab === 'form' && !isTyping && (
            <div className="flex items-center justify-between gap-2 pt-0.5 px-3 py-2 rounded-xl theme-surface-elevated border border-[var(--border-active)]">
              <div className="flex items-center gap-2.5 min-w-0">
                <CategoryScoreBadge
                  category={formCategory}
                  score={liveCalc.total}
                  size="sm"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="flex items-baseline gap-0.5">
                      <CountingNumber
                        number={liveCalc.total}
                        decimalPlaces={2}
                        className="font-mono text-lg font-extrabold text-[var(--accent)] leading-none"
                      />
                      <span className="font-mono text-[10px] text-[var(--text-muted)]">
                        /10
                      </span>
                    </div>
                    <StarRatingBadge score10={liveCalc.total} />
                  </div>
                  <p className="text-[11px] font-bold text-[var(--text-primary)] leading-tight mt-0.5">
                    {liveTier.verdict}
                  </p>
                </div>
              </div>

              <RippleButton
                type="button"
                onClick={() => handleSaveReview()}
                className="h-8.5 px-3.5 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] font-extrabold text-xs flex items-center gap-1 shrink-0 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span>{editingId ? 'Cập nhật' : 'Lưu quán'}</span>
              </RippleButton>
            </div>
          )}
        </div>
      </header>

      {/* ====================================================================
       * 2. SCROLLABLE MAIN CONTENT AREA (pb-32 ensures zero overlap with dock)
       * ================================================================== */}
      <main className="pwa-scroll-main">
        <div
          className={cn(
            'max-w-[440px] mx-auto px-3.5 pt-3 space-y-3.5 transition-all',
            isTyping ? 'pb-6' : 'pb-32'
          )}
        >
          {/* ================================================================
           * TAB 1: DANH SÁCH QUÁN NƯỚC & QUÁN ĂN
           * ============================================================== */}
          {activeTab === 'list' && (
            <MotionEffect key="tab-list" className="space-y-3">
              {/* Active Location Summary Bar */}
              <div className="flex items-center justify-between gap-2 px-1">
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer text-left"
                >
                  <MapPin className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                  <span>{activeFilterSummary}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('map')}
                  className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[var(--accent)] hover:underline cursor-pointer shrink-0"
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>Mở Bản đồ ({filteredReviews.length})</span>
                </button>
              </div>

              {/* Collapsible 3-Tier Administrative Filter (Tỉnh/Thành -> Phường -> Đường) */}
              <AutoHeight isOpen={isFilterDrawerOpen}>
                <div className="rounded-2xl theme-surface-card p-3.5 space-y-3 mb-1">
                  {/* 1. Tỉnh / Thành phố (34) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[var(--text-secondary)]">
                        1. Tỉnh / Thành phố (34 đơn vị mới)
                      </span>
                      {(selectedWard !== 'ALL' || selectedStreet !== 'ALL') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedWard('ALL');
                            setSelectedStreet('ALL');
                          }}
                          className="text-[11px] font-semibold text-[var(--accent)] cursor-pointer"
                        >
                          Đặt lại
                        </button>
                      )}
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                      {filterCities.map((c) => {
                        const active = selectedCity === c;
                        return (
                          <motion.button
                            key={c}
                            type="button"
                            whileTap={{ scale: 0.94 }}
                            onClick={() => {
                              setSelectedCity(c);
                              setSelectedWard('ALL');
                              setSelectedStreet('ALL');
                            }}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all cursor-pointer border',
                              active
                                ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)] font-extrabold'
                                : 'theme-surface-elevated text-[var(--text-secondary)]'
                            )}
                          >
                            {c === 'ALL' ? 'Tất cả Tỉnh/TP' : c}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Phường / Xã */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-[var(--text-secondary)]">
                      2. Phường / Xã trực thuộc
                    </span>
                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                      {filterWards.map((w) => {
                        const active = selectedWard === w;
                        return (
                          <motion.button
                            key={w}
                            type="button"
                            whileTap={{ scale: 0.94 }}
                            onClick={() => {
                              setSelectedWard(w);
                              setSelectedStreet('ALL');
                            }}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all cursor-pointer border',
                              active
                                ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)] border-[var(--text-primary)] font-bold'
                                : 'theme-surface-elevated text-[var(--text-secondary)]'
                            )}
                          >
                            {w === 'ALL' ? 'Tất cả Phường' : `P. ${w}`}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Đường */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-[var(--text-secondary)]">
                      3. Tuyến Đường
                    </span>
                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                      {filterStreets.map((s) => {
                        const active = selectedStreet === s;
                        return (
                          <motion.button
                            key={s}
                            type="button"
                            whileTap={{ scale: 0.94 }}
                            onClick={() => setSelectedStreet(s)}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all cursor-pointer border',
                              active
                                ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--border-active)] font-bold'
                                : 'theme-surface-elevated text-[var(--text-secondary)]'
                            )}
                          >
                            {s === 'ALL' ? 'Tất cả Đường' : s}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sort Strip */}
                  <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[var(--border-card)]">
                    <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                      Sắp xếp theo:
                    </span>
                    <div className="flex p-0.5 rounded-lg theme-surface-elevated flex-1 max-w-[240px]">
                      {(
                        [
                          { k: 'score_desc', l: 'Điểm ↓' },
                          { k: 'taste_desc', l: 'Độ ngon ↓' },
                          { k: 'price_asc', l: 'Giá ↑' },
                        ] as const
                      ).map((s) => (
                        <button
                          key={s.k}
                          type="button"
                          onClick={() => setSortBy(s.k)}
                          className={cn(
                            'flex-1 py-1 rounded-md text-[11px] transition-colors cursor-pointer',
                            sortBy === s.k
                              ? 'bg-[var(--bg-pill)] text-[var(--accent)] font-bold'
                              : 'text-[var(--text-muted)]'
                          )}
                        >
                          {s.l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </AutoHeight>

              {/* SHOP CARDS LIST (BOTH DRINK & FOOD) */}
              <div className="space-y-3">
                {filteredReviews.length === 0 ? (
                  <div className="rounded-2xl theme-surface-card py-10 px-5 text-center space-y-3">
                    <p className="text-xs text-[var(--text-secondary)]">
                      Chưa có quán nào trong bộ lọc hiện tại.
                    </p>
                    <RippleButton
                      type="button"
                      onClick={() => {
                        if (selectedCity !== 'ALL') setCity(selectedCity);
                        if (selectedWard !== 'ALL') setWard(selectedWard);
                        if (selectedStreet !== 'ALL') setStreet(selectedStreet);
                        if (selectedCategoryFilter !== 'ALL')
                          setFormCategory(selectedCategoryFilter);
                        setActiveTab('form');
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Chấm điểm quán đầu tiên</span>
                    </RippleButton>
                  </div>
                ) : (
                  filteredReviews.map((item, idx) => {
                    const isFood = item.category === 'food';
                    const tier = getTierStyle(item.totalScore, item.category);
                    const priceInfo = isFood
                      ? getFoodPriceScore(
                          item.priceK,
                          item.foodType || 'streetfood'
                        )
                      : getDrinkPriceScore(item.priceK, item.mode);
                    const volLabel =
                      VOLUME_OPTIONS.find((v) => v.key === item.volumeKey)
                        ?.label || 'Ít';
                    const isExpanded = expandedCardId === item.id;

                    return (
                      <MotionEffect key={item.id} delay={idx * 0.04}>
                        <Shine
                          enableOnTap
                          enableOnHover
                          className={cn(
                            'rounded-2xl theme-surface-card transition-all duration-200',
                            isExpanded && 'border-[var(--border-active)]'
                          )}
                        >
                          {/* Scannable Header */}
                          <div
                            onClick={() =>
                              setExpandedCardId(isExpanded ? null : item.id)
                            }
                            className="p-4 cursor-pointer select-none space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0 flex-1">
                                <CategoryScoreBadge
                                  category={item.category}
                                  score={item.totalScore}
                                  size="sm"
                                />
                                <div className="min-w-0 flex-1 space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-mono text-xs font-bold text-[var(--accent)]">
                                      #{idx + 1}
                                    </span>
                                    <h3 className="text-base font-extrabold tracking-tight text-[var(--text-primary)] leading-snug">
                                      {item.name}
                                    </h3>
                                  </div>

                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span
                                      className={cn(
                                        'text-[10px] font-bold px-2 py-0.5 rounded-md',
                                        isFood
                                          ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                                          : 'theme-surface-elevated text-[var(--text-secondary)]'
                                      )}
                                    >
                                      {isFood
                                        ? item.foodType === 'streetfood'
                                          ? '🍜 Vỉa hè'
                                          : '🍜 Quán ngồi'
                                        : item.mode === 'takeaway'
                                          ? '🥤 Take-away'
                                          : '🥤 Ngồi lại'}
                                    </span>
                                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-[var(--accent-soft)] text-[var(--accent)]">
                                      {item.priceK}k
                                    </span>
                                    <StarRatingBadge
                                      score10={item.totalScore}
                                    />
                                    {(() => {
                                      const quota = getQuotaStatus(item);
                                      return (
                                        <span
                                          className={cn(
                                            'text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1',
                                            TONE_CLASSES[quota.tier.tone]
                                          )}
                                          title={quota.tier.recommendation}
                                        >
                                          <span>{quota.tier.label}</span>
                                          <span className="opacity-75 font-mono text-[9px]">
                                            ({quota.used}/{quota.tier.cycleLimit})
                                          </span>
                                        </span>
                                      );
                                    })()}
                                  </div>

                                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] flex-wrap leading-snug pt-0.5">
                                    <span>Đường {item.street}</span>
                                    <span className="text-[var(--text-muted)]">
                                      •
                                    </span>
                                    <span>P. {item.ward}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Score + Rank Tag */}
                              <div className="text-right shrink-0">
                                <div className="flex items-baseline justify-end gap-0.5">
                                  <CountingNumber
                                    number={item.totalScore}
                                    decimalPlaces={1}
                                    className="font-mono text-2xl font-extrabold leading-none text-[var(--accent)]"
                                  />
                                  <span className="font-mono text-[11px] text-[var(--text-muted)]">
                                    /10
                                  </span>
                                </div>
                                <span
                                  className={cn(
                                    'inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md border',
                                    tier.isTop
                                      ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--border-active)]'
                                      : 'theme-surface-elevated text-[var(--text-secondary)]'
                                  )}
                                >
                                  {tier.shortLabel}
                                </span>
                              </div>
                            </div>

                            {/* Minimal Metric Strip */}
                            <div className="flex items-center justify-between pt-2.5 border-t border-[var(--border-card)] text-xs">
                              {isFood ? (
                                <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--text-secondary)] flex-wrap">
                                  <span>
                                    Ngon{' '}
                                    <b className="text-[var(--text-primary)]">
                                      {item.taste}
                                    </b>
                                  </span>
                                  <span className="text-[var(--text-muted)]">
                                    •
                                  </span>
                                  <span>
                                    Chất lượng{' '}
                                    <b className="text-[var(--text-primary)]">
                                      {item.foodQuality ?? 8}
                                    </b>
                                  </span>
                                  <span className="text-[var(--text-muted)]">
                                    •
                                  </span>
                                  <span>
                                    Sạch{' '}
                                    <b className="text-[var(--text-primary)]">
                                      {item.cleanliness ?? 8}
                                    </b>
                                  </span>
                                  <span className="text-[var(--text-muted)]">
                                    •
                                  </span>
                                  <span>
                                    K.Gian{' '}
                                    <b className="text-[var(--text-primary)]">
                                      {item.space}
                                    </b>
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2.5 font-mono text-[11px] text-[var(--text-secondary)] flex-wrap">
                                  <span>
                                    Vị{' '}
                                    <b className="text-[var(--text-primary)]">
                                      {item.taste}
                                    </b>
                                  </span>
                                  <span className="text-[var(--text-muted)]">
                                    •
                                  </span>
                                  <span>
                                    Giá{' '}
                                    <b className="text-[var(--text-primary)]">
                                      {priceInfo.score}
                                    </b>
                                  </span>
                                  <span className="text-[var(--text-muted)]">
                                    •
                                  </span>
                                  <span>
                                    Lượng{' '}
                                    <b className="text-[var(--text-primary)]">
                                      {volLabel}
                                    </b>
                                  </span>
                                  <span className="text-[var(--text-muted)]">
                                    •
                                  </span>
                                  <span>
                                    Ly{' '}
                                    <b className="text-[var(--text-primary)]">
                                      {item.packaging}
                                    </b>
                                  </span>
                                </div>
                              )}
                              <ChevronRight
                                className={cn(
                                  'w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 shrink-0',
                                  isExpanded ? '-rotate-90' : 'rotate-90'
                                )}
                              />
                            </div>
                          </div>

                          {/* Smooth Zero-Shift Expanded Detail + Direct Navigation Buttons */}
                          <AutoHeight isOpen={isExpanded}>
                            <div
                              className="px-4 pb-4 pt-3 border-t border-[var(--border-card)] space-y-3"
                              style={{ background: 'var(--bg-card-expanded)' }}
                            >
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-[var(--accent)]">
                                  {tier.rankLabel}
                                </span>
                                <span className="font-mono text-[var(--text-muted)]">
                                  Khung giá {priceInfo.bracket}
                                </span>
                              </div>

                              {isFood ? (
                                <div className="space-y-2.5">
                                  <AnimatedProgress
                                    label="Độ ngon (Hương vị)"
                                    weightLabel={
                                      item.foodType === 'streetfood'
                                        ? '40%'
                                        : '35%'
                                    }
                                    value={item.taste}
                                    displayValue={`${item.taste.toFixed(1)}/10`}
                                    isHighlight
                                  />
                                  <AnimatedProgress
                                    label="Chất lượng & Khẩu phần đồ ăn"
                                    weightLabel="25%"
                                    value={item.foodQuality ?? 8}
                                    displayValue={`${(item.foodQuality ?? 8).toFixed(1)}/10`}
                                    isHighlight
                                  />
                                  <AnimatedProgress
                                    label="Độ sạch sẽ / Vệ sinh"
                                    weightLabel="15%"
                                    value={item.cleanliness ?? 8}
                                    displayValue={`${(item.cleanliness ?? 8).toFixed(1)}/10`}
                                  />
                                  <AnimatedProgress
                                    label={
                                      item.foodType === 'streetfood'
                                        ? 'Không gian chỗ ngồi vỉa hè'
                                        : 'Không gian quán / Nhà hàng'
                                    }
                                    weightLabel={
                                      item.foodType === 'streetfood'
                                        ? '5%'
                                        : '15%'
                                    }
                                    value={item.space}
                                    displayValue={`${item.space.toFixed(1)}/10`}
                                  />
                                  <AnimatedProgress
                                    label={`Quy đổi Giá (${item.priceK}k)`}
                                    weightLabel={
                                      item.foodType === 'streetfood'
                                        ? '15%'
                                        : '10%'
                                    }
                                    value={priceInfo.score}
                                    displayValue={`${priceInfo.score.toFixed(1)}/10`}
                                  />
                                </div>
                              ) : (
                                <div className="space-y-2.5">
                                  <AnimatedProgress
                                    label="Hương vị"
                                    weightLabel={
                                      item.mode === 'takeaway' ? '50%' : '35%'
                                    }
                                    value={item.taste}
                                    displayValue={`${item.taste.toFixed(1)}/10`}
                                    isHighlight
                                  />
                                  <AnimatedProgress
                                    label={`Quy đổi Giá (${item.priceK}k)`}
                                    weightLabel={
                                      item.mode === 'takeaway' ? '25%' : '20%'
                                    }
                                    value={priceInfo.score}
                                    displayValue={`${priceInfo.score.toFixed(1)}/10`}
                                  />
                                  <AnimatedProgress
                                    label={`Thể tích (${volLabel})`}
                                    weightLabel="20%"
                                    value={
                                      VOLUME_OPTIONS.find(
                                        (v) => v.key === item.volumeKey
                                      )?.score || 4
                                    }
                                    displayValue={`${(
                                      VOLUME_OPTIONS.find(
                                        (v) => v.key === item.volumeKey
                                      )?.score || 4
                                    ).toFixed(1)}/10`}
                                  />
                                  {item.mode === 'dinein' && (
                                    <AnimatedProgress
                                      label="Không gian ngồi lại"
                                      weightLabel="20%"
                                      value={item.space}
                                      displayValue={`${item.space.toFixed(1)}/10`}
                                    />
                                  )}
                                  <AnimatedProgress
                                    label="Chất liệu vỏ ly"
                                    weightLabel="5%"
                                    value={item.packaging}
                                    displayValue={`${item.packaging.toFixed(1)}/10`}
                                  />
                                </div>
                              )}

                              {item.note && (
                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed p-3 rounded-xl theme-surface-elevated">
                                  {item.note}
                                </p>
                              )}

                              {/* Quota & Frequency Cycle Tracker (Reset ngày 5 hằng tháng) */}
                              {(() => {
                                const quota = getQuotaStatus(item);
                                const monthCycle = getMonthCycleInfo();
                                return (
                                  <div className="p-2.5 rounded-xl theme-surface-elevated flex items-center justify-between gap-2 border border-[var(--border-card)]">
                                    <div className="min-w-0 space-y-0.5">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span
                                          className={cn(
                                            'text-[10px] font-bold px-1.5 py-0.5 rounded border',
                                            TONE_CLASSES[quota.tier.tone]
                                          )}
                                        >
                                          {quota.tier.label}
                                        </span>
                                        <span className="text-[11px] font-bold text-[var(--text-primary)]">
                                          Đã ghé: {quota.used}/{quota.tier.cycleLimit} lượt
                                        </span>
                                      </div>
                                      <p className="text-[10.5px] text-[var(--text-muted)] truncate">
                                        {quota.tier.cycle === 'month'
                                          ? `Chu kỳ tháng (${monthCycle.label}) • Reset ngày 5`
                                          : quota.resetText}{' '}
                                        • {quota.tier.recommendation}
                                      </p>
                                    </div>
                                    <RippleButton
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleLogVisit(item.id);
                                      }}
                                      className="px-2.5 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] text-[11px] font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                                      title="Ghi nhận 1 lần ghé quán trong chu kỳ hiện tại"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Ghé (+1)</span>
                                    </RippleButton>
                                  </div>
                                );
                              })()}

                              {/* Action Bar: Chỉ đường ăn/uống lại + Xem bản đồ + Sửa + Xóa */}
                              <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                  <RippleButton
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenDirectionsExternal(item);
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-extrabold flex items-center gap-1 shadow-xs"
                                  >
                                    <Navigation className="w-3.5 h-3.5" />
                                    <span>Chỉ đường</span>
                                  </RippleButton>

                                  <RippleButton
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewOnMap(item);
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl theme-surface-elevated text-xs font-bold text-[var(--text-primary)] flex items-center gap-1"
                                  >
                                    <MapIcon className="w-3.5 h-3.5 text-[var(--accent)]" />
                                    <span>Bản đồ</span>
                                  </RippleButton>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <RippleButton
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(item);
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl theme-surface-elevated text-xs font-bold text-[var(--text-primary)] flex items-center gap-1"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-[var(--accent)]" />
                                    <span>Sửa</span>
                                  </RippleButton>
                                  <RippleButton
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(item.id, item.name);
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl theme-surface-elevated text-xs font-semibold text-[var(--text-secondary)] hover:text-rose-400 flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Xóa</span>
                                  </RippleButton>
                                </div>
                              </div>
                            </div>
                          </AutoHeight>
                        </Shine>
                      </MotionEffect>
                    );
                  })
                )}
              </div>
            </MotionEffect>
          )}

          {/* ================================================================
           * TAB 2: GIAO DIỆN BẢN ĐỒ RIÊNG (ĐÁNH DẤU QUÁN, SỐ SAO & CHỈ ĐƯỜNG)
           * ============================================================== */}
          {activeTab === 'map' && (
            <MotionEffect key="tab-map">
              <MapExplorer
                items={reviews}
                theme={theme}
                selectedCity={selectedCity}
                initialFocusId={mapFocusId}
                onEditItem={(it) => {
                  const full = reviews.find((r) => r.id === it.id);
                  if (full) handleEdit(full);
                }}
                onOpenDirectionsExternal={handleOpenDirectionsExternal}
                onOpenSpinWheel={() => setShowSpinModal(true)}
                onCreateReviewAtCoords={(c) => {
                  resetForm();
                  if (c.city) setCity(c.city);
                  if (c.ward) setWard(c.ward);
                  if (c.street) setStreet(c.street);
                  setCustomCoords({ lat: c.lat, lng: c.lng });
                  setActiveTab('form');
                  showToast(
                    `Đã lấy vị trí ghim (${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}) vào biểu mẫu!`
                  );
                }}
              />
            </MotionEffect>
          )}

          {/* ================================================================
           * TAB 3: CHẤM ĐIỂM (ĐỒNG BỘ QUÁN NƯỚC & QUÁN ĂN)
           * ============================================================== */}
          {activeTab === 'form' && (
            <MotionEffect key="tab-form">
              <form onSubmit={handleSaveReview} className="space-y-3.5">
                {/* 1. CHỌN MẢNG ĐÁNH GIÁ: QUÁN NƯỚC HAY QUÁN ĂN */}
                <Shine className="rounded-2xl theme-surface-card p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[var(--text-primary)]">
                      Phân loại địa điểm đánh giá
                    </span>
                    {editingId && (
                      <button
                        type="button"
                        onClick={() => resetForm()}
                        className="text-[11px] font-bold text-[var(--accent)] cursor-pointer"
                      >
                        Hủy sửa • Tạo mới
                      </button>
                    )}
                  </div>

                  <MotionSegmented
                    value={formCategory}
                    onChange={(val) => {
                      setFormCategory(val);
                      if (!editingId) {
                        setPriceK(val === 'food' ? 30 : 31);
                      }
                    }}
                    options={[
                      {
                        value: 'drink',
                        label: '🥤 Quán nước',
                        badge: (
                          <span className="text-[10px] font-mono opacity-75">
                            Take-away / Ngồi
                          </span>
                        ),
                      },
                      {
                        value: 'food',
                        label: '🍜 Quán ăn',
                        badge: (
                          <span className="text-[10px] font-mono opacity-75">
                            Vỉa hè / Quán
                          </span>
                        ),
                      },
                    ]}
                  />
                </Shine>

                {/* 2. TÊN QUÁN & ĐỊA ĐIỂM HÀNH CHÍNH CHÍNH THỨC (34 TỈNH/THÀNH) */}
                <Shine className="rounded-2xl theme-surface-card p-4 space-y-3.5">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="shop-name-input"
                      className="text-xs font-bold text-[var(--text-primary)] block"
                    >
                      {formCategory === 'food'
                        ? 'Tên quán ăn / món đặc trưng'
                        : 'Tên quán nước'}
                    </label>
                    <input
                      id="shop-name-input"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={
                        formCategory === 'food'
                          ? 'VD: Bánh Canh Cá Lóc, Bún Chả Cá, Mì Quảng...'
                          : 'VD: Nốt, Phê La, Highlands...'
                      }
                      className="w-full h-11 px-3.5 rounded-xl theme-surface-elevated text-sm font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--border-active)] transition-colors"
                    />
                  </div>

                  {/* Official 3-Step Location Selector */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        Địa điểm (34 Tỉnh/TP • Phường • Đường)
                      </span>
                      <span className="text-[10px] font-mono font-bold text-[var(--accent)] shrink-0">
                        Chọn sẵn
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <RippleButton
                        type="button"
                        onClick={() => {
                          setLocStep('city');
                          setLocSearch('');
                          setIsLocPickerOpen(true);
                        }}
                        className="p-2.5 rounded-xl theme-surface-elevated text-left space-y-0.5"
                      >
                        <span className="text-[10px] font-medium text-[var(--text-muted)] block">
                          1. Tỉnh/Thành
                        </span>
                        <span className="text-xs font-bold text-[var(--text-primary)] block leading-snug">
                          {city}
                        </span>
                      </RippleButton>

                      <RippleButton
                        type="button"
                        onClick={() => {
                          setLocStep('ward');
                          setLocSearch('');
                          setIsLocPickerOpen(true);
                        }}
                        className="p-2.5 rounded-xl theme-surface-elevated text-left space-y-0.5"
                      >
                        <span className="text-[10px] font-medium text-[var(--text-muted)] block">
                          2. Phường/Xã
                        </span>
                        <span className="text-xs font-bold text-[var(--text-primary)] block leading-snug">
                          {ward}
                        </span>
                      </RippleButton>

                      <RippleButton
                        type="button"
                        onClick={() => {
                          setLocStep('street');
                          setLocSearch('');
                          setIsLocPickerOpen(true);
                        }}
                        className="p-2.5 rounded-xl theme-surface-elevated text-left space-y-0.5 border-[var(--border-active)]"
                      >
                        <span className="text-[10px] font-medium text-[var(--accent)] block">
                          3. Đường/Phố
                        </span>
                        <span className="text-xs font-bold text-[var(--text-primary)] block leading-snug">
                          {street}
                        </span>
                      </RippleButton>
                    </div>

                    {/* Direct 2D Map Pin Button */}
                    <div className="pt-1.5 flex items-center gap-2">
                      <RippleButton
                        type="button"
                        onClick={() => setShowPinPickerModal(true)}
                        className="flex-1 py-2 px-3 rounded-xl theme-surface-elevated border border-[var(--border-active)] text-xs font-bold text-[var(--text-primary)] flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                        <span className="truncate">
                          {customCoords
                            ? 'Chỉnh ghim tọa độ 2D'
                            : '📍 Chấm ghim trực tiếp trên Bản đồ 2D'}
                        </span>
                      </RippleButton>
                      {customCoords && (
                        <button
                          type="button"
                          onClick={() => setCustomCoords(null)}
                          className="px-2.5 py-2 rounded-xl theme-surface-elevated text-xs font-bold text-rose-400 hover:bg-rose-500/10 cursor-pointer shrink-0"
                          title="Hủy ghim thủ công (sử dụng địa chỉ hành chính)"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {customCoords && (
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--accent)] bg-[var(--accent-soft)] px-2.5 py-1 rounded-lg">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          Đã ghim: {customCoords.lat.toFixed(5)}, {customCoords.lng.toFixed(5)}
                        </span>
                      </div>
                    )}
                  </div>
                </Shine>

                {/* 3. LOẠI HÌNH PHỤC VỤ (THEO QUÁN NƯỚC HOẶC QUÁN ĂN) */}
                <Shine className="rounded-2xl theme-surface-card p-3.5 space-y-2">
                  <span className="text-xs font-bold text-[var(--text-primary)] block">
                    {formCategory === 'food'
                      ? 'Hình thức quán ăn (Vỉa hè hay Quán ngồi)'
                      : 'Hình thức thưởng thức đồ uống'}
                  </span>

                  {formCategory === 'food' ? (
                    <MotionSegmented
                      value={foodType}
                      onChange={setFoodType}
                      options={[
                        {
                          value: 'streetfood',
                          label: 'Vỉa hè / Bình dân',
                          badge: (
                            <span className="text-[10px] font-mono opacity-75">
                              Ngon 40%
                            </span>
                          ),
                        },
                        {
                          value: 'restaurant',
                          label: 'Quán / Nhà hàng',
                          badge: (
                            <span className="text-[10px] font-mono opacity-75">
                              K.Gian 15%
                            </span>
                          ),
                        },
                      ]}
                    />
                  ) : (
                    <MotionSegmented
                      value={mode}
                      onChange={setMode}
                      options={[
                        {
                          value: 'takeaway',
                          label: 'Take-away (Mang đi)',
                          badge: (
                            <span className="text-[10px] font-mono opacity-75">
                              Vị 50%
                            </span>
                          ),
                        },
                        {
                          value: 'dinein',
                          label: 'Ngồi lại quán',
                          badge: (
                            <span className="text-[10px] font-mono opacity-75">
                              K.Gian 20%
                            </span>
                          ),
                        },
                      ]}
                    />
                  )}
                </Shine>

                {/* 4. HẠNG MỤC CHẤM ĐIỂM CHI TIẾT (KHÔNG BAO GIỜ RỚT DÒNG ĐÈ NÚT SLIDER) */}
                <Shine className="rounded-2xl theme-surface-card p-4 space-y-4">
                  {/* 4A. Độ ngon / Hương vị */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[var(--text-primary)] min-w-0 leading-snug">
                        {formCategory === 'food'
                          ? 'Độ ngon món ăn'
                          : 'Hương vị đồ uống'}{' '}
                        <span className="font-mono text-[10px] font-medium text-[var(--text-muted)]">
                          (
                          {formCategory === 'food'
                            ? foodType === 'streetfood'
                              ? '40%'
                              : '35%'
                            : mode === 'takeaway'
                              ? '50%'
                              : '35%'}
                          )
                        </span>
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] whitespace-nowrap">
                          {getSliderReaction(taste)}
                        </span>
                        <motion.span
                          key={taste}
                          initial={{ scale: 1.35 }}
                          animate={{ scale: 1 }}
                          className="font-mono text-base font-extrabold text-[var(--accent)]"
                        >
                          {taste.toFixed(1)}
                        </motion.span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.5"
                      value={taste}
                      onChange={(e) => setTaste(parseFloat(e.target.value))}
                      className="precision-slider"
                    />
                  </div>

                  {/* 4B. Giá tiền */}
                  <div className="space-y-2 pt-3.5 border-t border-[var(--border-card)]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        Giá trung bình 1 phần{' '}
                        <span className="font-mono text-[10px] font-medium text-[var(--text-muted)]">
                          (
                          {formCategory === 'food'
                            ? foodType === 'streetfood'
                              ? '15%'
                              : '10%'
                            : mode === 'takeaway'
                              ? '25%'
                              : '20%'}
                          )
                        </span>
                      </span>
                      <span className="font-mono text-xs text-[var(--text-secondary)] shrink-0 whitespace-nowrap">
                        {priceK}k →{' '}
                        <b className="text-[var(--accent)]">
                          {liveCalc.priceScore.toFixed(1)}đ
                        </b>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative w-24 shrink-0">
                        <input
                          type="number"
                          inputMode="numeric"
                          min="1"
                          max="2000"
                          value={priceK}
                          onChange={(e) =>
                            setPriceK(parseInt(e.target.value, 10) || 0)
                          }
                          className="w-full h-10 pl-3 pr-7 rounded-xl theme-surface-elevated font-mono text-sm font-bold text-[var(--accent)] outline-none focus:border-[var(--border-active)]"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-[var(--text-muted)]">
                          k
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 flex-1">
                        {(formCategory === 'food'
                          ? foodType === 'streetfood'
                            ? STREETFOOD_PRICE_PRESETS
                            : RESTAURANT_PRICE_PRESETS
                          : mode === 'takeaway'
                            ? TAKEAWAY_PRICE_PRESETS
                            : DINEIN_PRICE_PRESETS
                        ).map((p) => {
                          const active = priceK === p.value;
                          return (
                            <motion.button
                              key={p.label}
                              type="button"
                              whileTap={{ scale: 0.92 }}
                              onClick={() => setPriceK(p.value)}
                              className={cn(
                                'h-8 rounded-lg font-mono text-[11px] transition-all cursor-pointer border',
                                active
                                  ? 'bg-[var(--accent-soft)] border-[var(--border-active)] text-[var(--accent)] font-extrabold'
                                  : 'theme-surface-elevated text-[var(--text-secondary)]'
                              )}
                            >
                              {p.label}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Live Frequency Tier Recommendation (Theo công thức phân loại giá và chu kỳ ngày 5) */}
                    {(() => {
                      const fTier = getFreqTier(formCategory, Number(priceK) || 0);
                      const monthCycle = getMonthCycleInfo();
                      return (
                        <div
                          className={cn(
                            'p-2.5 rounded-xl border text-xs space-y-1 mt-1',
                            TONE_CLASSES[fTier.tone]
                          )}
                        >
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span className="font-extrabold flex items-center gap-1">
                              <span>📅 Đề xuất tần suất:</span>
                              <span className="underline font-black">{fTier.label}</span>
                            </span>
                            <span className="text-[10px] font-mono opacity-85">
                              {fTier.cycle === 'month'
                                ? `Chu kỳ tháng (${monthCycle.label}) • Reset ngày 5`
                                : fTier.cycle === 'week'
                                  ? 'Reset Thứ Hai'
                                  : '1–2 lần/năm'}
                            </span>
                          </div>
                          <p className="text-[11px] opacity-90 leading-snug">
                            {fTier.recommendation}{' '}
                            <span className="opacity-75">
                              (
                              {formCategory === 'food'
                                ? priceK <= 40
                                  ? 'Món ăn ≤40k: 2 lần/tuần'
                                  : priceK <= 80
                                    ? 'Món ăn 40-80k: 1 lần/tuần'
                                    : 'Món ăn >80k: 1 lần/tháng'
                                : priceK <= 40
                                  ? 'Nước uống ≤40k: 2 lần/tuần'
                                  : priceK <= 80
                                    ? 'Nước uống 40-80k: 1 lần/2 tuần'
                                    : 'Nước uống >80k: 1-2 lần/năm'}
                              )
                            </span>
                          </p>
                        </div>
                      );
                    })()}
                  </div>

                  {/* 4C. HẠNG MỤC RIÊNG CHO QUÁN ĂN vs QUÁN NƯỚC */}
                  {formCategory === 'food' ? (
                    <>
                      {/* Chất lượng & Khẩu phần (25%) */}
                      <div className="space-y-2 pt-3.5 border-t border-[var(--border-card)]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[var(--text-primary)] min-w-0 leading-snug">
                            Chất lượng & Khẩu phần{' '}
                            <span className="font-mono text-[10px] font-medium text-[var(--text-muted)]">
                              (25%)
                            </span>
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md theme-surface-elevated text-[var(--text-secondary)] whitespace-nowrap">
                              {getSliderReaction(foodQuality)}
                            </span>
                            <motion.span
                              key={foodQuality}
                              initial={{ scale: 1.3 }}
                              animate={{ scale: 1 }}
                              className="font-mono text-sm font-extrabold text-[var(--text-primary)]"
                            >
                              {foodQuality.toFixed(1)}
                            </motion.span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="0.5"
                          value={foodQuality}
                          onChange={(e) =>
                            setFoodQuality(parseFloat(e.target.value))
                          }
                          className="precision-slider"
                        />
                      </div>

                      {/* Độ sạch sẽ & Vệ sinh (15%) */}
                      <div className="space-y-2 pt-3.5 border-t border-[var(--border-card)]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[var(--text-primary)] min-w-0 leading-snug">
                            Độ sạch sẽ & Vệ sinh{' '}
                            <span className="font-mono text-[10px] font-medium text-[var(--text-muted)]">
                              (15%)
                            </span>
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md theme-surface-elevated text-[var(--text-secondary)] whitespace-nowrap">
                              {getSliderReaction(cleanliness)}
                            </span>
                            <motion.span
                              key={cleanliness}
                              initial={{ scale: 1.3 }}
                              animate={{ scale: 1 }}
                              className="font-mono text-sm font-extrabold text-[var(--text-primary)]"
                            >
                              {cleanliness.toFixed(1)}
                            </motion.span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="0.5"
                          value={cleanliness}
                          onChange={(e) =>
                            setCleanliness(parseFloat(e.target.value))
                          }
                          className="precision-slider"
                        />
                      </div>

                      {/* Không gian quán ăn / chỗ ngồi (5% cho vỉa hè, 15% cho quán ngồi) */}
                      <div className="space-y-2 pt-3.5 border-t border-[var(--border-card)]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[var(--text-primary)] min-w-0 leading-snug">
                            {foodType === 'streetfood'
                              ? 'Chỗ ngồi vỉa hè'
                              : 'Không gian quán'}{' '}
                            <span className="font-mono text-[10px] font-medium text-[var(--text-muted)]">
                              ({foodType === 'streetfood' ? '5%' : '15%'})
                            </span>
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md theme-surface-elevated text-[var(--text-secondary)] whitespace-nowrap">
                              {getSliderReaction(space)}
                            </span>
                            <motion.span
                              key={space}
                              initial={{ scale: 1.3 }}
                              animate={{ scale: 1 }}
                              className="font-mono text-sm font-extrabold text-[var(--text-primary)]"
                            >
                              {space.toFixed(1)}
                            </motion.span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="0.5"
                          value={space}
                          onChange={(e) => setSpace(parseFloat(e.target.value))}
                          className="precision-slider"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Thể tích đồ uống (20%) */}
                      <div className="space-y-2 pt-3.5 border-t border-[var(--border-card)]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[var(--text-primary)]">
                            Thể tích đồ uống{' '}
                            <span className="font-mono text-[10px] font-medium text-[var(--text-muted)]">
                              (20%)
                            </span>
                          </span>
                          <span className="font-mono text-xs font-bold text-[var(--accent)] shrink-0 whitespace-nowrap">
                            {
                              VOLUME_OPTIONS.find((v) => v.key === volumeKey)
                                ?.label
                            }{' '}
                            ({liveCalc.volumeScore}đ)
                          </span>
                        </div>

                        <div className="grid grid-cols-5 gap-1.5">
                          {VOLUME_OPTIONS.map((v) => {
                            const active = volumeKey === v.key;
                            return (
                              <motion.button
                                key={v.key}
                                type="button"
                                whileTap={{ scale: 0.92 }}
                                onClick={() => setVolumeKey(v.key)}
                                className={cn(
                                  'py-2 px-1 rounded-xl text-center transition-all cursor-pointer border',
                                  active
                                    ? 'bg-[var(--accent-soft)] border-[var(--border-active)] text-[var(--accent)] font-extrabold'
                                    : 'theme-surface-elevated text-[var(--text-secondary)]'
                                )}
                              >
                                <div className="text-[11px] leading-tight">
                                  {v.label}
                                </div>
                                <div className="font-mono text-[10px] opacity-75 mt-0.5">
                                  {v.score}đ
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Không gian quán nước (Chỉ hiện khi Ngồi lại) */}
                      <AutoHeight isOpen={mode === 'dinein'}>
                        <div className="space-y-2 pt-3.5 border-t border-[var(--border-card)]">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[var(--text-primary)] min-w-0 leading-snug">
                              Không gian quán{' '}
                              <span className="font-mono text-[10px] font-medium text-[var(--text-muted)]">
                                (20%)
                              </span>
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] whitespace-nowrap">
                                {getSliderReaction(space)}
                              </span>
                              <motion.span
                                key={space}
                                initial={{ scale: 1.3 }}
                                animate={{ scale: 1 }}
                                className="font-mono text-sm font-extrabold text-[var(--accent)]"
                              >
                                {space.toFixed(1)}
                              </motion.span>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            step="0.5"
                            value={space}
                            onChange={(e) =>
                              setSpace(parseFloat(e.target.value))
                            }
                            className="precision-slider"
                          />
                        </div>
                      </AutoHeight>

                      {/* Chất liệu vỏ ly (5%) */}
                      <div className="space-y-2 pt-3.5 border-t border-[var(--border-card)]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[var(--text-primary)] min-w-0 leading-snug">
                            Chất liệu vỏ ly{' '}
                            <span className="font-mono text-[10px] font-medium text-[var(--text-muted)]">
                              (5%)
                            </span>
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md theme-surface-elevated text-[var(--text-secondary)] whitespace-nowrap">
                              {getSliderReaction(packaging)}
                            </span>
                            <motion.span
                              key={packaging}
                              initial={{ scale: 1.3 }}
                              animate={{ scale: 1 }}
                              className="font-mono text-sm font-extrabold text-[var(--text-primary)]"
                            >
                              {packaging.toFixed(1)}
                            </motion.span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="0.5"
                          value={packaging}
                          onChange={(e) =>
                            setPackaging(parseFloat(e.target.value))
                          }
                          className="precision-slider"
                        />
                      </div>
                    </>
                  )}

                  {/* Ghi chú */}
                  <div className="pt-3.5 border-t border-[var(--border-card)]">
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={
                        formCategory === 'food'
                          ? 'Ghi chú (VD: nước lèo ngọt thanh, chả cá dai ngon)...'
                          : 'Ghi chú ngắn (VD: vị trà đậm, hơi ít đá)...'
                      }
                      className="w-full h-10.5 px-3.5 rounded-xl theme-surface-elevated text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--border-active)]"
                    />
                  </div>
                </Shine>

                {/* 5. FINAL SUMMARY CARD + SUBMIT BUTTON */}
                <Shine className="rounded-2xl theme-surface-card border-[var(--border-active)] p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <CategoryScoreBadge
                        category={formCategory}
                        score={liveCalc.total}
                        size="md"
                      />
                      <div className="space-y-1">
                        <span className="text-[11px] text-[var(--text-secondary)] block">
                          Xếp hạng tổng kết & Số sao
                        </span>
                        <span className="text-xs font-extrabold text-[var(--text-primary)] block leading-snug">
                          {liveTier.rankLabel}
                        </span>
                        <StarRatingBadge
                          score10={liveCalc.total}
                          showFiveScale
                        />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-0.5 shrink-0">
                      <CountingNumber
                        number={liveCalc.total}
                        decimalPlaces={2}
                        className="font-mono text-2xl font-extrabold text-[var(--accent)]"
                      />
                      <span className="font-mono text-xs text-[var(--text-muted)]">
                        /10
                      </span>
                    </div>
                  </div>

                  <RippleButton
                    type="submit"
                    className="w-full h-11 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Flame className="w-4 h-4" strokeWidth={2.5} />
                    <span>
                      {editingId
                        ? 'Lưu cập nhật quán'
                        : formCategory === 'food'
                          ? 'Lưu đánh giá Quán ăn & Ghim Bản đồ'
                          : 'Lưu đánh giá Quán nước & Ghim Bản đồ'}
                    </span>
                  </RippleButton>
                </Shine>
              </form>
            </MotionEffect>
          )}

          {/* ================================================================
           * TAB 4: THỐNG KÊ & SAO LƯU DỮ LIỆU
           * ============================================================== */}
          {activeTab === 'insights' && (
            <MotionEffect key="tab-insights" className="space-y-3.5">
              {/* Summary Metrics */}
              <div className="grid grid-cols-3 gap-2.5">
                <Shine className="rounded-2xl theme-surface-card p-3.5">
                  <span className="text-[11px] font-medium text-[var(--text-muted)]">
                    Tổng số quán
                  </span>
                  <div className="mt-1">
                    <CountingNumber
                      number={reviews.length}
                      decimalPlaces={0}
                      className="font-mono text-2xl font-extrabold text-[var(--text-primary)]"
                    />
                  </div>
                  <span className="text-[10px] text-[var(--text-secondary)] block mt-0.5">
                    🥤 {reviews.filter((x) => x.category === 'drink').length} •
                    🍜 {reviews.filter((x) => x.category === 'food').length}
                  </span>
                </Shine>
                <Shine className="rounded-2xl theme-surface-card p-3.5">
                  <span className="text-[11px] font-medium text-[var(--text-muted)]">
                    Điểm TB
                  </span>
                  <div className="mt-1">
                    <CountingNumber
                      number={
                        reviews.length
                          ? reviews.reduce((s, r) => s + r.totalScore, 0) /
                            reviews.length
                          : 0
                      }
                      decimalPlaces={1}
                      className="font-mono text-2xl font-extrabold text-[var(--accent)]"
                    />
                  </div>
                  <span className="text-[10px] text-amber-400 font-mono font-bold block mt-0.5">
                    ★{' '}
                    {reviews.length
                      ? scoreToStars(
                          reviews.reduce((s, r) => s + r.totalScore, 0) /
                            reviews.length
                        ).toFixed(1)
                      : '0.0'}{' '}
                    / 5.0
                  </span>
                </Shine>
                <Shine className="rounded-2xl theme-surface-card p-3.5">
                  <span className="text-[11px] font-medium text-[var(--text-muted)]">
                    Giá TB
                  </span>
                  <div className="font-mono text-2xl font-extrabold text-[var(--text-primary)] mt-1 flex items-baseline">
                    <CountingNumber
                      number={
                        reviews.length
                          ? Math.round(
                              reviews.reduce((s, r) => s + r.priceK, 0) /
                                reviews.length
                            )
                          : 0
                      }
                      decimalPlaces={0}
                    />
                    <span>k</span>
                  </div>
                  <span className="text-[10px] text-[var(--text-secondary)] block mt-0.5">
                    Mức chi hợp lý
                  </span>
                </Shine>
              </div>

              {/* Area Breakdown */}
              <Shine className="rounded-2xl theme-surface-card p-4 space-y-3">
                <h3 className="text-xs font-bold text-[var(--text-primary)]">
                  Thống kê theo Phường & Tuyến đường
                </h3>
                <div className="space-y-2.5">
                  {Array.from(
                    new Set(
                      reviews.map((r) => `Đường ${r.street} • P. ${r.ward}`)
                    )
                  ).map((label, idx) => {
                    const items = reviews.filter(
                      (r) => `Đường ${r.street} • P. ${r.ward}` === label
                    );
                    const avg =
                      items.reduce((s, x) => s + x.totalScore, 0) /
                      items.length;
                    return (
                      <div
                        key={label}
                        className="space-y-1.5 py-2 border-b border-[var(--border-card)] last:border-none text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[var(--text-secondary)] font-medium leading-snug">
                            {label}
                          </span>
                          <div className="flex items-center gap-2 font-mono shrink-0">
                            <span className="text-[var(--text-muted)]">
                              {items.length} quán
                            </span>
                            <span className="text-amber-400 font-bold">
                              ★{scoreToStars(avg).toFixed(1)}
                            </span>
                            <span className="text-[var(--accent)] font-bold">
                              {avg.toFixed(1)}đ
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full rounded-full theme-surface-elevated overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, avg * 10)}%` }}
                            transition={{
                              type: 'spring',
                              stiffness: 220,
                              damping: 26,
                              delay: idx * 0.06,
                            }}
                            className="h-full rounded-full bg-[var(--accent)]"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Shine>

              {/* Backup & Restore */}
              <Shine className="rounded-2xl theme-surface-card p-4 space-y-3">
                <h3 className="text-xs font-bold text-[var(--text-primary)]">
                  Sao lưu & Khôi phục dữ liệu cá nhân
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <RippleButton
                    type="button"
                    onClick={handleExportJson}
                    className="h-10 rounded-xl theme-surface-elevated text-xs font-bold flex items-center justify-center gap-1.5 text-[var(--text-primary)]"
                  >
                    <Download className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Xuất file JSON</span>
                  </RippleButton>

                  <label className="h-10 rounded-xl theme-surface-elevated text-xs font-bold flex items-center justify-center gap-1.5 text-[var(--text-primary)] cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Khôi phục JSON</span>
                    <input
                      type="file"
                      accept="application/json"
                      onChange={handleImportJson}
                      className="hidden"
                    />
                  </label>
                </div>
              </Shine>
            </MotionEffect>
          )}
        </div>
      </main>

      {/* ====================================================================
       * 3. FLOATING PILL BOTTOM NAVIGATION DOCK (ẨN KHI MỞ BÀN PHÍM / ĐANG GÕ)
       * ================================================================== */}
      {!isTyping && !isLocPickerOpen && (
        <nav className="fixed bottom-5 inset-x-0 z-30 px-2.5 pointer-events-none">
          <div className="max-w-[400px] mx-auto rounded-2xl theme-floating-dock p-1.5 grid grid-cols-4 gap-1 pointer-events-auto">
            {(
              [
                {
                  id: 'list',
                  label: 'Quán xá',
                  icon: <MapPin className="w-3.5 h-3.5 shrink-0" />,
                },
                {
                  id: 'map',
                  label: 'Bản đồ',
                  icon: <MapIcon className="w-3.5 h-3.5 shrink-0" />,
                },
                {
                  id: 'form',
                  label: editingId ? 'Đang sửa' : 'Chấm điểm',
                  icon: <Plus className="w-3.5 h-3.5 shrink-0" />,
                },
                {
                  id: 'insights',
                  label: 'Thống kê',
                  icon: <BarChart3 className="w-3.5 h-3.5 shrink-0" />,
                },
              ] as const
            ).map((tab) => {
              const active = activeTab === tab.id;
              return (
                <RippleButton
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'h-10 px-1 rounded-xl flex items-center justify-center gap-1 text-[11px] whitespace-nowrap transition-all',
                    active
                      ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-extrabold shadow-sm'
                      : 'text-[var(--text-secondary)] font-medium hover:text-[var(--text-primary)]'
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </RippleButton>
              );
            })}
          </div>
        </nav>
      )}

      {/* ====================================================================
       * 4. BỘ CHỌN ĐỊA LÝ HÀNH CHÍNH VIỆT NAM CHÍNH THỨC (34 TỈNH/THÀNH -> PHƯỜNG -> ĐƯỜNG)
       * ================================================================== */}
      <AnimatePresence>
        {isLocPickerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setIsLocPickerOpen(false)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[440px] max-h-[85%] rounded-t-3xl sm:rounded-3xl theme-surface-card p-4 flex flex-col gap-2.5 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
                    Dữ liệu Hành chính Việt Nam Mới Nhất (34 Tỉnh/TP)
                  </h3>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {currentProvinceInfo.mergedFrom}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLocPickerOpen(false)}
                  className="p-1.5 rounded-xl theme-surface-elevated text-[var(--text-secondary)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step Switcher */}
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl theme-surface-elevated text-xs">
                {(
                  [
                    {
                      k: 'city',
                      t: `1. Tỉnh (${VIETNAM_34_PROVINCE_NAMES.length})`,
                    },
                    {
                      k: 'ward',
                      t: `2. Phường (${wardOptionsForCurrentCity.length})`,
                    },
                    {
                      k: 'street',
                      t: `3. Đường (${streetOptionsForCurrentCityAndWard.length})`,
                    },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.k}
                    type="button"
                    onClick={() => {
                      setLocStep(s.k);
                      setLocSearch('');
                    }}
                    className={cn(
                      'py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap',
                      locStep === s.k
                        ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-extrabold'
                        : 'text-[var(--text-muted)]'
                    )}
                  >
                    {s.t}
                  </button>
                ))}
              </div>

              {/* Search inside current step */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                <input
                  type="text"
                  value={locSearch}
                  onChange={(e) => setLocSearch(e.target.value)}
                  placeholder={
                    locStep === 'city'
                      ? 'Tìm nhanh trong 34 Tỉnh / Thành phố...'
                      : locStep === 'ward'
                        ? `Tìm trong ${wardOptionsForCurrentCity.length} Phường / Xã tại ${city}...`
                        : `Tìm trong ${streetOptionsForCurrentCityAndWard.length} Đường / Phố tại P. ${ward}...`
                  }
                  className="w-full h-9 pl-8 pr-3 rounded-xl theme-surface-elevated text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--border-active)]"
                />
              </div>

              {/* Sync status for OpenStreetMap streets */}
              {locStep === 'street' && (
                <div className="flex items-center justify-between px-1 text-[10px] text-[var(--text-secondary)]">
                  <span>
                    Đã tích hợp sẵn đường phố của <b>P. {ward}</b> ({city})
                  </span>
                  {isSyncingOsm && (
                    <span className="inline-flex items-center gap-1 text-[var(--accent)] font-mono">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Đang tải thêm từ OSM...
                    </span>
                  )}
                </div>
              )}

              {/* Scrollable Options Grid */}
              <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-2 gap-1.5 py-1 pr-0.5">
                {locStep === 'city' &&
                  VIETNAM_34_PROVINCES_DATA.filter(
                    (c) =>
                      c.name.toLowerCase().includes(locSearch.toLowerCase()) ||
                      c.mergedFrom
                        .toLowerCase()
                        .includes(locSearch.toLowerCase())
                  ).map((c) => {
                    const active = city === c.name;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => {
                          setCity(c.name);
                          const defaultWards = getWardsForCity(c.name);
                          const nextWard = defaultWards[0] || 'Trung Tâm';
                          setWard(nextWard);
                          const defaultStreets = getStreetsForCityAndWard(
                            c.name,
                            nextWard
                          );
                          setStreet(defaultStreets[0] || 'Trần Phú');
                          setLocStep('ward');
                          setLocSearch('');
                        }}
                        className={cn(
                          'px-3 py-2 rounded-xl text-left transition-all cursor-pointer border',
                          active
                            ? 'bg-[var(--accent-soft)] border-[var(--border-active)] text-[var(--accent)] font-bold'
                            : 'theme-surface-elevated text-[var(--text-secondary)]'
                        )}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>{c.name}</span>
                          {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </div>
                        <span className="text-[9px] text-[var(--text-muted)] block truncate mt-0.5">
                          {c.mergedFrom}
                        </span>
                      </button>
                    );
                  })}

                {locStep === 'ward' &&
                  wardOptionsForCurrentCity
                    .filter((w) =>
                      w.toLowerCase().includes(locSearch.toLowerCase())
                    )
                    .map((w) => {
                      const active = ward === w;
                      return (
                        <button
                          key={w}
                          type="button"
                          onClick={() => {
                            setWard(w);
                            const nextStreets = getStreetsForCityAndWard(
                              city,
                              w
                            );
                            if (nextStreets.length > 0) {
                              setStreet(nextStreets[0]);
                            }
                            setLocStep('street');
                            setLocSearch('');
                          }}
                          className={cn(
                            'px-3 py-2 rounded-xl text-xs text-left transition-all cursor-pointer flex items-center justify-between border',
                            active
                              ? 'bg-[var(--accent-soft)] border-[var(--border-active)] text-[var(--accent)] font-bold'
                              : 'theme-surface-elevated text-[var(--text-secondary)]'
                          )}
                        >
                          <span>
                            {w.startsWith('Xã ') || w.startsWith('Đặc khu')
                              ? w
                              : `P. ${w}`}
                          </span>
                          {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      );
                    })}

                {locStep === 'street' &&
                  streetOptionsForCurrentCityAndWard
                    .filter((s) =>
                      s.toLowerCase().includes(locSearch.toLowerCase())
                    )
                    .map((s) => {
                      const active = street === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setStreet(s);
                            setIsLocPickerOpen(false);
                          }}
                          className={cn(
                            'px-3 py-2 rounded-xl text-xs text-left transition-all cursor-pointer flex items-center justify-between border',
                            active
                              ? 'bg-[var(--accent-soft)] border-[var(--border-active)] text-[var(--accent)] font-bold'
                              : 'theme-surface-elevated text-[var(--text-secondary)]'
                          )}
                        >
                          <span>Đường {s}</span>
                          {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      );
                    })}
              </div>

              {/* Optional Custom Addition if a tiny alley isn't listed */}
              {locStep !== 'city' && (
                <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-card)]">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder={
                      locStep === 'ward'
                        ? 'Hoặc thêm Phường/Xã khác...'
                        : 'Hoặc thêm tên Đường/Kiệt nhỏ khác...'
                    }
                    className="flex-1 h-9 px-3 rounded-xl theme-surface-elevated text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
                  />
                  <RippleButton
                    type="button"
                    onClick={() => {
                      const val = customInput.trim();
                      if (!val) return;
                      if (locStep === 'ward') {
                        setWard(val.replace(/^Phường\s+/i, ''));
                        setCustomInput('');
                        setLocStep('street');
                      } else {
                        setStreet(val.replace(/^Đường\s+/i, ''));
                        setCustomInput('');
                        setIsLocPickerOpen(false);
                      }
                    }}
                    className="h-9 px-3.5 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-extrabold shrink-0"
                  >
                    Chọn
                  </RippleButton>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================================
       * 5. MODAL CÔNG THỨC TÍNH ĐIỂM (QUÁN NƯỚC & QUÁN ĂN)
       * ================================================================== */}
      <AnimatePresence>
        {showFormulaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setShowFormulaModal(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[410px] max-h-[85vh] overflow-y-auto rounded-3xl theme-surface-card p-5 space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
                  Hệ thống Công thức Chấm điểm Chuẩn hóa
                </h3>
                <button
                  type="button"
                  onClick={() => setShowFormulaModal(false)}
                  className="p-1.5 rounded-xl theme-surface-elevated text-[var(--text-secondary)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-[var(--text-secondary)] leading-relaxed">
                <div className="p-3 rounded-xl theme-surface-elevated space-y-1">
                  <div className="font-bold text-[var(--accent)]">
                    🥤 1. Quán nước • Take-away (Mang đi)
                  </div>
                  <p className="font-mono text-[11px]">
                    Tổng = Vị (50%) + Giá (25%) + Thể tích (20%) + Vỏ ly (5%)
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Mốc chuẩn quán <b>Nốt</b> (Phan Thanh, Đà Nẵng): Vị 7×0.5 +
                    Giá 31k (7đ×0.25) + Lượng Ít (4đ×0.2) + Vỏ ly 9×0.05 ={' '}
                    <b className="text-[var(--accent)]">6.50 / 10 (★3.3)</b>.
                  </p>
                </div>

                <div className="p-3 rounded-xl theme-surface-elevated space-y-1">
                  <div className="font-bold text-[var(--text-primary)]">
                    🥤 2. Quán nước • Ngồi lại quán (Dine-in)
                  </div>
                  <p className="font-mono text-[11px]">
                    Tổng = Vị (35%) + Không gian (20%) + Giá (20%) + Thể tích
                    (20%) + Vỏ ly (5%)
                  </p>
                </div>

                <div className="p-3 rounded-xl theme-surface-elevated space-y-1 border border-orange-500/30">
                  <div className="font-bold text-orange-400">
                    🍜 3. Quán ăn • Vỉa hè / Bình dân
                  </div>
                  <p className="font-mono text-[11px]">
                    Tổng = Độ ngon (40%) + Chất lượng đồ ăn (25%) + Sạch sẽ
                    (15%) + Giá (15%) + Không gian (5%)
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Khung giá vỉa hè: ≤25k (10đ) • 26-35k (8.5đ) • 36-50k (7đ).
                  </p>
                </div>

                <div className="p-3 rounded-xl theme-surface-elevated space-y-1 border border-orange-500/30">
                  <div className="font-bold text-orange-400">
                    🍜 4. Quán ăn • Quán ngồi / Nhà hàng
                  </div>
                  <p className="font-mono text-[11px]">
                    Tổng = Độ ngon (35%) + Chất lượng đồ ăn (25%) + Sạch sẽ
                    (15%) + Không gian (15%) + Giá (10%)
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Quy đổi Sao bản đồ: <b>Số Sao (★) = Điểm hệ 10 ÷ 2</b> (tối
                    đa 5.0★).
                  </p>
                </div>

                <div className="p-3 rounded-xl theme-surface-elevated space-y-1.5 border border-emerald-500/30">
                  <div className="font-bold text-emerald-400">
                    📅 5. Tần suất Thưởng thức & Chu kỳ Ngày 5
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <p>
                      • <b>Món ăn:</b> ≤40k: <b>2 lần/tuần</b> • 40-80k: <b>1 lần/tuần</b> • &gt;80k: <b>1 lần/tháng</b>.
                    </p>
                    <p>
                      • <b>Nước uống:</b> ≤40k: <b>2 lần/tuần</b> • 40-80k: <b>1 lần/2 tuần</b> • &gt;80k: <b>1–2 lần/năm</b>.
                    </p>
                    <p className="text-[10.5px] text-[var(--text-muted)]">
                      * Chu kỳ tháng bắt đầu từ <b>ngày 5 hằng tháng</b> (05/MM → 04/MM+1), tự động reset số lượt đã ghé.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================================
       * 6. VÒNG QUAY QUYẾT ĐỊNH THÔNG MINH: "HÔM NAY ĂN / UỐNG GÌ?"
       * ================================================================== */}
      <SmartSpinModal
        isOpen={showSpinModal}
        onClose={() => setShowSpinModal(false)}
        items={reviews}
        onSelectShop={(item) => {
          setExpandedCardId(item.id);
          setActiveTab('list');
        }}
        onLogVisit={handleLogVisit}
        onOpenDirections={handleOpenDirectionsExternal}
      />

      {/* ====================================================================
       * 7. MODAL CHẤM TỌA ĐỘ GHIM TRỰC TIẾP TRÊN BẢN ĐỒ 2D
       * ================================================================== */}
      <MapPinPickerModal
        isOpen={showPinPickerModal}
        onClose={() => setShowPinPickerModal(false)}
        initialCoords={customCoords || resolveCoordinates(city, ward, street, name)}
        initialCity={city}
        initialWard={ward}
        initialStreet={street}
        shopName={name}
        theme={theme}
        onConfirmPin={(c) => {
          setCustomCoords({ lat: c.lat, lng: c.lng });
          if (c.city) setCity(c.city);
          if (c.ward) setWard(c.ward);
          if (c.street) setStreet(c.street);
          showToast(
            `Đã ghim tọa độ 2D (${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}) vào biểu mẫu!`
          );
        }}
      />

      {/* ====================================================================
       * 8. TOAST NOTIFICATION
       * ================================================================== */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-extrabold shadow-lg flex items-center gap-1.5 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
