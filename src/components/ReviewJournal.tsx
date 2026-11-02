import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, ImageOff } from 'lucide-react';
import { motion } from 'motion/react';
import { Photo } from './Photo.tsx';
import { useQuietMotion } from './motion/kinetic.tsx';
import { adjacentMonth, journalDay, journalGroups, monthCells } from '../lib/journal.ts';
import type { ReviewItem } from '../lib/models.ts';
const time = (r: ReviewItem) =>
  new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(r.reviewedAt ?? r.createdAt));
export default function ReviewJournal({
  items,
  now,
  onSelect,
}: {
  items: ReviewItem[];
  now: Date;
  onSelect: (r: ReviewItem) => void;
}) {
  const groups = useMemo(() => journalGroups(items), [items]);
  const today = journalDay(now);
  const [day, setDay] = useState(() => [...groups.keys()][0] ?? today);
  const [month, setMonth] = useState(day.slice(0, 7));
  const [direction, setDirection] = useState(1);
  const quiet = useQuietMotion();
  const cells = monthCells(month);
  const selected = groups.get(day) ?? [];
  const shift = (delta: number) => {
    setDirection(delta);
    const next = adjacentMonth(month, delta);
    setMonth(next);
    setDay([...groups.keys()].find((d) => d.startsWith(next)) ?? `${next}-01`);
  };
  const title = `Tháng ${Number(month.slice(5))}, ${month.slice(0, 4)}`;
  return (
    <div className="journal-page stack">
      <div className="page-heading">
        <h1>Nhật ký</h1>
        <button
          className="text-button"
          onClick={() => {
            setMonth(today.slice(0, 7));
            setDay(today);
          }}
        >
          Hôm nay
        </button>
      </div>
      <div className="journal-month">
        <button className="icon-button" aria-label="Tháng trước" onClick={() => shift(-1)}>
          <ChevronLeft />
        </button>
        <h2>{title}</h2>
        <button className="icon-button" aria-label="Tháng sau" onClick={() => shift(1)}>
          <ChevronRight />
        </button>
      </div>
      <div className="journal-week" aria-hidden="true">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <motion.div
        key={month}
        className="journal-calendar"
        role="group"
        aria-label={title}
        initial={
          quiet ? false : { opacity: 0.6, x: direction * 14, clipPath: 'inset(0 2% round 12px)' }
        }
        animate={{ opacity: 1, x: 0, clipPath: 'inset(0 0 round 12px)' }}
        transition={{ duration: quiet ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {cells.map((d, i) =>
          d ? (
            <button
              key={d}
              className="journal-day"
              data-today={d === today}
              aria-pressed={d === day}
              aria-label={`${d.split('-').reverse().join('/')} · ${groups.get(d)?.length ?? 0} đánh giá`}
              onClick={() => setDay(d)}
            >
              {groups.get(d)?.[0]?.photoIds[0] && (
                <Photo id={groups.get(d)![0].photoIds[0]} alt="" preview={false} />
              )}
              <span>{Number(d.slice(-2))}</span>
              {(groups.get(d)?.length ?? 0) > 1 && <small>{groups.get(d)!.length}</small>}
              {groups.has(d) && !groups.get(d)![0].photoIds[0] && <i aria-hidden="true" />}
            </button>
          ) : (
            <span key={`empty-${i}`} />
          ),
        )}
      </motion.div>
      <section className="journal-selection" aria-label="Đánh giá trong ngày">
        <h2>
          {Number(day.slice(-2))} tháng {Number(day.slice(5, 7))}
          <span>{selected.length} đánh giá</span>
        </h2>
        {selected.length ? (
          <div className="journal-photos">
            {selected.map((r) => (
              <motion.button
                key={r.id}
                type="button"
                className="journal-photo-entry"
                whileTap={quiet ? undefined : { scale: 0.97 }}
                onClick={() => onSelect(r)}
                aria-label={`${r.name} · ${r.totalScore.toFixed(1)} điểm · ${time(r)}`}
              >
                <div className="journal-photo">
                  {r.photoIds[0] ? (
                    <Photo id={r.photoIds[0]} alt={r.name} preview={false} />
                  ) : (
                    <div className="journal-no-photo">
                      <ImageOff />
                    </div>
                  )}
                  <time>{time(r)}</time>
                  <strong>{r.totalScore.toFixed(1)}</strong>
                </div>
                <div className="journal-caption">
                  <strong>{r.name}</strong>
                  <span>{r.priceK}k</span>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="journal-empty">
            <CalendarDays />
            <p>Chưa có đánh giá</p>
          </div>
        )}
      </section>
    </div>
  );
}
