import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Coffee,
  MapPin,
  Plus,
  SlidersHorizontal,
  Download,
  Calculator,
  ShoppingBag,
  Armchair,
  Search,
  RotateCcw,
  Trash2,
  Pencil,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Ban,
  ChevronRight,
  CupSoda,
  Layers,
  Banknote,
  Scale,
  X,
  ArrowUpDown,
} from 'lucide-react';
import {
  CountingNumber,
  LiquidButton,
  RippleButton,
  MotionSegmented,
  AnimatedProgress,
  AutoHeight,
  AmbientGlowBackground,
  cn,
} from './components/animate-ui/primitives';

/* ============================================================================
 * DATA TYPES & SCORING FORMULA ENGINE
 * ========================================================================== */
export type ExperienceMode = 'takeaway' | 'dinein';
export type VolumeKey = 'very_little' | 'little' | 'medium' | 'much' | 'full';

export interface DrinkReview {
  id: string;
  name: string;
  city: string;
  ward: string;
  street: string;
  drink: string;
  mode: ExperienceMode;
  priceK: number;
  priceBracket: string;
  taste: number;
  packaging: number;
  volumeKey: VolumeKey;
  volumeScore: number;
  space: number | null;
  totalScore: number;
  verdict: string;
  note: string;
  createdAt: string;
}

const STORAGE_KEY = 'drink_reviews_a56_v1';

const VOLUME_OPTIONS: {
  key: VolumeKey;
  label: string;
  sub: string;
  score: number;
}[] = [
  { key: 'very_little', label: 'Rất ít', sub: '2.0đ', score: 2 },
  { key: 'little', label: 'Ít', sub: '4.0đ', score: 4 },
  { key: 'medium', label: 'Vừa', sub: '7.0đ', score: 7 },
  { key: 'much', label: 'Nhiều', sub: '9.0đ', score: 9 },
  { key: 'full', label: 'Đầy ắp', sub: '10đ', score: 10 },
];

const PRICE_PRESETS = [
  { label: '< 20k', value: 18 },
  { label: '20–29k', value: 25 },
  { label: '30–39k', value: 31 },
  { label: '40–49k', value: 45 },
  { label: '50–65k', value: 55 },
  { label: '> 65k', value: 75 },
];

const INITIAL_REVIEWS: DrinkReview[] = [
  {
    id: 'not-phan-thanh-dn',
    name: 'Nốt',
    city: 'Đà Nẵng',
    ward: 'Thạc Gián',
    street: 'Phan Thanh',
    drink: 'Đồ uống mang đi (Khung 30k – 39k)',
    mode: 'takeaway',
    priceK: 31,
    priceBracket: '30k – 39k',
    taste: 7,
    packaging: 9,
    volumeKey: 'little',
    volumeScore: 4,
    space: null,
    totalScore: 6.5,
    verdict: 'Uống cho biết - Không ưu tiên',
    note: 'Chất liệu vỏ ly rất xịn (9/10), hương vị khá (7/10) nhưng lượng đồ uống ít so với mức giá 31k.',
    createdAt: '2026-10-26',
  },
];

export function getPriceScore(priceK: number, mode: ExperienceMode) {
  if (mode === 'takeaway') {
    if (priceK < 20) return { score: 10.0, bracket: 'Dưới 20k' };
    if (priceK < 30) return { score: 8.5, bracket: '20k – 29k' };
    if (priceK < 40) return { score: 7.0, bracket: '30k – 39k' };
    if (priceK < 50) return { score: 5.0, bracket: '40k – 49k' };
    if (priceK <= 65) return { score: 3.0, bracket: '50k – 65k' };
    return { score: 1.5, bracket: 'Trên 65k' };
  } else {
    if (priceK < 20) return { score: 10.0, bracket: 'Dưới 20k' };
    if (priceK < 30) return { score: 9.5, bracket: '20k – 29k' };
    if (priceK < 40) return { score: 8.5, bracket: '30k – 39k' };
    if (priceK < 50) return { score: 7.5, bracket: '40k – 49k' };
    if (priceK <= 65) return { score: 6.0, bracket: '50k – 65k' };
    return { score: 4.0, bracket: 'Trên 65k' };
  }
}

export function getTierMeta(score: number) {
  if (score >= 8.5) {
    return {
      tier: 'TIER S',
      text: 'Quán Ruột • Ưu tiên số 1',
      colorClass: 'text-emerald-400',
      badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
      barClass: 'bg-emerald-400',
      Icon: Sparkles,
    };
  }
  if (score >= 7.5) {
    return {
      tier: 'TIER A',
      text: 'Đáng uống lại thường xuyên',
      colorClass: 'text-sky-400',
      badgeClass: 'bg-sky-500/10 text-sky-300 border-sky-500/25',
      barClass: 'bg-sky-400',
      Icon: CheckCircle2,
    };
  }
  if (score >= 6.8) {
    return {
      tier: 'TIER B',
      text: 'Ổn • Tiện đường thì ghé',
      colorClass: 'text-amber-400',
      badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
      barClass: 'bg-amber-400',
      Icon: Coffee,
    };
  }
  if (score >= 5.5) {
    return {
      tier: 'TIER C',
      text: 'Uống cho biết • Không ưu tiên',
      colorClass: 'text-orange-400',
      badgeClass: 'bg-orange-500/10 text-orange-300 border-orange-500/25',
      barClass: 'bg-orange-400',
      Icon: AlertCircle,
    };
  }
  return {
    tier: 'TIER D',
    text: 'Không quay lại',
    colorClass: 'text-rose-400',
    badgeClass: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
    barClass: 'bg-rose-400',
    Icon: Ban,
  };
}

