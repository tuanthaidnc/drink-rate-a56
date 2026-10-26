import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  RotateCw,
  Navigation,
  Check,
  Calendar,
  Flame,
  Filter,
  Trophy,
  Compass,
} from 'lucide-react';
import {
  cn,
  RippleButton,
  CategoryScoreBadge,
  StarRatingBadge,
  scoreToStars,
  type AppTheme,
} from './animate-ui/primitives';
import {
  getFreqTier,
  getQuotaStatus,
  getMonthCycleInfo,
  spinWeight,
  TONE_CLASSES,
  type QuotaStatus,
} from '../lib/frequency';

export interface SpinItem {
  id: string;
  category: 'food' | 'drink';
  name: string;
  city: string;
  ward: string;
  street: string;
  priceK: number;
  totalScore: number;
  note?: string;
  visits?: string[];
  lat: number;
  lng: number;
}

interface SmartSpinModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: SpinItem[];
  theme?: AppTheme;
  onLogVisit: (itemId: string) => void;
  onOpenDirections: (item: SpinItem) => void;
  onSelectShop?: (item: SpinItem) => void;
  onViewOnMap?: (item: SpinItem) => void;
}

const WHEEL_COLORS = [
  '#f59e0b', // amber
  '#10b981', // emerald
  '#0284c7', // sky
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f97316', // orange
  '#14b8a6', // teal
  '#6366f1', // indigo
];

