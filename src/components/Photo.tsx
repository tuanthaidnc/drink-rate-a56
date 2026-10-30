import { useEffect, useState } from 'react';
import { getPhoto } from '../lib/storage.ts';
export function Photo({ id, alt, draft }: { id: string; alt: string; draft?: Blob }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    let cancelled = false;
    let resource: string | undefined;
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
    <img src={url} alt={alt} loading="lazy" className="review-photo" />
  ) : (
    <div className="photo-placeholder" role="img" aria-label={`${alt}: đang mở ảnh`}>
      Ảnh
    </div>
  );
}
