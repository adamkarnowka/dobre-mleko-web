import { useCallback, useEffect, useState } from 'react';

export type Coords = { lat: number; lng: number };

/** Warsaw centre, used when the browser location is unknown. */
export const WARSAW: Coords = { lat: 52.2297, lng: 21.0122 };

let cached: Coords | null = null;

/**
 * The browser's location. Asked for only when `request()` is called (or automatically when permission was already
 * granted), never stored on the server: it is only sent as `lat`/`lng` query parameters.
 */
export function useGeo() {
  const [coords, setCoords] = useState<Coords | null>(cached);
  const [status, setStatus] = useState<'idle' | 'pending' | 'denied' | 'ok'>(cached ? 'ok' : 'idle');

  const request = useCallback(() => {
    if (!('geolocation' in navigator)) return setStatus('denied');
    setStatus('pending');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        cached = { lat: Math.round(p.coords.latitude * 1e5) / 1e5, lng: Math.round(p.coords.longitude * 1e5) / 1e5 };
        setCoords(cached);
        setStatus('ok');
      },
      () => setStatus('denied'),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  }, []);

  useEffect(() => {
    if (cached || !navigator.permissions) return;
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((p) => p.state === 'granted' && request())
      .catch(() => {});
  }, [request]);

  return { coords, status, request };
}
