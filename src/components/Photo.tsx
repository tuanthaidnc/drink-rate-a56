import { useEffect, useState } from 'react';
import { getPhoto } from '../lib/storage.ts';
import { Dialog } from './Dialog.tsx';
export function Photo({
  id,
  alt,
  draft,
  preview = true,
}: {
  id: string;
  alt: string;
  draft?: Blob;
  preview?: boolean;
}) {
  const [url, setUrl] = useState<string>();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let resource: string | undefined;
    setUrl(undefined);
    const load = async () => {
      const blob = draft ?? (await getPhoto(id))?.blob;
      if (blob && !cancelled) {
        resource = URL.createObjectURL(blob);
        setUrl(resource);
      }
    };
    void load().catch(() => {});
    return () => {
      cancelled = true;
      if (resource) URL.revokeObjectURL(resource);
    };
  }, [id, draft]);
  return url ? (
    !preview ? (
      <img src={url} alt={alt} loading="lazy" decoding="async" className="review-photo" />
    ) : (
      <>
        <button
          type="button"
          className="photo-preview"
          aria-label={`Xem ${alt}`}
          onClick={() => setOpen(true)}
        >
          <img src={url} alt={alt} loading="lazy" decoding="async" className="review-photo" />
        </button>
        {open && (
          <Dialog title={alt} wide onClose={() => setOpen(false)}>
            <img className="photo-full" src={url} alt={alt} />
          </Dialog>
        )}
      </>
    )
  ) : (
    <div className="photo-placeholder" role="img" aria-label={`${alt}: đang mở ảnh`}>
      <span>Ảnh</span>
    </div>
  );
}
