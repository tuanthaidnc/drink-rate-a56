import { lazy, Suspense, useMemo, useState } from 'react';
import { Check, MapPin, Camera, X } from 'lucide-react';
import type { ReviewItem, PhotoData, DrinkMode, FoodVenueType } from '../lib/models.ts';
import { hasConfirmedLocation } from '../lib/models.ts';
import { validateReview } from '../lib/validation.ts';
import {
  scoreReview,
  getTierStyle,
  getDrinkPriceScore,
  getFoodPriceScore,
  TAKEAWAY_PRICE_PRESETS,
  DINEIN_PRICE_PRESETS,
  STREETFOOD_PRICE_PRESETS,
  RESTAURANT_PRICE_PRESETS,
  VOLUME_OPTIONS,
} from '../lib/scoring.ts';
import { getFreqTier, localDayParts } from '../lib/frequency.ts';
import { compressPhoto } from '../lib/storage.ts';
import { CategoryScoreBadge, StarRatingBadge } from './animate-ui/primitives.tsx';
import { LocationPicker } from './LocationPicker.tsx';
import { Photo } from './Photo.tsx';
const PinPicker = lazy(() => import('./PinPicker.tsx'));
const dateInput = (value: string) => {
  const p = localDayParts(new Date(value));
  return `${p.year}-${String(p.month + 1).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
};
function ScoreSlider({
  label,
  weight,
  value,
  onChange,
}: {
  label: string;
  weight: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const id = label.replace(/\s+/g, '-');
  return (
    <label className="score-field" htmlFor={id}>
      <span className="split">
        <span>
          {label} <small>({weight}%)</small>
        </span>
        <output className="mono">{value.toFixed(1)}</output>
      </span>
      <input
        className="precision-slider"
        id={id}
        type="range"
        min="1"
        max="10"
        step="0.5"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={`${value} trên 10`}
      />
    </label>
  );
}
export default function ReviewForm({
  initial,
  isEdit,
  theme,
  busy,
  isTyping,
  existing,
  onSave,
  onCancel,
}: {
  initial: ReviewItem;
  isEdit: boolean;
  theme: 'dark' | 'light';
  busy: boolean;
  isTyping: boolean;
  existing: ReviewItem[];
  onSave: (
    item: ReviewItem,
    photos: PhotoData[],
    firstVisit: boolean,
    expectedUpdatedAt: string,
  ) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<ReviewItem>(() => structuredClone(initial));
  const [price, setPrice] = useState(String(initial.priceK));
  const [reviewDate, setReviewDate] = useState(
    dateInput(initial.reviewedAt ?? new Date().toISOString()),
  );
  const [error, setError] = useState('');
  const [location, setLocation] = useState(false);
  const [pinPicker, setPinPicker] = useState(false);
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [firstVisit, setFirstVisit] = useState(false);
  const change = <K extends keyof ReviewItem>(key: K, value: ReviewItem[K]) =>
    setDraft((r) => ({
      ...r,
      [key]: value,
      ...(['city', 'ward', 'street', 'address'].includes(key) &&
      r[key] !== value &&
      r.locationStatus === 'confirmed'
        ? { locationStatus: 'approximate' as const }
        : {}),
    }));
  const validPrice = Number.isFinite(Number(price)) && Number(price) >= 1 && Number(price) <= 2000;
  const score = useMemo(
    () => (validPrice ? scoreReview({ ...draft, priceK: Number(price) }) : null),
    [draft, price, validPrice],
  );
  const tier = score === null ? null : getTierStyle(score, draft.category);
  const isFood = draft.category === 'food';
  const presets = isFood
    ? draft.foodType === 'streetfood'
      ? STREETFOOD_PRICE_PRESETS
      : RESTAURANT_PRICE_PRESETS
    : draft.mode === 'takeaway'
      ? TAKEAWAY_PRICE_PRESETS
      : DINEIN_PRICE_PRESETS;
  const priceScore = validPrice
    ? isFood
      ? getFoodPriceScore(Number(price), draft.foodType)
      : getDrinkPriceScore(Number(price), draft.mode)
    : null;
  const freq = getFreqTier(draft.category, Number(price));
  const streetOptions = [
    ...new Set(
      existing
        .filter((r) => r.city === draft.city && r.ward === draft.ward)
        .map((r) => r.street)
        .concat(
          draft.city === 'Đà Nẵng'
            ? [
                'Phan Thanh',
                'Hàm Nghi',
                'Nguyễn Văn Linh',
                'Lê Duẩn',
                'Nguyễn Chí Thanh',
                'Hùng Vương',
                'Nguyễn Tri Phương',
              ]
            : [],
        ),
    ),
  ].filter(Boolean);
  const submit = async () => {
    setError('');
    let item: ReviewItem;
    try {
      item = validateReview({
        ...draft,
        priceK: Number(price),
        reviewedAt: reviewDate,
        updatedAt: new Date().toISOString(),
        isDemo: false,
      });
    } catch (e) {
      setError((e as Error).message);
      const target = !draft.name.trim() ? 'shop-name-input' : !validPrice ? 'review-price' : null;
      if (target) document.getElementById(target)?.focus();
      return;
    }
    await onSave(item, photos, firstVisit, initial.updatedAt);
  };
  return (
    <form
      noValidate
      className="review-form stack"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      {!isTyping && (
        <div className="live-score theme-surface-elevated">
          <div className="split">
            <div className="score-preview">
              <CategoryScoreBadge category={draft.category} score={score ?? 0} size="sm" />
              <div>
                <strong className="score">
                  {score?.toFixed(2) ?? '—'}
                  <small>/10</small>
                </strong>
                {score !== null && <StarRatingBadge score10={score} />}
                <p className="small">{tier?.verdict ?? 'Nhập mức giá hợp lệ để tính điểm'}</p>
              </div>
            </div>
            <button
              className="button"
              type="button"
              disabled={busy || photoBusy}
              onClick={() => void submit()}
            >
              <Check size={17} />
              {busy ? 'Đang lưu…' : isEdit ? 'Cập nhật' : 'Lưu quán'}
            </button>
          </div>
        </div>
      )}
      <div className="split">
        <h2>{isEdit ? 'Cập nhật trải nghiệm' : 'Chấm điểm quán'}</h2>
        <button type="button" className="text-button" onClick={onCancel}>
          Hủy
        </button>
      </div>
      {initial.isDemo && (
        <p className="notice">
          Đây là quán minh họa. Khi lưu, bạn xác nhận các điểm mới là trải nghiệm của mình.
        </p>
      )}
      {error && (
        <p role="alert" className="alert">
          {error}
        </p>
      )}
      <section className="panel">
        <h3>Phân loại trải nghiệm</h3>
        <div className="segmented" role="group" aria-label="Loại quán">
          {(['drink', 'food'] as const).map((category) => (
            <button
              key={category}
              type="button"
              aria-pressed={draft.category === category}
              onClick={() => {
                change('category', category);
                if (!isEdit) setPrice(category === 'food' ? '30' : '31');
              }}
            >
              {category === 'drink' ? '🥤 Quán nước' : '🍜 Quán ăn'}
            </button>
          ))}
        </div>
      </section>
      <section className="panel stack">
        <label className="field">
          <span>
            Tên quán <small>· bắt buộc</small>
          </span>
          <input
            id="shop-name-input"
            value={draft.name}
            onChange={(e) => change('name', e.target.value)}
            maxLength={160}
            required
            placeholder={isFood ? 'Ví dụ: quán bánh canh bạn vừa ăn' : 'Ví dụ: Nốt'}
          />
        </label>
        <div>
          <div className="split">
            <h3>Địa điểm</h3>
            <button type="button" className="text-button" onClick={() => setLocation(true)}>
              Chọn từ danh mục
            </button>
          </div>
          <button type="button" className="location-summary" onClick={() => setLocation(true)}>
            <MapPin size={18} />
            <span>
              {draft.city || 'Chọn tỉnh/thành'}
              <small>{draft.ward || 'Chọn phường/xã'}</small>
            </span>
          </button>
        </div>
        <label className="field">
          <span>Đường / phố / kiệt</span>
          <input
            list="saved-streets"
            value={draft.street}
            onChange={(e) => change('street', e.target.value)}
            maxLength={200}
            placeholder="Chọn đường đã lưu hoặc nhập đường mới"
          />
          <datalist id="saved-streets">
            {streetOptions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>
        <label className="field">
          <span>
            Số nhà / địa chỉ cụ thể <small>· không bắt buộc</small>
          </span>
          <input
            value={draft.address ?? ''}
            onChange={(e) => change('address', e.target.value)}
            maxLength={300}
            placeholder="Ví dụ: 31, kiệt 2…"
          />
        </label>
        <button
          type="button"
          className="button secondary w-full"
          onClick={() => setPinPicker(true)}
        >
          <MapPin size={18} />
          {hasConfirmedLocation(draft)
            ? 'Kiểm tra / chỉnh ghim đã xác nhận'
            : 'Ghim vị trí chính xác trên bản đồ'}
        </button>
        <p className="small muted">
          {hasConfirmedLocation(draft)
            ? `Ghim đã xác nhận: ${draft.lat!.toFixed(5)}, ${draft.lng!.toFixed(5)}.`
            : draft.lat !== null
              ? 'Tọa độ cũ chỉ là ước tính; chưa dùng để lọc gần tôi.'
              : 'Chưa có ghim. Bạn vẫn có thể lưu đánh giá và ghim sau.'}
        </p>
      </section>
      <section className="panel">
        <h3>{isFood ? 'Hình thức quán ăn' : 'Hình thức thưởng thức'}</h3>
        <div className="segmented" role="group" aria-label="Hình thức">
          {(isFood
            ? [
                ['streetfood', 'Vỉa hè / Bình dân', 'Ngon 40%'],
                ['restaurant', 'Quán / Nhà hàng', 'Không gian 15%'],
              ]
            : [
                ['takeaway', 'Take-away', 'Vị 50%'],
                ['dinein', 'Ngồi lại', 'Không gian 20%'],
              ]
          ).map(([key, label, hint]) => (
            <button
              type="button"
              key={key}
              aria-pressed={(isFood ? draft.foodType : draft.mode) === key}
              onClick={() =>
                isFood ? change('foodType', key as FoodVenueType) : change('mode', key as DrinkMode)
              }
            >
              {label}
              <small>{hint}</small>
            </button>
          ))}
        </div>
      </section>
      <section className="panel stack">
        <ScoreSlider
          label={isFood ? 'Độ ngon món ăn' : 'Hương vị đồ uống'}
          weight={
            isFood
              ? draft.foodType === 'streetfood'
                ? 40
                : 35
              : draft.mode === 'takeaway'
                ? 50
                : 35
          }
          value={draft.taste}
          onChange={(v) => change('taste', v)}
        />
        <label className="field">
          <span className="split">
            <span>
              Giá một phần <small>· nghìn đồng (k)</small>
            </span>
            <strong>{priceScore ? `${priceScore.score.toFixed(1)}đ` : '—'}</strong>
          </span>
          <input
            id="review-price"
            type="number"
            min="1"
            max="2000"
            step="0.5"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            aria-describedby="price-help"
          />
          <small id="price-help">
            Ví dụ 31 = 31.000đ. Đây là giá để chấm điểm; tiền thực trả được ghi riêng ở mỗi lượt
            ghé.
          </small>
        </label>
        <div className="price-presets">
          {presets.map((p) => (
            <button
              type="button"
              key={p.value}
              className="button secondary"
              onClick={() => setPrice(String(p.value))}
            >
              {p.label}
            </button>
          ))}
        </div>
        {validPrice && (
          <div className="frequency-hint">
            <strong>{freq.label}</strong>
            <p className="small">{freq.hint}</p>
            <small>Gợi ý theo từng quán · tuần từ thứ Hai, tháng từ ngày 5 · giờ Việt Nam.</small>
          </div>
        )}
        {isFood ? (
          <>
            <ScoreSlider
              label="Chất lượng & khẩu phần"
              weight={25}
              value={draft.foodQuality}
              onChange={(v) => change('foodQuality', v)}
            />
            <ScoreSlider
              label="Độ sạch sẽ"
              weight={15}
              value={draft.cleanliness}
              onChange={(v) => change('cleanliness', v)}
            />
          </>
        ) : (
          <>
            <div>
              <h3>
                Thể tích đồ uống <small>(20%)</small>
              </h3>
              <div className="volume-options">
                {VOLUME_OPTIONS.map((v) => (
                  <button
                    type="button"
                    key={v.key}
                    aria-pressed={draft.volumeKey === v.key}
                    onClick={() => change('volumeKey', v.key)}
                  >
                    {v.label}
                    <small>{v.score}đ</small>
                  </button>
                ))}
              </div>
            </div>
            <ScoreSlider
              label="Chất liệu vỏ ly"
              weight={5}
              value={draft.packaging}
              onChange={(v) => change('packaging', v)}
            />
          </>
        )}
        {(isFood || draft.mode === 'dinein') && (
          <ScoreSlider
            label="Không gian quán"
            weight={isFood ? (draft.foodType === 'streetfood' ? 5 : 15) : 20}
            value={draft.space}
            onChange={(v) => change('space', v)}
          />
        )}
      </section>
      <section className="panel stack">
        <label className="field">
          <span>Món nên gọi / món đã thử</span>
          <input
            value={draft.dish ?? ''}
            maxLength={300}
            onChange={(e) => change('dish', e.target.value)}
            placeholder="Ví dụ: trà sữa ô long ít đường"
          />
        </label>
        <label className="field">
          <span>
            Nhóm món <small>· để tìm nhanh sau này</small>
          </span>
          <input
            value={draft.cuisine ?? ''}
            maxLength={100}
            onChange={(e) => change('cuisine', e.target.value)}
            placeholder="Ví dụ: mì Quảng, cà phê, đồ chay…"
          />
        </label>
        <label className="field">
          <span>Ghi chú trải nghiệm</span>
          <textarea
            rows={3}
            value={draft.note}
            maxLength={5000}
            onChange={(e) => change('note', e.target.value)}
            placeholder="Điều bạn muốn nhớ khi quay lại…"
          />
        </label>
        <label className="field">
          <span>Ngày đánh giá</span>
          <input
            type="date"
            max={dateInput(new Date().toISOString())}
            value={reviewDate}
            onChange={(e) => setReviewDate(e.target.value)}
            required
          />
        </label>
        {!isEdit && (
          <label className="check">
            <input
              type="checkbox"
              checked={firstVisit}
              onChange={(e) => setFirstVisit(e.target.checked)}
            />
            Ghi nhận đã ghé hôm nay khi lưu (chưa ghi tiền thực trả)
          </label>
        )}
      </section>
      <section className="panel stack">
        <div className="split">
          <h3>
            Ảnh thực tế <small>· tối đa 3</small>
          </h3>
          <label className="button secondary file-button">
            <Camera size={17} />
            {photoBusy ? 'Đang xử lý…' : 'Thêm ảnh'}
            <input
              aria-label="Thêm ảnh món ăn hoặc quán"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={photoBusy || draft.photoIds.length >= 3}
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = '';
                if (draft.photoIds.length + files.length > 3) {
                  setError('Mỗi quán tối đa 3 ảnh.');
                  return;
                }
                setPhotoBusy(true);
                try {
                  const added = await Promise.all(files.map(compressPhoto));
                  setPhotos((p) => [...p, ...added]);
                  setDraft((r) => ({ ...r, photoIds: [...r.photoIds, ...added.map((p) => p.id)] }));
                  setError('');
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setPhotoBusy(false);
                }
              }}
            />
          </label>
        </div>
        <p className="small muted">
          Ảnh được nén và lưu trên thiết bị, đi kèm khi xuất bản sao JSON.
        </p>
        <div className="photo-grid">
          {draft.photoIds.map((id, index) => (
            <div className="photo-item" key={id}>
              <Photo
                id={id}
                draft={photos.find((p) => p.id === id)?.blob}
                alt={`Ảnh trải nghiệm ${index + 1}`}
              />
              <button
                type="button"
                className="icon-button"
                aria-label={`Bỏ ảnh ${index + 1}`}
                onClick={() => {
                  change(
                    'photoIds',
                    draft.photoIds.filter((p) => p !== id),
                  );
                  setPhotos((p) => p.filter((x) => x.id !== id));
                }}
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      </section>
      <details className="panel disclosure">
        <summary>
          Giờ mở cửa tôi đã kiểm tra <small>· không bắt buộc</small>
        </summary>
        <div className="stack">
          <label className="check">
            <input
              type="checkbox"
              checked={!!draft.openingHours}
              onChange={(e) =>
                change(
                  'openingHours',
                  e.target.checked
                    ? {
                        days: [0, 1, 2, 3, 4, 5, 6],
                        from: '06:00',
                        to: '22:00',
                        checkedAt: new Date().toISOString(),
                      }
                    : undefined,
                )
              }
            />
            Lưu giờ mở cửa để lọc khi cần
          </label>
          {draft.openingHours && (
            <>
              <div className="days" role="group" aria-label="Ngày mở cửa">
                {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, i) => (
                  <button
                    className="button secondary"
                    type="button"
                    key={day}
                    aria-pressed={draft.openingHours!.days.includes(i)}
                    onClick={() =>
                      change('openingHours', {
                        ...draft.openingHours!,
                        days: draft.openingHours!.days.includes(i)
                          ? draft.openingHours!.days.filter((d) => d !== i)
                          : [...draft.openingHours!.days, i],
                        checkedAt: new Date().toISOString(),
                      })
                    }
                  >
                    {day}
                  </button>
                ))}
              </div>
              <div className="two-columns">
                <label className="field">
                  <span>Giờ mở</span>
                  <input
                    type="time"
                    value={draft.openingHours.from}
                    onChange={(e) =>
                      change('openingHours', {
                        ...draft.openingHours!,
                        from: e.target.value,
                        checkedAt: new Date().toISOString(),
                      })
                    }
                  />
                </label>
                <label className="field">
                  <span>Giờ đóng</span>
                  <input
                    type="time"
                    value={draft.openingHours.to}
                    onChange={(e) =>
                      change('openingHours', {
                        ...draft.openingHours!,
                        to: e.target.value,
                        checkedAt: new Date().toISOString(),
                      })
                    }
                  />
                </label>
              </div>
              <p className="small muted">
                Giờ do bạn ghi, theo giờ Việt Nam; hãy kiểm tra lại khi quay lại. Sau 30 ngày ứng
                dụng coi thông tin này là chưa chắc chắn.
              </p>
            </>
          )}
        </div>
      </details>
      {error && (
        <p role="alert" className="alert">
          {error}
        </p>
      )}
      <button type="submit" className="button w-full" disabled={busy || photoBusy}>
        {busy
          ? 'Đang lưu trên thiết bị…'
          : initial.isDemo
            ? 'Lưu thành đánh giá thật của tôi'
            : isEdit
              ? 'Lưu cập nhật quán'
              : 'Lưu đánh giá & vị trí'}
      </button>
      {location && (
        <LocationPicker
          city={draft.city}
          ward={draft.ward}
          onClose={() => setLocation(false)}
          onSelect={(value) =>
            setDraft((r) => {
              const changed = value.city !== r.city || value.ward !== r.ward;
              return {
                ...r,
                ...value,
                street: changed ? '' : r.street,
                locationStatus: changed && r.lat !== null ? 'approximate' : r.locationStatus,
              };
            })
          }
        />
      )}
      {pinPicker && (
        <Suspense fallback={<p role="status">Đang mở bản đồ…</p>}>
          <PinPicker
            initial={
              draft.lat !== null && draft.lng !== null
                ? { lat: draft.lat, lng: draft.lng, accuracyM: draft.accuracyM }
                : null
            }
            theme={theme}
            onClose={() => setPinPicker(false)}
            onConfirm={(p) =>
              setDraft((r) => ({
                ...r,
                lat: p.lat,
                lng: p.lng,
                accuracyM: p.accuracyM,
                locationStatus: 'confirmed',
                locationSource: p.source,
                city: p.city ?? r.city,
                ward: p.ward ?? r.ward,
                street: p.street ?? r.street,
                provinceCode: undefined,
                wardCode: undefined,
              }))
            }
          />
        </Suspense>
      )}
    </form>
  );
}
