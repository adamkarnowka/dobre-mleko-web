import type { CardStyle, Category } from './api';
import { CATEGORY } from './categories';

// How a place looks in lists and on its page, chosen by its author (card_style in the API).

export type CardColor = NonNullable<CardStyle['color']>;
export type CardLayout = Exclude<CardStyle['layout'], 'auto'>;
export type PhotoFilter = CardStyle['photo_filter'];

/** The 16 card colours (names are the API's; red, blue, yellow and ink are the design system's own). */
export const CARD_COLORS: Record<CardColor, { label: string; hex: string }> = {
  red: { label: 'Czerwony', hex: '#D7301F' },
  blue: { label: 'Niebieski', hex: '#1D4FA0' },
  yellow: { label: 'Żółty', hex: '#F2B900' },
  ink: { label: 'Czarny', hex: '#141414' },
  orange: { label: 'Pomarańczowy', hex: '#E8702A' },
  pink: { label: 'Różowy', hex: '#E58FA6' },
  green: { label: 'Zielony', hex: '#2E7D4F' },
  teal: { label: 'Morski', hex: '#1E8A8A' },
  sky: { label: 'Błękitny', hex: '#6FA8DC' },
  navy: { label: 'Granatowy', hex: '#172B4D' },
  violet: { label: 'Fioletowy', hex: '#6B4C9A' },
  ochre: { label: 'Ochra', hex: '#C8902E' },
  brick: { label: 'Ceglany', hex: '#9C3B2A' },
  olive: { label: 'Oliwkowy', hex: '#6B6B2E' },
  sand: { label: 'Piaskowy', hex: '#D9C9A3' },
  stone: { label: 'Kamienny', hex: '#8D877D' },
};

export const CARD_COLOR_IDS = Object.keys(CARD_COLORS) as CardColor[];

export const LAYOUTS: Record<CardStyle['layout'], { label: string; hint: string }> = {
  auto: { label: 'Auto', hint: 'Układ zmienia się na liście' },
  a: { label: 'Zdjęcie', hint: 'Zdjęcie na całą szerokość' },
  b: { label: 'Plakat', hint: 'Kolor i kształt, bez zdjęcia' },
  c: { label: 'Koło', hint: 'Zdjęcie w kole' },
};

export const FILTERS: Record<PhotoFilter, string> = {
  none: 'Bez filtra',
  duotone: 'Duoton',
  halftone: 'Raster',
  engraving: 'Sztych',
  riso: 'Riso',
};

export const DEFAULT_CARD_STYLE: CardStyle = {
  layout: 'auto',
  photo_filter: 'none',
  filter_intensity: 100,
  color: null,
};

export const PAPER = '#F1ECE2';
export const INK = '#141414';

/** The card's main colour: the chosen one, else the category's. */
export const cardColor = (style: CardStyle | undefined, category: Category) =>
  style?.color ? CARD_COLORS[style.color].hex : CATEGORY[category].color;

const AUTO_ORDER: CardLayout[] = ['a', 'c', 'b'];

/**
 * The layout to draw. `auto` rotates through a, c, b by position in the list (or by id outside lists); a and c need
 * a photo, so without one the card is a poster (b).
 */
export function resolveLayout(style: CardStyle | undefined, hasPhoto: boolean, position: number | string): CardLayout {
  let layout = style?.layout ?? 'auto';
  if (layout === 'auto') {
    const n = typeof position === 'number' ? position : hash(position);
    layout = AUTO_ORDER[n % AUTO_ORDER.length]!;
  }
  return layout !== 'b' && !hasPhoto ? 'b' : layout;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

type Rgb = [number, number, number];

export const rgb = (hex: string): Rgb => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as Rgb;

export const mix = (a: Rgb, b: Rgb, t: number): Rgb => a.map((v, i) => v + (b[i]! - v) * t) as Rgb;

/** WCAG relative luminance, 0–1. */
export function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)) as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Ink or paper, whichever reads better on `hex`. */
export const textOn = (hex: string) => (luminance(hex) > 0.18 ? INK : PAPER);
