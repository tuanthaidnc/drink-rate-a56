import type { PhotoData, ReviewItem } from './models.ts';
import { newId } from './models.ts';
import { clearCaptureDraft, compressPhoto, getCaptureDraft, saveCaptureDraft } from './storage.ts';
import { isNativeApp } from './platform.ts';

export interface CaptureDraft {
  original: ReviewItem;
  isEdit: boolean;
  draft: ReviewItem;
  price: string;
  reviewDate: string;
  firstVisit: boolean;
  photos: PhotoData[];
  recoveryId: string;
  stage?: 'capture' | 'location' | 'score';
  gpsAttempted?: boolean;
}
type Recovered = { snapshot: CaptureDraft; error?: string };
let recovered: Recovered | undefined;
const listeners = new Set<(value: Recovered) => void>();
const publish = (value: Recovered) => {
  recovered = value;
  listeners.forEach((listener) => listener(value));
};
export function watchCaptureRecovery(listener: (value: Recovered) => void) {
  listeners.add(listener);
  if (recovered) listener(recovered);
  return () => {
    listeners.delete(listener);
  };
}
export function isCameraCancellation(error: unknown): boolean {
  const text = String((error as { message?: string; code?: string })?.message ?? error);
  return /cancel(?:led|ed|lation)?|canceled by user|no image picked|no photo picked/i.test(text);
}
export function cameraError(error: unknown): string {
  const text = String((error as { message?: string })?.message ?? error);
  return /permission|denied|access/i.test(text)
    ? 'Camera chưa được cho phép. Kiểm tra quyền của máy ảnh rồi thử lại hoặc chọn Thư viện.'
    : 'Không mở được ảnh từ camera. Hãy thử lại hoặc chọn Thư viện.';
}
async function attachCameraPhoto(
  snapshot: CaptureDraft,
  result: { webPath?: string },
): Promise<CaptureDraft> {
  if (!result.webPath) throw new Error('Camera không trả về ảnh.');
  if (snapshot.draft.photoIds.length >= 3) throw new Error('Mỗi quán tối đa 3 ảnh.');
  const response = await fetch(result.webPath);
  if (!response.ok) throw new Error('Không đọc được ảnh vừa chụp.');
  const photo = await compressPhoto(
    new File([await response.blob()], 'capture.jpg', { type: 'image/jpeg' }),
  );
  return {
    ...snapshot,
    draft: { ...snapshot.draft, photoIds: [...snapshot.draft.photoIds, photo.id] },
    photos: [...snapshot.photos, photo],
    stage: snapshot.isEdit ? 'score' : 'location',
    recoveryId: newId('capture'),
  };
}
export async function takeReviewPhoto(snapshot: CaptureDraft): Promise<CaptureDraft | null> {
  await saveCaptureDraft(snapshot);
  try {
    const { Camera, CameraSource, CameraResultType } = await import('@capacitor/camera');
    // v8.2.6's new takePhoto flow does not persist its Activity result state.
    // getPhoto uses Capacitor's saved-call bridge + appRestoredResult; keep this
    // adapter until the new API offers equivalent process-death recovery.
    const result = await Camera.getPhoto({
      source: CameraSource.Camera,
      resultType: CameraResultType.Uri,
      quality: 90,
      width: 1600,
      height: 1600,
      correctOrientation: true,
      allowEditing: false,
      saveToGallery: false,
    });
    const next = await attachCameraPhoto(snapshot, result);
    await saveCaptureDraft(next);
    return next;
  } catch (error) {
    await clearCaptureDraft();
    if (isCameraCancellation(error)) return null;
    throw new Error(cameraError(error));
  }
}
// Registered before React mounts: Capacitor retains restored results until a listener exists.
export async function initializeCaptureRecovery(): Promise<void> {
  if (!isNativeApp) return;
  const pending = await getCaptureDraft();
  if (pending) publish({ snapshot: pending });
  const { App } = await import('@capacitor/app');
  await App.addListener('appRestoredResult', (event) => {
    if (event.pluginId !== 'Camera' || event.methodName !== 'getPhoto') return;
    void (async () => {
      const snapshot = (await getCaptureDraft()) ?? pending;
      if (!snapshot) return;
      let next = snapshot;
      let error: string | undefined;
      if (event.success) {
        try {
          next = await attachCameraPhoto(snapshot, event.data);
        } catch {
          error = 'Bản đang nhập đã khôi phục. Hãy chụp lại ảnh.';
        }
      } else if (!isCameraCancellation(event.error)) error = cameraError(event.error);
      next = { ...next, recoveryId: newId('recovered') };
      await saveCaptureDraft(next);
      publish({ snapshot: next, error });
    })().catch(() => {
      if (pending)
        publish({ snapshot: pending, error: 'Bản đang nhập đã khôi phục. Hãy chụp lại ảnh.' });
    });
  });
}
export async function forgetCaptureRecovery() {
  recovered = undefined;
  await clearCaptureDraft();
}

// Browser capture requires a user gesture; call before the lazy form mounts.
export function openWebCamera(): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.capture = 'environment';
    input.hidden = true;
    const finish = (files: File[]) => {
      input.remove();
      resolve(files);
    };
    input.addEventListener('change', () => finish(Array.from(input.files ?? [])), { once: true });
    input.addEventListener('cancel', () => finish([]), { once: true });
    document.body.append(input);
    input.click();
  });
}
