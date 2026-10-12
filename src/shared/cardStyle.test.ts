import { describe, expect, it } from 'vitest';
import { CARD_COLORS, cardColor, DEFAULT_CARD_STYLE, INK, PAPER, resolveLayout, textOn } from './cardStyle';
import { CATEGORY } from './categories';

describe('card style', () => {
  it('uses the chosen colour, else the category colour', () => {
    expect(cardColor(DEFAULT_CARD_STYLE, 'bar')).toBe(CATEGORY.bar.color);
    expect(cardColor({ ...DEFAULT_CARD_STYLE, color: 'teal' }, 'bar')).toBe(CARD_COLORS.teal.hex);
  });

  it('rotates the auto layout by position and keeps a chosen one', () => {
    expect([0, 1, 2, 3].map((i) => resolveLayout(DEFAULT_CARD_STYLE, true, i))).toEqual(['a', 'c', 'b', 'a']);
    expect(resolveLayout({ ...DEFAULT_CARD_STYLE, layout: 'c' }, true, 0)).toBe('c');
    expect(resolveLayout(DEFAULT_CARD_STYLE, true, 'some-id')).toBe(resolveLayout(DEFAULT_CARD_STYLE, true, 'some-id'));
  });

  it('makes a poster when there is no photo', () => {
    expect(resolveLayout({ ...DEFAULT_CARD_STYLE, layout: 'a' }, false, 0)).toBe('b');
    expect(resolveLayout({ ...DEFAULT_CARD_STYLE, layout: 'c' }, false, 0)).toBe('b');
  });

  it('puts readable text on every card colour', () => {
    expect(textOn(CARD_COLORS.yellow.hex)).toBe(INK);
    expect(textOn(CARD_COLORS.sand.hex)).toBe(INK);
    expect(textOn(CARD_COLORS.navy.hex)).toBe(PAPER);
    expect(textOn(CARD_COLORS.red.hex)).toBe(PAPER);
  });
});
