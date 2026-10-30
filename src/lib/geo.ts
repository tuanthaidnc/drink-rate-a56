import { hasConfirmedLocation, type ReviewItem, normalizeSearch } from './models.ts';
import { isNativeApp } from './platform.ts';
export interface Position {
  lat: number;
  lng: number;
  accuracyM?: number;
}
export function distanceKm(a: Position, b: Position): number {
  const rad = (n: number) => (n * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat),
    dLng = rad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(Math.max(0, 1 - x)));
}
export function directionsUrl(item: ReviewItem): string {
  if (hasConfirmedLocation(item))
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${item.lat},${item.lng}`)}&travelmode=two-wheeler`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([item.name, item.address, item.street, item.ward, item.city, 'Việt Nam'].filter(Boolean).join(', '))}`;
}
export async function getCurrentPosition(): Promise<Position> {
  if (isNativeApp) {
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      const permission = await Geolocation.checkPermissions();
      if (permission.coarseLocation !== 'granted') await Geolocation.requestPermissions();
      const p = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 30_000,
      });
      return { lat: p.coords.latitude, lng: p.coords.longitude, accuracyM: p.coords.accuracy };
    } catch {
      throw new Error('Chưa lấy được GPS. Kiểm tra quyền vị trí hoặc ghim thủ công.');
    }
  }
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Thiết bị chưa hỗ trợ định vị. Bạn có thể ghim thủ công.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracyM: p.coords.accuracy }),
      (e) =>
        reject(
          new Error(
            e.code === 1
              ? 'Bạn chưa cho phép GPS. Vẫn có thể chọn địa điểm hoặc ghim thủ công.'
              : e.code === 3
                ? 'GPS hết thời gian chờ. Hãy thử lại ở nơi thoáng hơn.'
                : 'Chưa lấy được vị trí. Hãy thử lại hoặc ghim thủ công.',
          ),
        ),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    );
  });
}
export interface Province {
  code: string;
  name: string;
  wards: { code: string; name: string }[];
}
export interface AdminData {
  version: string;
  downloadedAt: string;
  reference: string;
  convertedBy: string;
  provinces: Province[];
}
let adminPromise: Promise<AdminData> | undefined;
export function loadAdminData(): Promise<AdminData> {
  if (!adminPromise)
    adminPromise = fetch(`${import.meta.env.BASE_URL}data/admin-2025.json`)
      .then(async (r) => {
        if (!r.ok)
          throw new Error('Không mở được danh mục địa điểm. Hãy mở ứng dụng có mạng một lần.');
        const j = (await r.json()) as AdminData;
        if (
          j.provinces.length !== 34 ||
          j.provinces.reduce((n, p) => n + p.wards.length, 0) !== 3321
        )
          throw new Error('Danh mục địa điểm không đầy đủ.');
        return j;
      })
      .catch((e) => {
        adminPromise = undefined;
        throw e;
      });
  return adminPromise;
}
export function shortProvince(name: string) {
  return name.replace(/^(Thành phố|Tỉnh)\s+/i, '');
}
export function shortWard(name: string) {
  return name.replace(/^(Phường|Xã)\s+/i, '');
}
export function matchProvince(data: AdminData, name: string) {
  return data.provinces.find(
    (p) => normalizeSearch(shortProvince(p.name)) === normalizeSearch(shortProvince(name)),
  );
}
export function matchWard(p: Province | undefined, name: string) {
  return p?.wards.find(
    (w) => normalizeSearch(shortWard(w.name)) === normalizeSearch(shortWard(name)),
  );
}

// Only invoked by an explicit address-lookup action. No automatic geocoding when saving.
export async function reverseAddress(
  pos: Position,
): Promise<{ street?: string; ward?: string; city?: string; displayName?: string }> {
  if (!navigator.onLine)
    throw new Error('Tra địa chỉ cần mạng; tọa độ đã ghim vẫn có thể lưu offline.');
  const key = `not-geocode-v13:${pos.lat.toFixed(5)},${pos.lng.toFixed(5)}`;
  try {
    const cached = localStorage.getItem(key);
    if (cached) return JSON.parse(cached);
  } catch {}
  const run = async () => {
    let last = 0;
    try {
      last = Number(localStorage.getItem('not-geocode-last-request')) || 0;
    } catch {}
    const wait = Math.max(0, 1100 - (Date.now() - last));
    if (wait) await new Promise((r) => setTimeout(r, wait));
    try {
      localStorage.setItem('not-geocode-last-request', String(Date.now()));
    } catch {}
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.lat.toFixed(5)}&lon=${pos.lng.toFixed(5)}&zoom=18&addressdetails=1`,
      {
        headers: { 'Accept-Language': 'vi' },
        signal: AbortSignal.timeout(8000),
        referrerPolicy: 'strict-origin-when-cross-origin',
      },
    );
    if (!r.ok) throw new Error('Dịch vụ địa chỉ đang bận. Tọa độ ghim vẫn được giữ nguyên.');
    const j = await r.json();
    const a = j.address;
    if (!a) throw new Error('Chưa tìm thấy địa chỉ. Bạn có thể chọn tỉnh/phường và điền đường.');
    const data = await loadAdminData();
    const p = matchProvince(data, a.city || a.state || a.province || '');
    const wardName = a.suburb || a.quarter || a.neighbourhood || a.city_district || '';
    const ward = matchWard(p, wardName);
    const result = {
      street: a.road || a.pedestrian || undefined,
      ward: ward ? shortWard(ward.name) : undefined,
      city: p ? shortProvince(p.name) : undefined,
      displayName: typeof j.display_name === 'string' ? j.display_name : undefined,
    };
    try {
      localStorage.setItem(key, JSON.stringify(result));
    } catch {}
    return result;
  };
  return navigator.locks ? navigator.locks.request('not-geocode-request', run) : run();
}
