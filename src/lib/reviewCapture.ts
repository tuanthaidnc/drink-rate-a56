import type { PhotoData, ReviewItem } from './models.ts';
import { newId } from './models.ts';
import { clearCaptureDraft, compressPhoto, getCaptureDraft, saveCaptureDraft } from './storage.ts';
import { isNativeApp } from './platform.ts';
import { reviewDraftIsDirty } from './reviewDraft.ts';
import { Capacitor, registerPlugin } from '@capacitor/core';
const NotCamera = registerPlugin<{ capture(): Promise<{ uri: string }> }>('NotCamera');

export interface CaptureDraft {
  original: ReviewItem;
  isEdit: boolean;
  draft: ReviewItem;
  price: string;
  reviewDate: string;
  firstVisit: boolean;
  photos: PhotoData[];
  recoveryId: string;
  stage?: 'choose' | 'capture' | 'location' | 'score';
  workflow?: 'takeaway' | 'dinein';
  venueLocked?: boolean;
  gpsAttempted?: boolean;
  replaceCover?: boolean;
}
type Recovered = { snapshot: CaptureDraft; error?: string; processing?: boolean };
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
  result: { webPath?: string; uri?: string },
): Promise<CaptureDraft> {
  const path = result.webPath ?? (result.uri ? Capacitor.convertFileSrc(result.uri) : undefined);
  if (!path) throw new Error('Camera không trả về ảnh.');
  const response = await fetch(path);
  if (!response.ok) throw new Error('Không đọc được ảnh vừa chụp.');
  const photo = await compressPhoto(
    new File([await response.blob()], 'capture.jpg', { type: 'image/jpeg' }),
  );
  return {
    ...snapshot,
    draft: { ...snapshot.draft, photoIds: [photo.id] },
    photos: [photo],
    stage: 'score',
    recoveryId: newId('capture'),
  };
}
export async function takeReviewPhoto(snapshot: CaptureDraft): Promise<CaptureDraft | null> {
  await saveCaptureDraft(snapshot);
  try {
    const result = await NotCamera.capture();
    const next = await attachCameraPhoto(snapshot, result);
    await saveCaptureDraft(next);
    return next;
  } catch (error) {
    if (
      reviewDraftIsDirty(
        snapshot.original,
        snapshot.draft,
        snapshot.price,
        snapshot.reviewDate,
        snapshot.isEdit,
        snapshot.firstVisit,
      )
    )
      await saveCaptureDraft(snapshot);
    else await clearCaptureDraft(snapshot.original.id);
    if (isCameraCancellation(error)) return null;
    throw new Error(cameraError(error));
  }
}
// Registered before React mounts: Capacitor retains restored results until a listener exists.
export async function initializeCaptureRecovery(): Promise<void> {
  let pending = await getCaptureDraft();
  if (pending) publish({ snapshot: pending });
  if (!isNativeApp) return;
  const { App } = await import('@capacitor/app');
  await App.addListener('appRestoredResult', (event) => {
    if (!(
      (event.pluginId === 'NotCamera' && event.methodName === 'capture') ||
      (event.pluginId === 'Camera' && event.methodName === 'getPhoto')
    ))
      return;
    void (async () => {
      const snapshot = (await getCaptureDraft()) ?? pending;
      if (!snapshot) return;
      if (event.success) publish({ snapshot, processing: true });
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
export async function forgetCaptureRecovery(id?: string) {
  if (!id || recovered?.snapshot.original.id === id) recovered = undefined;
  await clearCaptureDraft(id);
}

// Browser capture requires a user gesture; call before the lazy form mounts.
export async function openWebCamera(): Promise<File[]> {
  const { webSquareCamera } = await import('../components/WebSquareCamera.tsx');
  return webSquareCamera();
}
