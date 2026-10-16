import { api, unwrap } from '../shared/api';
import { searchPlaces, type GeoResult } from './geocode';
import type { Coords } from './geo';

/** What a pasted Google Maps link says (POST /maps-links/resolve): name, position, and places already nearby. */
export const resolveMapsLink = (text: string) => unwrap(api.POST('/maps-links/resolve', { body: { text } }));

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Whether two place names are the same place's ("Kawiarnia Relaks" ~ "Relaks – kawiarnia"). */
export function sameName(a: string, b: string): boolean {
  const x = normalize(a);
  const y = normalize(b);
  if (!x || !y) return false;
  if (x.includes(y) || y.includes(x)) return true;
  const ta = new Set(x.split(' ').filter((t) => t.length > 1));
  const tb = new Set(y.split(' ').filter((t) => t.length > 1));
  const shared = [...ta].filter((t) => tb.has(t)).length;
  return shared / Math.min(ta.size, tb.size) >= 0.5;
}

/** Metres between two points (haversine). */
export function distance(a: Coords, b: Coords): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

/**
 * The same place in OpenStreetMap, for its address and category: a result with the same name, within `radius` of
 * where Google puts it (or anywhere near, when the link had no position).
 */
export async function findInOsm(name: string, near: Coords, exact: boolean, radius = 250): Promise<GeoResult | null> {
  const results = await searchPlaces(name, near);
  return (
    results.find((r) => r.name && sameName(r.name, name) && (!exact || distance(r.location, near) <= radius)) ?? null
  );
}
