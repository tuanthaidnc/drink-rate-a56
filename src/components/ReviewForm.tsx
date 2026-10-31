import { lazy, Suspense, useEffect, useId, useMemo, useRef, useState } from 'react';
import * as ToggleGroup from '@animate-ui/react/primitives/radix-ui/toggle-group';
import * as Slider from '@animate-ui/react/primitives/radix-ui/slider';
import {
  ArrowLeft,
  Camera,
  Check,
  Coffee,
  Images,
  LoaderCircle,
  MapPin,
  CircleAlert,
  Utensils,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AnimatedNumber, useQuietMotion } from './motion/kinetic.tsx';
import { Input } from './ui/input.tsx';
import { Textarea } from './ui/textarea.tsx';
import { Photo } from './Photo.tsx';
import { LocationPicker } from './LocationPicker.tsx';
import { getCurrentPosition, type Position } from '../lib/geo.ts';
import { automaticReviewName, parseReviewPrice, reviewDraftIsDirty } from '../lib/reviewDraft.ts';
import { takeReviewPhoto, type CaptureDraft } from '../lib/reviewCapture.ts';
import { compressPhoto, saveCaptureDraft } from '../lib/storage.ts';
import { isNativeApp } from '../lib/platform.ts';
import {
  hasConfirmedLocation,
  newId,
  type DrinkMode,
  type FoodVenueType,
  type PhotoData,
  type ReviewItem,
} from '../lib/models.ts';
import { validateReview } from '../lib/validation.ts';
import { scoreReview, VOLUME_OPTIONS } from '../lib/scoring.ts';
import { localDayParts } from '../lib/frequency.ts';
const PinPicker = lazy(() => import('./PinPicker.tsx'));
const inputDate = (at: string) => {
  const p = localDayParts(new Date(at));
  return `${p.year}-${String(p.month + 1).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
};

function ScoreSlider({
  label,
  value,
  onChange,
  min = 1,
  max = 10,
  step = 0.5,
  display,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  display?: string;
}) {
  const id = useId();
  return (
    <div className="quick-criterion">
      <div className="split">
        <label htmlFor={id}>{label}</label>
        <output>{display ?? <AnimatedNumber value={value} />}</output>
      </div>
      <Slider.Root
        className="rating-slider"
        min={min}
        max={max}
        step={step}
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
          aria-valuetext={display ?? `${value} trên 10`}
        />
      </Slider.Root>
    </div>
  );
}

export default function ReviewForm({
  initial,
  recovered,
  entryPhotos,
  isEdit,
  theme,
  busy,
  isTyping,
  existing,
  onSave,
  onCancel,
  onDiscard,
  onDirtyChange,
  onPhotoBusyChange,
  onDraftSnapshot,
  recovering = false,
}: {
  initial: ReviewItem;
  recovered?: CaptureDraft;
  entryPhotos?: Promise<File[]>;
  isEdit: boolean;
  theme: 'dark' | 'light';
  busy: boolean;
  isTyping: boolean;
  existing: ReviewItem[];
  recovering?: boolean;
  onSave: (
    item: ReviewItem,
    photos: PhotoData[],
    firstVisit: boolean,
    expectedUpdatedAt: string,
  ) => Promise<boolean>;
  onCancel: () => void;
  onDiscard: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onPhotoBusyChange: (busy: boolean) => void;
  onDraftSnapshot: (snapshot: CaptureDraft) => void;
}) {
  const [draft, setDraft] = useState(() => structuredClone(recovered?.draft ?? initial));
  const [price, setPrice] = useState(recovered?.price ?? (isEdit ? String(initial.priceK) : ''));
  const [photos, setPhotos] = useState<PhotoData[]>(recovered?.photos ?? []);
  const [photoBusy, setPhotoBusy] = useState(false),
    [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(''),
    [photoError, setPhotoError] = useState(''),
    [gpsError, setGpsError] = useState('');
  const [gpsBusy, setGpsBusy] = useState(false),
    [pinPicker, setPinPicker] = useState(false),
    [location, setLocation] = useState(false);
  const [firstVisit, setFirstVisit] = useState(recovered?.firstVisit ?? false);
  const reviewDate = recovered?.reviewDate ?? inputDate(initial.reviewedAt ?? initial.createdAt);
  const captureInput = useRef<HTMLInputElement>(null),
    photoOperation = useRef(false),
    autoOpened = useRef(false),
    alive = useRef(true),
    saving = useRef(false);
  const gpsAttempted = useRef(
    recovered?.gpsAttempted ?? (draft.lat !== null && draft.lng !== null),
  );
  const manualPin = useRef(hasConfirmedLocation(draft));
  const gpsPromise = useRef<Promise<void> | undefined>(undefined);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const updateDraft = (fn: (value: ReviewItem) => ReviewItem) => {
    const next = fn(draftRef.current);
    draftRef.current = next;
    setDraft(next);
  };
  const quiet = useQuietMotion(),
    locked = busy || photoBusy || submitting || recovering;
  const stage = isEdit || draft.photoIds.length ? 'score' : 'capture';
  const dirty = reviewDraftIsDirty(initial, draft, price, reviewDate, isEdit, firstVisit);
  const amount = parseReviewPrice(price);
  const score = useMemo(
    () => (amount === null ? null : scoreReview({ ...draft, priceK: amount })),
    [draft, amount],
  );
  const snapshot: CaptureDraft = {
    original: initial,
    isEdit,
    draft,
    price,
    reviewDate,
    firstVisit,
    photos,
    recoveryId: recovered?.recoveryId ?? initial.id,
    stage,
    gpsAttempted: gpsAttempted.current,
  };
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    onPhotoBusyChange(photoBusy || submitting || recovering);
    return () => onPhotoBusyChange(false);
  }, [photoBusy, submitting, recovering, onPhotoBusyChange]);
  useEffect(() => {
    onDraftSnapshot(snapshotRef.current);
  }, [draft, price, photos, firstVisit, gpsBusy, gpsError, onDraftSnapshot]);
  useEffect(() => {
    if (!dirty || photoBusy || busy || submitting || recovering || saving.current) return;
    const timer = setTimeout(() => {
      if (!saving.current)
        void saveCaptureDraft(snapshotRef.current).catch(() =>
          setError('Chưa giữ được bản nháp. Hãy lưu trước khi đóng app.'),
        );
    }, 200);
    return () => clearTimeout(timer);
  }, [draft, price, photos, firstVisit, dirty, photoBusy, busy, submitting, recovering]);
  useEffect(() => {
    const persist = () => {
      if (
        document.visibilityState === 'hidden' &&
        dirty &&
        !photoOperation.current &&
        !saving.current
      )
        void saveCaptureDraft(snapshotRef.current).catch(() => {});
    };
    document.addEventListener('visibilitychange', persist);
    return () => document.removeEventListener('visibilitychange', persist);
  }, [dirty]);
  const locate = () => {
    if (gpsBusy) return gpsPromise.current;
    gpsAttempted.current = true;
    setGpsBusy(true);
    setGpsError('');
    const pending = (async () => {
      try {
        const p = await getCurrentPosition();
        if (!alive.current) return;
        if (!manualPin.current)
          updateDraft((r) => ({
            ...r,
            lat: p.lat,
            lng: p.lng,
            accuracyM: p.accuracyM,
            locationSource: 'gps',
            locationStatus:
              p.accuracyM !== undefined && p.accuracyM <= 150 ? 'confirmed' : 'approximate',
            placeResolution: undefined,
          }));
      } catch (e) {
        if (alive.current) setGpsError((e as Error).message);
      } finally {
        if (alive.current) setGpsBusy(false);
      }
    })();
    gpsPromise.current = pending;
    return pending;
  };
  useEffect(() => {
    if (!isEdit && stage === 'score' && !gpsAttempted.current && !recovering) void locate();
  }, [stage, isEdit, recovering]);
  const attach = (photo: PhotoData) => {
    setPhotos([photo]);
    updateDraft((r) => ({ ...r, photoIds: [photo.id] }));
    setPhotoError('');
    setError('');
  };
  const importPhoto = async (files: File[]) => {
    if (!files.length || photoOperation.current) return;
    if (files.length !== 1) {
      setPhotoError('Chỉ chọn một ảnh.');
      return;
    }
    photoOperation.current = true;
    setPhotoBusy(true);
    setPhotoError('');
    try {
      attach(await compressPhoto(files[0]));
    } catch (e) {
      setPhotoError((e as Error).message);
    } finally {
      photoOperation.current = false;
      setPhotoBusy(false);
    }
  };
  const capture = async () => {
    if (photoOperation.current || recovering) return;
    if (!isNativeApp) {
      captureInput.current?.click();
      return;
    }
    photoOperation.current = true;
    setPhotoBusy(true);
    setPhotoError('');
    try {
      const next = await takeReviewPhoto({
        ...snapshotRef.current,
        replaceCover: true,
        recoveryId: newId('capture'),
      });
      if (next?.photos[0]) attach(next.photos[0]);
    } catch (e) {
      setPhotoError((e as Error).message);
    } finally {
      photoOperation.current = false;
      setPhotoBusy(false);
    }
  };
  useEffect(() => {
    if (isEdit || recovered || autoOpened.current) return;
    autoOpened.current = true;
    if (isNativeApp) void capture();
    else if (entryPhotos)
      void entryPhotos.then((files) => {
        if (alive.current) void importPhoto(files);
      });
  }, []);
  const change = <K extends keyof ReviewItem>(key: K, value: ReviewItem[K]) =>
    updateDraft((r) => ({ ...r, [key]: value }));
  const submit = async () => {
    if (locked || saving.current) return;
    setError('');
    if (!isEdit && !draft.photoIds.length) {
      setPhotoError('Cần có ảnh để lưu.');
      return;
    }
    if (amount === null) {
      setError('Nhập giá từ 1 đến 2.000k.');
      document.getElementById('review-price')?.focus();
      return;
    }
    saving.current = true;
    setSubmitting(true);
    try {
      await gpsPromise.current;
      const current = draftRef.current,
        now = new Date();
      const item = validateReview({
        ...current,
        name: current.name.trim() || automaticReviewName(current.category, now),
        priceK: amount,
        reviewedAt: isEdit ? (current.reviewedAt ?? current.createdAt) : now.toISOString(),
        updatedAt: now.toISOString(),
        isDemo: false,
      });
      const ok = await onSave(item, photos, firstVisit, initial.updatedAt);
      if (!ok) saving.current = false;
    } catch (e) {
      saving.current = false;
      setError((e as Error).message);
    } finally {
      if (alive.current) setSubmitting(false);
    }
  };
  const food = draft.category === 'food',
    volume = Math.max(
      0,
      VOLUME_OPTIONS.findIndex((v) => v.key === draft.volumeKey),
    );
  const library = (label: string) => (
    <label className="button secondary file-button">
      <Images size={18} />
      {label}
      <input
        aria-label="Chọn ảnh món ăn hoặc đồ uống"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={locked}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          void importPhoto(files);
        }}
      />
    </label>
  );
  return (
    <form
      noValidate
      className="review-form quick-review stack"
      data-stage={stage}
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
          e.preventDefault();
          e.target.blur();
        }
      }}
    >
      <input
        ref={captureInput}
        type="file"
        hidden
        capture="environment"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Chụp ảnh món ăn hoặc đồ uống"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          void importPhoto(files);
        }}
      />
      <div className="quick-toolbar">
        <button
          type="button"
          className="icon-button"
          aria-label="Về quán xá"
          disabled={locked}
          onClick={onCancel}
        >
          <ArrowLeft />
        </button>
        {stage === 'capture' ? (
          <h1>Chụp ảnh</h1>
        ) : (
          <>
            <h1 className="sr-only">{isEdit ? 'Sửa đánh giá' : 'Chấm điểm'}</h1>
            <output className="quick-total" aria-label="Điểm đánh giá">
              {score === null ? '—' : <AnimatedNumber value={score} decimals={2} />}
              <small>/10</small>
            </output>
            <button
              type="submit"
              className="button"
              aria-label={isEdit ? 'Cập nhật đánh giá' : 'Lưu quán'}
              disabled={locked}
            >
              {busy || submitting ? (
                <LoaderCircle className="photo-spinner" size={18} />
              ) : (
                <Check size={18} />
              )}
              Lưu
            </button>
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="alert">
          {error}
        </p>
      )}
      {photoError && (
        <p role="alert" className="alert">
          {photoError}
        </p>
      )}
      {stage === 'capture' ? (
        <section className="capture-stage stack">
          <div className="capture-cover">
            <Camera size={48} />
            {(photoBusy || recovering) && (
              <span className="capture-processing" role="status">
                <LoaderCircle className="photo-spinner" />
                Đang mở ảnh…
              </span>
            )}
          </div>
          <button
            type="button"
            className="button shutter-button"
            disabled={locked}
            onClick={() => void capture()}
          >
            <Camera />
            Chụp ảnh
          </button>
          {library('Thư viện')}
        </section>
      ) : (
        <>
          <motion.section
            className="quick-photo-price"
            initial={quiet ? false : { opacity: 0.6, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: quiet ? 0 : 0.28 }}
          >
            <div className="quick-photo">
              {draft.photoIds[0] ? (
                <Photo
                  id={draft.photoIds[0]}
                  draft={photos.find((p) => p.id === draft.photoIds[0])?.blob}
                  alt="Ảnh đánh giá"
                />
              ) : (
                <button
                  type="button"
                  className="photo-empty"
                  aria-label="Chụp ảnh cho quán"
                  onClick={() => void capture()}
                  disabled={locked}
                >
                  <Camera size={32} />
                </button>
              )}
              <button
                type="button"
                className="icon-button retake-photo"
                aria-label="Chụp lại ảnh"
                disabled={locked}
                onClick={() => void capture()}
              >
                <Camera size={18} />
              </button>
              {(photoBusy || recovering) && (
                <span className="quick-photo-busy" role="status" aria-label="Đang xử lý ảnh">
                  <LoaderCircle className="photo-spinner" />
                </span>
              )}
            </div>
            <div className="quick-price-location">
              <label className="field quick-price-field" htmlFor="review-price">
                <span>
                  Giá <small>(k)</small>
                </span>
                <Input
                  id="review-price"
                  aria-label="Giá (k)"
                  type="text"
                  inputMode="decimal"
                  enterKeyHint="done"
                  autoComplete="off"
                  placeholder="0"
                  value={price}
                  maxLength={8}
                  disabled={locked}
                  onChange={(e) => setPrice(e.target.value)}
                  aria-invalid={!!error && amount === null}
                />
              </label>
              <button
                type="button"
                className="text-button quick-location"
                aria-label="Chỉnh vị trí quán"
                title={gpsError || undefined}
                disabled={locked}
                onClick={() => setPinPicker(true)}
              >
                {gpsBusy ? (
                  <LoaderCircle className="photo-spinner" size={16} />
                ) : gpsError ? (
                  <CircleAlert size={16} />
                ) : (
                  <MapPin size={16} />
                )}
                <span>
                  {gpsBusy
                    ? 'GPS…'
                    : draft.lat !== null
                      ? `Vị trí${draft.accuracyM ? ` · ±${Math.round(draft.accuracyM)}m` : ''}`
                      : 'Vị trí'}
                </span>
                {hasConfirmedLocation(draft) && <Check size={14} />}
              </button>
            </div>
          </motion.section>
          <ToggleGroup.Root
            key={`category-${theme}`}
            type="single"
            className="segmented quick-category"
            aria-label="Loại quán"
            value={draft.category}
            onValueChange={(v) => {
              if (v === 'drink' || v === 'food') change('category', v);
            }}
            disabled={locked}
          >
            <ToggleGroup.Item value="drink">
              <Coffee size={17} />
              Nước
            </ToggleGroup.Item>
            <ToggleGroup.Item value="food">
              <Utensils size={17} />
              Ăn
            </ToggleGroup.Item>
          </ToggleGroup.Root>
          <ToggleGroup.Root
            key={`mode-${theme}`}
            type="single"
            className="segmented quick-mode"
            aria-label="Hình thức"
            value={food ? draft.foodType : draft.mode}
            onValueChange={(v) => {
              if (v) {
                if (food) change('foodType', v as FoodVenueType);
                else change('mode', v as DrinkMode);
              }
            }}
            disabled={locked}
          >
            {(food
              ? [
                  ['streetfood', 'Bình dân'],
                  ['restaurant', 'Quán ngồi'],
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
          <fieldset className="quick-sliders stack" disabled={locked}>
            <ScoreSlider
              label={food ? 'Ngon' : 'Vị'}
              value={draft.taste}
              onChange={(v) => change('taste', v)}
            />
            {food ? (
              <>
                <ScoreSlider
                  label="Chất lượng"
                  value={draft.foodQuality}
                  onChange={(v) => change('foodQuality', v)}
                />
                <ScoreSlider
                  label="Sạch"
                  value={draft.cleanliness}
                  onChange={(v) => change('cleanliness', v)}
                />
              </>
            ) : (
              <>
                <ScoreSlider
                  label="Lượng"
                  min={0}
                  max={4}
                  step={1}
                  value={volume}
                  display={`${VOLUME_OPTIONS[volume].label} · ${VOLUME_OPTIONS[volume].score}`}
                  onChange={(v) => change('volumeKey', VOLUME_OPTIONS[v].key)}
                />
                <ScoreSlider
                  label="Ly"
                  value={draft.packaging}
                  onChange={(v) => change('packaging', v)}
                />
              </>
            )}
            {(food || draft.mode === 'dinein') && (
              <ScoreSlider
                label="Không gian"
                value={draft.space}
                onChange={(v) => change('space', v)}
              />
            )}
          </fieldset>
          <details className="quick-more disclosure">
            <summary>Thông tin thêm</summary>
            <div className="stack">
              <label className="field">
                <span>Tên quán</span>
                <Input
                  id="shop-name-input"
                  value={draft.name}
                  maxLength={160}
                  onChange={(e) => change('name', e.target.value)}
                  placeholder="Tên quán"
                />
              </label>
              <label className="field">
                <span>Món</span>
                <Input
                  value={draft.dish ?? ''}
                  maxLength={300}
                  onChange={(e) => change('dish', e.target.value)}
                />
              </label>
              <label className="field">
                <span>Ghi chú</span>
                <Textarea
                  value={draft.note}
                  rows={2}
                  maxLength={5000}
                  onChange={(e) => change('note', e.target.value)}
                />
              </label>
              <button type="button" className="text-button" onClick={() => setLocation(true)}>
                <MapPin size={16} />
                {[draft.city, draft.ward].filter(Boolean).join(', ') || 'Địa điểm'}
              </button>
              <div className="two-columns">
                <label className="field">
                  <span>Đường</span>
                  <Input
                    value={draft.street}
                    list="saved-streets"
                    maxLength={200}
                    onChange={(e) => change('street', e.target.value)}
                  />
                  <datalist id="saved-streets">
                    {[
                      ...new Set(
                        existing
                          .filter((r) => r.city === draft.city)
                          .map((r) => r.street)
                          .filter(Boolean),
                      ),
                    ].map((v) => (
                      <option key={v} value={v} />
                    ))}
                  </datalist>
                </label>
                <label className="field">
                  <span>Số nhà</span>
                  <Input
                    value={draft.address ?? ''}
                    maxLength={100}
                    onChange={(e) => change('address', e.target.value)}
                  />
                </label>
              </div>
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
              {library('Đổi ảnh từ thư viện')}
              <button
                type="button"
                className="text-button danger-text"
                disabled={locked}
                onClick={onDiscard}
              >
                Bỏ bản nháp
              </button>
            </div>
          </details>
        </>
      )}
      {pinPicker && (
        <Suspense fallback={<p role="status">Đang mở bản đồ…</p>}>
          <PinPicker
            theme={theme}
            initial={
              draft.lat !== null && draft.lng !== null
                ? { lat: draft.lat, lng: draft.lng, accuracyM: draft.accuracyM }
                : null
            }
            onClose={() => setPinPicker(false)}
            onConfirm={(p) => {
              manualPin.current = true;
              setGpsError('');
              updateDraft((r) => ({
                ...r,
                lat: p.lat,
                lng: p.lng,
                accuracyM: p.accuracyM,
                locationStatus: 'confirmed',
                locationSource: p.source,
                placeResolution: undefined,
              }));
            }}
          />
        </Suspense>
      )}
      {location && (
        <LocationPicker
          city={draft.city}
          ward={draft.ward}
          onClose={() => setLocation(false)}
          onSelect={(value) =>
            updateDraft((r) => ({ ...r, ...value, provinceCode: undefined, wardCode: undefined }))
          }
        />
      )}
    </form>
  );
}
