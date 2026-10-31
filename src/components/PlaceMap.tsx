import { useState } from 'react';
import { MapPin, Navigation, LocateFixed } from 'lucide-react';
import MapSurface from './MapSurface.tsx';
import { hasConfirmedLocation, type ReviewItem } from '../lib/models.ts';
import { distanceKm, type Position } from '../lib/geo.ts';
export default function PlaceMap({
  items,
  theme,
  position,
  onLocate,
  onEdit,
  onDirections,
  onCreate,
  selectedId,
}: {
  items: ReviewItem[];
  theme: 'light' | 'dark';
  position: Position | null;
  onLocate: () => void;
  onEdit: (item: ReviewItem) => void;
  onDirections: (item: ReviewItem) => void;
  onCreate: (p: Position) => void;
  selectedId?: string | null;
}) {
  const [id, setId] = useState<string | null>(selectedId ?? null);
  const [approximate, setApproximate] = useState(false);
  const [picking, setPicking] = useState(false);
  const [pin, setPin] = useState<Position | null>(null);
  const active = items.find((r) => r.id === id) ?? items.find(hasConfirmedLocation) ?? items[0];
  const confirmed = items.filter(hasConfirmedLocation).length;
  const hasLegacyPins = items.some(
    (r) => r.lat != null && r.lng != null && !hasConfirmedLocation(r),
  );
  return (
    <div className="place-map stack">
      <section className="map-toolbar" aria-label="Điều khiển bản đồ">
        <span className="map-count">
          {items.length} quán · {confirmed} ghim xác nhận
        </span>
        <div className="map-actions">
          <button
            className="icon-button"
            onClick={onLocate}
            aria-label="GPS của tôi"
            title="GPS của tôi"
          >
            <LocateFixed size={17} />
          </button>
          <button
            className="icon-button"
            aria-pressed={picking}
            aria-label={picking ? 'Dừng chấm ghim' : 'Chấm ghim mới'}
            title={picking ? 'Dừng chấm ghim' : 'Chấm ghim mới'}
            onClick={() => {
              setPicking(!picking);
              setPin(null);
            }}
          >
            <MapPin size={16} />
          </button>
        </div>
        {hasLegacyPins && (
          <label className="check map-legacy">
            <input
              type="checkbox"
              checked={approximate}
              onChange={(e) => setApproximate(e.target.checked)}
              aria-label="Hiện vị trí cũ chưa xác nhận"
            />
            Vị trí cũ
          </label>
        )}
      </section>
      <MapSurface
        theme={theme}
        items={items}
        selectedId={active?.id}
        onSelect={setId}
        position={position}
        showApproximate={approximate}
        pin={pin}
        onPin={picking ? setPin : undefined}
      />
      {pin && (
        <section className="panel">
          <p>
            Ghim mới:{' '}
            <span className="mono">
              {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
            </span>
          </p>
          <button className="button w-full" onClick={() => onCreate(pin)}>
            Chấm điểm quán tại ghim này
          </button>
        </section>
      )}
      <div className="map-places" aria-label="Chọn quán trên bản đồ">
        {items.map((r) => (
          <button
            className="button secondary map-place"
            key={r.id}
            aria-pressed={active?.id === r.id}
            onClick={() => setId(r.id)}
          >
            {r.category === 'food' ? '🍜' : '🥤'} {r.name}
            <small>
              {r.priceK}k · {r.totalScore.toFixed(1)}đ
            </small>
          </button>
        ))}
      </div>
      {active ? (
        <section className="panel">
          <div className="split">
            <h3>{active.name}</h3>
            <strong className="score">
              {active.totalScore.toFixed(1)}
              <small>/10</small>
            </strong>
          </div>
          <p>
            {[active.address, active.street, active.ward, active.city].filter(Boolean).join(' • ')}
          </p>
          {!hasConfirmedLocation(active) && <span className="small muted">Chưa ghim</span>}
          {position && hasConfirmedLocation(active) && (
            <span className="small muted">
              {distanceKm(position, { lat: active.lat!, lng: active.lng! }).toFixed(1)} km
            </span>
          )}
          <div className="button-row">
            <button className="button" onClick={() => onDirections(active)}>
              <Navigation size={17} />
              {hasConfirmedLocation(active) ? 'Chỉ đường tới ghim' : 'Tìm quán trên Maps'}
            </button>
            <button className="button secondary" onClick={() => onEdit(active)}>
              Sửa / xác nhận vị trí
            </button>
          </div>
        </section>
      ) : (
        <p className="empty">Không có quán</p>
      )}
    </div>
  );
}
