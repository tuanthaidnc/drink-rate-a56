import { useEffect, useRef } from 'react';
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
import { CategoryScoreBadge, StarRatingBadge, MotionEffect } from './animate-ui/primitives.tsx';
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
  const details = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (selected && details.current && window.matchMedia('(max-width:1099px)').matches) {
      details.current.open = true;
      details.current.scrollIntoView({
        block: 'nearest',
        behavior: window.matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth',
      });
    }
  }, [selected]);
  const quota = getQuotaStatus(item, undefined, undefined, now);
  const food = item.category === 'food';
  const tier = getTierStyle(item.totalScore, item.category);
  const parts = food
    ? [
        ['Ngon', item.taste],
        ['Chất lượng', item.foodQuality],
        ['Sạch', item.cleanliness],
        ['Không gian', item.space],
        ['Giá quy đổi', getFoodPriceScore(item.priceK, item.foodType).score],
      ]
    : [
        ['Vị', item.taste],
        ['Giá quy đổi', getDrinkPriceScore(item.priceK, item.mode).score],
        ['Lượng', VOLUME_OPTIONS.find((v) => v.key === item.volumeKey)?.score ?? 0],
        ['Vỏ ly', item.packaging],
        ...(item.mode === 'dinein' ? [['Không gian', item.space]] : []),
      ];
  return (
    <MotionEffect delay={Math.min(index, 5) * 0.025} slideOffset={5} blurAmount="0px">
      <details className="review-card theme-surface-card" ref={details} data-selected={selected}>
        <summary
          onClick={(e) => {
            onInspect?.();
            if (window.matchMedia('(min-width:1100px)').matches) e.preventDefault();
          }}
        >
          <div className="card-main">
            <span aria-hidden="true">
              <CategoryScoreBadge category={item.category} score={item.totalScore} size="sm" />
            </span>
            <div className="card-identity">
              <div className="card-title">
                <span className="rank">#{index + 1}</span>
                <h3>{item.name}</h3>
              </div>
              <div className="badges">
                <span className={`badge ${food ? 'food-badge' : ''}`}>
                  {food ? <Utensils aria-hidden="true" /> : <Coffee aria-hidden="true" />}
                  {food
                    ? item.foodType === 'streetfood'
                      ? 'Bình dân'
                      : 'Quán ngồi'
                    : item.mode === 'takeaway'
                      ? 'Mang đi'
                      : 'Ngồi lại'}
                </span>
                <span className="badge">{item.priceK}k</span>
                {item.isDemo && <span className="badge demo-badge">Minh họa</span>}
              </div>
              <p className="small address">
                {[[item.address, item.street].filter(Boolean).join(' '), item.ward, item.city]
                  .filter(Boolean)
                  .join(' · ') || 'Chưa ghi địa chỉ'}
              </p>
            </div>
            <div className="card-score">
              <strong className="score">
                {item.totalScore.toFixed(1)}
                <small>/10</small>
              </strong>
              <span className="small">{tier.shortLabel}</span>
            </div>
          </div>
          <div className="card-summary">
            <span className="verdict">
              {item.totalScore >= 7.5 ? <Smile /> : <Meh />}
              {tier.shortLabel}
            </span>
            <span className="small">{quota.tier.label}</span>
            <ChevronRight className="chevron" aria-hidden="true" />
          </div>
        </summary>
        <div className="card-details stack">
          <StarRatingBadge score10={item.totalScore} />
          {item.placeResolution?.status === 'verified' && (
            <a
              className="source-link"
              href={item.placeResolution.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              Địa điểm đã đối chiếu Maps
            </a>
          )}
          <div className="score-breakdown">
            {parts.map(([label, value]) => (
              <div key={String(label)} className="split small">
                <span>{label}</span>
                <meter min="0" max="10" value={Number(value)} aria-label={String(label)} />
                <strong className="mono">{Number(value).toFixed(1)}</strong>
              </div>
            ))}
          </div>
          {item.dish && (
            <p>
              <strong>Nên gọi:</strong> {item.dish}
            </p>
          )}
          {item.note && <p className="review-note">{item.note}</p>}
          <div className="photo-grid">
            {item.photoIds.map((id, i) => (
              <Photo key={id} id={id} alt={`Ảnh ${i + 1} bạn lưu tại ${item.name}`} />
            ))}
          </div>
          <p className="muted small">
            {item.reviewedAt
              ? `Đánh giá ${formatDate(item.reviewedAt)}`
              : 'Chưa rõ ngày trải nghiệm cũ'}
            {item.cuisine ? ` · ${item.cuisine}` : ''}
          </p>
          {position && hasConfirmedLocation(item) ? (
            <p className="small">
              Cách GPS khoảng {distanceKm(position, { lat: item.lat!, lng: item.lng! }).toFixed(1)}{' '}
              km đường chim bay.
            </p>
          ) : (
            !hasConfirmedLocation(item) && (
              <p className="muted small">Chưa có ghim xác nhận · không đoán khoảng cách.</p>
            )
          )}
          <div className="quota-note">
            <strong>{quota.statusBadgeText}</strong>
            <span className="small">
              {quota.resetText} · Gợi ý theo từng quán, không phải giới hạn bắt buộc.
            </span>
          </div>
          <div className="button-row">
            <button className="button" onClick={onVisit}>
              <Plus size={16} />
              Lượt ghé & tiền
            </button>
            <button className="button secondary" onClick={onDirections}>
              <Navigation size={16} />
              {hasConfirmedLocation(item) ? 'Chỉ đường' : 'Tìm Maps'}
            </button>
            <button className="button secondary" onClick={onMap}>
              <MapPin size={16} />
              Bản đồ
            </button>
          </div>
          <div className="split">
            <button className="text-button" onClick={onEdit}>
              <Edit3 size={16} />
              {item.isDemo ? 'Chấm lại thành trải nghiệm thật' : 'Sửa đánh giá'}
            </button>
            <button className="text-button danger-text" onClick={onDelete}>
              <Trash2 size={16} />
              Xóa
            </button>
          </div>
          {item.ratingHistory.length > 0 && (
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
      </details>
    </MotionEffect>
  );
}
