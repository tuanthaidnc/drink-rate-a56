import {
  emptyDocument,
  newId,
  SCHEMA_VERSION,
  SCORING_VERSION,
  type ReviewDocument,
  type PhotoData,
  type BackupFile,
  type ReviewItem,
} from './models.ts';
import {
  DataError,
  validateReviews,
  validateSettings,
  parseBackup,
  MAX_PHOTO_BYTES,
} from './validation.ts';

import { applyPlaceCorrections, needsPlaceCorrections } from './placeCorrections.ts';
export const DB_NAME = 'not-food-drink-personal';
export const LEGACY_KEYS = [
  'not_drink_food_reviews_v11',
  'not_drink_food_reviews_v9',
  'not_drink_reviews_v5_34tinh',
  'not_drink_reviews_v4_34provinces',
];
export interface Snapshot {
  id: string;
  createdAt: string;
  reason: string;
  document: ReviewDocument;
}
export class RecoveryError extends Error {
  name = 'RecoveryError';
  raw?: string;
  source?: string;
  constructor(message: string, raw?: string, source?: string) {
    super(message);
    this.raw = raw;
    this.source = source;
  }
}
let database: Promise<IDBDatabase> | undefined;
function db(): Promise<IDBDatabase> {
  if (!database)
    database = new Promise((resolve, reject) => {
      const r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = () => {
        const d = r.result;
        d.createObjectStore('documents');
        d.createObjectStore('snapshots', { keyPath: 'id' });
        d.createObjectStore('photos', { keyPath: 'id' });
        d.createObjectStore('archives', { keyPath: 'id' });
      };
      r.onsuccess = () => {
        r.result.onversionchange = () => {
          r.result.close();
          database = undefined;
        };
        resolve(r.result);
      };
      r.onerror = () => {
        database = undefined;
        reject(new Error('Không mở được nơi lưu dữ liệu trên thiết bị.'));
      };
      r.onblocked = () => {
        database = undefined;
        reject(new Error('Hãy đóng phiên NỐT cũ khác rồi mở lại để cập nhật nơi lưu.'));
      };
    });
  return database;
}
function request<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
function complete(t: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    t.oncomplete = () => resolve();
    t.onabort = () => reject(t.error ?? new Error('Lưu dữ liệu bị hủy.'));
    t.onerror = () => {};
  });
}
function checkDocument(input: unknown): ReviewDocument {
  if (
    !input ||
    typeof input !== 'object' ||
    (input as ReviewDocument).schemaVersion !== SCHEMA_VERSION
  )
    throw new DataError('Phiên bản dữ liệu trên máy không được hỗ trợ.');
  const x = input as ReviewDocument;
  if (
    typeof x.revision !== 'string' ||
    !x.revision ||
    typeof x.updatedAt !== 'string' ||
    !Number.isFinite(Date.parse(x.updatedAt))
  )
    throw new DataError('Thông tin bản lưu không hợp lệ.');
  return { ...x, reviews: validateReviews(x.reviews), settings: validateSettings(x.settings) };
}
async function readCurrent(): Promise<ReviewDocument | undefined> {
  const d = await db();
  const raw = await request(
    d.transaction('documents', 'readonly').objectStore('documents').get('current'),
  );
  if (raw === undefined) return undefined;
  try {
    return checkDocument(raw);
  } catch (e) {
    throw new RecoveryError((e as Error).message, JSON.stringify(raw, null, 2), 'IndexedDB');
  }
}
export function readLegacy(
  storage: Pick<Storage, 'getItem'> = localStorage,
): { key: string; raw: string; reviews: ReviewItem[] } | null {
  for (const key of LEGACY_KEYS) {
    let raw: string | null;
    try {
      raw = storage.getItem(key);
    } catch {
      throw new RecoveryError(
        'Không đọc được dữ liệu cũ. Hãy cho phép lưu dữ liệu website rồi mở lại.',
      );
    }
    if (raw === null) continue;
    try {
      return { key, raw, reviews: validateReviews(JSON.parse(raw), true) };
    } catch (e) {
      throw new RecoveryError(`Dữ liệu cũ cần khôi phục: ${(e as Error).message}`, raw, key);
    }
  }
  return null;
}
export async function loadDocument(): Promise<ReviewDocument> {
  const existing = await readCurrent();
  if (existing)
    return needsPlaceCorrections(existing)
      ? commitDocument(
          (current) => applyPlaceCorrections(current),
          'Đối chiếu vị trí Nốt Tea và bỏ mẫu Bếp Trang',
        )
      : existing;
  const legacy = readLegacy();
  let initial = emptyDocument();
  if (legacy) initial.reviews = legacy.reviews;
  initial = applyPlaceCorrections(initial);
  const d = await db();
  // Recheck inside the write transaction: two opening tabs must not re-migrate over each other.
  return new Promise((resolve, reject) => {
    const t = d.transaction(['documents', 'archives'], 'readwrite');
    let result = initial;
    let failure: Error | undefined;
    const r = t.objectStore('documents').get('current');
    r.onsuccess = () => {
      try {
        if (r.result !== undefined) {
          result = checkDocument(r.result);
          return;
        }
        if (legacy)
          t.objectStore('archives').put({
            id: `migration-${newId()}`,
            key: legacy.key,
            raw: legacy.raw,
            createdAt: new Date().toISOString(),
          });
        t.objectStore('documents').put(initial, 'current');
      } catch (e) {
        failure = e as Error;
        t.abort();
      }
    };
    t.oncomplete = () => resolve(result);
    t.onabort = () =>
      reject(failure ?? new Error('Chưa chuyển đổi được dữ liệu. Bản cũ được giữ nguyên.'));
    t.onerror = () => {};
  });
}
export async function commitDocument(
  change: (current: ReviewDocument) => ReviewDocument,
  reason: string,
  photos: PhotoData[] = [],
): Promise<ReviewDocument> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const t = d.transaction(['documents', 'snapshots', 'photos', 'archives'], 'readwrite');
    let result: ReviewDocument;
    let failure: Error | undefined;
    let preserveAllPhotos = false;
    const fail = (e: unknown) => {
      failure = e instanceof Error ? e : new Error('Không lưu được dữ liệu.');
      try {
        t.abort();
      } catch {}
    };
    const r = t.objectStore('documents').get('current');
    r.onsuccess = () => {
      try {
        let current: ReviewDocument;
        if (r.result === undefined) current = emptyDocument();
        else {
          try {
            current = checkDocument(r.result);
          } catch {
            // A user-confirmed recovery can replace corrupt state only after archiving it.
            if (!reason.startsWith('Khôi phục'))
              throw new DataError('Dữ liệu hiện tại bị lỗi; hãy dùng Khôi phục.');
            t.objectStore('archives').put({
              id: newId('recovery'),
              raw: JSON.stringify(r.result),
              createdAt: new Date().toISOString(),
              key: 'IndexedDB',
            });
            current = emptyDocument();
            preserveAllPhotos = true;
          }
        }
        const changed = change(structuredClone(current));
        const proposed = needsPlaceCorrections(changed) ? applyPlaceCorrections(changed) : changed;
        result = {
          ...proposed,
          schemaVersion: SCHEMA_VERSION,
          reviews: validateReviews(proposed.reviews),
          settings: validateSettings(proposed.settings),
          revision: newId('revision'),
          updatedAt: new Date().toISOString(),
        };
        t.objectStore('snapshots').put({
          id: newId('snapshot'),
          createdAt: new Date().toISOString(),
          reason,
          document: current,
        } satisfies Snapshot);
        for (const photo of photos) {
          if (
            photo.blob.size > MAX_PHOTO_BYTES ||
            !['image/webp', 'image/png', 'image/jpeg'].includes(photo.blob.type)
          )
            throw new DataError('Ảnh không hợp lệ.');
          t.objectStore('photos').put(photo);
        }
        const used = new Set(result.reviews.flatMap((r) => r.photoIds));
        for (const id of used) {
          const q = t.objectStore('photos').getKey(id);
          q.onsuccess = () => {
            if (q.result === undefined)
              fail(new DataError('Một ảnh chưa được lưu; chưa thay đổi đánh giá.'));
          };
        }
        t.objectStore('documents').put(result, 'current');
        const archived = t.objectStore('archives').getAll();
        archived.onsuccess = () => {
          if (archived.result.some((a) => a.key === 'IndexedDB')) preserveAllPhotos = true;
        };
        const snaps = t.objectStore('snapshots').getAll();
        snaps.onsuccess = () => {
          const old = (snaps.result as Snapshot[]).sort((a, b) =>
            b.createdAt.localeCompare(a.createdAt),
          );
          for (const s of old.slice(20)) t.objectStore('snapshots').delete(s.id);
          // Only reclaim images with no reference in either current data or retained
          // snapshots. Preserve all media on a corrupt-document recovery.
          if (!preserveAllPhotos) {
            const retained = new Set(
              [...result.reviews, ...old.slice(0, 20).flatMap((s) => s.document.reviews)].flatMap(
                (r) => r.photoIds,
              ),
            );
            const cursor = t.objectStore('photos').openKeyCursor();
            cursor.onsuccess = () => {
              const c = cursor.result;
              if (!c) return;
              if (!retained.has(String(c.key))) t.objectStore('photos').delete(c.key);
              c.continue();
            };
          }
        };
      } catch (e) {
        fail(e);
      }
    };
    t.oncomplete = () => {
      publishChange();
      resolve(result!);
    };
    t.onabort = () =>
      reject(
        failure ??
          new Error(
            'Không lưu được dữ liệu (có thể thiết bị hết dung lượng). Dữ liệu trước đó được giữ nguyên.',
          ),
      );
    t.onerror = () => {};
  });
}
export async function snapshots(): Promise<Snapshot[]> {
  const d = await db();
  return (
    (await request(
      d.transaction('snapshots', 'readonly').objectStore('snapshots').getAll(),
    )) as Snapshot[]
  ).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function restoreSnapshot(id: string): Promise<ReviewDocument> {
  const list = await snapshots();
  const selected = list.find((s) => s.id === id);
  if (!selected) throw new DataError('Bản dự phòng không còn tồn tại.');
  const target = checkDocument(selected.document);
  return commitDocument(() => target, 'Khôi phục bản dự phòng');
}
export async function getPhoto(id: string): Promise<PhotoData | undefined> {
  const d = await db();
  return request(d.transaction('photos', 'readonly').objectStore('photos').get(id));
}
function dataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
export async function makeBackup(doc: ReviewDocument): Promise<BackupFile> {
  const ids = [...new Set(doc.reviews.flatMap((r) => r.photoIds))];
  const media: BackupFile['media'] = [];
  for (const id of ids) {
    const p = await getPhoto(id);
    if (!p) throw new DataError('Thiếu một ảnh trong bản lưu; chưa tạo bản sao không đầy đủ.');
    media.push({ id, dataUrl: await dataUrl(p.blob) });
  }
  return {
    app: 'not-food-drink',
    schemaVersion: SCHEMA_VERSION,
    scoringVersion: SCORING_VERSION,
    exportedAt: new Date().toISOString(),
    reviews: doc.reviews,
    settings: doc.settings,
    media,
  };
}
export async function importBackup(
  backup: BackupFile,
  mode: 'merge' | 'replace',
): Promise<ReviewDocument> {
  // Revalidate even when the UI already previewed it. New photo IDs keep older snapshots intact.
  const clean = parseBackup(JSON.stringify(backup));
  const photoMap = new Map(clean.media.map((p) => [p.id, newId('photo')]));
  const photos: PhotoData[] = clean.media.map((p) => {
    const [head, body] = p.dataUrl.split(',');
    const binary = atob(body);
    return {
      id: photoMap.get(p.id)!,
      blob: new Blob([Uint8Array.from(binary, (c) => c.charCodeAt(0))], {
        type: head.slice(5, head.indexOf(';')),
      }),
    };
  });
  const imported = clean.reviews.map((r) => ({
    ...r,
    photoIds: r.photoIds.map((id) => photoMap.get(id)!),
  }));
  return commitDocument(
    (current) => {
      if (mode === 'replace') return { ...current, reviews: imported, settings: clean.settings };
      const existing = new Set(current.reviews.map((r) => r.id));
      return {
        ...current,
        reviews: [...current.reviews, ...imported.filter((r) => !existing.has(r.id))],
      };
    },
    `Khôi phục JSON (${mode === 'replace' ? 'thay thế' : 'gộp, giữ quán trùng'})`,
    photos,
  );
}
export async function recoverLegacyFile(): Promise<{ raw: string; source: string } | null> {
  try {
    const x = readLegacy();
    return x ? { raw: x.raw, source: x.key } : null;
  } catch (e) {
    if (e instanceof RecoveryError && e.raw) return { raw: e.raw, source: e.source ?? 'legacy' };
    throw e;
  }
}
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
function publishChange() {
  if (typeof BroadcastChannel === 'undefined') return;
  const c = new BroadcastChannel('not-personal-data');
  c.postMessage('changed');
  c.close();
}
export function watchChanges(listener: () => void) {
  if (typeof BroadcastChannel === 'undefined') return () => {};
  const c = new BroadcastChannel('not-personal-data');
  c.onmessage = listener;
  return () => c.close();
}
export async function requestPersistence(): Promise<boolean> {
  return navigator.storage?.persist ? navigator.storage.persist() : false;
}
export async function compressPhoto(file: File): Promise<PhotoData> {
  if (
    file.size > 20 * 1024 * 1024 ||
    !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
  )
    throw new DataError('Chọn ảnh JPEG, PNG hoặc WebP tối đa 20 MB.');
  const image = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    image.close();
    throw new DataError('Không xử lý được ảnh trên thiết bị này.');
  }
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();
  let blob: Blob | null = null;
  for (const q of [0.8, 0.65, 0.5, 0.35]) {
    blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', q));
    if (blob && blob.size <= MAX_PHOTO_BYTES) break;
  }
  if (!blob || blob.size > MAX_PHOTO_BYTES)
    throw new DataError('Ảnh còn quá lớn; hãy chọn ảnh nhỏ hơn.');
  return { id: newId('photo'), blob };
}
