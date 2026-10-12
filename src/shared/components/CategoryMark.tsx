import type { Category } from '../api';
import { categoryInfo, shapeMarkup, shapeSvg, type Shape } from '../categories';

/**
 * The category's shape in its colour (or `color`, e.g. on a coloured card), named for screen readers (colour never
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
      // Fixed shapes from categories.ts; colours are checked to be #RRGGBB there. No other data goes in.
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
