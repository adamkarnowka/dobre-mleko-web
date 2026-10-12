import { Link } from 'react-router-dom';
import type { PlaceSummary } from '../../shared/api';
import { CATEGORY } from '../../shared/categories';
import { CategoryMark } from '../../shared/components/CategoryMark';
import { PhotoImage } from '../../shared/components/PhotoImage';
import { count, distance, rating } from '../../shared/format';

/** A place in a list: cover photo, rank, name, score, gold stars, distance, category and author. */
export function PlaceCard({ place: p, rank, compact }: { place: PlaceSummary; rank?: number; compact?: boolean }) {
  const dist = distance(p.distance_m);
  return (
    <Link to={`/places/${p.id}`} className={`place-card panel${compact ? ' compact' : ''}`}>
      <div className="place-card-photo">
        {p.cover_photo ? (
          <PhotoImage photo={p.cover_photo} thumb alt="" />
        ) : (
          <div className="photo photo-empty">
            <CategoryMark category={p.category_id} size={56} />
          </div>
        )}
        {rank != null && <span className="place-rank">{String(rank).padStart(2, '0')}</span>}
      </div>
      <div className="place-card-body">
        <h3 className="place-card-name">{p.name}</h3>
        <div className="place-card-score">
          <span className="place-card-avg">{rating(p.rating_avg)}</span>
          <span className="data">{count(p.rating_count, ['ocena', 'oceny', 'ocen'])}</span>
          {p.gold_star_count > 0 && (
            <span className="gold" title="Złote gwiazdki">
              <span aria-hidden="true">★</span> {p.gold_star_count}
              <span className="visually-hidden"> złotych gwiazdek</span>
            </span>
          )}
          {dist && <span className="data place-card-dist">{dist}</span>}
        </div>
        <p className="label place-card-meta">
          <CategoryMark category={p.category_id} size={12} /> {CATEGORY[p.category_id].label} · poleca{' '}
          {p.author.display_name}
          {p.status !== 'active' && (
            <span className="badge">{p.status === 'closed' ? 'Zamknięte' : 'Chwilowo zamknięte'}</span>
          )}
          {p.my_rating != null && <span className="badge">Moja: {rating(p.my_rating)}</span>}
        </p>
      </div>
    </Link>
  );
}