export function SmartSpinModal({
  isOpen,
  onClose,
  items,
  theme = 'dark',
  onLogVisit,
  onOpenDirections,
  onSelectShop,
  onViewOnMap,
}: SmartSpinModalProps) {
  const handleSelectWinner = (w: SpinItem) => {
    onClose();
    if (onSelectShop) onSelectShop(w);
    else if (onViewOnMap) onViewOnMap(w);
  };
  const [catFilter, setCatFilter] = useState<'ALL' | 'food' | 'drink'>('ALL');
  const [priceTierFilter, setPriceTierFilter] = useState<'ALL' | 'daily' | 'weekly' | 'monthly'>('ALL');
  const [onlyAvailableQuota, setOnlyAvailableQuota] = useState(true);

  // Wheel animation states
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<SpinItem | null>(null);
  const [hasLoggedVisit, setHasLoggedVisit] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const monthCycle = useMemo(() => getMonthCycleInfo(), []);

  // Filter pool
  const candidatePool = useMemo(() => {
    return items.filter((item) => {
      if (catFilter !== 'ALL' && item.category !== catFilter) return false;
      const quota = getQuotaStatus(item.category, item.priceK, item.visits);
      if (onlyAvailableQuota && !quota.available) return false;
      if (priceTierFilter === 'daily' && item.priceK > 40) return false;
      if (priceTierFilter === 'weekly' && (item.priceK <= 40 || item.priceK > 80)) return false;
      if (priceTierFilter === 'monthly' && item.priceK <= 80) return false;
      return true;
    });
  }, [items, catFilter, priceTierFilter, onlyAvailableQuota]);

  // If filtered pool is too small, fallback gracefully
  const activePool = candidatePool.length >= 2 ? candidatePool : items;

  // Draw wheel on canvas
  useEffect(() => {
    if (!isOpen) return;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas || activePool.length === 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = canvas.width;
      const center = size / 2;
      const radius = center - 8;
      const count = activePool.length;
      const sliceAngle = (2 * Math.PI) / count;

      ctx.clearRect(0, 0, size, size);

      // Draw slices
      activePool.forEach((item, index) => {
        const startAngle = index * sliceAngle;
        const endAngle = startAngle + sliceAngle;

        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, startAngle, endAngle);
        ctx.closePath();

        // Alternate color
        const color = WHEEL_COLORS[index % WHEEL_COLORS.length];
        ctx.fillStyle = color;
        ctx.fill();

        // Border between slices
        ctx.strokeStyle = theme === 'light' ? '#ffffff' : '#0b111d';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Text inside slice
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 4;

        const emoji = item.category === 'food' ? '🍜' : '🥤';
        const label = `${emoji} ${item.name.length > 10 ? item.name.slice(0, 9) + '…' : item.name} (${item.priceK}k)`;
        ctx.fillText(label, radius - 14, 4);

        ctx.restore();
      });

      // Outer ring
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 4;
      ctx.stroke();
    };

    // Render immediately and on next frame to guarantee mounted canvas
    render();
    const animId = requestAnimationFrame(render);
    const timer = setTimeout(render, 60);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(timer);
    };
  }, [activePool, theme, isOpen]);

  const handleSpin = () => {
    if (isSpinning || activePool.length === 0) return;
    setIsSpinning(true);
    setWinner(null);
    setHasLoggedVisit(false);

    // Calculate weighted probabilities
    const weights = activePool.map((it) => {
      const q = getQuotaStatus(it.category, it.priceK, it.visits);
      return spinWeight(it.totalScore, q);
    });
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    let randomVal = Math.random() * totalWeight;
    let winningIndex = 0;
    for (let i = 0; i < weights.length; i++) {
      if (randomVal <= weights[i]) {
        winningIndex = i;
        break;
      }
      randomVal -= weights[i];
    }

    const chosenItem = activePool[winningIndex] || activePool[0];

    // Compute rotation angle
    // Top pointer points to 270 deg (top).
    // Slice i spans [i * sliceAngle, (i+1) * sliceAngle].
    // Center of slice i is (i + 0.5) * sliceAngle.
    // We want (rotation + sliceCenter) % 360 == 270 deg.
    const sliceAngleDeg = 360 / activePool.length;
    const sliceCenterDeg = (winningIndex + 0.5) * sliceAngleDeg;
    const targetOffset = 270 - sliceCenterDeg;
    
    // Add 6-8 full rotations
    const fullSpins = 360 * (6 + Math.floor(Math.random() * 2));
    const targetRotation = rotation + fullSpins + ((targetOffset - (rotation % 360) + 360) % 360);

    setRotation(targetRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setWinner(chosenItem);
    }, 4200);
  };

  const winnerQuota = useMemo(() => {
    if (!winner) return null;
    return getQuotaStatus(winner.category, winner.priceK, winner.visits);
  }, [winner]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3.5"
        onClick={() => !isSpinning && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-[430px] max-h-[92vh] overflow-y-auto no-scrollbar rounded-3xl theme-surface-card p-4 space-y-3.5 border-2 border-[var(--border-active)] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-[var(--border-card)]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold shadow-md">
                🎡
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-[var(--text-primary)] leading-tight">
                  Hôm nay Ăn / Uống gì?
                </h2>
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-mono">
                  <Calendar className="w-3 h-3 text-[var(--accent)]" />
                  <span>Chu kỳ tháng: {monthCycle.label} (Reset ngày 5)</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={isSpinning}
              onClick={onClose}
              className="p-1.5 rounded-xl theme-surface-elevated text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Pills */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-1 text-[11px]">
              <span className="font-bold text-[var(--text-secondary)]">Chọn món muốn ăn/uống:</span>
              <span className="font-mono text-[10px] text-[var(--accent)] font-bold">
                {candidatePool.length} quán hợp lệ
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1 p-0.5 rounded-xl theme-surface-elevated text-xs">
              {(
                [
                  { k: 'ALL', l: 'Tất cả' },
                  { k: 'food', l: '🍜 Quán ăn' },
                  { k: 'drink', l: '🥤 Quán nước' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.k}
                  type="button"
                  disabled={isSpinning}
                  onClick={() => setCatFilter(tab.k)}
                  className={cn(
                    'py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap',
                    catFilter === tab.k
                      ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs'
                      : 'text-[var(--text-secondary)]'
                  )}
                >
                  {tab.l}
                </button>
              ))}
            </div>

            {/* Price / Frequency Filter */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
              {(
                [
                  { k: 'ALL', l: 'Mọi khung giá' },
                  { k: 'daily', l: '≤ 40k (2 lần/tuần)' },
                  { k: 'weekly', l: '40–80k (1 lần/tuần)' },
                  { k: 'monthly', l: '> 80k (1 lần/tháng)' },
                ] as const
              ).map((f) => (
                <button
                  key={f.k}
                  type="button"
                  disabled={isSpinning}
                  onClick={() => setPriceTierFilter(f.k)}
                  className={cn(
                    'px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer whitespace-nowrap',
                    priceTierFilter === f.k
                      ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--border-active)]'
                      : 'theme-surface-elevated text-[var(--text-secondary)]'
                  )}
                >
                  {f.l}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Wheel Container */}
          <div className="relative flex flex-col items-center justify-center py-2 select-none">
            {/* Top Pointer Indicator */}
            <div className="absolute top-0 z-20 flex flex-col items-center drop-shadow-md">
              <div className="w-5 h-5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-extrabold shadow-md">
                ▼
              </div>
            </div>

            {/* Rotating Canvas Wheel */}
            <div
              className="relative rounded-full overflow-hidden shadow-xl border-4 border-[var(--border-card)]"
              style={{
                width: 270,
                height: 270,
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning
                  ? 'transform 4.2s cubic-bezier(0.18, 0.95, 0.22, 1)'
                  : 'none',
              }}
            >
              <canvas
                ref={canvasRef}
                width={300}
                height={300}
                className="w-full h-full"
              />
            </div>

            {/* Center Spin Button */}
            <button
              type="button"
              disabled={isSpinning || activePool.length === 0}
              onClick={handleSpin}
              className={cn(
                'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-16 h-16 rounded-full flex flex-col items-center justify-center font-extrabold text-[11px] shadow-2xl transition-transform active:scale-90 cursor-pointer border-2',
                isSpinning
                  ? 'bg-amber-500 text-white border-amber-300 animate-pulse'
                  : 'bg-[var(--accent)] text-[var(--accent-fg)] border-white hover:scale-105'
              )}
            >
              <RotateCw className={cn('w-4 h-4', isSpinning && 'animate-spin')} />
              <span>{isSpinning ? '...' : 'QUAY'}</span>
            </button>
          </div>

          {/* Winner Card Announcement */}
          <AnimatePresence>
            {winner && winnerQuota && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="rounded-2xl theme-surface-card border-2 border-amber-400/80 p-3.5 space-y-2.5 bg-gradient-to-b from-amber-500/10 to-transparent shadow-lg"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[11px] font-extrabold shadow-sm">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Lựa chọn ngẫu nhiên cho bạn!</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-400">
                    ★{scoreToStars(winner.totalScore).toFixed(1)} / 5.0
                  </span>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <CategoryScoreBadge
                      category={winner.category}
                      score={winner.totalScore}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <h3 className="text-base font-extrabold text-[var(--text-primary)] leading-snug">
                        {winner.name}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)]">
                        Đường {winner.street} • P. {winner.ward} • {winner.priceK}k
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-xl font-extrabold text-[var(--accent)] leading-none">
                      {winner.totalScore.toFixed(1)}
                      <span className="text-[10px] text-[var(--text-muted)]">/10</span>
                    </div>
                  </div>
                </div>

                {/* Frequency & Cycle Status Badge */}
                <div className="p-2.5 rounded-xl theme-surface-elevated flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{winnerQuota.tier.emoji}</span>
                    <div>
                      <span className="font-bold text-[var(--text-primary)] block leading-tight">
                        {winnerQuota.tier.shortTitle} • {winnerQuota.tier.label}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] block">
                        {winnerQuota.tier.hint}
                      </span>
                    </div>
                  </div>

                  <span
                    className={cn(
                      'text-[10px] font-mono font-bold px-2 py-1 rounded-lg border whitespace-nowrap',
                      TONE_CLASSES[winnerQuota.tier.tone]
                    )}
                  >
                    {hasLoggedVisit
                      ? `Đã trừ 1 lượt (${Math.max(0, winnerQuota.remaining - 1)} còn)`
                      : winnerQuota.statusBadgeText}
                  </span>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <RippleButton
                    type="button"
                    onClick={() => {
                      onLogVisit(winner.id);
                      setHasLoggedVisit(true);
                    }}
                    disabled={hasLoggedVisit}
                    className={cn(
                      'h-10 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 border transition-all',
                      hasLoggedVisit
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 cursor-default'
                        : 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)] shadow-sm'
                    )}
                  >
                    <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                    <span>{hasLoggedVisit ? 'Đã ghi nhận đi quán!' : 'Chốt đi quán này (-1 lượt)'}</span>
                  </RippleButton>

                  <RippleButton
                    type="button"
                    onClick={() => onOpenDirections(winner)}
                    className="h-10 rounded-xl theme-surface-elevated text-xs font-bold flex items-center justify-center gap-1.5 text-[var(--text-primary)]"
                  >
                    <Navigation className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Chỉ đường Maps</span>
                  </RippleButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick info footer */}
          <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] pt-1 px-1">
            <span>Quay thông minh ưu tiên quán điểm cao & còn lượt</span>
            <span className="font-mono text-[var(--accent)] font-bold">Tháng bắt đầu ngày 5</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
