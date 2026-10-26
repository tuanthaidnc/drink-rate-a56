import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Check,
  ChevronRight,
  Plus,
  X,
  Navigation,
} from 'lucide-react';
import { OFFICIAL_34_PROVINCES, type ProvinceData } from '../data/locations';
import { cn } from './animate-ui/primitives';

const CUSTOM_LOCATIONS_KEY = 'not_custom_locations_34_v1';

interface LocationPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  city: string;
  ward: string;
  street: string;
  onSelect: (loc: { city: string; ward: string; street: string }) => void;
}

export function loadMergedLocations(): ProvinceData[] {
  try {
    const raw = localStorage.getItem(CUSTOM_LOCATIONS_KEY);
    if (!raw) return OFFICIAL_34_PROVINCES;
    const custom: ProvinceData[] = JSON.parse(raw);
    const merged: ProvinceData[] = JSON.parse(JSON.stringify(OFFICIAL_34_PROVINCES));

    for (const c of custom) {
      const existingCity = merged.find((x) => x.name === c.name);
      if (!existingCity) {
        merged.push(c);
      } else {
        for (const w of c.wards) {
          const existingWard = existingCity.wards.find((x) => x.name === w.name);
          if (!existingWard) {
            existingCity.wards.push(w);
          } else {
            for (const s of w.streets) {
              if (!existingWard.streets.includes(s)) {
                existingWard.streets.unshift(s);
              }
            }
          }
        }
      }
    }
    return merged;
  } catch {
    return OFFICIAL_34_PROVINCES;
  }
}

export function saveCustomLocation(city: string, ward: string, street: string) {
  try {
    const raw = localStorage.getItem(CUSTOM_LOCATIONS_KEY);
    const custom: ProvinceData[] = raw ? JSON.parse(raw) : [];
    let c = custom.find((x) => x.name === city);
    if (!c) {
      c = { id: city.toLowerCase(), name: city, type: 'Tỉnh', wards: [] };
      custom.push(c);
    }
    let w = c.wards.find((x) => x.name === ward);
    if (!w) {
      w = { name: ward, streets: [] };
      c.wards.push(w);
    }
    if (street && !w.streets.includes(street)) {
      w.streets.unshift(street);
    }
    localStorage.setItem(CUSTOM_LOCATIONS_KEY, JSON.stringify(custom));
  } catch {
    // ignore
  }
}

