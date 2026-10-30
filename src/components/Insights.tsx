import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ReviewDocument, ReviewItem } from '../lib/models.ts';
import { formatDate } from '../lib/models.ts';
import { getCycleRange, getMonthCycleInfo } from '../lib/frequency.ts';
import { getDrinkPriceScore, getFoodPriceScore, VOLUME_OPTIONS } from '../lib/scoring.ts';
function Scatter({ items }: { items: ReviewItem[] }) {
  const svg = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(320);
  useEffect(() => {
    if (!svg.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(240, Math.round(entry.contentRect.width))),
    );
    observer.observe(svg.current);
    return () => observer.disconnect();
  }, [items.length > 0]);
  const [id, setId] = useState<string>();
  const selected = items.find((r) => r.id === id);
  const maxPrice = Math.max(40, ...items.map((r) => r.priceK));
  return (
    <section className="panel stack">
      <h3>Giá & điểm</h3>
      <></>
      {items.length ? (
        <>
          <svg
            className="scatter"
            ref={svg}
            viewBox={`0 0 ${width} 265`}
            role="img"
            aria-label="Biểu đồ giá theo trục ngang và điểm trải nghiệm theo trục dọc"
          >
            {[0, 2, 4, 6, 8, 10].map((n) => (
              <g key={n}>
                <line
                  x1="37"
                  y1={220 - n * 18}
                  x2={width - 15}
                  y2={220 - n * 18}
                  stroke="var(--border-card)"
                />
                <text x="25" y={224 - n * 18} textAnchor="end">
                  {n}
                </text>
              </g>
            ))}
            <line x1="37" x2="37" y1="40" y2="220" stroke="var(--text-muted)" />
            {[0, 0.25, 0.5, 0.75, 1].map((f) => (
              <text key={f} x={37 + f * (width - 52)} y="240" textAnchor="middle">
                {Math.round(maxPrice * f)}k
              </text>
            ))}
            <text x={width / 2} y="260" textAnchor="middle">
              Giá một phần
            </text>
            <text x="39" y="23">
              Điểm /10
            </text>
            {items.map((r) => (
              <circle
                key={r.id}
                cx={37 + (r.priceK / maxPrice) * (width - 52)}
                cy={220 - r.totalScore * 18}
                r={r.id === id ? 8 : 6}
                fill={r.category === 'food' ? 'var(--food-accent)' : 'var(--chart-fill)'}
                stroke="var(--bg-card)"
                strokeWidth="2"
                tabIndex={0}
                role="button"
                aria-label={`${r.name}: ${r.priceK} nghìn, ${r.totalScore} điểm`}
                onClick={() => setId(r.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setId(r.id);
                  }
                }}
              >
                <title>
                  {r.name} · {r.priceK}k · {r.totalScore}đ
                </title>
              </circle>
            ))}
          </svg>
          <p className="small" aria-live="polite">
            {selected
              ? `${selected.name}: ${selected.priceK}k · ${selected.totalScore.toFixed(1)}/10`
              : ''}
          </p>
        </>
      ) : (
        <p className="muted">Chưa có dữ liệu</p>
      )}
    </section>
  );
}
function Comparison({ items }: { items: ReviewItem[] }) {
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const a = items.find((r) => r.id === first) ?? items[0];
  const choices = a
    ? items.filter(
        (r) =>
          r.id !== a.id &&
          r.category === a.category &&
          (r.category === 'food' ? r.foodType === a.foodType : r.mode === a.mode),
      )
    : [];
  const b = choices.find((r) => r.id === second) ?? choices[0];
  if (items.length < 2) return null;
  const criterion = (r: ReviewItem) =>
    r.category === 'food'
      ? [
          r.taste,
          r.foodQuality,
          r.cleanliness,
          r.space,
          getFoodPriceScore(r.priceK, r.foodType).score,
        ]
      : [
          r.taste,
          VOLUME_OPTIONS.find((v) => v.key === r.volumeKey)?.score ?? 0,
          r.packaging,
          ...(r.mode === 'dinein' ? [r.space] : []),
          getDrinkPriceScore(r.priceK, r.mode).score,
        ];
  const labels =
    a?.category === 'food'
      ? ['Độ ngon', 'Chất lượng / khẩu phần', 'Sạch sẽ', 'Không gian', 'Điểm giá']
      : [
          'Hương vị',
          'Lượng đồ uống',
          'Vỏ ly',
          ...(a?.mode === 'dinein' ? ['Không gian'] : []),
          'Điểm giá',
        ];
  return (
    <section className="panel stack">
      <h3>So sánh cùng nhu cầu</h3>
      <label className="field">
        <span>Quán thứ nhất</span>
        <select value={a?.id ?? ''} onChange={(e) => setFirst(e.target.value)}>
          {items.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>
      {b ? (
        <>
          <label className="field">
            <span>Quán thứ hai · cùng loại và hình thức</span>
            <select value={b.id} onChange={(e) => setSecond(e.target.value)}>
              {choices.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <div className="comparison-table">
            <table>
              <thead>
                <tr>
                  <th>Tiêu chí</th>
                  <th>{a.name}</th>
                  <th>{b.name}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Giá một phần</td>
                  <td>{a.priceK}k</td>
                  <td>{b.priceK}k</td>
                </tr>
                {labels.map((label, i) => (
                  <tr key={label}>
                    <td>{label}</td>
                    <td>{criterion(a)[i].toFixed(1)}</td>
                    <td>{criterion(b)[i].toFixed(1)}</td>
                  </tr>
                ))}
                <tr>
                  <th>Điểm tổng</th>
                  <th>{a.totalScore.toFixed(2)}</th>
                  <th>{b.totalScore.toFixed(2)}</th>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="muted small">
          Chưa có quán thứ hai cùng loại và hình thức. Chọn một quán khác hoặc thêm trải nghiệm
          trước khi so sánh.
        </p>
      )}
    </section>
  );
}
export default function Insights({
  document: doc,
  items,
  summary,
  now,
  dataTools,
  onBudget,
  onVisit,
}: {
  document: ReviewDocument;
  items: ReviewItem[];
  summary: string;
  now: Date;
  dataTools: ReactNode;
  onBudget: (value: number | undefined) => Promise<boolean>;
  onVisit: (item: ReviewItem) => void;
}) {
  const [budget, setBudget] = useState(String(doc.settings.monthlyBudgetK ?? ''));
  const [error, setError] = useState('');
  useEffect(
    () => setBudget(String(doc.settings.monthlyBudgetK ?? '')),
    [doc.settings.monthlyBudgetK],
  );
  const real = doc.reviews.filter((r) => !r.isDemo);
  const average = items.length ? items.reduce((s, r) => s + r.totalScore, 0) / items.length : 0;
  const groups = useMemo(() => {
    const map = new Map<string, { label: string; count: number; sum: number }>();
    for (const r of items) {
      const key = JSON.stringify([r.city, r.ward, r.street]);
      const g = map.get(key) ?? {
        label: [r.street, r.ward, r.city].filter(Boolean).join(' • ') || 'Chưa ghi khu vực',
        count: 0,
        sum: 0,
      };
      g.count++;
      g.sum += r.totalScore;
      map.set(key, g);
    }
    return [...map.values()].sort((a, b) => b.sum / b.count - a.sum / a.count);
  }, [items]);
  const { start, end } = getCycleRange('month', now);
  const cycle = real
    .flatMap((item) => item.visitLog.map((visit) => ({ item, visit })))
    .filter(({ visit }) => {
      const t = Date.parse(visit.visitedAt);
      return t >= start.getTime() && t < end.getTime() && t <= now.getTime();
    });
  const total = cycle.reduce((s, x) => s + (x.visit.spentK ?? 0), 0);
  const missing = cycle.filter((x) => x.visit.spentK === undefined).length;
  const days = new Map<string, number>();
  for (const x of cycle) {
    if (x.visit.spentK !== undefined) {
      const date = formatDate(x.visit.visitedAt);
      days.set(date, (days.get(date) ?? 0) + x.visit.spentK);
    }
  }
  const spendDays = [...days.entries()].sort((a, b) =>
    a[0].split('/').reverse().join('').localeCompare(b[0].split('/').reverse().join('')),
  );
  const maxSpend = Math.max(1, ...spendDays.map(([, v]) => v));
  return (
    <div className="stack">
      <h2 className="sr-only">Thống kê theo bộ lọc</h2>
      <div className="stat-grid">
        <div className="panel">
          <span className="small muted">Quán trong bộ lọc</span>
          <strong>{items.length}</strong>
        </div>
        <div className="panel stat-average">
          <span className="small muted">Điểm trung bình</span>
          <strong data-stat="average">{items.length ? average.toFixed(1) : '—'}</strong>
        </div>
        <div className="panel">
          <span className="small muted">Giá một phần TB</span>
          <strong>
            {items.length ? Math.round(items.reduce((s, r) => s + r.priceK, 0) / items.length) : 0}
            <small>k</small>
          </strong>
        </div>
      </div>
      <></>
      <Scatter items={items} />
      <Comparison items={items} />
      <section className="panel stack">
        <h3>Chi tiêu</h3>
        <p className="small muted">{getMonthCycleInfo(now).label} · Tất cả quán</p>
        <div className="split">
          <strong className="score">
            {total.toLocaleString('vi-VN')}
            <small>k đã ghi</small>
          </strong>
          <span>{cycle.length} lượt ghé</span>
        </div>
        {missing > 0 && <p className="notice small">{missing} lượt chưa ghi tiền</p>}
        {doc.settings.monthlyBudgetK !== undefined && (
          <>
            <progress
              max={doc.settings.monthlyBudgetK}
              value={Math.min(total, doc.settings.monthlyBudgetK)}
              aria-label="Chi đã ghi so với ngân sách chu kỳ"
            />
            <p className="small">
              {total > doc.settings.monthlyBudgetK
                ? `Vượt ${(total - doc.settings.monthlyBudgetK).toLocaleString('vi-VN')}k`
                : `Còn ${(doc.settings.monthlyBudgetK - total).toLocaleString('vi-VN')}k`}{' '}
              {missing ? ' (chưa tính các lượt thiếu tiền)' : ''}.
            </p>
          </>
        )}
        <form
          className="stack"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            const n = budget.trim() ? Number(budget) : undefined;
            if (n !== undefined && (!Number.isFinite(n) || n <= 0 || n > 10_000_000)) {
              setError('Ngân sách cần là số dương hợp lệ (nghìn đồng).');
              return;
            }
            setError('');
            void onBudget(n);
          }}
        >
          <label className="field">
            <span>Ngân sách (k)</span>
            <input
              type="number"
              min="1"
              max="10000000"
              inputMode="decimal"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Ngân sách"
            />
          </label>
          <button className="button secondary" type="submit">
            Lưu ngân sách
          </button>
          {error && (
            <p className="alert" role="alert">
              {error}
            </p>
          )}
        </form>
        {!!spendDays.length && (
          <details className="disclosure">
            <summary>Chi đã ghi theo ngày</summary>
            {spendDays.map(([date, value]) => (
              <div key={date} className="spend-row">
                <span className="small">{date}</span>
                <meter min="0" max={maxSpend} value={value} aria-label={`Chi ngày ${date}`} />
                <strong className="mono small">{value}k</strong>
              </div>
            ))}
          </details>
        )}
        <details className="disclosure">
          <summary>Lượt ghé trong chu kỳ ({cycle.length})</summary>
          {cycle
            .sort((a, b) => b.visit.visitedAt.localeCompare(a.visit.visitedAt))
            .map(({ item, visit }) => (
              <button
                className="backup-row"
                key={`${item.id}-${visit.id}`}
                onClick={() => onVisit(item)}
              >
                <span>{item.name}</span>
                <small>
                  {formatDate(visit.visitedAt)} ·{' '}
                  {visit.spentK === undefined ? 'Chưa ghi tiền' : `${visit.spentK}k`}
                </small>
              </button>
            ))}
          {!cycle.length && <p className="muted small">0 lượt</p>}
        </details>
      </section>
      <section className="panel stack">
        <h3>Theo khu vực</h3>
        {groups.map((g) => (
          <div key={g.label} className="area-row">
            <div className="split small">
              <span>{g.label}</span>
              <strong>
                {g.count} quán · {(g.sum / g.count).toFixed(1)}đ
              </strong>
            </div>
            <meter
              min="0"
              max="10"
              value={g.sum / g.count}
              aria-label={`Điểm trung bình ${g.label}`}
            />
          </div>
        ))}
        {!groups.length && <p className="muted">Chưa có dữ liệu</p>}
      </section>
      {dataTools}
    </div>
  );
}
