import { useState } from 'react';
import { Dialog } from './Dialog.tsx';
import { newId, formatDate, type ReviewItem, type Visit } from '../lib/models.ts';
import { validateVisit } from '../lib/validation.ts';
import { getQuotaStatus } from '../lib/frequency.ts';
function dateTimeInput(value: string) {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(value));
  const v = (t: string) => p.find((p) => p.type === t)!.value;
  return `${v('year')}-${v('month')}-${v('day')}T${v('hour')}:${v('minute')}`;
}
export default function VisitManager({
  item,
  now,
  busy,
  onSave,
  onDelete,
  onClose,
}: {
  item: ReviewItem;
  now: Date;
  busy: boolean;
  onSave: (visit: Visit, editing: boolean) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [at, setAt] = useState(() => dateTimeInput(new Date().toISOString()));
  const [spent, setSpent] = useState('');
  const [dish, setDish] = useState(item.dish ?? '');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<Visit | null>(null);
  const [undo, setUndo] = useState<Visit | null>(null);
  const quota = getQuotaStatus(item, undefined, undefined, now);
  const reset = () => {
    setEditing(null);
    setAt(dateTimeInput(new Date().toISOString()));
    setSpent('');
    setDish(item.dish ?? '');
    setNote('');
    setError('');
  };
  const save = async () => {
    setError('');
    try {
      const visit = validateVisit({
        id: editing ?? newId('visit'),
        visitedAt: new Date(`${at}+07:00`).toISOString(),
        ...(spent.trim() ? { spentK: Number(spent) } : {}),
        dish,
        note,
      });
      if (await onSave(visit, !!editing)) reset();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <Dialog title={`Lượt ghé · ${item.name}`} onClose={onClose}>
      <div className="stack">
        <p className="small muted">
          {quota.tier.label} · {quota.used} lượt trong chu kỳ này · {quota.resetText}. Vẫn có thể
          ghi lần ghé thực tế khi đã vượt gợi ý.
        </p>
        <form
          className="panel stack"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <h3>{editing ? 'Sửa lượt ghé' : 'Ghi một lần đã ghé'}</h3>
          <label className="field">
            <span>
              Ngày, giờ ghé <small>· giờ Việt Nam</small>
            </span>
            <input
              type="datetime-local"
              value={at}
              max={dateTimeInput(new Date().toISOString())}
              onChange={(e) => setAt(e.target.value)}
            />
          </label>
          <label className="field">
            <span>
              Tiền thực trả <small>· nghìn đồng (k)</small>
            </span>
            <input
              type="number"
              min="0"
              max="1000000"
              step="0.5"
              inputMode="decimal"
              value={spent}
              onChange={(e) => setSpent(e.target.value)}
              placeholder="Để trống nếu chưa nhớ"
            />
            <small>Ứng dụng không lấy giá đánh giá để đoán tiền bạn đã trả.</small>
          </label>
          <label className="field">
            <span>Món đã gọi</span>
            <input maxLength={300} value={dish} onChange={(e) => setDish(e.target.value)} />
          </label>
          <label className="field">
            <span>Ghi chú lần này</span>
            <textarea
              rows={2}
              maxLength={1000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          {error && (
            <p role="alert" className="alert">
              {error}
            </p>
          )}
          <div className="button-row">
            <button className="button" type="submit" disabled={busy}>
              {busy ? 'Đang lưu…' : editing ? 'Lưu sửa lượt ghé' : 'Ghi nhận đã ghé'}
            </button>
            {editing && (
              <button type="button" className="button secondary" onClick={reset}>
                Hủy sửa
              </button>
            )}
          </div>
        </form>
        {undo && (
          <div role="status" className="notice">
            <p>Đã bỏ một lượt ghé.</p>
            <button
              className="text-button"
              disabled={busy}
              onClick={async () => {
                if (await onSave(undo, false)) setUndo(null);
              }}
            >
              Hoàn tác bỏ lượt ghé
            </button>
          </div>
        )}
        <h3>Lịch sử ({item.visitLog.length})</h3>
        {!item.visitLog.length && <p className="muted">Chưa ghi lượt ghé nào.</p>}
        {[...item.visitLog]
          .sort((a, b) => b.visitedAt.localeCompare(a.visitedAt))
          .map((v) => (
            <div className="visit-row" key={v.id}>
              <div className="split">
                <strong>{formatDate(v.visitedAt)}</strong>
                <span className="mono">
                  {v.spentK === undefined ? 'Chưa ghi tiền' : `${v.spentK}k`}
                </span>
              </div>
              {v.dish && <p className="small">{v.dish}</p>}
              {v.note && <p className="small muted">{v.note}</p>}
              <div className="split">
                <button
                  className="text-button"
                  onClick={() => {
                    setEditing(v.id);
                    setAt(dateTimeInput(v.visitedAt));
                    setSpent(v.spentK === undefined ? '' : String(v.spentK));
                    setDish(v.dish ?? '');
                    setNote(v.note ?? '');
                    setError('');
                    document
                      .querySelector('dialog[open] .dialog-body')
                      ?.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Sửa lượt ghé
                </button>
                <button className="text-button danger-text" onClick={() => setDeleting(v)}>
                  Bỏ lượt ghi nhầm
                </button>
              </div>
            </div>
          ))}
        {deleting && (
          <Dialog title="Bỏ lượt ghi nhầm?" onClose={() => setDeleting(null)}>
            <p>
              Lượt ngày {formatDate(deleting.visitedAt)}
              {deleting.spentK !== undefined ? `, ${deleting.spentK}k` : ''} sẽ được bỏ khỏi lịch
              sử. Bạn có thể hoàn tác hoặc khôi phục bản dự phòng.
            </p>
            <div className="button-row">
              <button className="button secondary" onClick={() => setDeleting(null)}>
                Giữ lại
              </button>
              <button
                className="button danger"
                disabled={busy}
                onClick={async () => {
                  const old = deleting;
                  if (await onDelete(old.id)) {
                    setUndo(old);
                    setDeleting(null);
                    if (editing === old.id) reset();
                  }
                }}
              >
                Bỏ lượt này
              </button>
            </div>
          </Dialog>
        )}
      </div>
    </Dialog>
  );
}
