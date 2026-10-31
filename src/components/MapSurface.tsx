import { useEffect, useRef, useState } from 'react';
import { Map, Marker, NavigationControl, setWorkerUrl, type MapMouseEvent } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { ReviewItem } from '../lib/models.ts';
import type { Position } from '../lib/geo.ts';
setWorkerUrl(workerUrl);
interface Props {
  theme: 'light' | 'dark';
  items?: ReviewItem[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  position?: Position | null;
  pin?: Position | null;
  onPin?: (p: Position) => void;
  showApproximate?: boolean;
}
export default function MapSurface({
  theme,
  items = [],
  selectedId,
  onSelect,
  position,
  pin,
  onPin,
  showApproximate = false,
}: Props) {
  const element = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const pickRef = useRef(onPin);
  pickRef.current = onPin;
  const markers = useRef<Marker[]>([]);
  const [message, setMessage] = useState('');
  const selected = items.find((r) => r.id === selectedId);
  useEffect(() => {
    if (!element.current) return;
    setMessage('');
    const center = pin ??
      (selected?.lat != null && selected.lng != null
        ? { lat: selected.lat, lng: selected.lng }
        : position) ?? { lat: 16.0678, lng: 108.2208 };
    let map: Map;
    try {
      map = new Map({
        container: element.current,
        style: `${import.meta.env.BASE_URL}data/map-${theme}.json`,
        center: [center.lng, center.lat],
        zoom: 14,
        pitch: 0,
        bearing: 0,
        attributionControl: {
          compact: true,
          customAttribution: `<a href="${import.meta.env.BASE_URL}data/map-style-licenses.txt" target="_blank" rel="noreferrer">Style: CARTO / OpenMapTiles</a>`,
        },
        cooperativeGestures: true,
        dragRotate: false,
        touchPitch: false,
      });
    } catch {
      setMessage('Thiết bị chưa mở được bản đồ. Bạn vẫn có thể xem quán và mở chỉ đường.');
      return;
    }
    mapRef.current = map;
    map.touchZoomRotate.disableRotation();
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    map.on('load', () =>
      setMessage(
        navigator.onLine
          ? ''
          : 'Bạn đang offline; nền bản đồ có thể chưa có. Danh sách và tọa độ vẫn được giữ.',
      ),
    );
    map.on('error', () =>
      setMessage(
        navigator.onLine
          ? 'Một phần nền bản đồ chưa tải được. Hãy thử lại khi mạng ổn định.'
          : 'Đang offline. Nền bản đồ cần mạng; dữ liệu quán vẫn có trên máy.',
      ),
    );
    const click = (e: MapMouseEvent) =>
      pickRef.current?.({
        lat: Number(e.lngLat.lat.toFixed(6)),
        lng: Number(e.lngLat.lng.toFixed(6)),
      });
    map.on('click', click);
    const resize = new ResizeObserver(() => map.resize());
    resize.observe(element.current);
    return () => {
      resize.disconnect();
      markers.current.forEach((m) => m.remove());
      markers.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [theme]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markers.current.forEach((m) => m.remove());
    markers.current = [];
    for (const item of items) {
      if (
        item.lat == null ||
        item.lng == null ||
        (!showApproximate && item.locationStatus !== 'confirmed')
      )
        continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `place-pin ${item.category === 'food' ? 'food-pin' : ''} ${item.id === selectedId ? 'selected-pin' : ''} ${item.locationStatus !== 'confirmed' ? 'approximate-pin' : ''}`;
      button.textContent = `${item.category === 'food' ? '🍜' : '🥤'} ${item.id === selectedId ? item.name + ' · ' : ''}★${(item.totalScore / 2).toFixed(1)}${item.locationStatus !== 'confirmed' ? ' ?' : ''}`;
      button.setAttribute(
        'aria-label',
        `${item.name}, ${item.totalScore.toFixed(1)} điểm${item.locationStatus !== 'confirmed' ? ', vị trí ước tính chưa xác nhận' : ''}`,
      );
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        selectRef.current?.(item.id);
      });
      markers.current.push(
        new Marker({ element: button, anchor: 'bottom' })
          .setLngLat([item.lng, item.lat])
          .addTo(map),
      );
    }
    if (position) {
      const el = document.createElement('div');
      el.className = 'gps-pin';
      el.title = `Vị trí GPS${position.accuracyM ? `, sai số khoảng ${Math.round(position.accuracyM)}m` : ''}`;
      el.setAttribute('aria-label', el.title);
      markers.current.push(
        new Marker({ element: el }).setLngLat([position.lng, position.lat]).addTo(map),
      );
    }
    if (pin) {
      const el = document.createElement('div');
      el.className = 'picked-pin';
      el.textContent = '📍 Vị trí đã ghim';
      const marker = new Marker({ element: el, anchor: 'bottom', draggable: true })
        .setLngLat([pin.lng, pin.lat])
        .addTo(map);
      marker.on('dragend', () => {
        const p = marker.getLngLat();
        pickRef.current?.({ lat: Number(p.lat.toFixed(6)), lng: Number(p.lng.toFixed(6)) });
      });
      markers.current.push(marker);
    }
  }, [items, selectedId, position, pin, showApproximate, theme]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const target =
      pin ??
      (selected?.lat != null && selected.lng != null
        ? { lat: selected.lat, lng: selected.lng }
        : null);
    if (target)
      map.easeTo({
        center: [target.lng, target.lat],
        zoom: Math.max(14, map.getZoom()),
        duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350,
      });
  }, [selected?.id, pin?.lat, pin?.lng, theme]);
  return (
    <div className="map-container">
      <div
        ref={element}
        className="map-surface"
        aria-label={onPin ? 'Bản đồ chọn vị trí quán' : 'Bản đồ quán trong bộ lọc'}
      />
      {message && (
        <p role="status" className="map-status">
          {message}
        </p>
      )}
    </div>
  );
}
