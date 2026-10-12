import { describe, expect, it } from 'vitest';
import { toResult } from './geocode';

const feature = (properties: Record<string, unknown>, coordinates: [number, number] = [21.0189, 52.2324]) => ({
  geometry: { coordinates },
  properties,
});

describe('geocode', () => {
  it('reads a café as a place with its category and address', () => {
    const r = toResult(
      feature({
        osm_type: 'N',
        osm_id: 1,
        osm_key: 'amenity',
        osm_value: 'cafe',
        name: 'Kawiarnia Nowy Świat',
        street: 'Nowy Świat',
        housenumber: '22',
        city: 'Warszawa',
        country: 'Polska',
      }),
    );
    expect(r).toMatchObject({
      name: 'Kawiarnia Nowy Świat',
      category: 'coffee',
      address: 'Nowy Świat 22, Warszawa',
      location: { lat: 52.2324, lng: 21.0189 },
      title: 'Kawiarnia Nowy Świat',
      detail: 'Nowy Świat 22, Warszawa',
    });
  });

  it('reads a house as an address without a name', () => {
    const r = toResult(
      feature({
        osm_key: 'building',
        osm_value: 'yes',
        type: 'house',
        street: 'Marszałkowska',
        housenumber: '10',
        city: 'Warszawa',
        country: 'Polska',
      }),
    );
    expect(r).toMatchObject({
      name: null,
      category: null,
      address: 'Marszałkowska 10, Warszawa',
      title: 'Marszałkowska 10',
    });
  });

  it('maps shops, parks and unknown tags', () => {
    expect(toResult(feature({ osm_key: 'shop', osm_value: 'books', name: 'Księgarnia' })).category).toBe('shopping');
    expect(toResult(feature({ osm_key: 'leisure', osm_value: 'park', name: 'Pole Mokotowskie' })).category).toBe(
      'nature',
    );
    expect(toResult(feature({ osm_key: 'amenity', osm_value: 'bank', name: 'Bank' })).category).toBeNull();
  });
});
