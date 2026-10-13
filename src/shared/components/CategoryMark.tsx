import type { Category } from '../api';
import { categoryInfo, iconSvg, shapeMarkup, shapeSvg, type Shape } from '../categories';

/**
 * The category's pictogram (or shape) in its colour (or `color`, e.g. on a coloured card), named for screen readers (colour never
 * carries meaning alone).
 */
export function CategoryMark({
  category,
  size = 20,
  title,
  color,
}: {
  category: Category;
  size?: number;
  title?: boolean;
  color?: string;
}) {
  return <Svg markup={shapeMarkup(category, color)} size={size} label={title ? categoryInfo(category).label : null} />;
}

/** An icon's path (24×24 grid), e.g. in the icon library; falls back to a square for invalid path data. */
export function IconMark({ path, color, size = 20 }: { path: string; color: string; size?: number }) {
  return <Svg markup={iconSvg(path, color) ?? shapeSvg('square', color)} size={size} label={null} />;
}

/** A bare shape, e.g. a category being edited. */
export function ShapeIcon({ shape, color, size = 20 }: { shape: Shape; color: string; size?: number }) {
  return <Svg markup={shapeSvg(shape, color)} size={size} label={null} />;
}

function Svg({ markup, size, label }: { markup: string; size: number; label: string | null }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      role={label ? 'img' : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
      style={{ flex: 'none' }}
      // Fixed shapes and icon paths checked in categories.ts (path commands and numbers only, colours #RRGGBB).
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
