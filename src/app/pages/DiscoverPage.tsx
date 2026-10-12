import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, unwrap, type Category } from '../../shared/api';
import { categoryInfo, categoryChoices } from '../../shared/categories';
import { CategoryMark } from '../../shared/components/CategoryMark';
import { count } from '../../shared/format';
import { PlaceCard } from '../components/PlaceCard';
import { useGeo } from '../geo';

const SORTS = [
  ['best', 'Najlepsze'],
  ['gold_stars', 'Gwiazdki'],
  ['nearest', 'Blisko'],
  ['newest', 'Nowe'],
  ['most_commented', 'Komentowane'],
] as const;
type Sort = (typeof SORTS)[number][0];

const RADII = [
  [500, '≤ 500 M'],
  [2000, '≤ 2 KM'],
  [10000, '≤ 10 KM'],
] as const;

const TOGGLES = [
  ['gold_only', 'Ze złotą gwiazdką'],
  ['unrated_only', 'Jeszcze nie oceniłem'],
  ['saved_only', 'Zapisane'],
] as const;

/** Search and filters live in the URL, so a view can be shared and survives going back. */
export function DiscoverPage() {
  const [params, setParams] = useSearchParams();
  const geo = useGeo();
  const [q, setQ] = useState(params.get('q') ?? '');
  const sort = (params.get('sort') as Sort) ?? 'best';
  const categories = (params.get('categories')?.split(',').filter(Boolean) ?? []) as Category[];
  const radius = Number(params.get('radius_m')) || null;
  const tags = params.get('tags')?.split(',').filter(Boolean) ?? [];
  const flags = Object.fromEntries(TOGGLES.map(([k]) => [k, params.get(k) === 'true'])) as Record<
    (typeof TOGGLES)[number][0],
    boolean
  >;
  const needsGeo = sort === 'nearest' || radius != null;

  const set = (changes: Record<string, string | null>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(changes)) {
          if (v == null || v === '') next.delete(k);
          else next.set(k, v);
        }
        return next;
      },
      { replace: true },
    );

  // Debounced search box. Writes only real changes: a no-op navigation would cancel a pending one (lazy routes).
  const urlQ = params.get('q') ?? '';
  useEffect(() => {
    if (q.trim() === urlQ) return;
    const t = setTimeout(() => set({ q: q.trim() || null }), 300);
    return () => clearTimeout(t);
  }, [q]); // only typing triggers it; `set` only writes the URL

  useEffect(() => {
    if (needsGeo && geo.status === 'idle') geo.request();
  }, [needsGeo, geo]);

  const coords = geo.coords;
  const query = {
    q: params.get('q') || undefined,
    categories: categories.length ? categories.join(',') : undefined,
    tags: tags.length ? tags.join(',') : undefined,
    sort: needsGeo && !coords ? 'best' : sort,
    lat: coords?.lat,
    lng: coords?.lng,
    radius_m: coords && radius ? radius : undefined,
    gold_only: flags.gold_only ? ('true' as const) : undefined,
    unrated_only: flags.unrated_only ? ('true' as const) : undefined,
    saved_only: flags.saved_only ? ('true' as const) : undefined,
    limit: 24,
  };
  const list = useInfiniteQuery({
    queryKey: ['places', query],
    queryFn: ({ pageParam }) => unwrap(api.GET('/places', { params: { query: { ...query, cursor: pageParam } } })),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  });
  const items = list.data?.pages.flatMap((p) => p.items) ?? [];
  const total = list.data?.pages[0]?.total;
  const activeFilters = categories.length + tags.length + (radius ? 1 : 0) + TOGGLES.filter(([k]) => flags[k]).length;

  return (
    <div className="page">
      <header className="page-head">
        <h1 className="display">Odkrywaj</h1>
        <p className="label">{total == null ? ' ' : count(total, ['miejsce', 'miejsca', 'miejsc'])}</p>
      </header>

      <div className="search">
        <label htmlFor="search" className="visually-hidden">
          Szukaj miejsc
        </label>
        <input
          id="search"
          type="search"
          placeholder="Szukaj miejsc, ulic, tagów…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="chips" role="group" aria-label="Sortowanie">
        {SORTS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className="chip"
            aria-pressed={sort === key}
            onClick={() => set({ sort: key === 'best' ? null : key })}
          >
            {label}
          </button>
        ))}
      </div>

      {tags.length > 0 && (
        <div className="chips" role="group" aria-label="Tagi">
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              className="chip"
              aria-pressed
              onClick={() => set({ tags: tags.filter((x) => x !== t).join(',') || null })}
            >
              {t} <span aria-hidden="true">×</span>
              <span className="visually-hidden">(usuń filtr)</span>
            </button>
          ))}
        </div>
      )}

      <details className="filters" open={activeFilters > 0 || undefined}>
        <summary className="label">Filtry{activeFilters > 0 && <span className="badge">{activeFilters}</span>}</summary>
        <div className="chips" role="group" aria-label="Kategorie">
          {categoryChoices(categories).map(({ id: c }) => {
            const on = categories.includes(c);
            return (
              <button
                key={c}
                type="button"
                className="chip"
                aria-pressed={on}
                onClick={() =>
                  set({ categories: (on ? categories.filter((x) => x !== c) : [...categories, c]).join(',') || null })
                }
              >
                <CategoryMark category={c} size={14} /> {categoryInfo(c).label}
              </button>
            );
          })}
        </div>
        <div className="chips" role="group" aria-label="Odległość">
          {RADII.map(([m, label]) => (
            <button
              key={m}
              type="button"
              className="chip"
              aria-pressed={radius === m}
              onClick={() => set({ radius_m: radius === m ? null : String(m) })}
            >
              {label}
            </button>
          ))}
          {TOGGLES.map(([k, label]) => (
            <button
              key={k}
              type="button"
              className="chip"
              aria-pressed={flags[k]}
              onClick={() => set({ [k]: flags[k] ? null : 'true' })}
            >
              {label}
            </button>
          ))}
        </div>
      </details>

      {needsGeo && geo.status === 'denied' && (
        <p className="notice">Bez dostępu do lokalizacji nie pokażę odległości. Sortuję po najlepszych.</p>
      )}

      {list.isLoading ? (
        <p className="label">Ładowanie…</p>
      ) : list.isError ? (
        <p className="notice">Nie udało się wczytać miejsc.</p>
      ) : items.length === 0 ? (
        <div className="empty panel">
          <p>Nic nie pasuje do filtrów.</p>
          <a className="btn btn-primary" href="/add">
            Dodaj miejsce
          </a>
        </div>
      ) : (
        <>
          <div className="place-grid">
            {items.map((p, i) => (
              <PlaceCard
                key={p.id}
                place={p}
                index={i}
                rank={sort === 'best' && !params.get('q') ? i + 1 : undefined}
              />
            ))}
          </div>
          {list.hasNextPage && (
            <button
              type="button"
              className="btn btn-secondary more"
              disabled={list.isFetchingNextPage}
              onClick={() => list.fetchNextPage()}
            >
              {list.isFetchingNextPage ? 'Ładowanie…' : 'Pokaż więcej'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
