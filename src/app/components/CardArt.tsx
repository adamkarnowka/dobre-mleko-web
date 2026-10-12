import type { CardStyle, Category, Photo } from '../../shared/api';
import { cardColor, resolveLayout, textOn } from '../../shared/cardStyle';
import { CategoryMark } from '../../shared/components/CategoryMark';
import { PhotoImage } from '../../shared/components/PhotoImage';

/**
 * The picture part of a place card in the author's style: a = the photo full width, b = a poster (the card's colour
 * and the category's shape, no photo), c = the photo in a circle on the card's colour. Filters apply to the photo.
 */
export function CardArt({
  category,
  style,
  photo,
  position,
  rank,
}: {
  category: Category;
  style: CardStyle | undefined;
  photo: Pick<Photo, 'url' | 'thumb_url' | 'blurhash'> | null;
  /** Place in the list (or the place's id) for the `auto` layout. */
  position: number | string;
  rank?: number;
}) {
  const color = cardColor(style, category);
  const on = textOn(color);
  const layout = resolveLayout(style, !!photo, position);
  const effect = style && { filter: style.photo_filter, intensity: style.filter_intensity, color };
  return (
    <div
      className={`place-card-photo card-art layout-${layout}`}
      style={{ ['--card' as string]: color, ['--card-on' as string]: on }}
      data-layout={layout}
    >
      {layout === 'a' && photo && <PhotoImage photo={photo} thumb alt="" effect={effect} />}
      {layout === 'b' && (
        <>
          <span className="card-art-shape">
            <CategoryMark category={category} size={200} color={on} />
          </span>
          <span className="card-art-line" />
        </>
      )}
      {layout === 'c' && photo && (
        <>
          <PhotoImage photo={photo} thumb alt="" effect={effect} className="card-art-circle" />
          <span className="card-art-mark">
            <CategoryMark category={category} size={28} color={on} />
          </span>
        </>
      )}
      {rank != null && <span className="place-rank">{String(rank).padStart(2, '0')}</span>}
    </div>
  );
}
