import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  Navigation,
  LocateFixed,
  Star,
  Route,
  Edit3,
  Utensils,
  CupSoda,
  Compass,
  Sparkles,
} from 'lucide-react';
import {
  cn,
  Shine,
  RippleButton,
  CategoryScoreBadge,
  StarRatingBadge,
  scoreToStars,
  type AppTheme,
} from './animate-ui/primitives';
import {
  calculateDistanceKm,
  getProvinceInfo,
} from '../data/vietnamLocations2025';

export interface MapReviewItem {
  id: string;
  category: 'drink' | 'food';
  name: string;
  city: string;
  ward: string;
  street: string;
  mode: 'takeaway' | 'dinein';
  foodType?: 'streetfood' | 'restaurant';
  priceK: number;
  taste: number;
  totalScore: number;
  note: string;
  lat: number;
  lng: number;
}

interface MapExplorerProps {
  items: MapReviewItem[];
  theme: AppTheme;
  selectedCity: string;
  initialFocusId?: string | null;
  onEditItem: (item: MapReviewItem) => void;
  onOpenDirectionsExternal: (item: MapReviewItem) => void;
}

export function MapExplorer({
  items,
  theme,
  selectedCity,
  initialFocusId,
  onEditItem,
  onOpenDirectionsExternal,
}: MapExplorerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);

  const [catFilter, setCatFilter] = useState<'ALL' | 'food' | 'drink'>('ALL');
  const [minStars, setMinStars] = useState<number>(0);
  const [activeId, setActiveId] = useState<string | null>(
    initialFocusId || (items[0]?.id ?? null)
  );
  const [userPos, setUserPos] = useState<{
    lat: number;
    lng: number;
    label: string;
  }>({
    lat: 16.0635,
    lng: 108.2092,
    label: 'Phan Thanh • Thanh Khê',
  });
  const [showRouteOnMap, setShowRouteOnMap] = useState<boolean>(false);
  const [locatingGps, setLocatingGps] = useState<boolean>(false);

  useEffect(() => {
    if (initialFocusId) {
      setActiveId(initialFocusId);
    }
  }, [initialFocusId]);

  const filteredMapItems = useMemo(() => {
    return items.filter((it) => {
      if (catFilter !== 'ALL' && it.category !== catFilter) return false;
      const stars = scoreToStars(it.totalScore);
      if (minStars > 0 && stars < minStars) return false;
      return true;
    });
  }, [items, catFilter, minStars]);

  const activeItem = useMemo(() => {
    return (
      filteredMapItems.find((x) => x.id === activeId) ||
      filteredMapItems[0] ||
      null
    );
  }, [filteredMapItems, activeId]);

  // Initialize Clean 2D Google Maps Roadmap
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const defaultCenter: [number, number] = activeItem
      ? [activeItem.lat, activeItem.lng]
      : [16.0645, 108.2125];

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Giao diện Bản đồ 2D Google Maps Tiếng Việt sạch sẽ, đơn giản, dễ nhìn
    L.tileLayer('https://mt1.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}', {
      maxZoom: 20,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    const routeGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = markersGroup;
    routeLayerRef.current = routeGroup;

    setTimeout(() => {
      map.invalidateSize();
    }, 180);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Render Markers: Active Pin shows Full Name + Stars; Inactive Pins show Compact Icon + Stars so nothing clips at map edges
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // Marker vị trí xuất phát (Nhà / GPS người dùng)
    const homeHtml = `
      <div style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:999px;background:#2563eb;border:2.5px solid #ffffff;box-shadow:0 4px 10px rgba(37,99,235,0.55);color:#fff;font-size:12px;font-weight:800;transform:translate(-50%,-50%);">
        ⌂
      </div>
    `;
    const homeIcon = L.divIcon({
      className: 'not-map-pin-wrapper',
      html: homeHtml,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
    L.marker([userPos.lat, userPos.lng], {
      icon: homeIcon,
      zIndexOffset: 50,
    }).addTo(markersGroup);

    // Markers cho từng Quán ăn / Quán nước
    filteredMapItems.forEach((item) => {
      const isSelected = activeItem?.id === item.id;
      const stars = scoreToStars(item.totalScore).toFixed(1);
      const isFood = item.category === 'food';
      const badgeColor = isFood
        ? item.totalScore >= 7.5
          ? '#ea580c'
          : '#d97706'
        : item.totalScore >= 7.5
          ? '#059669'
          : '#0891b2';

      const bgCard = theme === 'dark' ? '#0f172a' : '#ffffff';
      const textPrimary = theme === 'dark' ? '#f8fafc' : '#0f172a';
      const emoji = isFood ? '🍜' : '🥤';

      const pinHtml = isSelected
        ? `
        <div style="position:relative;display:inline-flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%) scale(1.06);">
          <div style="display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:999px;background:${bgCard};border:2.5px solid ${badgeColor};box-shadow:0 8px 20px rgba(0,0,0,0.38);white-space:nowrap;">
            <span style="font-size:13px;line-height:1;">${emoji}</span>
            <span style="font-size:11px;font-weight:800;color:${textPrimary};">${item.name}</span>
            <span style="display:inline-flex;align-items:center;gap:2px;padding:1.5px 6px;border-radius:999px;background:${badgeColor};color:#ffffff;font-family:monospace;font-size:10px;font-weight:800;">
              ★${stars}
            </span>
          </div>
          <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:7px solid ${badgeColor};margin-top:-1px;"></div>
        </div>
      `
        : `
        <div style="position:relative;display:inline-flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);opacity:0.92;">
          <div style="display:inline-flex;align-items:center;gap:3px;padding:3.5px 7px;border-radius:999px;background:${bgCard};border:2px solid ${badgeColor};box-shadow:0 4px 12px rgba(0,0,0,0.28);white-space:nowrap;">
            <span style="font-size:12px;line-height:1;">${emoji}</span>
            <span style="font-family:monospace;font-size:10px;font-weight:800;color:${textPrimary};">★${stars}</span>
          </div>
          <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${badgeColor};margin-top:-1px;"></div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'not-map-pin-wrapper',
        html: pinHtml,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([item.lat, item.lng], {
        icon,
        zIndexOffset: isSelected ? 1000 : 200,
      }).addTo(markersGroup);

      marker.on('click', () => {
        setActiveId(item.id);
      });
    });
  }, [filteredMapItems, activeItem, theme, userPos]);

  // Fly to Active Item or Draw Route Line
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeGroup = routeLayerRef.current;
    if (!map || !routeGroup) return;

    routeGroup.clearLayers();

    if (!activeItem) {
      if (selectedCity !== 'ALL') {
        const p = getProvinceInfo(selectedCity);
        map.flyTo([p.lat, p.lng], 13, { duration: 0.5 });
      }
      return;
    }

    if (showRouteOnMap) {
      const latlngs: [number, number][] = [
        [userPos.lat, userPos.lng],
        [
          (userPos.lat + activeItem.lat) / 2 + 0.001,
          (userPos.lng + activeItem.lng) / 2 - 0.0006,
        ],
        [activeItem.lat, activeItem.lng],
      ];

      const polyline = L.polyline(latlngs, {
        color: activeItem.category === 'food' ? '#ea580c' : '#059669',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.95,
      }).addTo(routeGroup);

      map.fitBounds(polyline.getBounds(), {
        padding: [55, 55],
        maxZoom: 16,
      });
    } else {
      map.flyTo([activeItem.lat, activeItem.lng], 15, {
        duration: 0.5,
      });
    }
  }, [activeItem, showRouteOnMap, userPos, selectedCity]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: 'Vị trí GPS hiện tại',
        });
        setLocatingGps(false);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo(
            [pos.coords.latitude, pos.coords.longitude],
            15,
            { duration: 0.5 }
          );
        }
      },
      () => {
        setLocatingGps(false);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const distanceKm = activeItem
    ? calculateDistanceKm(
        userPos.lat,
        userPos.lng,
        activeItem.lat,
        activeItem.lng
      )
    : 0;
  const estMinutes = Math.max(2, Math.round(distanceKm * 3));

  return (
    <div className="space-y-3">
      {/* 1. BỘ LỌC NHANH TRÊN BẢN ĐỒ (LOẠI QUÁN + SỐ SAO) */}
      <div className="rounded-2xl theme-surface-card p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex p-0.5 rounded-xl theme-surface-elevated flex-1 min-w-0">
            {(
              [
                { k: 'ALL', l: `Tất cả (${items.length})` },
                {
                  k: 'food',
                  l: `🍜 Ăn (${items.filter((x) => x.category === 'food').length})`,
                },
                {
                  k: 'drink',
                  l: `🥤 Nước (${items.filter((x) => x.category === 'drink').length})`,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.k}
                type="button"
                onClick={() => setCatFilter(tab.k)}
                className={cn(
                  'flex-1 py-1.5 px-1.5 rounded-lg text-[11px] transition-all cursor-pointer whitespace-nowrap',
                  catFilter === tab.k
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-extrabold shadow-xs'
                    : 'text-[var(--text-secondary)] font-medium'
                )}
              >
                {tab.l}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleLocateMe}
            className="h-8 px-2.5 rounded-xl theme-surface-elevated flex items-center gap-1 text-[11px] font-bold text-[var(--accent)] shrink-0 cursor-pointer"
            title="Định vị GPS của tôi"
          >
            <LocateFixed
              className={cn('w-3.5 h-3.5', locatingGps && 'animate-spin')}
            />
            <span>GPS</span>
          </button>
        </div>

        {/* Bộ lọc mức Sao */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(
            [
              { v: 0, label: 'Mọi mức sao' },
              { v: 4.0, label: '★ ≥ 4.0 (Quán ruột)' },
              { v: 3.5, label: '★ ≥ 3.5 (Đáng thử)' },
              { v: 3.0, label: '★ ≥ 3.0' },
            ] as const
          ).map((st) => {
            const active = minStars === st.v;
            return (
              <button
                key={st.v}
                type="button"
                onClick={() => setMinStars(st.v)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap border transition-all cursor-pointer',
                  active
                    ? 'bg-amber-500/20 text-amber-400 border-amber-400/60 font-bold'
                    : 'theme-surface-elevated text-[var(--text-secondary)]'
                )}
              >
                {st.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. KHUNG BẢN ĐỒ 2D GOOGLE MAPS SẠCH SẼ, DỄ NHÌN */}
      <div className="relative rounded-2xl theme-surface-card overflow-hidden border-2 border-[var(--border-card)] shadow-lg">
        <div
          ref={mapContainerRef}
          id="not-interactive-map"
          className="w-full h-[265px] z-0"
        />

        {/* Chú thích nổi trên góc Bản đồ */}
        <div className="absolute top-2.5 left-2.5 z-[400] flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--bg-card)]/92 border border-[var(--border-card)] shadow-xs text-[10px] font-bold text-[var(--text-secondary)]">
          <Compass className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
          <span>Bản đồ 2D • Chạm ghim ★ để xem quán</span>
        </div>
      </div>

      {/* 3. THANH CUỘN CHỌN NHANH CÁC QUÁN TRÊN BẢN ĐỒ */}
      {filteredMapItems.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {filteredMapItems.map((it) => {
            const isSelected = activeItem?.id === it.id;
            const stars = scoreToStars(it.totalScore).toFixed(1);
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => setActiveId(it.id)}
                className={cn(
                  'px-3 py-2 rounded-xl border text-left shrink-0 transition-all cursor-pointer flex items-center gap-2',
                  isSelected
                    ? 'theme-surface-card border-[var(--border-active)] ring-1 ring-[var(--border-active)]'
                    : 'theme-surface-elevated opacity-80 hover:opacity-100'
                )}
              >
                <span className="text-sm">
                  {it.category === 'food' ? '🍜' : '🥤'}
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-[var(--text-primary)] whitespace-nowrap">
                      {it.name}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-amber-400">
                      ★{stars}
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] block whitespace-nowrap">
                    Đường {it.street} • {it.priceK}k
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* 4. THẺ CHI TIẾT QUÁN ĐANG CHỌN TRÊN BẢN ĐỒ & CHỈ ĐƯỜNG 1 DÒNG GỌN GÀNG */}
      {activeItem ? (
        <Shine className="rounded-2xl theme-surface-card border-[var(--border-active)] p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <CategoryScoreBadge
                category={activeItem.category}
                score={activeItem.totalScore}
                size="sm"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={cn(
                      'text-[10px] font-extrabold px-2 py-0.5 rounded-md inline-flex items-center gap-1 whitespace-nowrap',
                      activeItem.category === 'food'
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/35'
                        : 'bg-[var(--accent-soft)] text-[var(--accent)]'
                    )}
                  >
                    {activeItem.category === 'food' ? (
                      <>
                        <Utensils className="w-3 h-3 shrink-0" />
                        <span>
                          {activeItem.foodType === 'streetfood'
                            ? 'Quán ăn • Vỉa hè'
                            : 'Quán ăn • Quán ngồi'}
                        </span>
                      </>
                    ) : (
                      <>
                        <CupSoda className="w-3 h-3 shrink-0" />
                        <span>
                          {activeItem.mode === 'takeaway'
                            ? 'Quán nước • Take-away'
                            : 'Quán nước • Ngồi lại'}
                        </span>
                      </>
                    )}
                  </span>
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md theme-surface-elevated text-[var(--text-primary)] whitespace-nowrap">
                    {activeItem.priceK}k
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-[var(--text-primary)] leading-snug">
                  {activeItem.name}
                </h3>

                <p className="text-xs text-[var(--text-secondary)]">
                  Đường {activeItem.street} • P. {activeItem.ward} •{' '}
                  {activeItem.city}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0 space-y-1">
              <div className="font-mono text-xl font-extrabold text-[var(--accent)] leading-none">
                {activeItem.totalScore.toFixed(1)}
                <span className="text-[11px] text-[var(--text-muted)] font-normal">
                  /10
                </span>
              </div>
              <StarRatingBadge score10={activeItem.totalScore} />
            </div>
          </div>

          {/* Thông tin khoảng cách & lộ trình ước tính */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl theme-surface-elevated text-xs">
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <Route className="w-4 h-4 text-[var(--accent)] shrink-0" />
              <span>
                Cách <b>{userPos.label}</b>{' '}
                <b className="font-mono text-[var(--text-primary)]">
                  {distanceKm} km
                </b>{' '}
                (~{estMinutes} phút)
              </span>
            </div>
            <Star className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-amber-400" />
          </div>

          {activeItem.note && (
            <p className="text-xs text-[var(--text-secondary)] italic px-1">
              “{activeItem.note}”
            </p>
          )}

          {/* Cụm nút Chỉ đường & Xem lộ trình: Tất cả nằm gọn trên 1 dòng, không bị rớt chữ */}
          <div className="grid grid-cols-12 gap-2 pt-1">
            <RippleButton
              type="button"
              onClick={() => onOpenDirectionsExternal(activeItem)}
              className="col-span-5 h-10 px-2 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <Navigation className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
              <span>Chỉ đường</span>
            </RippleButton>

            <RippleButton
              type="button"
              onClick={() => setShowRouteOnMap((prev) => !prev)}
              className={cn(
                'col-span-5 h-10 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border whitespace-nowrap',
                showRouteOnMap
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--border-active)]'
                  : 'theme-surface-elevated text-[var(--text-primary)]'
              )}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>{showRouteOnMap ? 'Ẩn lộ trình' : 'Xem lộ trình'}</span>
            </RippleButton>

            <RippleButton
              type="button"
              onClick={() => onEditItem(activeItem)}
              className="col-span-2 h-10 rounded-xl theme-surface-elevated text-xs font-bold flex items-center justify-center text-[var(--text-secondary)]"
              title="Sửa đánh giá"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </RippleButton>
          </div>
        </Shine>
      ) : (
        <div className="rounded-2xl theme-surface-card p-6 text-center text-xs text-[var(--text-secondary)]">
          Không có quán nào khớp bộ lọc mức sao trên bản đồ.
        </div>
      )}
    </div>
  );
}
