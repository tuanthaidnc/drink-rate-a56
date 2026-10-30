import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigation, RotateCw, Check } from 'lucide-react';
import { Dialog } from './Dialog.tsx';
import { getQuotaStatus, getMonthCycleInfo } from '../lib/frequency.ts';
import { chooseWeighted, weightedCandidates } from '../lib/selection.ts';
import type { ReviewItem } from '../lib/models.ts';
const COLORS = [
  '#059669',
  '#0284c7',
  '#d97706',
  '#7c3aed',
  '#db2777',
  '#0d9488',
  '#ea580c',
  '#4f46e5',
];
export default function SpinPicker({
  items,
  summary,
  theme,
  now,
  onClose,
  onSelect,
  onDirections,
  onVisit,
}: {
  items: ReviewItem[];
  summary: string;
  theme: 'light' | 'dark';
  now: Date;
  onClose: () => void;
  onSelect: (item: ReviewItem) => void;
  onDirections: (item: ReviewItem) => void;
  onVisit: (item: ReviewItem) => void;
}) {
  const [category, setCategory] = useState('ALL');
  const [price, setPrice] = useState('ALL');
  const [goodOnly, setGoodOnly] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const pool = useMemo(
    () =>
      items.filter(
        (r) =>
          !r.isDemo &&
          (category === 'ALL' || r.category === category) &&
          (!goodOnly || r.totalScore >= 7.5) &&
          (price === 'ALL' ||
            (price === 'low'
              ? r.priceK <= 40
              : price === 'middle'
                ? r.priceK > 40 && r.priceK <= 80
                : r.priceK > 80)) &&
          getQuotaStatus(r, undefined, undefined, now).available,
      ),
    [items, category, price, goodOnly, now],
  );
  const weighted = useMemo(() => weightedCandidates(pool, now), [pool, now]);
  const sum = weighted.reduce((s, x) => s + x.weight, 0);
  const winner = pool.find((r) => r.id === winnerId) ?? null;
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 360, 360);
    if (!pool.length) return;
    const step = (2 * Math.PI) / pool.length;
    pool.forEach((r, i) => {
      ctx.beginPath();
      ctx.moveTo(180, 180);
      ctx.arc(180, 180, 170, i * step, (i + 1) * step);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = theme === 'light' ? '#fff' : '#0b111d';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.save();
      ctx.translate(180, 180);
      ctx.rotate((i + 0.5) * step);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px system-ui';
      ctx.fillText(
        `${r.name.length > 14 ? r.name.slice(0, 13) + '…' : r.name} · ${r.priceK}k`,
        157,
        4,
      );
      ctx.restore();
    });
  }, [pool, theme]);
  const spin = () => {
    if (spinning || !pool.length) return;
    const chosen = chooseWeighted(pool, Math.random, now);
    if (!chosen) return;
    const index = pool.findIndex((r) => r.id === chosen.id);
    setWinnerId(null);
    const reduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.dataset.reducedMotion === 'true';
    if (pool.length === 1 || reduced) {
      setWinnerId(chosen.id);
      return;
    }
    setSpinning(true);
    const target = 270 - ((index + 0.5) * 360) / pool.length;
    setRotation((r) => r + 360 * 6 + ((target - (r % 360) + 360) % 360));
    timer.current = setTimeout(() => {
      setWinnerId(chosen.id);
      setSpinning(false);
    }, 4200);
  };
  const quota = winner ? getQuotaStatus(winner, undefined, undefined, now) : null;
  return (
    <Dialog title="Hôm nay ăn / uống gì?" onClose={onClose}>
      <div className="stack">
        <p className="muted small">Phạm vi: {summary}</p>
        <p className="muted small">Chu kỳ tháng {getMonthCycleInfo(now).label} · Bắt đầu ngày 5</p>
        <div className="button-row">
          {[
            ['ALL', 'Tất cả'],
            ['food', '🍜 Quán ăn'],
            ['drink', '🥤 Quán nước'],
          ].map(([key, label]) => (
            <button
              className="button secondary grow"
              key={key}
              disabled={spinning}
              aria-pressed={category === key}
              onClick={() => {
                setCategory(key);
                setWinnerId(null);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="field">
          <span>Khung giá</span>
          <select
            value={price}
            disabled={spinning}
            onChange={(e) => {
              setPrice(e.target.value);
              setWinnerId(null);
            }}
          >
            <option value="ALL">Mọi giá trong bộ lọc</option>
            <option value="low">Từ 40k trở xuống</option>
            <option value="middle">Trên 40k đến 80k</option>
            <option value="high">Trên 80k</option>
          </select>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={goodOnly}
            disabled={spinning}
            onChange={(e) => {
              setGoodOnly(e.target.checked);
              setWinnerId(null);
            }}
          />
          Ưu tiên quán đáng quay lại (từ 7,5 điểm)
        </label>
        <strong role="status">{pool.length} quán hợp lệ, còn lượt gợi ý</strong>
        {!pool.length ? (
          <div className="empty">
            <p>Chưa có quán thỏa tất cả điều kiện và còn lượt.</p>
            <p className="muted small">
              Bạn có thể bỏ giới hạn 7,5 điểm, đổi khung giá hoặc quay lại chỉnh bộ lọc. Ứng dụng sẽ
              giữ đúng điều kiện bạn chọn.
            </p>
            <button className="button secondary" onClick={onClose}>
              Quay lại chỉnh lựa chọn
            </button>
          </div>
        ) : (
          <>
            <div className="wheel">
              <span className="wheel-pointer" aria-hidden="true">
                ▼
              </span>
              <div
                className="wheel-disc"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? 'transform 4.2s cubic-bezier(.18,.95,.22,1)' : 'none',
                }}
              >
                <canvas
                  ref={canvas}
                  width="360"
                  height="360"
                  aria-label="Bánh xe minh họa các quán trong danh sách phía dưới"
                />
              </div>
              <button className="wheel-button" disabled={spinning} onClick={spin}>
                <RotateCw size={20} />
                {spinning ? 'Đang quay' : pool.length === 1 ? 'CHỌN' : 'QUAY'}
              </button>
            </div>
            {winner && quota && (
              <section className="panel winner" role="status" aria-live="polite">
                <span className="badge">Lựa chọn cho bạn</span>
                <div className="split">
                  <h3>{winner.name}</h3>
                  <strong className="score">
                    {winner.totalScore.toFixed(1)}
                    <small>/10</small>
                  </strong>
                </div>
                <p>
                  {winner.priceK}k · {winner.dish || winner.cuisine || 'Xem ghi chú của bạn'}
                </p>
                <p className="small muted">
                  {quota.tier.label} · {quota.statusBadgeText}
                </p>
                <div className="button-row">
                  <button className="button" onClick={() => onSelect(winner)}>
                    <Check size={17} />
                    Chọn quán này
                  </button>
                  <button className="button secondary" onClick={() => onDirections(winner)}>
                    <Navigation size={17} />
                    Maps
                  </button>
                </div>
                <button className="text-button" onClick={() => onVisit(winner)}>
                  Tôi đã ghé · ghi lại lượt và tiền thực trả
                </button>
                <p className="small muted">Chọn quán hoặc mở Maps không tự trừ lượt.</p>
              </section>
            )}
            <details className="disclosure">
              <summary>Xem quán và mức ưu tiên</summary>
              <p className="muted small">
                Ưu tiên điểm cao và còn nhiều lượt. Xác suất có trọng số; các ô minh họa không biểu
                thị tỷ lệ.
              </p>
              {weighted.map(({ item, weight }) => (
                <div className="split small" key={item.id}>
                  <span>
                    {item.name} · {item.priceK}k
                  </span>
                  <strong>{Math.round((weight / sum) * 100)}%</strong>
                </div>
              ))}
            </details>
          </>
        )}
      </div>
    </Dialog>
  );
}
