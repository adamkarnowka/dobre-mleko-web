import type { Schemas } from './api';
import { useMeta } from './session';

/** Categories = pictogram (or shape) + colour (design system). Colour never carries the meaning alone. */
export type CategoryInfo = Schemas['Category'];
export type Shape = CategoryInfo['shape'];
export type CategoryIcon = Schemas['CategoryIcon'];

export const SHAPES: { id: Shape; label: string }[] = [
  { id: 'circle', label: 'Koło' },
  { id: 'half', label: 'Półkole' },
  { id: 'triangle', label: 'Trójkąt' },
  { id: 'triangle_down', label: 'Trójkąt w dół' },
  { id: 'ring', label: 'Pierścień' },
  { id: 'square', label: 'Kwadrat' },
  { id: 'quarter', label: 'Ćwiartka' },
  { id: 'house', label: 'Domek' },
];

// Categories are managed by admins and come from GET /meta (category_details); useCategories() keeps this registry
// in sync. These are the first ones (API migration 007), used until /meta arrives.
const BUILT_IN: CategoryInfo[] = (
  [
    ['food', 'Jedzenie', '#D7301F', 'circle'],
    ['coffee', 'Kawa', '#141414', 'half'],
    ['bar', 'Bar', '#1D4FA0', 'triangle'],
    ['club', 'Klub', '#D7301F', 'triangle_down'],
    ['kids', 'Dzieci', '#F2B900', 'ring'],
    ['culture', 'Kultura', '#1D4FA0', 'square'],
    ['nature', 'Natura', '#F2B900', 'triangle'],
    ['sport', 'Sport', '#D7301F', 'quarter'],
    ['shopping', 'Zakupy', '#1D4FA0', 'half'],
    ['hotel', 'Hotel', '#141414', 'house'],
    ['other', 'Inne', '#141414', 'square'],
  ] as const
).map(([id, label, color, shape], i) => ({ id, label, color, shape, icon: null, position: i + 1, active: true }));

let list: CategoryInfo[] = BUILT_IN;
let byId = new Map(list.map((c) => [c.id, c]));

/** Replaces the registry (from /meta). */
export function setCategories(next: CategoryInfo[]): void {
  if (next === list) return;
  list = [...next].sort((a, b) => a.position - b.position);
  byId = new Map(list.map((c) => [c.id, c]));
}

/** A category by id; an unknown id (deleted meanwhile) still gets a neutral mark. */
export const categoryInfo = (id: string): CategoryInfo =>
  byId.get(id) ?? { id, label: id, color: '#141414', shape: 'square', icon: null, position: 999, active: false };

/** Categories to offer (not retired), in order, plus any of `keep` (e.g. the current choice) even if retired. */
export const categoryChoices = (keep: (string | null | undefined)[] = []): CategoryInfo[] =>
  list.filter((c) => c.active || keep.includes(c.id));

/** Keeps the registry in sync with /meta; components calling it re-render when categories change. */
export function useCategories(): CategoryInfo[] {
  const meta = useMeta().data;
  // Older APIs have no category_details: keep the built-in list.
  if (meta?.category_details) setCategories(meta.category_details);
  return list;
}

/** SVG markup (44×44 viewBox) of a shape; constant data and palette colours only (used with innerHTML). */
export function shapeSvg(shape: Shape, color: string, onColor = false): string {
  const c = /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#141414'; // never markup from data
  switch (shape) {
    case 'circle':
      return `<circle cx="22" cy="22" r="22" fill="${c}"/>`;
    case 'half':
      return `<path d="M0 44 A22 22 0 0 1 44 44 Z" fill="${c}"/>`;
    case 'triangle':
      return `<polygon points="22,0 44,44 0,44" fill="${c}"/>`;
    case 'triangle_down':
      return `<polygon points="0,0 44,0 22,44" fill="${c}"/>`;
    case 'ring':
      return onColor
        ? `<circle cx="22" cy="22" r="18" fill="none" stroke="${c}" stroke-width="8"/>`
        : `<circle cx="22" cy="22" r="21" fill="${c}" stroke="#141414" stroke-width="2"/>`;
    case 'square':
      return `<rect width="44" height="44" fill="${c}"/>`;
    case 'quarter':
      return `<path d="M44 0 V44 H0 A44 44 0 0 1 44 0 Z" fill="${c}"/>`;
    case 'house':
      return `<polygon points="22,0 44,18 44,44 0,44 0,18" fill="${c}"/>`;
    default:
      return `<rect width="44" height="44" fill="${c}"/>`;
  }
}

/** SVG path data of an icon (the API checks it too): commands and numbers only, so it is safe inside markup. */
export const ICON_PATH = /^[MmLlHhVvCcSsQqTtAaZz0-9eE.,+\-\s]+$/;

/**
 * SVG markup (44×44 viewBox) of an icon: its path on a 24×24 grid, scaled up, filled even-odd. `null` for path data
 * that is not plain path commands (never markup from data).
 */
export function iconSvg(path: string, color: string): string | null {
  if (!ICON_PATH.test(path)) return null;
  const c = /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#141414';
  return `<path d="${path}" fill="${c}" fill-rule="evenodd" transform="scale(${44 / 24})"/>`;
}

/** A category's mark — its pictogram, or its shape — in its colour or `color` (e.g. on a coloured card). */
export function shapeMarkup(id: string, color?: string): string {
  const c = categoryInfo(id);
  return (c.icon && iconSvg(c.icon.path, color ?? c.color)) ?? shapeSvg(c.shape, color ?? c.color, !!color);
}

/**
 * Path data from what an admin pastes: a bare path, or a whole SVG (its `<path d>` values are joined). `grid` is false
 * when the SVG declares a viewBox other than 0 0 24 24.
 */
export function pastedIconPath(text: string): { path: string; grid: boolean } {
  const trimmed = text.trim();
  if (!trimmed.startsWith('<')) return { path: trimmed.replace(/\s+/g, ' '), grid: true };
  const viewBox = /viewBox\s*=\s*["']([^"']*)["']/i
    .exec(trimmed)?.[1]
    ?.trim()
    .replace(/[\s,]+/g, ' ');
  const paths = [...trimmed.matchAll(/\sd\s*=\s*["']([^"']*)["']/gi)].map((m) => m[1]!.trim());
  return { path: paths.join(' ').replace(/\s+/g, ' '), grid: !viewBox || viewBox === '0 0 24 24' };
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
