import { useMemo, useState } from 'react';
import type { Photo } from '../api';
import { blurhashDataUrl } from '../image';
import { PhotoEffect, type Effect } from './PhotoEffect';

/** A photo (signed URL from the API, or a local preview) over its blurhash placeholder, optionally filtered. */
export function PhotoImage({
  photo,
  thumb,
  alt,
  className,
  effect,
}: {
  photo: Pick<Photo, 'url' | 'thumb_url' | 'blurhash'>;
  thumb?: boolean;
  alt: string;
  className?: string;
  effect?: Effect;
}) {
  const [loaded, setLoaded] = useState(false);
  const placeholder = useMemo(() => (photo.blurhash ? blurhashDataUrl(photo.blurhash) : null), [photo.blurhash]);
  const src = thumb ? photo.thumb_url : photo.url;
  return (
    <div
      className={`photo ${className ?? ''}`}
      style={placeholder && !loaded ? { backgroundImage: `url(${placeholder})`, backgroundSize: 'cover' } : undefined}
    >
      <img src={src} alt={alt} loading="lazy" onLoad={() => setLoaded(true)} style={{ opacity: loaded ? 1 : 0 }} />
      {effect && loaded && <PhotoEffect src={src} effect={effect} />}
    </div>
  );
}
