import { MAX_PHOTO_BYTES } from './validation.ts';

/** Re-encoding removes EXIF/GPS. A bounded output also keeps JSON backups practical. */
export async function encodePhoto(file: Blob): Promise<Blob> {
  if (
    file.size > 20 * 1024 * 1024 ||
    !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
  )
    throw new Error('Chọn ảnh JPEG, PNG hoặc WebP tối đa 20 MB.');
  let image: ImageBitmap;
  try {
    image = await createImageBitmap(file);
  } catch {
    throw new Error('Ảnh bị lỗi hoặc không đọc được. Hãy chọn ảnh khác.');
  }
  try {
    for (const edge of [1400, 1050, 800]) {
      const crop = Math.min(image.width, image.height);
      const width = Math.max(1, Math.min(edge, crop));
      const height = width;
      const canvas =
        typeof OffscreenCanvas !== 'undefined'
          ? new OffscreenCanvas(width, height)
          : Object.assign(document.createElement('canvas'), { width, height });
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Không xử lý được ảnh trên thiết bị này.');
      (ctx as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D).drawImage(
        image,
        (image.width - crop) / 2,
        (image.height - crop) / 2,
        crop,
        crop,
        0,
        0,
        width,
        height,
      );
      for (const quality of [0.82, 0.65, 0.45]) {
        const blob =
          'convertToBlob' in canvas
            ? await canvas.convertToBlob({ type: 'image/webp', quality })
            : await new Promise<Blob | null>((resolve) =>
                canvas.toBlob(resolve, 'image/webp', quality),
              );
        if (blob && blob.size <= MAX_PHOTO_BYTES) return blob;
      }
    }
    throw new Error('Ảnh còn quá lớn; hãy chọn ảnh nhỏ hơn.');
  } finally {
    image.close();
  }
}
