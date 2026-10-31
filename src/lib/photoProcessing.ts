import { encodePhoto } from './photoCodec.ts';

export async function processPhoto(file: Blob): Promise<Blob> {
  if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined')
    return encodePhoto(file);
  // One bounded worker per sequential image; no idle worker or image buffers retained.
  return new Promise((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL('./photo.worker.ts', import.meta.url), { type: 'module' });
    } catch {
      void encodePhoto(file).then(resolve, reject);
      return;
    }
    const timer = setTimeout(() => {
      worker.terminate();
      reject(new Error('Xử lý ảnh quá lâu. Hãy thử lại.'));
    }, 45000);
    const finish = () => {
      clearTimeout(timer);
      worker.terminate();
    };
    worker.onmessage = (event: MessageEvent<{ blob?: Blob; error?: string }>) => {
      finish();
      if (event.data.blob) resolve(event.data.blob);
      else reject(new Error(event.data.error ?? 'Không xử lý được ảnh.'));
    };
    worker.onerror = () => {
      finish();
      void encodePhoto(file).then(resolve, reject);
    };
    worker.postMessage(file);
  });
}
