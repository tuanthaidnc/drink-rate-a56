import { memo } from 'react';
import { motion } from 'motion/react';
import { Camera } from 'lucide-react';
import type { ReviewItem } from '../lib/models.ts';
import { Photo } from './Photo.tsx';
import { useQuietMotion } from './motion/kinetic.tsx';

export default memo(function ReviewCard({
  item,
  index,
  selected,
  onInspect,
}: {
  item: ReviewItem;
  index: number;
  selected: boolean;
  onInspect: () => void;
}) {
  const quiet = useQuietMotion();
  return (
    <motion.article
      className="album-entry"
      data-selected={selected}
      data-category={item.category}
      data-motion="card"
      layout={quiet ? false : 'position'}
      initial={quiet ? false : { opacity: 0.6, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: quiet ? 0 : 0.28,
        delay: quiet ? 0 : Math.min(index, 4) * 0.035,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <motion.button
        type="button"
        className="album-tile"
        onClick={onInspect}
        aria-label={`${item.name} · ${item.totalScore.toFixed(1)} điểm · ${item.priceK}k · ${[item.address, item.street, item.ward].filter(Boolean).join(', ')}`}
        aria-haspopup="dialog"
        whileTap={quiet ? undefined : { scale: 0.96 }}
      >
        <span className="album-cover">
          {item.photoIds[0] ? (
            <Photo id={item.photoIds[0]} alt={`Ảnh tại ${item.name}`} preview={false} />
          ) : (
            <span className="album-no-photo" role="img" aria-label="Chưa có ảnh">
              <span className="album-initial" aria-hidden="true">
                {item.name.trim().slice(0, 1).toLocaleUpperCase('vi')}
              </span>
              <Camera size={19} aria-hidden="true" />
            </span>
          )}
          <span className="album-score">
            {item.totalScore.toFixed(1)}
            <span className="sr-only"> điểm</span>
          </span>
          <span className="album-price">
            {item.priceK}
            <small>k</small>
          </span>
          {item.photoIds.length > 1 && (
            <span className="album-photo-count" aria-label={`${item.photoIds.length} ảnh`}>
              {item.photoIds.length}
            </span>
          )}
        </span>
        <span className="album-caption">
          <strong>{item.name}</strong>
          <span>
            {[item.address, item.street].filter(Boolean).join(' ') || item.ward || item.city}
          </span>
        </span>
      </motion.button>
    </motion.article>
  );
});
