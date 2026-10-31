import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useIsPresent } from 'motion/react';
import {
  Edit3,
  Trash2,
  MapPin,
  Navigation,
  Plus,
  ChevronRight,
  Coffee,
  Utensils,
  Meh,
  Smile,
  ExternalLink,
} from 'lucide-react';
import type { ReviewItem } from '../lib/models.ts';
import { formatDate, hasConfirmedLocation } from '../lib/models.ts';
import { getQuotaStatus } from '../lib/frequency.ts';
import {
  getTierStyle,
  getDrinkPriceScore,
  getFoodPriceScore,
  VOLUME_OPTIONS,
} from '../lib/scoring.ts';
import { distanceKm, type Position } from '../lib/geo.ts';
import { ScoreDial, AnimatedNumber, CriterionBar, useQuietMotion } from './motion/kinetic.tsx';
import { Photo } from './Photo.tsx';

export default function ReviewCard({
  item,
  index,
  now,
  position,
  selected,
  onEdit,
  onDelete,
  onVisit,
  onDirections,
  onMap,
  onInspect,
}: {
  item: ReviewItem;
  index: number;
  now: Date;
  position: Position | null;
  selected: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onVisit: () => void;
  onDirections: () => void;
  onMap: () => void;
  onInspect?: () => void;
}) {
  const card = useRef<HTMLElement>(null),
    region = useId();
  const [expanded, setExpanded] = useState(false);
  const quiet = useQuietMotion(),
    present = useIsPresent();
  useEffect(() => {
    if (selected && matchMedia('(max-width:1099px)').matches) {
      setExpanded(true);
      card.current?.scrollIntoView({ block: 'nearest', behavior: quiet ? 'auto' : 'smooth' });
    }
  }, [selected, quiet]);
  const quota = getQuotaStatus(item, undefined, undefined, now),
    food = item.category === 'food';
  const tier = getTierStyle(item.totalScore, item.category);
  const parts: [string, number][] = food
    ? [
        ['Ngon', item.taste],
        ['Chất lượng', item.foodQuality],
        ['Sạch', item.cleanliness],
        ['Giá', getFoodPriceScore(item.priceK, item.foodType).score],
        ['Không gian', item.space],
      ]
    : [
        ['Vị', item.taste],
        ['Giá', getDrinkPriceScore(item.priceK, item.mode).score],
        ['Lượng', VOLUME_OPTIONS.find((v) => v.key === item.volumeKey)?.score ?? 0],
        ['Ly', item.packaging],
        ...(item.mode === 'dinein' ? [['Không gian', item.space] as [string, number]] : []),
      ];
  return (
    <motion.article
      ref={card}
      className="review-card"
      data-selected={selected}
      data-expanded={expanded}
      data-category={item.category}
      aria-hidden={!present}
      inert={!present || undefined}
      layout="position"
      data-motion="card"
      initial={quiet ? false : { opacity: 0.4, y: 18, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.96 }}
      transition={{
        duration: quiet ? 0 : 0.45,
        delay: quiet ? 0 : Math.min(index, 5) * 0.075,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={quiet ? undefined : { y: -3 }}
    >
      <motion.button
        type="button"
        className="review-summary"
        aria-expanded={expanded}
        aria-controls={region}
        whileTap={quiet ? undefined : { scale: 0.985 }}
        onClick={() => {
          if (matchMedia('(min-width:1100px)').matches) onInspect?.();
          else setExpanded((v) => !v);
        }}
      >
        <div className="card-main">
          <ScoreDial value={item.totalScore} />
          <div className="card-identity">
            <div className="card-title">
              <h3>{item.name}</h3>
            </div>
            <div className="badges">
              <strong className="card-price">
                {item.priceK}
                <small>k</small>
              </strong>
              <span className="venue-mode">
                {food ? <Utensils /> : <Coffee />}
                {food
                  ? item.foodType === 'streetfood'
                    ? 'Bình dân'
                    : 'Quán ngồi'
                  : item.mode === 'takeaway'
                    ? 'Mang đi'
                    : 'Ngồi lại'}
              </span>
              {item.isDemo && <span className="badge">Minh họa</span>}
            </div>
            <p className="address">
              <MapPin />
              {[[item.address, item.street].filter(Boolean).join(' '), item.ward, item.city]
                .filter(Boolean)
                .join(', ') || 'Chưa ghim'}
            </p>
          </div>
        </div>
        <div className="card-criteria">
          {parts.slice(0, 4).map(([label, value]) => (
            <span className="mini-criterion" key={label}>
              <small>{label}</small>
              <strong>
                <AnimatedNumber value={value} decimals={Number.isInteger(value) ? 0 : 1} />
              </strong>
              <span className="mini-meter">
                <motion.i
                  initial={quiet ? false : { scaleX: 0 }}
                  animate={{ scaleX: value / 10 }}
                  transition={{ duration: quiet ? 0 : 0.8 }}
                />
              </span>
            </span>
          ))}
        </div>
        <div className="card-summary">
          <span className="verdict">
            {item.totalScore >= 7.5 ? <Smile /> : <Meh />}
            {tier.shortLabel}
          </span>
          <span className="small">{quota.tier.label}</span>
          <ChevronRight className="chevron" />
        </div>
      </motion.button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={region}
            key="detail"
            className="card-reveal"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: quiet ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="card-details stack">
              {parts.length > 4 && (
                <div className="score-breakdown">
                  {parts.map(([label, value]) => (
                    <CriterionBar key={label} label={label} value={value} />
                  ))}
                </div>
              )}
              {item.dish && (
                <p className="dish-note">
                  <strong>{item.dish}</strong>
                </p>
              )}
              {item.note && <p className="review-note">{item.note}</p>}
              {!!item.photoIds.length && (
                <div className="photo-grid">
                  {item.photoIds.map((id, i) => (
                    <Photo key={id} id={id} alt={`Ảnh ${i + 1} bạn lưu tại ${item.name}`} />
                  ))}
                </div>
              )}
              <div className="split small muted">
                {item.reviewedAt && <span>{formatDate(item.reviewedAt)}</span>}
                {item.cuisine && <span>{item.cuisine}</span>}
                {item.placeResolution?.status === 'verified' && (
                  <a
                    className="source-link"
                    href={item.placeResolution.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink />
                    Maps
                  </a>
                )}
              </div>
              {position && hasConfirmedLocation(item) && (
                <span className="small muted">
                  {distanceKm(position, { lat: item.lat!, lng: item.lng! }).toFixed(1)} km
                </span>
              )}
              <div className="quota-note">
                <strong>{quota.statusBadgeText}</strong>
                <span className="small">{quota.resetText}</span>
              </div>
              <div className="button-row">
                <button className="button" aria-label="Lượt ghé & tiền" onClick={onVisit}>
                  <Plus size={16} />
                  Ghé quán
                </button>
                <button className="button secondary" onClick={onDirections}>
                  <Navigation size={16} />
                  {hasConfirmedLocation(item) ? 'Chỉ đường' : 'Tìm Maps'}
                </button>
                <button className="icon-button" aria-label="Bản đồ" onClick={onMap}>
                  <MapPin />
                </button>
              </div>
              <div className="split">
                <button className="text-button" aria-label="Sửa đánh giá" onClick={onEdit}>
                  <Edit3 />
                  Sửa
                </button>
                <button className="text-button danger-text" aria-label="Xóa" onClick={onDelete}>
                  <Trash2 />
                  Xóa
                </button>
              </div>
              {!!item.ratingHistory.length && (
                <details className="disclosure">
                  <summary>Lịch sử điểm ({item.ratingHistory.length})</summary>
                  {item.ratingHistory
                    .slice(-10)
                    .reverse()
                    .map((h, i) => (
                      <p className="split small" key={`${h.reviewedAt}-${i}`}>
                        <span>{formatDate(h.reviewedAt)}</span>
                        <span>
                          {h.totalScore.toFixed(1)}đ · {h.priceK}k
                        </span>
                      </p>
                    ))}
                </details>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
