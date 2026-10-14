import type { CardStyle, Category, Photo } from '../../shared/api';
import { cardColor, resolveLayout, textOn } from '../../shared/cardStyle';
import { CategoryMark } from '../../shared/components/CategoryMark';
import { PhotoImage } from '../../shared/components/PhotoImage';

/**
 * The picture part of a place card in the author's style: a = the photo full width, b = a poster (the card's colour
 * and the category's shape, no photo), c = the photo in a circle on the card's colour, diagonal = the photo cut by a
 * triangle of the card's colour, ribbon = the card's colour crossed by a diagonal ink band with the name (no photo),
 * arch = the photo in an arch, wedge = the card's colour with the photo in a parallelogram. Filters apply to the photo.
 */
export function CardArt({
  category,
  style,
  photo,
  position,
  rank,
  name,
}: {
  category: Category;
  style: CardStyle | undefined;
  photo: Pick<Photo, 'url' | 'thumb_url' | 'blurhash'> | null;
  /** Place in the list (or the place's id) for the `auto` layout. */
  position: number | string;
  rank?: number;
  /** Shown on the ribbon layout's band. */
  name?: string;
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
      {layout === 'diagonal' && photo && (
        <>
          <PhotoImage photo={photo} thumb alt="" effect={effect} />
          <span className="card-art-cut" />
          <CutLine x1={0} y1={40} x2={55} y2={100} />
        </>
      )}
      {layout === 'ribbon' && (
        <>
          <span className="card-art-ribbon">{name}</span>
          <span className="card-art-mark">
            <CategoryMark category={category} size={28} color={on} />
          </span>
        </>
      )}
      {layout === 'arch' && photo && (
        <PhotoImage photo={photo} thumb alt="" effect={effect} className="card-art-arch" />
      )}
      {layout === 'wedge' && photo && (
        <>
          <PhotoImage photo={photo} thumb alt="" effect={effect} className="card-art-wedge" />
          <CutLine x1={42} y1={0} x2={30} y2={100} />
          <span className="card-art-mark card-art-mark-left">
            <CategoryMark category={category} size={28} color={on} />
          </span>
        </>
      )}
      {rank != null && <span className="place-rank">{String(rank).padStart(2, '0')}</span>}
    </div>
  );
}

/** The edge of a diagonal cut (in % of the card): ink with a light margin, visible on dark photos and dark cards. */
function CutLine({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <svg className="card-art-cutline" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--surface)" strokeWidth={6} vectorEffect="non-scaling-stroke" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--ink)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
