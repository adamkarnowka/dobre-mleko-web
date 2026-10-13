import { describe, expect, it } from 'vitest';
import { addTag, MAX_TAGS } from './tags';

describe('addTag', () => {
  it('adds a trimmed tag once, in the known spelling', () => {
    expect(addTag([], '  późno   w nocy ')).toEqual(['późno w nocy']);
    expect(addTag(['Ogródek'], 'ogródek')).toEqual(['Ogródek']);
    expect(addTag([], 'ogródek', ['Ogródek', 'Jazz'])).toEqual(['Ogródek']);
    expect(addTag([], '   ')).toEqual([]);
    expect(addTag([], 'x'.repeat(40))[0]).toHaveLength(30);
  });

  it('stops at the limit', () => {
    const full = Array.from({ length: MAX_TAGS }, (_, i) => `t${i}`);
    expect(addTag(full, 'more')).toBe(full);
  });
});
