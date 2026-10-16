import { describe, expect, it } from 'vitest';
import { distance, sameName } from './mapsLink';

describe('matching a Google place in OpenStreetMap', () => {
  it('compares names loosely', () => {
    expect(sameName('Kawiarnia Relaks', 'Relaks – kawiarnia')).toBe(true);
    expect(sameName('Pizzeria Roma', 'Roma')).toBe(true);
    expect(sameName('Łódź Kaliska Bistro', 'lodz kaliska')).toBe(true);
    expect(sameName('Kawiarnia Relaks', 'Bar Mleczny Pod Lipą')).toBe(false);
    expect(sameName('', 'x')).toBe(false);
  });

  it('measures metres', () => {
    expect(Math.round(distance({ lat: 50, lng: 18 }, { lat: 50.001, lng: 18 }))).toBe(111);
  });
});
