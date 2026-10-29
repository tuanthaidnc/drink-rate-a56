import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import L from 'leaflet';
import {
  X,
  MapPin,
  LocateFixed,
  Check,
  Compass,
  RefreshCw,
} from 'lucide-react';
import { RippleButton, type AppTheme } from './animate-ui/primitives';
import { reverseGeocodeOsm } from '../data/vietnamLocations2025';

interface MapPinPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLat?: number;
  initialLng?: number;
  initialCoords?: { lat: number; lng: number };
  initialCity?: string;
  initialWard?: string;
  initialStreet?: string;
  shopName?: string;
  theme?: AppTheme;
  onConfirm?: (result: {
    lat: number;
    lng: number;
    city?: string;
    ward?: string;
    street?: string;
  }) => void;
  onConfirmPin?: (result: {
    lat: number;
    lng: number;
    city?: string;
    ward?: string;
    street?: string;
  }) => void;
}

export function MapPinPickerModal({
  isOpen,
  onClose,
  initialLat,
  initialLng,
  initialCoords,
  initialCity = 'Đà Nẵng',
  initialWard = 'Thanh Khê',
  initialStreet = 'Phan Thanh',
  theme = 'dark',
  onConfirm,
  onConfirmPin,
}: MapPinPickerModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const startLat = initialCoords?.lat ?? initialLat ?? 16.0645;
  const startLng = initialCoords?.lng ?? initialLng ?? 108.2125;

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: startLat,
    lng: startLng,
  });

  const [resolvedAddress, setResolvedAddress] = useState<{
    city?: string;
    ward?: string;
    street?: string;
  }>({
    city: initialCity,
    ward: initialWard,
    street: initialStreet,
  });

  const [isResolving, setIsResolving] = useState(false);
  const [locatingGps, setLocatingGps] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!isOpen) return;

    // Small delay to ensure DOM element is mounted
    const timer = setTimeout(() => {
      if (!containerRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(containerRef.current, {
        center: [currentCoords.lat, currentCoords.lng],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      // Clean 2D Google Maps Vietnamese Roadmap
      L.tileLayer('https://mt1.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}&apistyle=s.t%3A2%7Cp.v%3Aoff%2Cs.t%3A4%7Cp.v%3Aoff%2Cs.t%3A6%7Cs.e%3Al%7Cp.v%3Aoff%2Cs.t%3A81%7Cs.e%3Al%7Cp.v%3Aoff', {
        maxZoom: 20,
      }).addTo(map);

      // Custom Draggable Pin Icon
      const pinIcon = L.divIcon({
        className: 'not-map-pin-picker',
        html: `
          <div style="position:relative;display:inline-flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
            <div style="display:inline-flex;align-items:center;gap:4px;padding:5px 9px;border-radius:999px;background:#ea580c;color:#ffffff;font-size:11px;font-weight:800;box-shadow:0 6px 16px rgba(234,88,12,0.6);white-space:nowrap;">
              <span>📍 Vị trí quán</span>
            </div>
            <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #ea580c;margin-top:-1px;"></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([currentCoords.lat, currentCoords.lng], {
        icon: pinIcon,
        draggable: true,
      }).addTo(map);

      const updatePosition = async (lat: number, lng: number) => {
        const roundedLat = Math.round(lat * 100000) / 100000;
        const roundedLng = Math.round(lng * 100000) / 100000;
        setCurrentCoords({ lat: roundedLat, lng: roundedLng });
        marker.setLatLng([roundedLat, roundedLng]);

        setIsResolving(true);
        try {
          const res = await reverseGeocodeOsm(roundedLat, roundedLng);
          if (res) {
            setResolvedAddress({
              city: res.city || initialCity,
              ward: res.ward || initialWard,
              street: res.street || initialStreet,
            });
          }
        } finally {
          setIsResolving(false);
        }
      };

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        updatePosition(pos.lat, pos.lng);
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        updatePosition(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
      markerRef.current = marker;

      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isOpen]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Math.round(pos.coords.latitude * 100000) / 100000;
        const lng = Math.round(pos.coords.longitude * 100000) / 100000;
        setCurrentCoords({ lat, lng });
        setLocatingGps(false);
        if (mapRef.current && markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          mapRef.current.flyTo([lat, lng], 17, { duration: 0.5 });
        }
        setIsResolving(true);
        try {
          const res = await reverseGeocodeOsm(lat, lng);
          if (res) {
            setResolvedAddress({
              city: res.city || initialCity,
              ward: res.ward || initialWard,
              street: res.street || initialStreet,
            });
          }
        } finally {
          setIsResolving(false);
        }
      },
      () => setLocatingGps(false),
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const handleConfirm = () => {
    const payload = {
      lat: currentCoords.lat,
      lng: currentCoords.lng,
      city: resolvedAddress.city,
      ward: resolvedAddress.ward,
      street: resolvedAddress.street,
    };
    if (onConfirm) onConfirm(payload);
    if (onConfirmPin) onConfirmPin(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-[430px] rounded-3xl theme-surface-card p-4 space-y-3 border-2 border-[var(--border-active)] shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-500 border border-orange-500/30 flex items-center justify-center font-bold">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[var(--text-primary)] leading-tight">
                  Chấm ghim trực tiếp trên Bản đồ 2D
                </h3>
                <p className="text-[10px] text-[var(--text-muted)]">
                  Chạm hoặc kéo ghim để định vị quán chính xác
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl theme-surface-elevated text-[var(--text-secondary)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Map Box */}
          <div className="relative w-full h-[290px] rounded-2xl overflow-hidden border border-[var(--border-card)]">
            <div ref={containerRef} className="w-full h-full z-0" />

            {/* Hint overlay */}
            <div className="absolute top-2 left-2 z-[400] flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--bg-card)]/90 backdrop-blur-xs border border-[var(--border-card)] text-[10px] font-bold text-[var(--text-secondary)] shadow-sm">
              <Compass className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
              <span>Chạm bất kỳ đâu để đổi vị trí</span>
            </div>

            {/* GPS Button */}
            <button
              type="button"
              onClick={handleLocateMe}
              className="absolute bottom-3 right-3 z-[400] h-9 px-3 rounded-xl bg-[var(--bg-card)]/95 border border-[var(--border-active)] shadow-md text-xs font-bold text-[var(--accent)] flex items-center gap-1.5 cursor-pointer"
            >
              <LocateFixed className={locatingGps ? 'w-3.5 h-3.5 animate-spin' : 'w-3.5 h-3.5'} />
              <span>Vị trí GPS của tôi</span>
            </button>
          </div>

          {/* Readout of selected position */}
          <div className="p-3 rounded-2xl theme-surface-elevated space-y-1 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-[var(--text-primary)]">Tọa độ đã chọn:</span>
              <span className="font-mono text-xs font-bold text-[var(--accent)]">
                {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--text-secondary)]">
              <span>Địa chỉ ước tính:</span>
              <div className="flex items-center gap-1 font-semibold text-[var(--text-primary)] text-right">
                {isResolving ? (
                  <span className="inline-flex items-center gap-1 text-[var(--accent)] font-mono">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Đang giải mã...
                  </span>
                ) : (
                  <span>
                    Đường {resolvedAddress.street || '...'} • P. {resolvedAddress.ward || '...'} •{' '}
                    {resolvedAddress.city || '...'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <RippleButton
            type="button"
            onClick={handleConfirm}
            className="w-full h-11 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
          >
            <Check className="w-4 h-4" strokeWidth={2.5} />
            <span>Xác nhận vị trí ghim này</span>
          </RippleButton>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
