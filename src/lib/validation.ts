import { INITIAL_REVIEWS } from '../data/demo.ts';
import {
  SCHEMA_VERSION,
  SCORING_VERSION,
  newId,
  type ReviewItem,
  type Visit,
  type Settings,
  type BackupFile,
  type BackupPhoto,
} from './models.ts';
import { scoreReview } from './scoring.ts';

export const MAX_BACKUP_BYTES = 75 * 1024 * 1024;
export const MAX_PHOTO_BYTES = 300_000;
export class DataError extends Error {
  name = 'DataError';
}
type Obj = Record<string, unknown>;
function object(v: unknown, label: string): Obj {
  if (!v || typeof v !== 'object' || Array.isArray(v))
    throw new DataError(`${label}: cần một đối tượng dữ liệu.`);
  return v as Obj;
}
function text(v: unknown, label: string, max: number, required = false): string {
  if (typeof v !== 'string' || v.length > max || (required && !v.trim()))
    throw new DataError(`${label}: ${required ? 'không được trống và ' : ''}tối đa ${max} ký tự.`);
  return v.trim();
}
function numeric(v: unknown, label: string, min: number, max: number): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max)
    throw new DataError(`${label}: phải từ ${min} đến ${max}.`);
  return v;
}
function choice<T extends string>(v: unknown, allowed: readonly T[], label: string): T {
  if (typeof v !== 'string' || !allowed.includes(v as T))
    throw new DataError(`${label}: giá trị không được hỗ trợ.`);
  return v as T;
}
function date(v: unknown, label: string, now: Date, allowFuture = false): string {
  if (
    typeof v !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(v)
  )
    throw new DataError(`${label}: ngày không hợp lệ.`);
  const d = new Date(v.includes('T') ? v : `${v}T00:00:00+07:00`);
  if (
    !Number.isFinite(d.getTime()) ||
    d.getUTCFullYear() < 1970 ||
    new Date(`${v.slice(0, 10)}T00:00:00Z`).toISOString().slice(0, 10) !== v.slice(0, 10) ||
    (!allowFuture && d.getTime() > now.getTime() + 60_000)
  )
    throw new DataError(`${label}: ngày không hợp lệ hoặc nằm trong tương lai.`);
  return d.toISOString();
}
function optionalText(v: unknown, label: string, max: number) {
  return v === undefined || v === null || v === '' ? undefined : text(v, label, max);
}
export function validateSettings(input: unknown): Settings {
  const x = object(input ?? {}, 'Cài đặt');
  return {
    ...(x.monthlyBudgetK !== undefined
      ? { monthlyBudgetK: numeric(x.monthlyBudgetK, 'Ngân sách', 1, 10_000_000) }
      : {}),
    ...(typeof x.reducedMotion === 'boolean' ? { reducedMotion: x.reducedMotion } : {}),
  };
}
export function validateVisit(input: unknown, now = new Date()): Visit {
  const x = object(input, 'Lượt ghé');
  return {
    id: text(x.id, 'Mã lượt ghé', 160, true),
    visitedAt: date(x.visitedAt, 'Ngày ghé', now),
    ...(x.spentK !== undefined
      ? { spentK: numeric(x.spentK, 'Tiền thực trả (k)', 0, 1_000_000) }
      : {}),
    dish: optionalText(x.dish, 'Món đã gọi', 300),
    note: optionalText(x.note, 'Ghi chú lượt ghé', 1000),
  };
}
function isUntouchedDemo(x: Obj): boolean {
  const seed = INITIAL_REVIEWS.find((s) => s.id === x.id && s.category === 'food');
  if (
    !seed ||
    (Array.isArray(x.visits) && x.visits.length) ||
    (Array.isArray(x.visitLog) && x.visitLog.length)
  )
    return false;
  return [
    'name',
    'city',
    'ward',
    'street',
    'priceK',
    'taste',
    'space',
    'totalScore',
    'note',
    'createdAt',
    'lat',
    'lng',
    'foodType',
    'foodQuality',
    'cleanliness',
  ].every((k) => x[k] === (seed as unknown as Obj)[k]);
}
export function validateReview(
  input: unknown,
  options: { legacy?: boolean; now?: Date } = {},
): ReviewItem {
  const { legacy = false, now = new Date() } = options;
  const x = object(input, 'Đánh giá');
  const category = choice(
    x.category ?? (legacy ? 'drink' : undefined),
    ['drink', 'food'] as const,
    'Loại quán',
  );
  const oldVisits = x.visits ?? [];
  if (!Array.isArray(oldVisits) || oldVisits.length > 20_000)
    throw new DataError('Lịch sử ghé không hợp lệ.');
  const logs = x.visitLog ?? oldVisits.map((v, i) => ({ id: `legacy-visit-${i}`, visitedAt: v }));
  if (!Array.isArray(logs) || logs.length > 20_000)
    throw new DataError('Lịch sử ghé không hợp lệ.');
  const visitLog = logs.map((v) => validateVisit(v, now));
  if (new Set(visitLog.map((v) => v.id)).size !== visitLog.length)
    throw new DataError('Trùng mã lượt ghé.');
  const ids = x.photoIds ?? [];
  if (!Array.isArray(ids) || ids.length > 3) throw new DataError('Mỗi quán tối đa 3 ảnh.');
  const photoIds = ids.map((v) => text(v, 'Mã ảnh', 160, true));
  if (new Set(photoIds).size !== photoIds.length)
    throw new DataError('Trùng mã ảnh trong đánh giá.');
  const lat = x.lat == null ? null : numeric(x.lat, 'Vĩ độ', -90, 90);
  const lng = x.lng == null ? null : numeric(x.lng, 'Kinh độ', -180, 180);
  if ((lat === null) !== (lng === null)) throw new DataError('Cần cả vĩ độ và kinh độ.');
  const locationStatus = choice(
    x.locationStatus ?? (legacy ? (lat == null ? 'missing' : 'approximate') : undefined),
    ['confirmed', 'approximate', 'missing'] as const,
    'Độ chính xác vị trí',
  );
  if (locationStatus === 'confirmed' && (lat == null || lng == null))
    throw new DataError('Vị trí xác nhận chưa có tọa độ.');
  const ratingHistory = x.ratingHistory ?? [];
  if (!Array.isArray(ratingHistory) || ratingHistory.length > 1000)
    throw new DataError('Lịch sử đánh giá không hợp lệ.');
  const record: ReviewItem = {
    id: text(x.id, 'Mã quán', 160, true),
    category,
    name: text(x.name, 'Tên quán', 160, true),
    city: text(x.city ?? (legacy ? '' : undefined), 'Tỉnh/thành', 120),
    ward: text(x.ward ?? '', 'Phường/xã', 160),
    street: text(x.street ?? '', 'Đường', 200),
    provinceCode:
      x.provinceCode === undefined ? undefined : text(x.provinceCode, 'Mã tỉnh', 2, true),
    wardCode: x.wardCode === undefined ? undefined : text(x.wardCode, 'Mã xã', 5, true),
    address: optionalText(x.address, 'Địa chỉ cụ thể', 300),
    priceK: numeric(x.priceK, 'Giá (k)', 1, 2000),
    taste: numeric(x.taste, 'Hương vị', 1, 10),
    space: numeric(x.space ?? (legacy ? 7.5 : undefined), 'Không gian', 1, 10),
    packaging: numeric(x.packaging ?? (legacy ? 8 : undefined), 'Vỏ ly', 1, 10),
    foodQuality: numeric(x.foodQuality ?? (legacy ? 8 : undefined), 'Chất lượng', 1, 10),
    cleanliness: numeric(x.cleanliness ?? (legacy ? 8 : undefined), 'Sạch sẽ', 1, 10),
    mode: choice(
      x.mode ?? (legacy ? 'takeaway' : undefined),
      ['takeaway', 'dinein'] as const,
      'Hình thức uống',
    ),
    foodType: choice(
      x.foodType ?? (legacy ? 'streetfood' : undefined),
      ['streetfood', 'restaurant'] as const,
      'Hình thức ăn',
    ),
    volumeKey: choice(
      x.volumeKey ?? (legacy ? 'medium' : undefined),
      ['very_low', 'low', 'medium', 'high', 'overflow'] as const,
      'Lượng đồ uống',
    ),
    totalScore: 0,
    note: text(x.note ?? '', 'Ghi chú', 5000),
    createdAt: date(x.createdAt ?? (legacy ? now.toISOString() : undefined), 'Ngày tạo', now),
    updatedAt: date(x.updatedAt ?? x.createdAt ?? now.toISOString(), 'Ngày cập nhật', now),
    reviewedAt: x.reviewedAt
      ? date(x.reviewedAt, 'Ngày đánh giá', now)
      : legacy && x.createdAt
        ? date(x.createdAt, 'Ngày đánh giá', now)
        : undefined,
    lat,
    lng,
    locationStatus,
    locationSource:
      x.locationSource === undefined
        ? legacy
          ? 'legacy'
          : undefined
        : choice(x.locationSource, ['manual', 'gps', 'legacy'] as const, 'Nguồn vị trí'),
    accuracyM:
      x.accuracyM === undefined ? undefined : numeric(x.accuracyM, 'Độ chính xác GPS', 0, 100_000),
    visitLog,
    visits: visitLog.map((v) => v.visitedAt),
    photoIds,
    dish: optionalText(x.dish, 'Món nên gọi', 300),
    cuisine: optionalText(x.cuisine, 'Loại món', 100),
    isDemo: x.isDemo === true || (legacy && isUntouchedDemo(x)),
    scoringVersion: SCORING_VERSION,
    ratingHistory: ratingHistory.map((v) => {
      const r = object(v, 'Lịch sử đánh giá');
      return {
        reviewedAt: date(r.reviewedAt, 'Ngày đánh giá cũ', now),
        totalScore: numeric(r.totalScore, 'Điểm cũ', 0, 10),
        priceK: numeric(r.priceK, 'Giá cũ', 1, 2000),
        taste: numeric(r.taste, 'Vị cũ', 1, 10),
        scoringVersion: text(r.scoringVersion, 'Phiên bản điểm cũ', 80, true),
      };
    }),
  };
  if (x.openingHours !== undefined && x.openingHours !== null) {
    const h = object(x.openingHours, 'Giờ mở cửa');
    if (
      !Array.isArray(h.days) ||
      !h.days.length ||
      h.days.length > 7 ||
      new Set(h.days).size !== h.days.length ||
      h.days.some((d) => !Number.isInteger(d) || Number(d) < 0 || Number(d) > 6)
    )
      throw new DataError('Ngày mở cửa không hợp lệ.');
    const from = text(h.from, 'Giờ mở', 5, true),
      to = text(h.to, 'Giờ đóng', 5, true);
    if (![from, to].every((v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v)) || from === to)
      throw new DataError('Giờ mở/đóng cần đúng HH:mm và khác nhau.');
    record.openingHours = {
      days: h.days as number[],
      from,
      to,
      checkedAt: date(h.checkedAt, 'Ngày kiểm tra giờ mở cửa', now),
    };
  }
  record.totalScore = scoreReview(record);
  return record;
}
export function validateReviews(input: unknown, legacy = false, now = new Date()): ReviewItem[] {
  if (!Array.isArray(input) || input.length > 10_000)
    throw new DataError('Dữ liệu cần là danh sách tối đa 10.000 quán.');
  const reviews = input.map((x, i) => {
    try {
      return validateReview(x, { legacy, now });
    } catch (e) {
      throw new DataError(`Quán ${i + 1}: ${(e as Error).message}`);
    }
  });
  if (new Set(reviews.map((r) => r.id)).size !== reviews.length)
    throw new DataError('File có mã quán trùng nhau; chưa nhập dữ liệu.');
  return reviews;
}
export function validateBackupPhoto(input: unknown): BackupPhoto {
  const x = object(input, 'Ảnh sao lưu');
  const id = text(x.id, 'Mã ảnh', 160, true);
  if (typeof x.dataUrl !== 'string' || x.dataUrl.length > MAX_PHOTO_BYTES * 1.4 + 100)
    throw new DataError('Ảnh quá lớn (tối đa 300 KB/ảnh).');
  const m = /^data:image\/(webp|png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/.exec(x.dataUrl);
  if (!m) throw new DataError('Chỉ nhận ảnh WebP, PNG hoặc JPEG trong file sao lưu.');
  let bytes: string;
  try {
    bytes = atob(m[2]);
  } catch {
    throw new DataError('Ảnh sao lưu không hợp lệ.');
  }
  const valid =
    m[1] === 'webp'
      ? bytes.startsWith('RIFF') && bytes.slice(8, 12) === 'WEBP'
      : m[1] === 'png'
        ? bytes.startsWith('\x89PNG\r\n\x1a\n')
        : bytes.startsWith('\xff\xd8\xff');
  if (!valid || bytes.length > MAX_PHOTO_BYTES)
    throw new DataError('Nội dung ảnh không đúng định dạng.');
  return { id, dataUrl: x.dataUrl };
}
export function parseBackup(raw: string, now = new Date()): BackupFile {
  if (new Blob([raw]).size > MAX_BACKUP_BYTES) throw new DataError('File sao lưu vượt quá 75 MB.');
  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    throw new DataError('Không đọc được JSON. Dữ liệu hiện tại được giữ nguyên.');
  }
  if (Array.isArray(input))
    return {
      app: 'not-food-drink',
      schemaVersion: SCHEMA_VERSION,
      scoringVersion: SCORING_VERSION,
      exportedAt: now.toISOString(),
      reviews: validateReviews(input, true, now),
      settings: {},
      media: [],
    };
  const x = object(input, 'File sao lưu');
  if (
    x.app !== 'not-food-drink' ||
    x.schemaVersion !== SCHEMA_VERSION ||
    x.scoringVersion !== SCORING_VERSION
  )
    throw new DataError('Phiên bản file sao lưu không được hỗ trợ; chưa thay đổi dữ liệu.');
  const reviews = validateReviews(x.reviews, false, now);
  if (!Array.isArray(x.media) || x.media.length > 30_000)
    throw new DataError('Danh sách ảnh sao lưu không hợp lệ.');
  const media = x.media.map(validateBackupPhoto);
  const mediaIds = new Set(media.map((p) => p.id));
  if (mediaIds.size !== media.length) throw new DataError('Trùng mã ảnh sao lưu.');
  for (const r of reviews)
    for (const id of r.photoIds)
      if (!mediaIds.has(id))
        throw new DataError(`Thiếu ảnh của quán ${r.name}; chưa nhập dữ liệu.`);
  return {
    app: 'not-food-drink',
    schemaVersion: SCHEMA_VERSION,
    scoringVersion: SCORING_VERSION,
    exportedAt: date(x.exportedAt, 'Ngày xuất file', now, true),
    reviews,
    settings: validateSettings(x.settings),
    media,
  };
}
export function createReview(category: 'food' | 'drink' = 'drink', now = new Date()): ReviewItem {
  return {
    id: newId('place'),
    category,
    name: '',
    city: 'Đà Nẵng',
    ward: '',
    street: '',
    priceK: category === 'food' ? 30 : 31,
    taste: 7.5,
    space: 7.5,
    totalScore: 0,
    note: '',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    reviewedAt: now.toISOString(),
    lat: null,
    lng: null,
    locationStatus: 'missing',
    mode: 'takeaway',
    volumeKey: 'medium',
    packaging: 8,
    foodType: 'streetfood',
    foodQuality: 8,
    cleanliness: 8,
    visits: [],
    visitLog: [],
    ratingHistory: [],
    photoIds: [],
    isDemo: false,
    scoringVersion: SCORING_VERSION,
  };
}
