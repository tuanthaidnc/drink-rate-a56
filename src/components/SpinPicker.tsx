import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigation, Shuffle, Check, Coffee, Utensils, ImageOff } from 'lucide-react';
import { Dialog } from './Dialog.tsx';
import { Photo } from './Photo.tsx';
import { useQuietMotion } from './motion/kinetic.tsx';
import { getQuotaStatus } from '../lib/frequency.ts';
import { chooseWeighted, weightedCandidates } from '../lib/selection.ts';
import type { ReviewItem } from '../lib/models.ts';

export default function SpinPicker({ items, onClose, onSelect, onDirections, onVisit, now }: {
  items: ReviewItem[]; summary: string; theme: 'light' | 'dark'; now: Date;
  onClose: () => void; onSelect: (item: ReviewItem) => void;
  onDirections: (item: ReviewItem) => void; onVisit: (item: ReviewItem) => void;
}) {
  const [category, setCategory] = useState('ALL');
  const [price, setPrice] = useState('ALL');
  const [goodOnly, setGoodOnly] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<ReviewItem | null>(null);
  const [run, setRun] = useState<{ cards: ReviewItem[]; chosen: ReviewItem; index: number }>();
  const track = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | undefined>(undefined);
  const quiet = useQuietMotion();
  const pool = useMemo(() => items.filter(r => !r.isDemo &&
    (category === 'ALL' || r.category === category) && (!goodOnly || r.totalScore >= 7.5) &&
    (price === 'ALL' || (price === 'low' ? r.priceK <= 40 : price === 'middle' ? r.priceK > 40 && r.priceK <= 80 : r.priceK > 80)) &&
    getQuotaStatus(r, undefined, undefined, now).available), [items, category, price, goodOnly, now]);
  const poolKey = pool.map(r => r.id).join('|');
  useEffect(() => {
    animation.current?.cancel(); setRun(undefined); setWinner(null); setSpinning(false);
    if (track.current) track.current.style.transform = 'translate3d(0,0,0)';
  }, [poolKey]);
  useEffect(() => {
    if (!run || !track.current) return;
    const element = track.current;
    const first = element.firstElementChild as HTMLElement | null;
    if (!first) return;
    const pitch = first.getBoundingClientRect().width + parseFloat(getComputedStyle(element).gap || '0');
    const end = -run.index * pitch;
    let active = true;
    const finish = () => {
      if (!active) return;
      element.style.transform = `translate3d(${end}px,0,0)`;
      setWinner(run.chosen); setSpinning(false);
    };
    if (quiet || pool.length === 1) { finish(); return; }
    const effect = element.animate([
      { transform: 'translate3d(0,0,0)' }, { transform: `translate3d(${end}px,0,0)` },
    ], { duration: 4600, easing: 'cubic-bezier(.09,.68,.12,1)', fill: 'forwards' });
    animation.current = effect;
    void effect.finished.then(finish).catch(() => {});
    return () => { active = false; effect.cancel(); };
  }, [run, quiet]);
  const spin = () => {
    if (spinning) return;
    const chosen = chooseWeighted(pool, Math.random, now);
    if (!chosen) return;
    animation.current?.cancel();
    if (track.current) track.current.style.transform = 'translate3d(0,0,0)';
    setWinner(null); setSpinning(true);
    const index = pool.length === 1 || quiet ? 0 : 32;
    const cards = Array.from({ length: index + 5 }, (_, i) => i === index ? chosen : pool[i % pool.length]);
    setRun({ cards, chosen, index });
  };
  const cards = run?.cards ?? pool.slice(0, 7);
  const weighted = weightedCandidates(pool, now);
  const sum = weighted.reduce((s, x) => s + x.weight, 0);
  return <Dialog title="Ăn gì?" onClose={onClose}>
    <div className="case-picker">
      <div className="case-filters">
        <div className="segmented" role="group" aria-label="Loại gợi ý">
          {([['ALL', 'Tất cả', null], ['food', 'Ăn', Utensils], ['drink', 'Nước', Coffee]] as const).map(([key, label, Icon]) =>
            <button key={key} className="button secondary" aria-pressed={category === key} disabled={spinning}
              onClick={() => setCategory(key)}>{Icon && <Icon size={16} />}{label}</button>)}
        </div>
        <select aria-label="Khung giá gợi ý" value={price} disabled={spinning} onChange={e => setPrice(e.target.value)}>
          <option value="ALL">Mọi giá</option><option value="low">≤ 40k</option>
          <option value="middle">40–80k</option><option value="high">&gt; 80k</option>
        </select>
      </div>
      <label className="check case-preference"><input type="checkbox" checked={goodOnly} disabled={spinning}
        onChange={e => setGoodOnly(e.target.checked)} />Từ 7,5 điểm<span>{pool.length} quán</span></label>
      {pool.length ? <>
        <div className={`case-reel ${winner ? 'is-landed' : ''}`} aria-label="Dải ảnh chọn quán" aria-busy={spinning}>
          <div className="case-marker" aria-hidden="true" />
          <div className="case-track" ref={track} aria-hidden="true">
            {cards.map((r, i) => <div className="case-photo" key={`${run ? 'run' : 'idle'}-${i}-${r.id}`} data-winner={!!winner && i === run?.index}>
              {r.photoIds[0] ? <Photo id={r.photoIds[0]} alt={r.name} preview={false} eager /> :
                <div className="case-no-photo"><ImageOff /><span>{r.name}</span></div>}
              <div className="case-photo-caption"><strong>{r.name}</strong><span>{r.totalScore.toFixed(1)} · {r.priceK}k</span></div>
            </div>)}
          </div>
        </div>
        <div className="case-result" role="status" aria-live="polite">
          {winner ? <><h3>{winner.name}</h3><p>{winner.totalScore.toFixed(1)}<small>/10</small><span>· {winner.priceK}k</span></p></> :
            <p className="case-ready">{spinning ? 'Đang chọn…' : 'Hôm nay thử quán nào?'}</p>}
        </div>
        <button className="button case-open" disabled={spinning} onClick={spin}><Shuffle size={20} />
          {spinning ? 'Đang chọn…' : winner ? 'Quay lại' : pool.length === 1 ? 'Chọn quán' : 'Mở lựa chọn'}</button>
        {winner && <div className="case-actions">
          <button className="button secondary" onClick={() => onSelect(winner)}><Check size={18} />Xem quán</button>
          <button className="button secondary" onClick={() => onDirections(winner)}><Navigation size={18} />Chỉ đường</button>
          <button className="text-button" onClick={() => onVisit(winner)}>Ghi lượt ghé</button>
        </div>}
        <details className="case-odds disclosure"><summary>Danh sách ({pool.length})</summary>
          {weighted.map(({ item, weight }) => <div className="split small" key={item.id}><span>{item.name}</span><span>{Math.round(weight / sum * 100)}%</span></div>)}
        </details>
      </> : <div className="case-empty"><Utensils size={32} /><p>Chưa có quán phù hợp</p><button className="button secondary" onClick={() => { setCategory('ALL'); setPrice('ALL'); setGoodOnly(false); }}>Xóa bộ lọc gợi ý</button></div>}
    </div>
  </Dialog>;
}
