import { lazy, Suspense, useState } from 'react';
import { Check, LocateFixed, LoaderCircle, MapPin } from 'lucide-react';
import type { Position } from '../lib/geo.ts';
const MapSurface = lazy(() => import('./MapSurface.tsx'));

export default function CaptureLocation({
  theme,
  pin,
  gps,
  busy,
  error,
  onLocate,
  onPin,
  onConfirm,
}: {
  theme: 'dark' | 'light';
  pin: Position | null;
  gps: Position | null;
  busy: boolean;
  error: string;
  onLocate: () => void;
  onPin: (p: Position) => void;
  onConfirm: () => void;
}) {
  const [manual, setManual] = useState(false);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [invalid, setInvalid] = useState('');
  return (
    <section className="capture-location stack" aria-label="Xác nhận vị trí">
      <div className="capture-map" data-locating={busy}>
        <Suspense
          fallback={
            <span className="scene-loader" role="status" aria-label="Đang mở bản đồ">
              <i />
            </span>
          }
        >
          <MapSurface theme={theme} pin={pin} position={gps} onPin={onPin} />
        </Suspense>
        {busy && (
          <span className="gps-status" role="status">
            <LoaderCircle className="photo-spinner" size={16} /> Đang lấy GPS…
          </span>
        )}
      </div>
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
      <div className="split location-tools">
        <span className="small muted">
          <MapPin size={15} />
          {pin
            ? `${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}${pin.accuracyM ? ` · ±${Math.round(pin.accuracyM)}m` : ''}`
            : 'Chọn ghim trên bản đồ'}
        </span>
        <button
          type="button"
          className="icon-button"
          disabled={busy}
          onClick={onLocate}
          aria-label="Lấy lại GPS"
        >
          <LocateFixed />
        </button>
      </div>
      <button
        type="button"
        className="text-button manual-coordinates"
        onClick={() => {
          setManual((v) => !v);
          setLat(pin ? String(pin.lat) : '');
          setLng(pin ? String(pin.lng) : '');
        }}
        aria-expanded={manual}
      >
        Nhập tọa độ
      </button>
      {manual && (
        <div className="stack">
          <div className="two-columns">
            <label className="field">
              <span>Vĩ độ</span>
              <input inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} />
            </label>
            <label className="field">
              <span>Kinh độ</span>
              <input inputMode="decimal" value={lng} onChange={(e) => setLng(e.target.value)} />
            </label>
          </div>
          {invalid && (
            <p className="alert" role="alert">
              {invalid}
            </p>
          )}
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              const a = Number(lat),
                b = Number(lng);
              if (
                !lat.trim() ||
                !lng.trim() ||
                !Number.isFinite(a) ||
                !Number.isFinite(b) ||
                Math.abs(a) > 90 ||
                Math.abs(b) > 180
              ) {
                setInvalid('Tọa độ chưa hợp lệ.');
                return;
              }
              onPin({ lat: a, lng: b });
              setInvalid('');
              setManual(false);
            }}
          >
            Đặt ghim
          </button>
        </div>
      )}
      <button type="button" className="button confirm-location" disabled={!pin} onClick={onConfirm}>
        <Check size={18} /> Dùng vị trí này
      </button>
    </section>
  );
}
