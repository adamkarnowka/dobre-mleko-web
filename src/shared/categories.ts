import type { Category } from './api';

/** Categories = shape + colour (design system). Colour never carries the meaning alone. */
export type Shape = 'circle' | 'half' | 'triangle' | 'triangle-down' | 'ring' | 'square' | 'quarter';

export const CATEGORY: Record<Category, { label: string; color: string; shape: Shape }> = {
  food: { label: 'Jedzenie', color: '#D7301F', shape: 'circle' },
  coffee: { label: 'Kawa', color: '#141414', shape: 'half' },
  bar: { label: 'Bar', color: '#1D4FA0', shape: 'triangle' },
  club: { label: 'Klub', color: '#D7301F', shape: 'triangle-down' },
  kids: { label: 'Dzieci', color: '#F2B900', shape: 'ring' },
  culture: { label: 'Kultura', color: '#1D4FA0', shape: 'square' },
  nature: { label: 'Natura', color: '#F2B900', shape: 'triangle' },
  sport: { label: 'Sport', color: '#D7301F', shape: 'quarter' },
  shopping: { label: 'Zakupy', color: '#1D4FA0', shape: 'half' },
  other: { label: 'Inne', color: '#141414', shape: 'square' },
};

export const CATEGORY_IDS = Object.keys(CATEGORY) as Category[];

/**
 * SVG markup (44×44 viewBox) of a category's shape, in its colour or `color`; constant data, used by CategoryMark,
 * map markers and poster cards.
 */
export function shapeMarkup(category: Category, color?: string): string {
  const { shape } = CATEGORY[category];
  const c = color ?? CATEGORY[category].color;
  switch (shape) {
    case 'circle':
      return `<circle cx="22" cy="22" r="22" fill="${c}"/>`;
    case 'half':
      return `<path d="M0 44 A22 22 0 0 1 44 44 Z" fill="${c}"/>`;
    case 'triangle':
      return `<polygon points="22,0 44,44 0,44" fill="${c}"/>`;
    case 'triangle-down':
      return `<polygon points="0,0 44,0 22,44" fill="${c}"/>`;
    case 'ring':
      return color
        ? `<circle cx="22" cy="22" r="18" fill="none" stroke="${c}" stroke-width="8"/>`
        : `<circle cx="22" cy="22" r="21" fill="${c}" stroke="#141414" stroke-width="2"/>`;
    case 'square':
      return `<rect width="44" height="44" fill="${c}"/>`;
    case 'quarter':
      return `<path d="M44 0 V44 H0 A44 44 0 0 1 44 0 Z" fill="${c}"/>`;
  }
}

export const CRITERIA = [
  { key: 'vibe', label: 'Klimat', hint: 'Jak się tam czujesz? Wnętrze, ludzie, atmosfera.', required: true },
  { key: 'offer', label: 'Oferta', hint: 'Jedzenie, muzyka, program — to, po co się przychodzi.', required: true },
  { key: 'service', label: 'Obsługa', hint: 'Bramka, bar, kelnerzy, szatnia.', required: false },
  { key: 'value', label: 'Wartość', hint: 'Czy jest warte swojej ceny?', required: false },
] as const;

export type CriterionKey = (typeof CRITERIA)[number]['key'];

export const SCORE_WORDS = ['—', 'Słabo', 'Średnio', 'Dobrze', 'Bardzo dobrze', 'Wybitnie'];

export const STATUS_LABEL = { active: 'Czynne', temporarily_closed: 'Chwilowo zamknięte', closed: 'Zamknięte' };
