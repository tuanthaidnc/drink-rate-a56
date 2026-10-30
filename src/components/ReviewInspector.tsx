import { MapPin, Navigation, Plus, Edit3, Trash2, ExternalLink } from 'lucide-react';
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
import { Badge } from './ui/badge.tsx';
import { Separator } from './ui/separator.tsx';
import { Button } from './ui/button.tsx';
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
  if (!item)
    return (
      <aside className="review-inspector">
        <p className="muted">Chọn một quán để xem chi tiết trải nghiệm.</p>
      </aside>
    );
  const food = item.category === 'food',
    quota = getQuotaStatus(item, undefined, undefined, now);
  const parts = food
    ? [
        ['Độ ngon', item.taste],
        ['Chất lượng', item.foodQuality],
        ['Sạch sẽ', item.cleanliness],
        ['Không gian', item.space],
        ['Giá', getFoodPriceScore(item.priceK, item.foodType).score],
      ]
    : [
        ['Hương vị', item.taste],
        ['Giá', getDrinkPriceScore(item.priceK, item.mode).score],
        ['Lượng', VOLUME_OPTIONS.find((v) => v.key === item.volumeKey)!.score],
        ['Vỏ ly', item.packaging],
        ...(item.mode === 'dinein' ? [['Không gian', item.space]] : []),
      ];
  return (
    <aside className="review-inspector stack">
      <div className="split">
        <h2>{item.name}</h2>
        <button className="icon-button" aria-label={`Sửa ${item.name}`} onClick={onEdit}>
          <Edit3 />
        </button>
      </div>
      <div className="badges">
        <Badge variant="secondary">{food ? 'Quán ăn' : 'Quán nước'}</Badge>
        <Badge variant="secondary">
          {food
            ? item.foodType === 'streetfood'
              ? 'Bình dân'
              : 'Quán ngồi'
            : item.mode === 'takeaway'
              ? 'Mang đi'
              : 'Ngồi lại'}
        </Badge>
        <Badge variant="outline">{item.priceK}k</Badge>
      </div>
      <p className="inspector-address">
        <MapPin />
        {[item.address, item.street, item.ward, item.city].filter(Boolean).join(' · ')}
      </p>
      <div className="inspector-result">
        <strong>
          {item.totalScore.toFixed(1)}
          <small>/10</small>
        </strong>
        <div>
          <span>{getTierStyle(item.totalScore, item.category).shortLabel}</span>
          <small>{quota.tier.label}</small>
        </div>
      </div>
      <div className="stack">
        <h3>Tiêu chí chấm điểm</h3>
        <div className="score-breakdown">
          {parts.map(([label, value]) => (
            <div key={String(label)} className="criterion">
              <div className="split small">
                <span>{label}</span>
                <strong className="mono">{Number(value).toFixed(1)}</strong>
              </div>
              <meter min="0" max="10" value={Number(value)} aria-label={String(label)} />
            </div>
          ))}
        </div>
      </div>
      {item.placeResolution?.status === 'verified' && (
        <a
          className="source-link"
          href={item.placeResolution.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink />
          Địa điểm đã đối chiếu Maps
        </a>
      )}
      <Separator />
      <section className="stack">
        <h3>Ghi chú cá nhân</h3>
        <p className="inspector-note">
          {item.dish && (
            <strong>
              {item.dish}
              <br />
            </strong>
          )}
          {item.note || 'Chưa ghi chú cho trải nghiệm này.'}
        </p>
        {item.photoIds.length > 0 && (
          <div className="photo-grid">
            {item.photoIds.map((id, i) => (
              <Photo key={id} id={id} alt={`Ảnh ${i + 1} bạn lưu tại ${item.name}`} />
            ))}
          </div>
        )}
        <p className="small muted">
          {item.reviewedAt
            ? `Đánh giá ${formatDate(item.reviewedAt)}`
            : 'Chưa rõ ngày trải nghiệm cũ'}
          {item.cuisine ? ` · ${item.cuisine}` : ''}
        </p>
      </section>
      <div className="quota-note">
        <strong>{quota.statusBadgeText}</strong>
        <span className="small">{quota.resetText} · Gợi ý theo từng quán.</span>
      </div>
      <Button onClick={onVisit}>
        <Plus data-icon="inline-start" />
        Lượt ghé & tiền
      </Button>
      <Button variant="outline" onClick={onDirections}>
        <Navigation data-icon="inline-start" />
        {hasConfirmedLocation(item) ? 'Chỉ đường' : 'Tìm Maps'}
      </Button>
      <Button variant="outline" onClick={onMap}>
        <MapPin data-icon="inline-start" />
        Bản đồ
      </Button>
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
      <div className="split">
        <button className="text-button danger-text" onClick={onDelete}>
          <Trash2 />
          Xóa quán
        </button>
        <button className="text-button" onClick={onEdit}>
          <Edit3 />
          Chỉnh sửa
        </button>
      </div>
    </aside>
  );
}
