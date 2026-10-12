import { describe, expect, it } from 'vitest';
import { ID_PATTERN, slug } from './slug';

describe('slug', () => {
  it('makes an API category id from a Polish name', () => {
    expect(slug('Żłobki i przedszkola')).toBe('zlobki_i_przedszkola');
    expect(slug('Kawiarnie & Bary')).toBe('kawiarnie_bary');
    expect(slug('  24h sklepy ')).toBe('h_sklepy');
    expect(slug('Ąę')).toBe('ae');
    expect(ID_PATTERN.test(slug('Sauna'))).toBe(true);
    expect(slug('x'.repeat(50))).toHaveLength(32);
  });
});