export function calculateScore(params: {
  mode: ExperienceMode;
  taste: number;
  priceK: number;
  volumeScore: number;
  packaging: number;
  space: number;
}) {
  const { mode, taste, priceK, volumeScore, packaging, space } = params;
  const priceInfo = getPriceScore(priceK, mode);

  if (mode === 'takeaway') {
    const wTaste = taste * 0.5;
    const wPrice = priceInfo.score * 0.25;
    const wVol = volumeScore * 0.2;
    const wPack = packaging * 0.05;
    const total = Math.round((wTaste + wPrice + wVol + wPack) * 100) / 100;
    return {
      total,
      priceScore: priceInfo.score,
      priceBracket: priceInfo.bracket,
      parts: [
        { label: 'Hương vị', weight: '50%', raw: taste, weighted: wTaste },
        { label: `Giá (${priceK}k)`, weight: '25%', raw: priceInfo.score, weighted: wPrice },
        { label: 'Thể tích', weight: '20%', raw: volumeScore, weighted: wVol },
        { label: 'Vỏ ly', weight: '5%', raw: packaging, weighted: wPack },
      ],
    };
  } else {
    const wTaste = taste * 0.35;
    const wPrice = priceInfo.score * 0.2;
    const wVol = volumeScore * 0.2;
    const wSpace = space * 0.2;
    const wPack = packaging * 0.05;
    const total = Math.round((wTaste + wPrice + wVol + wSpace + wPack) * 100) / 100;
    return {
      total,
      priceScore: priceInfo.score,
      priceBracket: priceInfo.bracket,
      parts: [
        { label: 'Hương vị', weight: '35%', raw: taste, weighted: wTaste },
        { label: `Giá (${priceK}k)`, weight: '20%', raw: priceInfo.score, weighted: wPrice },
        { label: 'Thể tích', weight: '20%', raw: volumeScore, weighted: wVol },
        { label: 'Không gian', weight: '20%', raw: space, weighted: wSpace },
        { label: 'Vỏ ly', weight: '5%', raw: packaging, weighted: wPack },
      ],
    };
  }
}

/* ============================================================================
 * MAIN APPLICATION COMPONENT
 * ========================================================================== */
