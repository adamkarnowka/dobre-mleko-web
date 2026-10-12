import type { Category } from '../shared/api';
import type { Coords } from './geo';

// Place and address search with Photon (OpenStreetMap data, https://photon.komoot.io, fair use, no key).
// Called from the browser; the nginx CSP allows GEOCODER_ORIGIN, so a self-hosted Photon needs both settings.
const BASE: string = import.meta.env.VITE_GEOCODER_URL || 'https://photon.komoot.io';

export type GeoResult = {
  id: string;
  /** A named place (café, park…); null for a bare address. */
  name: string | null;
  /** "Nowy Świat 22, Warszawa", or null when OSM has no street for it. */
  address: string | null;
  location: Coords;
  /** Our category for the OSM tag, when there is an obvious one. */
  category: Category | null;
  /** First and second line in the result list. */
  title: string;
  detail: string;
};

type Feature = {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_type?: string;
    osm_id?: number;
    osm_key?: string;
    osm_value?: string;
    type?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    district?: string;
    locality?: string;
    county?: string;
    state?: string;
    country?: string;
  };
};

const CATEGORY_BY_TAG: Record<string, Category> = {
  'amenity=restaurant': 'food',
  'amenity=fast_food': 'food',
  'amenity=food_court': 'food',
  'amenity=ice_cream': 'food',
  'shop=bakery': 'food',
  'shop=pastry': 'food',
  'amenity=cafe': 'coffee',
  'shop=coffee': 'coffee',
  'amenity=bar': 'bar',
  'amenity=pub': 'bar',
  'amenity=biergarten': 'bar',
  'shop=wine': 'bar',
  'amenity=nightclub': 'club',
  'amenity=theatre': 'culture',
  'amenity=cinema': 'culture',
  'amenity=arts_centre': 'culture',
  'amenity=library': 'culture',
  'tourism=museum': 'culture',
  'tourism=gallery': 'culture',
  'tourism=zoo': 'kids',
  'tourism=theme_park': 'kids',
  'leisure=playground': 'kids',
  'leisure=park': 'nature',
  'leisure=garden': 'nature',
  'leisure=nature_reserve': 'nature',
  'tourism=viewpoint': 'nature',
  'leisure=sports_centre': 'sport',
  'leisure=fitness_centre': 'sport',
  'leisure=stadium': 'sport',
  'leisure=swimming_pool': 'sport',
  'leisure=ice_rink': 'sport',
  'leisure=pitch': 'sport',
  'tourism=hotel': 'hotel',
  'tourism=motel': 'hotel',
  'tourism=hostel': 'hotel',
  'tourism=guest_house': 'hotel',
  'tourism=apartment': 'hotel',
  'tourism=chalet': 'hotel',
};

const POI_KEYS = new Set(['amenity', 'shop', 'leisure', 'tourism', 'historic', 'craft', 'club', 'natural', 'office']);

function categoryOf(key?: string, value?: string): Category | null {
  if (!key || !value) return null;
  return CATEGORY_BY_TAG[`${key}=${value}`] ?? (key === 'shop' ? 'shopping' : key === 'natural' ? 'nature' : null);
}

/** One Photon feature as a search result. */
export function toResult(f: Feature): GeoResult {
  const p = f.properties;
  const [lng, lat] = f.geometry.coordinates;
  const town = p.city ?? p.locality ?? p.district ?? p.county;
  const streetLine = p.street ? [p.street, p.housenumber].filter(Boolean).join(' ') : null;
  const address = streetLine ? [streetLine, town].filter(Boolean).join(', ') : null;
  const isPlace = !!p.name && POI_KEYS.has(p.osm_key ?? '');
  const area = [town, p.country].filter((x, i, all) => x && all.indexOf(x) === i).join(', ');
  return {
    id: `${p.osm_type ?? ''}${p.osm_id ?? `${lat},${lng}`}`,
    name: isPlace ? p.name! : null,
    address,
    location: { lat: round(lat), lng: round(lng) },
    category: isPlace ? categoryOf(p.osm_key, p.osm_value) : null,
    title: isPlace ? p.name! : (streetLine ?? p.name ?? town ?? '?'),
    detail: isPlace ? (address ?? area) : streetLine ? area : [p.state, p.country].filter(Boolean).join(', '),
  };
}

const round = (n: number) => Math.round(n * 1e6) / 1e6;

async function photon(path: string, params: Record<string, string | number>, signal?: AbortSignal) {
  const url = `${BASE}${path}?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`geocoder ${res.status}`);
  const body = (await res.json()) as { features?: Feature[] };
  return (body.features ?? []).map(toResult);
}

/** Places and addresses matching `q`, nearest to `near` first. */
export function searchPlaces(q: string, near: Coords, signal?: AbortSignal): Promise<GeoResult[]> {
  return photon('/api/', { q, lat: near.lat, lon: near.lng, zoom: 12, location_bias_scale: 0.3, limit: 6 }, signal);
}

/** The address at a point, if there is one nearby. */
export async function reverseGeocode(at: Coords, signal?: AbortSignal): Promise<GeoResult | null> {
  const results = await photon('/reverse', { lat: at.lat, lon: at.lng, radius: 0.1, limit: 1 }, signal);
  return results[0] ?? null;
}