export function LocationPickerSheet({
  isOpen,
  onClose,
  city,
  ward,
  street,
  onSelect,
}: LocationPickerSheetProps) {
  const [step, setStep] = useState<'city' | 'ward' | 'street'>('ward');
  const [tempCity, setTempCity] = useState(city || 'Đà Nẵng');
  const [tempWard, setTempWard] = useState(ward || 'Thanh Khê');
  const [tempStreet, setTempStreet] = useState(street || 'Phan Thanh');
  const [query, setQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTempCity(city || 'Đà Nẵng');
      setTempWard(ward || 'Thanh Khê');
      setTempStreet(street || 'Phan Thanh');
      setQuery('');
      setIsSearchFocused(false);
    }
  }, [isOpen, city, ward, street]);

  const allProvinces = useMemo(() => loadMergedLocations(), [isOpen]);

  const currentProvinceObj = useMemo(
    () => allProvinces.find((c) => c.name === tempCity) || allProvinces[0],
    [allProvinces, tempCity]
  );

  const currentWardObj = useMemo(
    () =>
      currentProvinceObj?.wards.find((w) => w.name === tempWard) ||
      currentProvinceObj?.wards[0],
    [currentProvinceObj, tempWard]
  );

  const filteredProvinces = useMemo(() => {
    if (!query.trim() || step !== 'city') return allProvinces;
    const q = query.toLowerCase();
    return allProvinces.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.mergedFrom && c.mergedFrom.toLowerCase().includes(q))
    );
  }, [allProvinces, query, step]);

  const filteredWards = useMemo(() => {
    const list = currentProvinceObj?.wards || [];
    if (!query.trim() || step !== 'ward') return list;
    const q = query.toLowerCase();
    return list.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        (w.formerArea && w.formerArea.toLowerCase().includes(q)) ||
        w.streets.some((s) => s.toLowerCase().includes(q))
    );
  }, [currentProvinceObj, query, step]);

  const filteredStreets = useMemo(() => {
    const list = currentWardObj?.streets || [];
    if (!query.trim() || step !== 'street') return list;
    const q = query.toLowerCase();
    return list.filter((s) => s.toLowerCase().includes(q));
  }, [currentWardObj, query, step]);

  const handlePickCity = (cName: string) => {
    setTempCity(cName);
    const nextProv = allProvinces.find((x) => x.name === cName);
    if (nextProv && nextProv.wards.length > 0) {
      setTempWard(nextProv.wards[0].name);
      setTempStreet(nextProv.wards[0].streets[0] || '');
    } else {
      setTempWard('');
      setTempStreet('');
    }
    setQuery('');
    setStep('ward');
  };

  const handlePickWard = (wName: string) => {
    setTempWard(wName);
    const wObj = currentProvinceObj?.wards.find((x) => x.name === wName);
    if (wObj && wObj.streets.length > 0) {
      setTempStreet(wObj.streets[0]);
    } else {
      setTempStreet('');
    }
    setQuery('');
    setStep('street');
  };

  const handlePickStreet = (sName: string) => {
    setTempStreet(sName);
    saveCustomLocation(tempCity, tempWard, sName);
    onSelect({ city: tempCity, ward: tempWard, street: sName });
    onClose();
  };

  const handleQuickCreateFromQuery = () => {
    const clean = query.trim();
    if (!clean) return;
    if (step === 'ward') {
      const wClean = clean.replace(/^Phường\s+/i, '').replace(/^P\.\s*/i, '');
      saveCustomLocation(tempCity, wClean, '');
      setTempWard(wClean);
      setTempStreet('');
      setQuery('');
      setStep('street');
    } else if (step === 'street') {
      const sClean = clean.replace(/^Đường\s+/i, '');
      const targetWard = tempWard || 'Trung tâm';
      saveCustomLocation(tempCity, targetWard, sClean);
      setQuery('');
      onSelect({ city: tempCity, ward: targetWard, street: sClean });
      onClose();
    }
  };

  const stepIndex = step === 'city' ? 0 : step === 'ward' ? 1 : 2;
  const cleanQuery = query.trim();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          style={{
            top: 'var(--vvo, 0px)',
            height: 'var(--vvh, 100dvh)',
          }}
          className="fixed inset-x-0 z-50 bg-black/75 backdrop-blur-md flex items-start justify-center p-2 sm:p-4 overflow-hidden"
          onClick={onClose}
        >
          {/* Khối Modal khớp chính xác chiều cao vùng nhìn thấy phía trên bàn phím ảo */}
          <motion.div
            initial={{ y: -18, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -14, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[430px] max-h-full rounded-[24px] theme-surface-card p-3.5 flex flex-col gap-2.5 overflow-hidden shadow-2xl"
          >
            {/* Compact Header + 3-Step Switcher */}
            <div className="flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Navigation
                  className="w-4 h-4 text-[var(--accent)] shrink-0"
                  strokeWidth={2}
                />
                <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                  Chọn Địa Điểm (34 Tỉnh/Thành)
                </h3>
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-7 h-7 rounded-full theme-surface-elevated text-[var(--text-secondary)] flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* 3-Step Direct Hierarchy (Automatically compacts when keyboard is open) */}
            <div className="relative grid grid-cols-3 p-1 rounded-2xl theme-surface-elevated shrink-0 overflow-hidden">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-1 bottom-1 left-1 rounded-xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  width: 'calc((100% - 8px) / 3)',
                  transform: `translate3d(${stepIndex * 100}%, 0, 0)`,
                  background: 'var(--bg-pill)',
                  border: '1px solid var(--border-active)',
                  boxShadow: 'var(--card-inset)',
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setStep('city');
                  setQuery('');
                }}
                className="relative z-10 py-1.5 px-2 rounded-xl text-left cursor-pointer"
              >
                {!isSearchFocused && (
                  <span className="block text-[10px] text-[var(--text-muted)]">
                    1. Tỉnh/Thành
                  </span>
                )}
                <span className="block text-xs font-semibold text-[var(--text-primary)] leading-tight">
                  {tempCity || 'Chọn'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('ward');
                  setQuery('');
                }}
                className="relative z-10 py-1.5 px-2 rounded-xl text-left cursor-pointer"
              >
                {!isSearchFocused && (
                  <span className="block text-[10px] text-[var(--text-muted)]">
                    2. Phường
                  </span>
                )}
                <span className="block text-xs font-semibold text-[var(--text-primary)] leading-tight">
                  {tempWard ? `P. ${tempWard}` : 'Chọn phường'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('street');
                  setQuery('');
                }}
                className="relative z-10 py-1.5 px-2 rounded-xl text-left cursor-pointer"
              >
                {!isSearchFocused && (
                  <span className="block text-[10px] text-[var(--text-muted)]">
                    3. Đường
                  </span>
                )}
                <span className="block text-xs font-semibold text-[var(--accent)] leading-tight">
                  {tempStreet || 'Chọn đường'}
                </span>
              </button>
            </div>

            {/* Unified Search + Quick Add Input right at the top */}
            <div className="relative shrink-0">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  step === 'city'
                    ? 'Tìm trong 34 Tỉnh / Thành phố...'
                    : step === 'ward'
                      ? `Tìm hoặc nhập tên phường tại ${tempCity}...`
                      : `Tìm hoặc nhập tên đường thuộc P. ${tempWard}...`
                }
                className="w-full h-9.5 pl-9 pr-8 rounded-xl theme-surface-elevated text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--border-active)]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Instant Top Quick-Create Button when user types a custom Ward/Street */}
            {cleanQuery.length > 1 && step !== 'city' && (
              <motion.button
                type="button"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleQuickCreateFromQuery}
                className="w-full py-2 px-3 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] font-semibold text-xs flex items-center justify-between gap-2 shrink-0 cursor-pointer shadow-sm"
              >
                <span className="text-left leading-snug">
                  {step === 'ward'
                    ? `Thêm & chọn Phường: "${cleanQuery}"`
                    : `Thêm & chọn Đường: "${cleanQuery}"`}
                </span>
                <Plus className="w-4 h-4 shrink-0" />
              </motion.button>
            )}

            {/* Strictly Contained Scrollable List (min-h-0 prevents flex overflow!) */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain space-y-1.5 pr-0.5">
              {step === 'city' &&
                filteredProvinces.map((c) => {
                  const active = c.name === tempCity;
                  return (
                    <motion.button
                      key={c.id}
                      type="button"
                      whileTap={{ scale: 0.985 }}
                      onClick={() => handlePickCity(c.name)}
                      className={cn(
                        'w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-left transition-colors cursor-pointer border',
                        active
                          ? 'bg-[var(--accent-soft)] border-[var(--border-active)]'
                          : 'theme-surface-elevated border-transparent'
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-[var(--text-primary)]">
                            {c.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-pill)] text-[var(--text-secondary)]">
                            {c.type}
                          </span>
                        </div>
                        {c.mergedFrom && (
                          <div className="text-[11px] text-[var(--text-muted)] leading-snug mt-0.5">
                            Hợp nhất: {c.mergedFrom}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                    </motion.button>
                  );
                })}

              {step === 'ward' &&
                filteredWards.map((w) => {
                  const active = w.name === tempWard;
                  return (
                    <motion.button
                      key={w.name}
                      type="button"
                      whileTap={{ scale: 0.985 }}
                      onClick={() => handlePickWard(w.name)}
                      className={cn(
                        'w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-left transition-colors cursor-pointer border',
                        active
                          ? 'bg-[var(--accent-soft)] border-[var(--border-active)]'
                          : 'theme-surface-elevated border-transparent'
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[var(--text-primary)]">
                            Phường {w.name}
                          </span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-pill)] text-[var(--text-secondary)] shrink-0">
                            {w.streets.length} đường
                          </span>
                        </div>
                        {w.formerArea && (
                          <div className="text-[11px] text-[var(--text-muted)] leading-snug mt-0.5">
                            Gồm: {w.formerArea}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                    </motion.button>
                  );
                })}

              {step === 'street' && (
                <div className="grid grid-cols-2 gap-1.5 pb-1">
                  {filteredStreets.map((s) => {
                    const active = s === tempStreet;
                    return (
                      <motion.button
                        key={s}
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handlePickStreet(s)}
                        className={cn(
                          'flex items-center justify-between gap-1.5 px-3 py-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer border',
                          active
                            ? 'bg-[var(--accent-soft)] border-[var(--border-active)] text-[var(--accent)] font-semibold'
                            : 'theme-surface-elevated text-[var(--text-primary)]'
                        )}
                      >
                        <span className="leading-snug">{s}</span>
                        {active && (
                          <Check className="w-3.5 h-3.5 shrink-0 text-[var(--accent)]" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
