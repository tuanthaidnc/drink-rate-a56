import * as ToggleGroup from '@animate-ui/react/primitives/radix-ui/toggle-group';
import { useState } from 'react';
import { Search, SlidersHorizontal, X, LocateFixed } from 'lucide-react';
import { Dialog } from './Dialog.tsx';
import { DEFAULT_FILTERS, describeFilters, type Filters } from '../lib/selection.ts';
import type { ReviewItem } from '../lib/models.ts';
import type { Position } from '../lib/geo.ts';
export default function FilterBar({
  items,
  filters,
  onChange,
  position,
  onLocate,
  locating,
  theme,
}: {
  items: ReviewItem[];
  filters: Filters;
  onChange: (value: Filters) => void;
  position: Position | null;
  onLocate: () => void;
  locating: boolean;
  theme: 'dark' | 'light';
}) {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const real = items.filter((r) => !r.isDemo);
  const cities = [...new Set(real.map((r) => r.city).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'vi'),
  );
  const wards = [
    ...new Set(
      real
        .filter((r) => filters.city === 'ALL' || r.city === filters.city)
        .map((r) => r.ward)
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, 'vi'));
  const streets = [
    ...new Set(
      real
        .filter(
          (r) =>
            (filters.city === 'ALL' || r.city === filters.city) &&
            (filters.ward === 'ALL' || r.ward === filters.ward),
        )
        .map((r) => r.street)
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, 'vi'));
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onChange({ ...filters, [key]: value });
  return (
    <>
      <div className="filters-header stack" data-search-open={searchOpen || !!filters.search}>
        <ToggleGroup.Root
          key={theme}
          type="single"
          className="category-tabs"
          aria-label="Lọc loại quán"
          value={filters.category}
          onValueChange={(value) => {
            if (value)
              onChange({ ...filters, category: value as Filters['category'], mode: 'ALL' });
          }}
        >
          {(
            [
              ['ALL', 'Tất cả'],
              ['drink', 'Nước'],
              ['food', 'Ăn'],
            ] as const
          ).map(([key, label]) => (
            <ToggleGroup.Item
              key={key}
              value={key}
              aria-label={`${key === 'ALL' ? 'Tất cả' : key === 'drink' ? 'Quán nước' : 'Quán ăn'} (${key === 'ALL' ? real.length : real.filter((r) => r.category === key).length})`}
            >
              {label}{' '}
              <small className="sr-only">
                ({key === 'ALL' ? real.length : real.filter((r) => r.category === key).length})
              </small>
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
        <div className="search-row">
          <button
            className="icon-button search-toggle"
            aria-label="Mở tìm kiếm"
            onClick={() => setSearchOpen((v) => !v)}
            aria-expanded={searchOpen || !!filters.search}
          >
            <Search size={18} />
          </button>
          <label className="search-field">
            <Search size={17} />
            <span className="sr-only">Tìm quán, món, đường hoặc ghi chú</span>
            <input
              type="search"
              value={filters.search}
              onChange={(e) => set('search', e.target.value)}
              placeholder="Tìm quán…"
            />
            {filters.search && (
              <button
                className="icon-button"
                aria-label="Xóa nội dung tìm kiếm"
                onClick={() => set('search', '')}
              >
                <X size={16} />
              </button>
            )}
          </label>
          <button className="button secondary" onClick={() => setOpen(true)}>
            <SlidersHorizontal size={17} />
            <span className="sr-only">Bộ lọc</span>
          </button>
        </div>
        {JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS) && (
          <button
            className="scope-summary"
            onClick={() => setOpen(true)}
            aria-label={`Chỉnh bộ lọc: ${describeFilters(filters)}`}
          >
            {describeFilters(filters)}
          </button>
        )}
      </div>
      {open && (
        <Dialog title="Chọn quán theo nhu cầu" onClose={() => setOpen(false)}>
          <div className="stack">
            <div className="two-columns">
              <label className="field">
                <span>Tỉnh / thành phố đã lưu</span>
                <select
                  value={filters.city}
                  onChange={(e) =>
                    onChange({ ...filters, city: e.target.value, ward: 'ALL', street: 'ALL' })
                  }
                >
                  <option value="ALL">Tất cả tỉnh/thành</option>
                  {cities.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Phường / xã đã lưu</span>
                <select
                  value={filters.ward}
                  onChange={(e) => onChange({ ...filters, ward: e.target.value, street: 'ALL' })}
                >
                  <option value="ALL">Tất cả phường/xã</option>
                  {wards.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              <span>Đường đã lưu</span>
              <select value={filters.street} onChange={(e) => set('street', e.target.value)}>
                <option value="ALL">Tất cả đường</option>
                {streets.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <div className="two-columns">
              <label className="field">
                <span>
                  Giá tối đa <small>· k/phần</small>
                </span>
                <input
                  type="number"
                  min="1"
                  max="2000"
                  inputMode="decimal"
                  placeholder="Không giới hạn"
                  value={filters.maxPriceK ?? ''}
                  onChange={(e) => set('maxPriceK', e.target.value ? Number(e.target.value) : null)}
                />
              </label>
              <label className="field">
                <span>Điểm tối thiểu</span>
                <select
                  value={filters.minScore}
                  onChange={(e) => set('minScore', Number(e.target.value))}
                >
                  <option value="0">Mọi mức điểm</option>
                  <option value="6.8">Từ 6,8 · khá ổn</option>
                  <option value="7.5">Từ 7,5 · đáng quay lại</option>
                  <option value="8.5">Từ 8,5 · quán ruột</option>
                </select>
              </label>
            </div>
            <label className="field">
              <span>Hình thức</span>
              <select
                value={filters.mode}
                onChange={(e) => set('mode', e.target.value as Filters['mode'])}
              >
                <option value="ALL">Mọi hình thức</option>
                <option value="takeaway">Nước · mang đi</option>
                <option value="dinein">Nước · ngồi lại</option>
                <option value="streetfood">Ăn · vỉa hè / bình dân</option>
                <option value="restaurant">Ăn · quán / nhà hàng</option>
              </select>
            </label>
            <div className="panel compact stack">
              <button className="button secondary" disabled={locating} onClick={onLocate}>
                <LocateFixed size={18} />
                {locating
                  ? 'Đang lấy GPS…'
                  : position
                    ? 'Cập nhật GPS của tôi'
                    : 'Lấy vị trí của tôi'}
              </button>
              <label className="field">
                <span>
                  Gần tôi <small>· đường chim bay</small>
                </span>
                <select
                  value={filters.radiusKm ?? ''}
                  onChange={(e) => set('radiusKm', e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Không giới hạn khoảng cách</option>
                  <option value="1">Trong 1 km</option>
                  <option value="3">Trong 3 km</option>
                  <option value="5">Trong 5 km</option>
                  <option value="10">Trong 10 km</option>
                </select>
              </label>
              {position && (
                <span className="small muted">
                  GPS{position.accuracyM ? ` ±${Math.round(position.accuracyM)}m` : ''}
                </span>
              )}
            </div>
            <label className="check">
              <input
                type="checkbox"
                checked={filters.onlyAvailable}
                onChange={(e) => set('onlyAvailable', e.target.checked)}
              />
              Chỉ quán còn lượt gợi ý trong chu kỳ
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={filters.onlyOpen}
                onChange={(e) => set('onlyOpen', e.target.checked)}
              />
              Đang mở theo giờ tôi đã kiểm tra
            </label>
            <></>
            <label className="field">
              <span>Tránh quán vừa ghé</span>
              <select
                value={filters.avoidDays}
                onChange={(e) => set('avoidDays', Number(e.target.value))}
              >
                <option value="0">Không giới hạn</option>
                <option value="1">Trong 1 ngày gần đây</option>
                <option value="3">Trong 3 ngày gần đây</option>
                <option value="7">Trong 7 ngày gần đây</option>
                <option value="14">Trong 14 ngày gần đây</option>
              </select>
            </label>
            <div className="button-row">
              <button className="button secondary" onClick={() => onChange({ ...DEFAULT_FILTERS })}>
                Xóa tất cả điều kiện
              </button>
              <button className="button" onClick={() => setOpen(false)}>
                Xem kết quả
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
