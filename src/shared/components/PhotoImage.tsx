import { useMemo, useState } from 'react';
import type { Photo } from '../api';
import { blurhashDataUrl } from '../image';

/** A photo (signed URL from the API) over its blurhash placeholder. */
export function PhotoImage({
  photo,
  thumb,
  alt,
  className,
}: {
  photo: Photo;
  thumb?: boolean;
  alt: string;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const placeholder = useMemo(() => (photo.blurhash ? blurhashDataUrl(photo.blurhash) : null), [photo.blurhash]);
  return (
    <div
      className={`photo ${className ?? ''}`}
      style={placeholder && !loaded ? { backgroundImage: `url(${placeholder})`, backgroundSize: 'cover' } : undefined}
    >
      <img
        src={thumb ? photo.thumb_url : photo.url}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        style={{ opacity: loaded ? 1 : 0 }}
      />
    </div>
  );
}
