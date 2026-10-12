import type { Category } from '../api';
import { CATEGORY, shapeMarkup } from '../categories';

/** The category's shape in its colour, named for screen readers (colour never carries meaning alone). */
export function CategoryMark({ category, size = 20, title }: { category: Category; size?: number; title?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      role={title ? 'img' : undefined}
      aria-label={title ? CATEGORY[category].label : undefined}
      aria-hidden={title ? undefined : true}
      style={{ flex: 'none' }}
      // Constant markup from categories.ts, no user data.
      dangerouslySetInnerHTML={{ __html: shapeMarkup(category) }}
    />
  );
}
