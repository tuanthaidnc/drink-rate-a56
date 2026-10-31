import { AnimatedNumber, ScoreDial } from './motion/kinetic.tsx';
import { lazy, Suspense, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Button } from './ui/button.tsx';
import { Input } from './ui/input.tsx';
import { Textarea } from './ui/textarea.tsx';
import { Field, FieldLabel, FieldGroup } from './ui/field.tsx';
import * as ToggleGroup from '@animate-ui/react/primitives/radix-ui/toggle-group';
import * as Slider from '@animate-ui/react/primitives/radix-ui/slider';
import { reviewDraftSignature } from '../lib/reviewDraft.ts';
import {
  Check,
  MapPin,
  Camera,
  Images,
  LoaderCircle,
  X,
  Coffee,
  Utensils,
  Package,
  Armchair,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
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
import { clearCaptureDraft } from '../lib/storage.ts';
import { takeReviewPhoto, type CaptureDraft } from '../lib/reviewCapture.ts';
import { isNativeApp } from '../lib/platform.ts';
import { newId } from '../lib/models.ts';
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
  const id = useId();
  const shortLabel =
    (
      {
        'Hương vị đồ uống': 'Vị',
        'Độ ngon món ăn': 'Ngon',
        'Chất lượng & khẩu phần': 'Chất lượng',
        'Độ sạch sẽ': 'Sạch',
        'Chất liệu vỏ ly': 'Ly',
        'Không gian quán': 'Không gian',
      } as Record<string, string>
    )[label] ?? label;
  const Icon = label.includes('vỏ')
    ? Package
    : label.includes('Không gian')
      ? Armchair
      : label.includes('sạch')
        ? Sparkles
        : label.includes('món')
          ? Utensils
          : Coffee;
  return (
    <label className="score-field" htmlFor={id}>
      <span className="criterion-orb" aria-hidden="true">
        <Icon />
      </span>
      <span className="split">
        <span className="criterion-label">
          {shortLabel} <small>{weight}%</small>
        </span>
        <output className="mono">
          <AnimatedNumber value={value} />
        </output>
      </span>
      <Slider.Root
        className="rating-slider"
        min={1}
        max={10}
        step={0.5}
        value={[value]}
        onValueChange={(values) => onChange(values[0])}
        aria-label={label}
      >
        <Slider.Track className="rating-slider-track">
          <Slider.Range className="rating-slider-range" />
        </Slider.Track>
        <Slider.Thumb
          id={id}
          className="rating-slider-thumb"
          aria-label={label}
          aria-valuetext={`${value} trên 10`}
        />
      </Slider.Root>
    </label>
  );
}
export default function ReviewForm({
  initial,
  recovered,
  isEdit,
  theme,
  busy,
  isTyping,
  existing,
  onSave,
  onCancel,
  onDirtyChange,
  onPhotoBusyChange,
}: {
  initial: ReviewItem;
  recovered?: CaptureDraft;
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
  onDirtyChange: (dirty: boolean) => void;
  onPhotoBusyChange: (busy: boolean) => void;
}) {
  const [draft, setDraft] = useState<ReviewItem>(() =>
    structuredClone(recovered?.draft ?? initial),
  );
  const [price, setPrice] = useState(recovered?.price ?? String(initial.priceK));
  const [reviewDate, setReviewDate] = useState(
    recovered?.reviewDate ?? dateInput(initial.reviewedAt ?? initial.createdAt),
  );
  const [error, setError] = useState('');
  const [location, setLocation] = useState(false);
  const [pinPicker, setPinPicker] = useState(false);
  const [photos, setPhotos] = useState<PhotoData[]>(recovered?.photos ?? []);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [firstVisit, setFirstVisit] = useState(recovered?.firstVisit ?? false);
  const captureInput = useRef<HTMLInputElement>(null);
  const photoOperation = useRef(false);
  useEffect(() => {
    onPhotoBusyChange(photoBusy);
    return () => onPhotoBusyChange(false);
  }, [photoBusy, onPhotoBusyChange]);
  const attach = (added: PhotoData[]) => {
    setPhotos((current) => [...current, ...added]);
    setDraft((current) => ({
      ...current,
      photoIds: [...current.photoIds, ...added.map((photo) => photo.id)],
    }));
    setError('');
  };
  const importPhotos = async (files: File[]) => {
    if (!files.length || photoOperation.current) return;
    if (draft.photoIds.length + files.length > 3) {
      setError('Mỗi quán tối đa 3 ảnh.');
      return;
    }
    photoOperation.current = true;
    setPhotoBusy(true);
    try {
      const added: PhotoData[] = [];
      // Sequential decoding bounds peak memory when selecting three large photos.
      for (const file of files) added.push(await compressPhoto(file));
      attach(added);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      photoOperation.current = false;
      setPhotoBusy(false);
    }
  };
  const capture = async () => {
    if (!isNativeApp) {
      captureInput.current?.click();
      return;
    }
    if (photoOperation.current || draft.photoIds.length >= 3) return;
    photoOperation.current = true;
    setPhotoBusy(true);
    try {
      const next = await takeReviewPhoto({
        original: initial,
        isEdit,
        draft,
        price,
        reviewDate,
        firstVisit,
        photos,
        recoveryId: newId('capture'),
      });
      if (next) attach(next.photos.filter((photo) => !photos.some((p) => p.id === photo.id)));
      await clearCaptureDraft();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      photoOperation.current = false;
      setPhotoBusy(false);
    }
  };
  const baseline = useMemo(
    () =>
      reviewDraftSignature(
        initial,
        String(initial.priceK),
        dateInput(initial.reviewedAt ?? initial.createdAt),
      ),
    [initial],
  );
  const signature = reviewDraftSignature(draft, price, reviewDate, firstVisit);
  const dirty =
    signature !== baseline || (!isEdit && !initial.isDemo && hasConfirmedLocation(initial));
  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);
  const change = <K extends keyof ReviewItem>(key: K, value: ReviewItem[K]) =>
    setDraft((r) => {
      const next = { ...r, [key]: value };
      if (['city', 'ward', 'street', 'address'].includes(key) && r[key] !== value) {
        next.placeResolution = undefined;
        if (next.locationStatus === 'confirmed') next.locationStatus = 'approximate';
        const restored = (['city', 'ward', 'street', 'address', 'lat', 'lng'] as const).every(
          (field) => (next[field] ?? '') === (initial[field] ?? ''),
        );
        if (restored) {
          next.placeResolution = initial.placeResolution;
          next.locationStatus = initial.locationStatus;
          next.locationSource = initial.locationSource;
        }
      }
      return next;
    });
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
      <div className="split form-title">
        <button
          type="button"
          className="text-button"
          aria-label="Hủy"
          disabled={photoBusy}
          onClick={onCancel}
        >
          <ArrowLeft />
        </button>
        <h1>{isEdit ? 'Sửa đánh giá' : 'Chấm điểm'}</h1>
      </div>
      {!isTyping && (
        <div className="live-score theme-surface-elevated">
          <div className="split">
            <div className="score-preview">
              <ScoreDial value={score ?? 0} size={56} className="dial-mini" decimals={2} />
              <strong className="score">
                {score === null ? '—' : <AnimatedNumber value={score} decimals={2} />}
                <small>/10</small>
              </strong>
            </div>
            <Button
              type="button"
              aria-label={isEdit ? 'Cập nhật đánh giá' : 'Lưu quán'}
              disabled={busy || photoBusy}
              onClick={() => void submit()}
            >
              <Check size={17} />
              {busy ? '…' : 'Lưu'}
            </Button>
          </div>
        </div>
      )}

      {initial.isDemo && <span className="badge demo-badge">Minh họa</span>}
      {error && (
        <p role="alert" className="alert">
          {error}
        </p>
      )}

      <section className="panel stack">
        <FieldGroup>
          <Field className="field" data-invalid={!!error && !draft.name.trim()}>
            <FieldLabel htmlFor="shop-name-input">Tên quán</FieldLabel>
            <Input
              id="shop-name-input"
              value={draft.name}
              onChange={(e) => change('name', e.target.value)}
              maxLength={160}
              required
              aria-invalid={!!error && !draft.name.trim()}
              placeholder="Tên quán"
            />
          </Field>

          <div className="form-pricing">
            <label className="field price-field">
              <span className="split">
                <span>Giá (k)</span>
                <strong>{priceScore ? `${priceScore.score.toFixed(1)}đ` : '—'}</strong>
              </span>
              <Input
                id="review-price"
                type="number"
                min="1"
                max="2000"
                step="0.5"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </label>
            <div className="form-category">
              <span className="form-help">Danh mục</span>
              <ToggleGroup.Root
                key={`category-${theme}`}
                type="single"
                className="segmented"
                aria-label="Loại quán"
                value={draft.category}
                onValueChange={(category) => {
                  if (category !== 'drink' && category !== 'food') return;
                  change('category', category);
                  if (!isEdit) setPrice(category === 'food' ? '30' : '31');
                }}
              >
                {(['drink', 'food'] as const).map((category) => (
                  <ToggleGroup.Item key={category} value={category}>
                    {category === 'drink' ? <Coffee /> : <Utensils />}
                    {category === 'drink' ? 'Nước' : 'Ăn'}
                  </ToggleGroup.Item>
                ))}
              </ToggleGroup.Root>
            </div>
          </div>
        </FieldGroup>
        <details className="price-quick">
          <summary>Khoảng giá</summary>{' '}
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
        </details>

        <ToggleGroup.Root
          key={`mode-${theme}`}
          type="single"
          className="segmented"
          aria-label="Hình thức"
          value={isFood ? draft.foodType : draft.mode}
          onValueChange={(value) => {
            if (!value) return;
            if (isFood) change('foodType', value as FoodVenueType);
            else change('mode', value as DrinkMode);
          }}
        >
          {(isFood
            ? [
                ['streetfood', 'Bình dân / Vỉa hè'],
                ['restaurant', 'Quán / Nhà hàng'],
              ]
            : [
                ['takeaway', 'Mang đi'],
                ['dinein', 'Ngồi lại'],
              ]
          ).map(([value, label]) => (
            <ToggleGroup.Item key={value} value={value}>
              {label}
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
        <details className="form-address">
          <summary>
            Địa điểm ·{' '}
            {[draft.address, draft.street, draft.ward, draft.city].filter(Boolean).join(', ')}
          </summary>
          <div className="stack">
            {' '}
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
              <Input
                list="saved-streets"
                value={draft.street}
                onChange={(e) => change('street', e.target.value)}
                maxLength={200}
                placeholder="Tên đường"
              />
              <datalist id="saved-streets">
                {streetOptions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </label>
            <label className="field">
              <span>Số nhà</span>
              <Input
                value={draft.address ?? ''}
                onChange={(e) => change('address', e.target.value)}
                maxLength={300}
                placeholder="Số nhà"
              />
            </label>
            <button
              type="button"
              className="button secondary w-full"
              onClick={() => setPinPicker(true)}
            >
              <MapPin size={18} />
              {hasConfirmedLocation(draft) ? 'Chỉnh ghim' : 'Ghim vị trí'}
            </button>
            <span className="small muted">
              {hasConfirmedLocation(draft)
                ? `${draft.lat!.toFixed(5)}, ${draft.lng!.toFixed(5)}`
                : 'Chưa ghim'}
            </span>
          </div>
        </details>
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
                Lượng <small>20%</small>
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
          <Input
            value={draft.dish ?? ''}
            maxLength={300}
            onChange={(e) => change('dish', e.target.value)}
            placeholder="Món đã thử"
          />
        </label>
        <label className="field">
          <span>
            Nhóm món <small></small>
          </span>
          <Input
            value={draft.cuisine ?? ''}
            maxLength={100}
            onChange={(e) => change('cuisine', e.target.value)}
            placeholder="Nhóm món"
          />
        </label>
        <label className="field">
          <span>Ghi chú trải nghiệm</span>
          <Textarea
            rows={3}
            value={draft.note}
            maxLength={5000}
            onChange={(e) => change('note', e.target.value)}
            placeholder="Ghi chú"
          />
        </label>
        <label className="field">
          <span>Ngày đánh giá</span>
          <Input
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
            Đã ghé hôm nay
          </label>
        )}
      </section>
      <section className="panel stack">
        <div className="split">
          <h3>
            Ảnh <small>{draft.photoIds.length}/3</small>
          </h3>
          <div className="photo-actions">
            <Button
              type="button"
              className="photo-capture"
              disabled={photoBusy || draft.photoIds.length >= 3}
              onClick={() => void capture()}
            >
              <Camera size={18} /> Chụp
            </Button>
            <input
              ref={captureInput}
              type="file"
              hidden
              capture="environment"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Chụp ảnh món ăn hoặc đồ uống"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = '';
                void importPhotos(files);
              }}
            />
            <label
              className="button secondary file-button"
              data-disabled={photoBusy || draft.photoIds.length >= 3}
            >
              <Images size={17} />
              Thư viện
              <input
                aria-label="Thêm ảnh món ăn hoặc quán"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={photoBusy || draft.photoIds.length >= 3}
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  e.target.value = '';
                  void importPhotos(files);
                }}
              />
            </label>
          </div>
        </div>
        {photoBusy && (
          <div className="photo-processing" role="status">
            <LoaderCircle className="photo-spinner" size={18} /> Đang xử lý ảnh…
          </div>
        )}
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
                disabled={photoBusy}
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
        <summary>Giờ mở cửa</summary>
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
            Đã kiểm tra
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
                  <Input
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
                  <Input
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
            </>
          )}
        </div>
      </details>
      {error && (
        <p role="alert" className="alert">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={busy || photoBusy}>
        {busy
          ? 'Đang lưu trên thiết bị…'
          : initial.isDemo
            ? 'Lưu thành đánh giá thật của tôi'
            : isEdit
              ? 'Lưu cập nhật quán'
              : 'Lưu đánh giá & vị trí'}
      </Button>
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
                placeResolution: changed ? undefined : r.placeResolution,
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
                placeResolution: undefined,
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