export default function App() {
  const [reviews, setReviews] = useState<DrinkReview[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_REVIEWS));
    return INITIAL_REVIEWS;
  });

  const [activeTab, setActiveTab] = useState<'directory' | 'evaluate'>('directory');
  const [isFormulaOpen, setIsFormulaOpen] = useState(false);

  // 3-Tier Geo Filters (Tỉnh/Thành -> Phường -> Đường)
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [selectedWard, setSelectedWard] = useState<string>('ALL');
  const [selectedStreet, setSelectedStreet] = useState<string>('ALL');
  const [selectedModeFilter, setSelectedModeFilter] = useState<'ALL' | ExperienceMode>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Evaluation Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [city, setCity] = useState('Đà Nẵng');
  const [ward, setWard] = useState('Thạc Gián');
  const [street, setStreet] = useState('Phan Thanh');
  const [drink, setDrink] = useState('');
  const [mode, setMode] = useState<ExperienceMode>('takeaway');
  const [taste, setTaste] = useState<number>(7.0);
  const [priceK, setPriceK] = useState<number>(31);
  const [volumeKey, setVolumeKey] = useState<VolumeKey>('little');
  const [packaging, setPackaging] = useState<number>(9.0);
  const [space, setSpace] = useState<number>(7.5);
  const [note, setNote] = useState('');

  const saveToStorage = (nextList: DrinkReview[]) => {
    setReviews(nextList);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
  };

  // Cascading Geo Options
  const cities = useMemo(() => {
    return ['ALL', ...Array.from(new Set(reviews.map((r) => r.city))).sort()];
  }, [reviews]);

  const wards = useMemo(() => {
    const base = selectedCity === 'ALL' ? reviews : reviews.filter((r) => r.city === selectedCity);
    return ['ALL', ...Array.from(new Set(base.map((r) => r.ward))).sort()];
  }, [reviews, selectedCity]);

  const streets = useMemo(() => {
    let base = reviews;
    if (selectedCity !== 'ALL') base = base.filter((r) => r.city === selectedCity);
    if (selectedWard !== 'ALL') base = base.filter((r) => r.ward === selectedWard);
    return ['ALL', ...Array.from(new Set(base.map((r) => r.street))).sort()];
  }, [reviews, selectedCity, selectedWard]);

  const filteredReviews = useMemo(() => {
    return reviews
      .filter((r) => {
        if (selectedCity !== 'ALL' && r.city !== selectedCity) return false;
        if (selectedWard !== 'ALL' && r.ward !== selectedWard) return false;
        if (selectedStreet !== 'ALL' && r.street !== selectedStreet) return false;
        if (selectedModeFilter !== 'ALL' && r.mode !== selectedModeFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const hay = `${r.name} ${r.street} ${r.ward} ${r.city} ${r.drink} ${r.note}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.totalScore - a.totalScore);
  }, [reviews, selectedCity, selectedWard, selectedStreet, selectedModeFilter, searchQuery]);

  // Live Score Calculation for Form
  const volumeObj = VOLUME_OPTIONS.find((v) => v.key === volumeKey) ?? VOLUME_OPTIONS[1];
  const liveCalc = useMemo(
    () =>
      calculateScore({
        mode,
        taste,
        priceK,
        volumeScore: volumeObj.score,
        packaging,
        space,
      }),
    [mode, taste, priceK, volumeObj.score, packaging, space]
  );
  const liveTier = getTierMeta(liveCalc.total);

  // Handlers
  const handleSelectCity = (c: string) => {
    setSelectedCity(c);
    setSelectedWard('ALL');
    setSelectedStreet('ALL');
  };

  const handleSelectWard = (w: string) => {
    setSelectedWard(w);
    setSelectedStreet('ALL');
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCity('Đà Nẵng');
    setWard('Thạc Gián');
    setStreet('Phan Thanh');
    setDrink('');
    setMode('takeaway');
    setTaste(7.0);
    setPriceK(31);
    setVolumeKey('little');
    setPackaging(9.0);
    setSpace(7.5);
    setNote('');
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !city.trim() || !ward.trim() || !street.trim()) return;

    const item: DrinkReview = {
      id: editingId || `shop-${Date.now()}`,
      name: name.trim(),
      city: city.trim(),
      ward: ward.trim(),
      street: street.trim(),
      drink: drink.trim() || `Đồ uống (${liveCalc.priceBracket})`,
      mode,
      priceK,
      priceBracket: liveCalc.priceBracket,
      taste,
      packaging,
      volumeKey,
      volumeScore: volumeObj.score,
      space: mode === 'dinein' ? space : null,
      totalScore: liveCalc.total,
      verdict: liveTier.text.replace(' • ', ' - '),
      note: note.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
    };

    if (editingId) {
      saveToStorage(reviews.map((r) => (r.id === editingId ? item : r)));
    } else {
      saveToStorage([item, ...reviews]);
    }

    resetForm();
    setActiveTab('directory');
  };

  const handleEdit = (r: DrinkReview) => {
    setEditingId(r.id);
    setName(r.name);
    setCity(r.city);
    setWard(r.ward);
    setStreet(r.street);
    setDrink(r.drink);
    setMode(r.mode);
    setTaste(r.taste);
    setPriceK(r.priceK);
    setVolumeKey(r.volumeKey || 'little');
    setPackaging(r.packaging);
    setSpace(r.space ?? 7.5);
    setNote(r.note || '');
    setActiveTab('evaluate');
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Xác nhận xóa đánh giá quán nước này?')) return;
    saveToStorage(reviews.filter((r) => r.id !== id));
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(reviews, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `not-drink-reviews-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const avgScore = useMemo(() => {
    if (!filteredReviews.length) return 0;
    return (
      filteredReviews.reduce((acc, item) => acc + item.totalScore, 0) /
      filteredReviews.length
    );
  }, [filteredReviews]);

  const priorityCount = useMemo(
    () => filteredReviews.filter((r) => r.totalScore >= 7.5).length,
    [filteredReviews]
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-50 pb-24 relative selection:bg-amber-500 selection:text-zinc-950">
      <AmbientGlowBackground />

      {/* TOP BAR */}
      <header className="sticky top-0 z-30 bg-[#09090b]/85 backdrop-blur-xl border-b border-white/[0.07]">
        <div className="max-w-[430px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center shadow-inner">
              <CupSoda className="w-5 h-5 text-amber-400" strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[15px] font-bold tracking-tight text-zinc-50">
                  NỐT • Drink Index
                </h1>
                <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  A56
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">
                Hệ thống định lượng & xếp hạng quán nước
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <LiquidButton
              onClick={handleExport}
              title="Sao lưu dữ liệu JSON"
              className="h-9 px-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-zinc-300 hover:text-white flex items-center gap-1.5 text-xs font-medium"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.75} />
              <span>Lưu</span>
            </LiquidButton>

            <LiquidButton
              onClick={() => setIsFormulaOpen(true)}
              className="h-9 px-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 flex items-center gap-1.5 text-xs font-semibold"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.75} />
              <span>Công thức</span>
            </LiquidButton>
          </div>
        </div>
      </header>

      {/* MAIN VIEWPORT (412px–430px optimized for Samsung A56) */}
      <main className="max-w-[430px] mx-auto px-4 pt-4 space-y-4">
        {/* ANIMATE-UI TABS SWITCHER */}
        <MotionSegmented
          layoutId="main-nav-tabs"
          value={activeTab}
          onChange={(v) => {
            if (v === 'directory') resetForm();
            setActiveTab(v);
          }}
          activeHighlightClassName="bg-zinc-800/95 border border-white/[0.1] shadow-md"
          options={[
            {
              value: 'directory',
              label: 'Sổ Tay & Xếp Hạng',
              icon: <Layers className="w-4 h-4 text-amber-400" strokeWidth={1.75} />,
              badge: (
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-950/70 text-zinc-300">
                  {reviews.length}
                </span>
              ),
            },
            {
              value: 'evaluate',
              label: editingId ? 'Cập Nhật Điểm' : 'Chấm Điểm Quán',
              icon: <Plus className="w-4 h-4 text-amber-400" strokeWidth={1.75} />,
            },
          ]}
        />

        <AnimatePresence mode="wait">
          {activeTab === 'directory' ? (
            <motion.section
              key="tab-directory"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="space-y-4"
            >
              {/* SUMMARY METRICS (CountingNumber from animate-ui) */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="rounded-[18px] bg-[#121215] border border-white/[0.07] p-3.5 flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-zinc-400">Tổng số quán</span>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <CountingNumber
                      number={filteredReviews.length}
                      decimalPlaces={0}
                      className="font-mono text-2xl font-bold text-zinc-50"
                    />
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">Quán</span>
                  </div>
                </div>

                <div className="rounded-[18px] bg-[#121215] border border-white/[0.07] p-3.5 flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-zinc-400">Điểm trung bình</span>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <CountingNumber
                      number={avgScore}
                      decimalPlaces={1}
                      className="font-mono text-2xl font-bold text-amber-400"
                    />
                    <span className="text-[10px] font-mono text-zinc-500">/10</span>
                  </div>
                </div>

                <div className="rounded-[18px] bg-[#121215] border border-white/[0.07] p-3.5 flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-zinc-400">Ưu tiên uống lại</span>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <CountingNumber
                      number={priorityCount}
                      decimalPlaces={0}
                      className="font-mono text-2xl font-bold text-emerald-400"
                    />
                    <span className="text-[10px] font-mono text-zinc-500">≥ 7.5đ</span>
                  </div>
                </div>
              </div>

              {/* 3-TIER CASCADING GEO FILTER (NO NATIVE <SELECT> TRUNCATION) */}
              <div className="rounded-[20px] bg-[#121215] border border-white/[0.07] p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.75} />
                    <span className="text-xs font-semibold tracking-tight text-zinc-200">
                      Phân cấp Địa lý (Tỉnh/Thành → Phường → Đường)
                    </span>
                  </div>
                  {(selectedCity !== 'ALL' ||
                    selectedWard !== 'ALL' ||
                    selectedStreet !== 'ALL' ||
                    selectedModeFilter !== 'ALL' ||
                    searchQuery) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCity('ALL');
                        setSelectedWard('ALL');
                        setSelectedStreet('ALL');
                        setSelectedModeFilter('ALL');
                        setSearchQuery('');
                      }}
                      className="flex items-center gap-1 text-[11px] font-medium text-amber-400 hover:text-amber-300 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Đặt lại</span>
                    </button>
                  )}
                </div>

                {/* Tier 1: Tỉnh / Thành phố */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                    <span className="font-mono text-[10px] text-amber-400/90">01</span>
                    <span>Tỉnh / Thành phố</span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                    {cities.map((c) => {
                      const active = selectedCity === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => handleSelectCity(c)}
                          className={cn(
                            'relative px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer',
                            active
                              ? 'text-zinc-950 font-semibold'
                              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-white/[0.05]'
                          )}
                        >
                          {active && (
                            <motion.div
                              layoutId="geo-city-pill"
                              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                              className="absolute inset-0 rounded-xl bg-amber-400 -z-0"
                            />
                          )}
                          <span className="relative z-10">
                            {c === 'ALL' ? 'Tất cả Tỉnh/Thành' : c}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tier 2: Phường */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                    <span className="font-mono text-[10px] text-amber-400/90">02</span>
                    <span>Phường</span>
                    {selectedCity !== 'ALL' && (
                      <span className="text-zinc-500">({selectedCity})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                    {wards.map((w) => {
                      const active = selectedWard === w;
                      return (
                        <button
                          key={w}
                          type="button"
                          onClick={() => handleSelectWard(w)}
                          className={cn(
                            'relative px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer',
                            active
                              ? 'text-zinc-50 font-semibold'
                              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-white/[0.05]'
                          )}
                        >
                          {active && (
                            <motion.div
                              layoutId="geo-ward-pill"
                              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                              className="absolute inset-0 rounded-xl bg-zinc-700 border border-white/15 -z-0"
                            />
                          )}
                          <span className="relative z-10">
                            {w === 'ALL' ? 'Tất cả Phường' : `P. ${w}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tier 3: Đường */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                    <span className="font-mono text-[10px] text-amber-400/90">03</span>
                    <span>Tuyến đường</span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                    {streets.map((s) => {
                      const active = selectedStreet === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSelectedStreet(s)}
                          className={cn(
                            'relative px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer',
                            active
                              ? 'text-amber-300 font-semibold'
                              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-white/[0.05]'
                          )}
                        >
                          {active && (
                            <motion.div
                              layoutId="geo-street-pill"
                              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                              className="absolute inset-0 rounded-xl bg-amber-500/15 border border-amber-500/35 -z-0"
                            />
                          )}
                          <span className="relative z-10">
                            {s === 'ALL' ? 'Tất cả Đường' : `Đường ${s}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Search & Experience Mode Filter */}
                <div className="pt-1 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search
                      className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2"
                      strokeWidth={1.75}
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm tên quán, đường, ghi chú..."
                      className="w-full h-9 pl-8 pr-3 rounded-xl bg-zinc-900 border border-white/[0.07] text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500/50 outline-none transition-colors"
                    />
                  </div>
                  <div className="flex p-0.5 rounded-xl bg-zinc-900 border border-white/[0.07]">
                    {(['ALL', 'takeaway', 'dinein'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSelectedModeFilter(m)}
                        className={cn(
                          'px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer',
                          selectedModeFilter === m
                            ? 'bg-zinc-800 text-zinc-100 font-semibold'
                            : 'text-zinc-400 hover:text-zinc-200'
                        )}
                      >
                        {m === 'ALL' ? 'Tất cả' : m === 'takeaway' ? 'Take-away' : 'Ngồi lại'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* RANKED SHOP CARDS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                    <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.75} />
                    <span>Xếp hạng ưu tiên uống lại (Cao → Thấp)</span>
                  </span>
                </div>

                {filteredReviews.length === 0 ? (
                  <div className="rounded-[20px] bg-[#121215] border border-white/[0.07] p-8 text-center space-y-3">
                    <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-white/10 mx-auto flex items-center justify-center">
                      <Coffee className="w-5 h-5 text-zinc-400" strokeWidth={1.75} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-zinc-200">
                        Không tìm thấy quán phù hợp
                      </p>
                      <p className="text-xs text-zinc-500">
                        Thử đổi bộ lọc Phường/Đường hoặc chấm điểm quán mới.
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredReviews.map((item, idx) => {
                    const tier = getTierMeta(item.totalScore);
                    const TierIcon = tier.Icon;
                    const priceInfo = getPriceScore(item.priceK, item.mode);
                    const volLabel =
                      VOLUME_OPTIONS.find((v) => v.key === item.volumeKey)?.label || 'Ít';

                    return (
                      <motion.article
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                        className="rounded-[20px] bg-[#121215] border border-white/[0.07] p-5 space-y-4 shadow-lg"
                      >
                        {/* Card Header: Rank + Shop Name + Breadcrumb + Total Score */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-300 border border-white/[0.07]">
                                #{idx + 1}
                              </span>
                              <h3 className="text-lg font-bold tracking-tight text-zinc-50 truncate">
                                {item.name}
                              </h3>
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-300 border border-white/[0.06]">
                                {item.mode === 'takeaway' ? (
                                  <>
                                    <ShoppingBag className="w-3 h-3 text-amber-400" />
                                    <span>Take-away</span>
                                  </>
                                ) : (
                                  <>
                                    <Armchair className="w-3 h-3 text-sky-400" />
                                    <span>Ngồi lại</span>
                                  </>
                                )}
                              </span>
                            </div>

                            {/* 3-Tier Location Breadcrumb */}
                            <div className="flex items-center gap-1 text-xs text-zinc-400 flex-wrap">
                              <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" strokeWidth={1.75} />
                              <span>{item.city}</span>
                              <ChevronRight className="w-3 h-3 text-zinc-600" />
                              <span>P. {item.ward}</span>
                              <ChevronRight className="w-3 h-3 text-zinc-600" />
                              <span className="text-zinc-200 font-medium">
                                Đường {item.street}
                              </span>
                            </div>
                          </div>

                          {/* Display Score with CountingNumber */}
                          <div className="text-right shrink-0 bg-zinc-900/90 border border-white/[0.07] rounded-2xl px-3.5 py-2">
                            <div className="flex items-baseline justify-end gap-0.5">
                              <CountingNumber
                                number={item.totalScore}
                                decimalPlaces={1}
                                className={cn('font-mono text-2xl font-extrabold', tier.colorClass)}
                              />
                              <span className="font-mono text-xs text-zinc-500">/10</span>
                            </div>
                            <span className="block font-mono text-[9px] tracking-wider uppercase text-zinc-500 mt-0.5">
                              {tier.tier}
                            </span>
                          </div>
                        </div>

                        {/* Semantic Verdict Pill & Price Tag */}
                        <div className="flex items-center justify-between gap-2 pt-0.5 flex-wrap">
                          <div
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-semibold',
                              tier.badgeClass
                            )}
                          >
                            <TierIcon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                            <span>{tier.text}</span>
                          </div>

                          <div className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-zinc-200 bg-zinc-900 px-3 py-1 rounded-xl border border-white/[0.06]">
                            <Banknote className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.75} />
                            <span>{item.priceK}k</span>
                            <span className="text-zinc-500 font-normal">({item.priceBracket})</span>
                          </div>
                        </div>

                        {/* Animated Progress Bars Breakdown (animate-ui) */}
                        <div className="rounded-2xl bg-zinc-900/60 border border-white/[0.05] p-3.5 space-y-2.5">
                          <AnimatedProgress
                            label="Hương vị"
                            weightLabel={item.mode === 'takeaway' ? '50%' : '35%'}
                            value={item.taste}
                            displayValue={`${item.taste.toFixed(1)} / 10`}
                            accentClass="bg-amber-400"
                          />
                          <AnimatedProgress
                            label={`Quy đổi Giá (${item.priceK}k)`}
                            weightLabel={item.mode === 'takeaway' ? '25%' : '20%'}
                            value={priceInfo.score}
                            displayValue={`${priceInfo.score.toFixed(1)} / 10`}
                            accentClass="bg-emerald-400"
                          />
                          <AnimatedProgress
                            label={`Thể tích (${volLabel})`}
                            weightLabel="20%"
                            value={item.volumeScore}
                            displayValue={`${item.volumeScore.toFixed(1)} / 10`}
                            accentClass={
                              item.volumeScore <= 4 ? 'bg-orange-400' : 'bg-sky-400'
                            }
                          />
                          {item.mode === 'dinein' && item.space !== null && (
                            <AnimatedProgress
                              label="Không gian quán"
                              weightLabel="20%"
                              value={item.space}
                              displayValue={`${item.space.toFixed(1)} / 10`}
                              accentClass="bg-indigo-400"
                            />
                          )}
                          <AnimatedProgress
                            label="Chất liệu vỏ ly"
                            weightLabel="5%"
                            value={item.packaging}
                            displayValue={`${item.packaging.toFixed(1)} / 10`}
                            accentClass="bg-zinc-300"
                          />
                        </div>

                        {/* Review Note & Actions */}
                        {item.note && (
                          <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/40 rounded-xl px-3.5 py-2.5 border-l-2 border-amber-500/60">
                            {item.note}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-white/[0.05]">
                          <span className="font-mono text-[11px] text-zinc-500">
                            Cập nhật: {item.createdAt}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300 border border-white/[0.07] transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
                              <span>Chỉnh sửa</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-xs font-medium text-rose-300 border border-rose-500/20 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                              <span>Xóa</span>
                            </button>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })
                )}
              </div>
            </motion.section>
          ) : (
            /* ================================================================
             * TAB 2: INTERACTIVE EVALUATION ENGINE
             * ============================================================== */
            <motion.section
              key="tab-evaluate"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              <form onSubmit={handleSaveReview} className="space-y-4">
                {/* Block 1: Location Hierarchy */}
                <div className="rounded-[20px] bg-[#121215] border border-white/[0.07] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-400" strokeWidth={1.75} />
                      <h2 className="text-sm font-bold text-zinc-100">
                        Định danh Quán & Tọa độ 3 Cấp
                      </h2>
                    </div>
                    {editingId && (
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300">
                        Đang sửa
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1.5">
                      <label className="block text-xs font-medium text-zinc-300">
                        Tên quán nước *
                      </label>
                      <input
                        required
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="VD: Nốt"
                        className="w-full h-11 px-3.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-zinc-300">
                        1. Tỉnh / Thành phố *
                      </label>
                      <input
                        required
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Đà Nẵng"
                        className="w-full h-10 px-3 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs font-medium text-zinc-100 focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-zinc-300">
                        2. Phường *
                      </label>
                      <input
                        required
                        type="text"
                        value={ward}
                        onChange={(e) => setWard(e.target.value)}
                        placeholder="VD: Thạc Gián"
                        className="w-full h-10 px-3 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs font-medium text-zinc-100 focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div className="col-span-2 space-y-1.5">
                      <label className="block text-xs font-medium text-zinc-300">
                        3. Tên Đường *
                      </label>
                      <input
                        required
                        type="text"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="VD: Phan Thanh"
                        className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs font-medium text-zinc-100 focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div className="col-span-2 space-y-1.5">
                      <label className="block text-xs font-medium text-zinc-400">
                        Món nước đã gọi (Tùy chọn)
                      </label>
                      <input
                        type="text"
                        value={drink}
                        onChange={(e) => setDrink(e.target.value)}
                        placeholder="VD: Trà sữa Ô long / Cà phê muối..."
                        className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Block 2: Experience Mode Switcher (MotionSegmented) */}
                <div className="rounded-[20px] bg-[#121215] border border-white/[0.07] p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-zinc-100">
                      Hình thức Trải nghiệm
                    </h2>
                    <span className="font-mono text-[11px] text-zinc-400">
                      Tự động đổi trọng số
                    </span>
                  </div>

                  <MotionSegmented
                    layoutId="experience-mode-switch"
                    value={mode}
                    onChange={setMode}
                    activeHighlightClassName="bg-amber-500/15 border border-amber-500/40"
                    options={[
                      {
                        value: 'takeaway',
                        label: 'Take-away (Mang đi)',
                        sublabel: 'Vị 50% • Giá 25% • Lượng 20% • Ly 5%',
                        icon: <ShoppingBag className="w-4 h-4 text-amber-400" strokeWidth={1.75} />,
                      },
                      {
                        value: 'dinein',
                        label: 'Ngồi lại quán',
                        sublabel: 'Vị 35% • Giá 20% • Lượng 20% • K.Gian 20%',
                        icon: <Armchair className="w-4 h-4 text-sky-400" strokeWidth={1.75} />,
                      },
                    ]}
                  />
                </div>

                {/* Block 3: Precision Sliders & Segmented Metrics */}
                <div className="rounded-[20px] bg-[#121215] border border-white/[0.07] p-5 space-y-5">
                  {/* Metric 1: Taste */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-100">
                          1. Hương vị đồ uống
                        </span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {mode === 'takeaway' ? '50%' : '35%'}
                        </span>
                      </div>
                      <span className="font-mono text-sm font-bold text-amber-400 tabular-nums">
                        {taste.toFixed(1)} / 10
                      </span>
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
                    <div className="flex justify-between font-mono text-[10px] text-zinc-500">
                      <span>1.0 (Tệ)</span>
                      <span>5.0 (Tạm)</span>
                      <span>7.0 (Khá ngon)</span>
                      <span>10.0 (Đỉnh)</span>
                    </div>
                  </div>

                  {/* Metric 2: Price */}
                  <div className="space-y-3 pt-4 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-100">
                          2. Giá tiền thực tế
                        </span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {mode === 'takeaway' ? '25%' : '20%'}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-semibold text-emerald-400">
                        Quy đổi: {liveCalc.priceScore.toFixed(1)} / 10đ
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="relative w-28 shrink-0">
                        <input
                          type="number"
                          min="5"
                          max="250"
                          value={priceK}
                          onChange={(e) => setPriceK(Number(e.target.value) || 0)}
                          className="w-full h-10 pl-3 pr-9 rounded-xl bg-zinc-900 border border-white/[0.1] font-mono text-sm font-bold text-amber-400 outline-none focus:border-amber-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-zinc-500">
                          .000đ
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 flex-1">
                        {PRICE_PRESETS.map((p) => {
                          const isSelected = liveCalc.priceBracket.includes(
                            p.label.replace('–', ' – ').replace('< ', 'Dưới ').replace('> ', 'Trên ')
                          ) || priceK === p.value;
                          return (
                            <button
                              key={p.label}
                              type="button"
                              onClick={() => setPriceK(p.value)}
                              className={cn(
                                'py-1.5 px-2 rounded-lg font-mono text-[11px] font-medium border transition-colors cursor-pointer',
                                isSelected
                                  ? 'bg-zinc-800 text-amber-300 border-amber-500/40 font-semibold'
                                  : 'bg-zinc-900 text-zinc-400 border-white/[0.05] hover:text-zinc-200'
                              )}
                            >
                              {p.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Metric 3: Volume (20%) */}
                  <div className="space-y-3 pt-4 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-100">
                          3. Thể tích / Lượng đồ uống
                        </span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          20%
                        </span>
                      </div>
                      <span className="font-mono text-xs font-semibold text-zinc-200">
                        {volumeObj.label} ({volumeObj.score.toFixed(1)}/10)
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5">
                      {VOLUME_OPTIONS.map((v) => {
                        const active = volumeKey === v.key;
                        return (
                          <button
                            key={v.key}
                            type="button"
                            onClick={() => setVolumeKey(v.key)}
                            className={cn(
                              'relative py-2.5 px-1 rounded-xl border text-center transition-colors cursor-pointer',
                              active
                                ? 'border-amber-500/50 text-zinc-50 font-semibold'
                                : 'bg-zinc-900 border-white/[0.05] text-zinc-400 hover:text-zinc-200'
                            )}
                          >
                            {active && (
                              <motion.div
                                layoutId="volume-selector-pill"
                                transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                                className="absolute inset-0 rounded-xl bg-amber-500/15 -z-0"
                              />
                            )}
                            <span className="relative z-10 block text-xs">{v.label}</span>
                            <span className="relative z-10 block font-mono text-[10px] text-zinc-500 mt-0.5">
                              {v.sub}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Metric 4: Space (AutoHeight when Dine-in is selected) */}
                  <AutoHeight isOpen={mode === 'dinein'}>
                    <div className="space-y-2.5 pt-4 border-t border-white/[0.06]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-zinc-100">
                            4. Không gian & Chỗ ngồi
                          </span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                            20%
                          </span>
                        </div>
                        <span className="font-mono text-sm font-bold text-sky-400 tabular-nums">
                          {space.toFixed(1)} / 10
                        </span>
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
                  </AutoHeight>

                  {/* Metric 5: Packaging (5%) */}
                  <div className="space-y-2.5 pt-4 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-100">
                          {mode === 'dinein' ? '5.' : '4.'} Chất liệu vỏ ly / Bao bì
                        </span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/[0.07]">
                          5%
                        </span>
                      </div>
                      <span className="font-mono text-sm font-bold text-zinc-200 tabular-nums">
                        {packaging.toFixed(1)} / 10
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.5"
                      value={packaging}
                      onChange={(e) => setPackaging(parseFloat(e.target.value))}
                      className="precision-slider"
                    />
                  </div>

                  {/* Review Notes */}
                  <div className="space-y-1.5 pt-4 border-t border-white/[0.06]">
                    <label className="block text-xs font-medium text-zinc-300">
                      Ghi chú nhận xét
                    </label>
                    <textarea
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="VD: Nguyên nhân chính cho 6.5đ là lượng đồ uống ít so với mức giá 31k..."
                      className="w-full p-3 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                {/* Block 4: Live Animated Score Preview + Ripple Submit Button */}
                <div className="rounded-[20px] bg-gradient-to-b from-[#16161a] to-[#121215] border border-amber-500/30 p-5 space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-amber-400 font-semibold">
                        Kết quả định lượng thời gian thực
                      </span>
                      <div className="text-sm font-bold text-zinc-100">
                        {liveTier.text}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-baseline justify-end gap-0.5">
                        <CountingNumber
                          number={liveCalc.total}
                          decimalPlaces={2}
                          className={cn(
                            'font-mono text-3xl font-extrabold',
                            liveTier.colorClass
                          )}
                        />
                        <span className="font-mono text-xs text-zinc-500">/10</span>
                      </div>
                    </div>
                  </div>

                  {/* Formula Breakdown Pills */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {liveCalc.parts.map((pt) => (
                      <div
                        key={pt.label}
                        className="rounded-xl bg-zinc-950/80 border border-white/[0.06] p-2 text-center"
                      >
                        <div className="text-[10px] text-zinc-400 truncate">{pt.label}</div>
                        <div className="font-mono text-xs font-bold text-zinc-100 mt-0.5">
                          +{pt.weighted.toFixed(2)}
                        </div>
                        <div className="font-mono text-[9px] text-zinc-500">
                          ({pt.raw}×{pt.weight})
                        </div>
                      </div>
                    ))}
                  </div>

                  <RippleButton
                    type="submit"
                    className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Scale className="w-4 h-4" strokeWidth={2} />
                    <span>{editingId ? 'Cập Nhật Đánh Giá' : 'Lưu Vào Sổ Tay Xếp Hạng'}</span>
                  </RippleButton>
                </div>
              </form>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* FORMULA MODAL DIALOG */}
      <AnimatePresence>
        {isFormulaOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setIsFormulaOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[410px] rounded-[24px] bg-[#121215] border border-white/10 p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-400" strokeWidth={1.75} />
                  <h3 className="text-sm font-bold text-zinc-50">
                    System Design Công Thức Chấm Điểm
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormulaOpen(false)}
                  className="w-7 h-7 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
                <div className="rounded-2xl bg-zinc-900/90 border border-white/[0.06] p-3.5 space-y-1.5">
                  <div className="font-semibold text-amber-400">
                    1. Phân tách Trọng số Take-away vs Ngồi lại
                  </div>
                  <p className="text-zinc-400">
                    • <b className="text-zinc-100">Take-away:</b> Vị <span className="font-mono text-amber-300">50%</span> + Giá <span className="font-mono text-amber-300">25%</span> + Thể tích <span className="font-mono text-amber-300">20%</span> + Vỏ ly <span className="font-mono text-amber-300">5%</span>
                  </p>
                  <p className="text-zinc-400">
                    • <b className="text-zinc-100">Ngồi lại:</b> Vị <span className="font-mono text-sky-300">35%</span> + Không gian <span className="font-mono text-sky-300">20%</span> + Giá <span className="font-mono text-sky-300">20%</span> + Thể tích <span className="font-mono text-sky-300">20%</span> + Vỏ ly <span className="font-mono text-sky-300">5%</span>
                  </p>
                </div>

                <div className="rounded-2xl bg-zinc-900/90 border border-white/[0.06] p-3.5 space-y-2">
                  <div className="font-semibold text-emerald-400">
                    2. Ma trận quy đổi Giá tiền → Điểm (Thang 10)
                  </div>
                  <table className="w-full font-mono text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-zinc-400 text-left">
                        <th className="py-1.5">Khung giá</th>
                        <th className="py-1.5">Take-away</th>
                        <th className="py-1.5">Ngồi lại</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      <tr><td className="py-1.5">&lt; 20k</td><td className="text-emerald-400 font-bold">10.0đ</td><td className="text-emerald-400 font-bold">10.0đ</td></tr>
                      <tr><td className="py-1.5">20k – 29k</td><td className="text-emerald-400 font-bold">8.5đ</td><td className="text-emerald-400 font-bold">9.5đ</td></tr>
                      <tr><td className="py-1.5">30k – 39k (Nốt: 31k)</td><td className="text-amber-400 font-bold">7.0đ</td><td className="text-emerald-400 font-bold">8.5đ</td></tr>
                      <tr><td className="py-1.5">40k – 49k</td><td className="text-orange-400 font-bold">5.0đ</td><td className="text-amber-400 font-bold">7.5đ</td></tr>
                      <tr><td className="py-1.5">50k – 65k</td><td className="text-rose-400 font-bold">3.0đ</td><td className="text-orange-400 font-bold">6.0đ</td></tr>
                      <tr><td className="py-1.5">&gt; 65k</td><td className="text-rose-500 font-bold">1.5đ</td><td className="text-rose-400 font-bold">4.0đ</td></tr>
                    </tbody>
                  </table>
                </div>

                <div className="rounded-2xl bg-amber-500/10 border border-amber-500/25 p-3.5 space-y-1 font-mono text-[11px]">
                  <div className="font-sans font-bold text-amber-300 text-xs">
                    Chuẩn đối chiếu: Quán Nốt (Phan Thanh, Đà Nẵng)
                  </div>
                  <div>• Hương vị: 7.0 × 0.50 = 3.50</div>
                  <div>• Giá 31k (Take-away): 7.0 × 0.25 = 1.75</div>
                  <div>• Thể tích (Ít = 4đ): 4.0 × 0.20 = 0.80</div>
                  <div>• Vỏ ly: 9.0 × 0.05 = 0.45</div>
                  <div className="pt-1 text-amber-300 font-bold">
                    ⇒ Tổng điểm = 3.50 + 1.75 + 0.80 + 0.45 = 6.50 / 10
                  </div>
                </div>
              </div>

              <RippleButton
                type="button"
                onClick={() => setIsFormulaOpen(false)}
                className="w-full h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold text-xs"
              >
                Đóng bảng công thức
              </RippleButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
