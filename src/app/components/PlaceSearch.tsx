import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useId, useState } from 'react';
import { CategoryMark } from '../../shared/components/CategoryMark';
import { searchPlaces, type GeoResult } from '../geocode';
import type { Coords } from '../geo';

/** Search OpenStreetMap for a place or an address; picking a result hands it to `onPick`. */
export function PlaceSearch({ near, onPick }: { near: Coords; onPick: (r: GeoResult) => void }) {
  const id = useId();
  const [text, setText] = useState('');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setQ(text.trim()), 350);
    return () => clearTimeout(t);
  }, [text]);

  // Bias towards where the map is, rounded so small pans reuse the cache.
  const bias = { lat: Math.round(near.lat * 10) / 10, lng: Math.round(near.lng * 10) / 10 };
  const results = useQuery({
    queryKey: ['geocode', q, bias.lat, bias.lng],
    queryFn: ({ signal }) => searchPlaces(q, bias, signal),
    enabled: q.length >= 3,
    staleTime: 10 * 60_000,
    retry: false,
    placeholderData: keepPreviousData,
  });
  const items = q.length >= 3 ? (results.data ?? []) : [];
  const show = open && q.length >= 3;

  const pick = (r: GeoResult) => {
    onPick(r);
    setText(r.title);
    setOpen(false);
  };

  return (
    <div className="place-search">
      <label htmlFor={`${id}-input`}>Szukaj miejsca lub adresu</label>
      <div className="place-search-box">
        <input
          id={`${id}-input`}
          type="search"
          role="combobox"
          aria-expanded={show && items.length > 0}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={show && items[active] ? `${id}-${active}` : undefined}
          autoComplete="off"
          placeholder="Np. Kawiarnia Relaks albo Nowy Świat 22"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault();
              setOpen(true);
              const step = e.key === 'ArrowDown' ? 1 : -1;
              setActive((a) => (items.length ? (a + step + items.length) % items.length : 0));
            } else if (e.key === 'Enter') {
              e.preventDefault(); // never submit the place form from here
              const r = items[active];
              if (show && r) pick(r);
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
        />
        {show && (
          <ul id={`${id}-list`} role="listbox" className="place-search-list" aria-label="Wyniki wyszukiwania">
            {items.map((r, i) => (
              <li
                key={r.id}
                id={`${id}-${i}`}
                role="option"
                aria-selected={i === active}
                // mousedown, so the input's blur does not close the list first
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(r);
                }}
                onMouseEnter={() => setActive(i)}
              >
                {r.category ? <CategoryMark category={r.category} size={14} /> : <span className="place-search-dot" />}
                <span>
                  <strong>{r.title}</strong>
                  {r.detail && <span className="data muted">{r.detail}</span>}
                </span>
              </li>
            ))}
            {items.length === 0 && (
              <li className="place-search-status data muted" aria-live="polite">
                {results.isError
                  ? 'Wyszukiwarka nie odpowiada. Postaw pinezkę na mapie.'
                  : results.isFetching
                    ? 'Szukam…'
                    : 'Nic nie znaleziono.'}
              </li>
            )}
          </ul>
        )}
      </div>
      <span className="data muted">Wyniki z OpenStreetMap. Pinezkę możesz potem przesunąć.</span>
    </div>
  );
}
