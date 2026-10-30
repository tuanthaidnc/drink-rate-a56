import { useEffect, useState } from 'react';
import { Download, Upload, ShieldCheck } from 'lucide-react';
import { Dialog } from './Dialog.tsx';
import type { BackupFile, ReviewDocument, Settings } from '../lib/models.ts';
import { formatDate } from '../lib/models.ts';
import {
  makeBackup,
  downloadBlob,
  requestPersistence,
  RecoveryError,
  type Snapshot,
} from '../lib/storage.ts';
import { parseBackup, MAX_BACKUP_BYTES } from '../lib/validation.ts';
export default function DataTools({
  document: doc,
  backups,
  busy,
  error,
  onImport,
  onRestore,
  onSettings,
  onMessage,
}: {
  document: ReviewDocument | null;
  backups: Snapshot[];
  busy: boolean;
  error: Error | null;
  onImport: (file: BackupFile, mode: 'merge' | 'replace') => Promise<boolean>;
  onRestore: (id: string) => Promise<boolean>;
  onSettings: (settings: Settings) => Promise<boolean>;
  onMessage: (message: string) => void;
}) {
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [confirmed, setConfirmed] = useState(false);
  const [localError, setLocalError] = useState('');
  const [working, setWorking] = useState(false);
  const [restore, setRestore] = useState<Snapshot | null>(null);
  const [persistent, setPersistent] = useState<boolean | null>(null);
  const [size, setSize] = useState<number | null>(null);
  useEffect(() => {
    void navigator.storage
      ?.persisted?.()
      .then(setPersistent)
      .catch(() => {});
    void navigator.storage
      ?.estimate?.()
      .then((e) => setSize(e.usage ?? null))
      .catch(() => {});
  }, []);
  const exportData = async () => {
    if (!doc) return;
    setWorking(true);
    setLocalError('');
    try {
      const backup = await makeBackup(doc);
      const raw = JSON.stringify(backup, null, 2);
      parseBackup(raw);
      downloadBlob(
        new Blob([raw], { type: 'application/json' }),
        `not-sao-luu-${new Date().toISOString().slice(0, 10)}.json`,
      );
      onMessage(
        'Đã tạo file sao lưu gồm đánh giá, ảnh và lịch sử ghé. Hãy giữ file ở nơi khác ứng dụng.',
      );
    } catch (e) {
      setLocalError((e as Error).message);
    } finally {
      setWorking(false);
    }
  };
  const duplicates =
    pending && doc
      ? pending.reviews.filter((r) => doc.reviews.some((old) => old.id === r.id)).length
      : 0;
  return (
    <section className="panel stack">
      <h3>Sao lưu & khôi phục</h3>
      <p className="small muted">
        Dữ liệu ở trên thiết bị này. Bản dự phòng tự động giúp hoàn tác; file JSON có cả ảnh giúp
        chuyển máy và lưu một bản bên ngoài ứng dụng.
      </p>
      <div className="button-row">
        <button
          className="button secondary"
          disabled={!doc || working || busy}
          onClick={() => void exportData()}
        >
          <Download size={17} />
          {working ? 'Đang tạo file…' : 'Xuất bản sao JSON'}
        </button>
        <label className={`button secondary file-button ${busy ? 'disabled' : ''}`}>
          <Upload size={17} />
          Khôi phục JSON
          <input
            type="file"
            accept="application/json,.json"
            aria-label="Chọn file JSON để khôi phục"
            disabled={busy || working || !!pending}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              setLocalError('');
              try {
                if (file.size > MAX_BACKUP_BYTES)
                  throw new Error('File quá 75 MB; chưa thay đổi dữ liệu.');
                const parsed = parseBackup(await file.text());
                setMode(doc ? 'merge' : 'replace');
                setConfirmed(false);
                setPending(parsed);
              } catch (e) {
                setLocalError((e as Error).message);
              }
            }}
          />
        </label>
      </div>
      {error instanceof RecoveryError && error.raw && (
        <button
          className="button secondary"
          onClick={() =>
            downloadBlob(
              new Blob([error.raw!], { type: 'application/json' }),
              `not-du-lieu-goc-can-khoi-phuc-${new Date().toISOString().slice(0, 10)}.json`,
            )
          }
        >
          Tải nguyên dữ liệu gốc để giữ lại
        </button>
      )}
      {localError && (
        <p className="alert" role="alert">
          {localError}
        </p>
      )}
      <details className="disclosure">
        <summary>Bản dự phòng tự động trên thiết bị ({backups.length})</summary>
        <p className="small muted">
          Giữ tối đa 20 bản trước các thay đổi. Bản cũ không bị ảnh hưởng khi nhập ảnh có mã trùng.
          Xóa dữ liệu website cũng xóa các bản dự phòng này.
        </p>
        <div className="stack">
          {backups.map((s) => (
            <button className="backup-row" key={s.id} disabled={busy} onClick={() => setRestore(s)}>
              <span>{s.reason}</span>
              <small>
                {formatDate(s.createdAt)} · {s.document.reviews.length} quán
              </small>
            </button>
          ))}
          {!backups.length && <p className="muted small">Chưa có bản dự phòng tự động.</p>}
        </div>
      </details>
      <details className="disclosure">
        <summary>Lưu trữ & chuyển động</summary>
        <div className="stack">
          <p className="small muted">
            {size !== null
              ? `Bộ nhớ website đang dùng khoảng ${(size / 1024 / 1024).toFixed(1)} MB. `
              : ''}
            {persistent === true
              ? 'Trình duyệt đã cho phép lưu bền vững.'
              : 'Hãy giữ file sao lưu riêng, kể cả khi đã cài ứng dụng.'}
          </p>
          {persistent !== true && (
            <button
              className="button secondary"
              onClick={async () => {
                try {
                  const result = await requestPersistence();
                  setPersistent(result);
                  onMessage(
                    result
                      ? 'Đã được trình duyệt cho phép lưu bền vững. Vẫn nên giữ file sao lưu riêng.'
                      : 'Trình duyệt chưa cấp lưu bền vững. Dữ liệu hiện tại được giữ; hãy xuất file định kỳ.',
                  );
                } catch {
                  onMessage('Chưa cấp được lưu bền vững. Bạn vẫn có thể xuất file sao lưu.');
                }
              }}
            >
              <ShieldCheck size={17} />
              Đề nghị giữ dữ liệu bền vững
            </button>
          )}
          <label className="check">
            <input
              type="checkbox"
              checked={doc?.settings.reducedMotion ?? false}
              disabled={!doc || busy}
              onChange={(e) => void onSettings({ reducedMotion: e.target.checked })}
            />
            Giảm chuyển động trong ứng dụng
          </label>
        </div>
      </details>
      {pending && (
        <Dialog
          title="Kiểm tra trước khi khôi phục"
          onClose={() => {
            if (!busy) setPending(null);
          }}
        >
          <div className="stack">
            <p>
              File hợp lệ: <strong>{pending.reviews.length} quán</strong>,{' '}
              {pending.reviews.reduce((n, r) => n + r.visitLog.length, 0)} lượt ghé,{' '}
              {pending.media.length} ảnh. Có {pending.reviews.filter((r) => r.isDemo).length} quán
              minh họa được giữ riêng.
            </p>
            <p className="small muted">
              Điểm được tính lại theo công thức đã chốt. Bản dữ liệu trước khi nhập sẽ được lưu dự
              phòng.
            </p>
            {doc && (
              <fieldset>
                <legend>Cách khôi phục</legend>
                <label className="check">
                  <input
                    type="radio"
                    name="import-mode"
                    checked={mode === 'merge'}
                    onChange={() => {
                      setMode('merge');
                      setConfirmed(false);
                    }}
                  />
                  Gộp thêm; giữ nguyên {duplicates} quán trùng mã đang có
                </label>
                <label className="check">
                  <input
                    type="radio"
                    name="import-mode"
                    checked={mode === 'replace'}
                    onChange={() => {
                      setMode('replace');
                      setConfirmed(false);
                    }}
                  />
                  Thay toàn bộ {doc.reviews.length} quán bằng dữ liệu file
                </label>
              </fieldset>
            )}
            {mode === 'replace' && (
              <label className="check">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                Tôi đã kiểm tra file và đồng ý thay danh sách hiện tại
                {pending.reviews.length === 0 ? ' bằng danh sách rỗng' : ''}.
              </label>
            )}
            <div className="button-row">
              <button className="button secondary" disabled={busy} onClick={() => setPending(null)}>
                Giữ dữ liệu hiện tại
              </button>
              <button
                className="button"
                disabled={busy || (mode === 'replace' && !confirmed)}
                onClick={async () => {
                  if (await onImport(pending, mode)) {
                    setPending(null);
                    onMessage('Khôi phục thành công; bản dữ liệu trước đó vẫn ở mục dự phòng.');
                  }
                }}
              >
                {busy ? 'Đang khôi phục…' : 'Xác nhận khôi phục'}
              </button>
            </div>
          </div>
        </Dialog>
      )}
      {restore && (
        <Dialog
          title="Khôi phục bản dự phòng?"
          onClose={() => {
            if (!busy) setRestore(null);
          }}
        >
          <p>
            Khôi phục {restore.document.reviews.length} quán từ bản “{restore.reason}”, ngày{' '}
            {formatDate(restore.createdAt)}. Danh sách hiện tại cũng được lưu thành một bản dự phòng
            trước khi thay đổi.
          </p>
          <div className="button-row">
            <button className="button secondary" disabled={busy} onClick={() => setRestore(null)}>
              Giữ hiện tại
            </button>
            <button
              className="button"
              disabled={busy}
              onClick={async () => {
                if (await onRestore(restore.id)) {
                  setRestore(null);
                  onMessage('Đã khôi phục bản dự phòng.');
                }
              }}
            >
              Khôi phục bản này
            </button>
          </div>
        </Dialog>
      )}
    </section>
  );
}
