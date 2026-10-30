import { MapPin, Navigation, Plus, Edit3, Trash2, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReviewItem } from '../lib/models.ts';
import { formatDate, hasConfirmedLocation } from '../lib/models.ts';
import { Photo } from './Photo.tsx';
import {
  getTierStyle,
  getDrinkPriceScore,
  getFoodPriceScore,
  VOLUME_OPTIONS,
} from '../lib/scoring.ts';
import { getQuotaStatus } from '../lib/frequency.ts';
import { ScoreDial, CriterionBar, useQuietMotion } from './motion/kinetic.tsx';

export default function ReviewInspector({
  item,
  now,
  onEdit,
  onVisit,
  onDelete,
  onDirections,
  onMap,
}: {
  item: ReviewItem | undefined;
  now: Date;
  onEdit: () => void;
  onVisit: () => void;
  onDelete: () => void;
  onDirections: () => void;
  onMap: () => void;
}) {
  const quiet = useQuietMotion();
  if (!item) return null;
  const food = item.category === 'food',
    quota = getQuotaStatus(item, undefined, undefined, now);
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
        ['Lượng', VOLUME_OPTIONS.find((v) => v.key === item.volumeKey)!.score],
        ['Ly', item.packaging],
        ...(item.mode === 'dinein' ? [['Không gian', item.space] as [string, number]] : []),
      ];
  return (
    <motion.aside
      key={item.id}
      className="review-inspector stack"
      data-motion="inspector"
      initial={quiet ? false : { opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: quiet ? 0 : 0.4 }}
    >
      <div className="inspector-heading">
        <h2>{item.name}</h2>
        <div className="inspector-actions">
          <motion.button
            whileTap={quiet ? undefined : { scale: 0.9 }}
            className="icon-button primary"
            aria-label="Lượt ghé & tiền"
            title="Ghé quán"
            onClick={onVisit}
          >
            <Plus />
          </motion.button>
          <button
            className="icon-button"
            aria-label={hasConfirmedLocation(item) ? 'Chỉ đường' : 'Tìm Maps'}
            title="Chỉ đường"
            onClick={onDirections}
          >
            <Navigation />
          </button>
          <button
            className="icon-button"
            aria-label={`Sửa ${item.name}`}
            title="Sửa đánh giá"
            onClick={onEdit}
          >
            <Edit3 />
          </button>
          <button
            className="icon-button danger-text"
            aria-label="Xóa quán"
            title="Xóa quán"
            onClick={onDelete}
          >
            <Trash2 />
          </button>
        </div>
      </div>
      <div className="inspector-meta">
        <strong>{item.priceK}k</strong>
        <span>·</span>
        <span>
          {food
            ? item.foodType === 'streetfood'
              ? 'Bình dân'
              : 'Quán ngồi'
            : item.mode === 'takeaway'
              ? 'Mang đi'
              : 'Ngồi lại'}
        </span>
      </div>
      <button className="inspector-address" onClick={onMap}>
        <MapPin />
        {[[item.address, item.street].filter(Boolean).join(' '), item.ward, item.city]
          .filter(Boolean)
          .join(', ') || 'Chưa ghim'}
      </button>
      <div className="inspector-visual">
        <ScoreDial value={item.totalScore} size={236} />
        <div className="score-breakdown">
          {parts.map(([label, value]) => (
            <CriterionBar key={label} label={label} value={value} />
          ))}
        </div>
      </div>
      <div className="inspector-verdict">
        <span>{getTierStyle(item.totalScore, item.category).shortLabel}</span>
        <span>{quota.statusBadgeText}</span>
      </div>
      {(item.note || item.dish) && (
        <section className="inspector-note">
          {item.dish && <strong>{item.dish}</strong>}
          {item.note && <p>{item.note}</p>}
        </section>
      )}
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
      <span className="small muted">{quota.resetText}</span>
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
    </motion.aside>
  );
}
