import { useEffect, useState } from 'react';
import { getPhoto } from '../lib/storage.ts';
import { Dialog } from './Dialog.tsx';
const resources = new Map<string, { refs: number; url: Promise<string | undefined> }>();
function retainPhoto(id: string) {
  let entry = resources.get(id);
  if (!entry) {
    entry = { refs: 0, url: getPhoto(id).then(p => p ? URL.createObjectURL(p.blob) : undefined) };
    resources.set(id, entry);
  }
  entry.refs++;
  const current = entry;
  return { url: entry.url, release: () => {
    if (--current.refs === 0) {
      resources.delete(id);
      void current.url.then(url => { if (url) URL.revokeObjectURL(url); }).catch(() => {});
    }
  } };
}
export function Photo({
  id,
  alt,
  draft,
  preview = true,
  eager = false,
}: {
  id: string;
  alt: string;
  draft?: Blob;
  preview?: boolean;
  eager?: boolean;
}) {
  const [url, setUrl] = useState<string>();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let resource: string | undefined;
    const retained = draft ? undefined : retainPhoto(id);
    setUrl(undefined);
    const load = async () => {
      const loaded = draft ? (resource = URL.createObjectURL(draft)) : await retained!.url;
      if (!cancelled) {
        setUrl(loaded);
      }
    };
    void load().catch(() => {});
    return () => {
      cancelled = true;
      if (resource) URL.revokeObjectURL(resource);
      retained?.release();
    };
  }, [id, draft]);
  return url ? (
    !preview ? (
      <img src={url} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" className="review-photo" />
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
