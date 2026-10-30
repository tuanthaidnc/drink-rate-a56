import { useEffect, useMemo, useState } from 'react';
import { Dialog } from './Dialog.tsx';
import {
  loadAdminData,
  matchProvince,
  shortProvince,
  shortWard,
  type AdminData,
} from '../lib/geo.ts';
import { normalizeSearch } from '../lib/models.ts';
export function LocationPicker({
  city,
  ward,
  onSelect,
  onClose,
}: {
  city: string;
  ward: string;
  onSelect: (value: {
    city: string;
    ward: string;
    provinceCode: string;
    wardCode?: string;
  }) => void;
  onClose: () => void;
}) {
  const [data, setData] = useState<AdminData>();
  const [error, setError] = useState('');
  const [province, setProvince] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    let cancelled = false;
    void loadAdminData()
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setProvince(matchProvince(d, city)?.code ?? '');
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [city]);
  const current = data?.provinces.find((p) => p.code === province);
  const choices = useMemo(() => {
    const q = normalizeSearch(query);
    return (current ? current.wards : (data?.provinces ?? [])).filter((x) =>
      normalizeSearch(x.name).includes(q),
    );
  }, [data, current, query]);
  return (
    <Dialog title="Chọn tỉnh và phường/xã" onClose={onClose}>
      <p className="muted small">
        34 tỉnh/thành • 3.321 phường/xã/đặc khu. Danh mục 01/07/2025, lưu sẵn trên thiết bị khi ứng
        dụng sẵn sàng offline.
      </p>
      {current && (
        <button
          className="button secondary w-full"
          onClick={() => {
            setProvince('');
            setQuery('');
          }}
        >
          ‹ Đổi tỉnh/thành · {current.name}
        </button>
      )}
      <label className="field">
        <span>{current ? 'Tìm phường/xã' : 'Tìm tỉnh/thành'}</span>
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={current ? 'Ví dụ: Thanh Khê' : 'Ví dụ: Đà Nẵng'}
        />
      </label>
      {error && (
        <p role="alert" className="alert">
          {error}
        </p>
      )}
      {!data && !error && <p role="status">Đang mở danh mục…</p>}
      <div className="location-options">
        {choices.map((x) => (
          <button
            key={x.code}
            className="location-option"
            aria-pressed={
              !!current && normalizeSearch(shortWard(x.name)) === normalizeSearch(shortWard(ward))
            }
            onClick={() => {
              if (!current) {
                setProvince(x.code);
                setQuery('');
                return;
              }
              onSelect({
                city: shortProvince(current.name),
                ward: shortWard(x.name),
                provinceCode: current.code,
                wardCode: x.code,
              });
              onClose();
            }}
          >
            <span>{x.name}</span>
            <span className="muted small">{x.code}</span>
          </button>
        ))}
        {data && !choices.length && (
          <p className="muted">Không tìm thấy. Hãy thử tên không dấu hoặc chọn lại tỉnh.</p>
        )}
      </div>
      <details className="disclosure small">
        <summary>Nguồn danh mục</summary>
        <p>
          Danh mục theo Quyết định 19/2025/QĐ-TTg; dữ liệu chuyển dạng VietnamProvinces, tải
          30/10/2026. Địa chỉ cũ của bạn được giữ nguyên nếu chưa đối chiếu được mã.
        </p>
        <a
          href="https://vanban.chinhphu.vn/?docid=214409&pageid=27160"
          target="_blank"
          rel="noreferrer"
        >
          Văn bản danh mục
        </a>{' '}
        ·{' '}
        <a href="https://provinces.open-api.vn/" target="_blank" rel="noreferrer">
          Nguồn chuyển dạng
        </a>
      </details>
    </Dialog>
  );
}
