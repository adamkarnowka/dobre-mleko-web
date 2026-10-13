import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, unwrap, type PlaceDetail, type PlaceSummary } from '../shared/api';
import { categoryChoices, categoryInfo, STATUS_LABEL, useCategories } from '../shared/categories';
import { CategoryMark } from '../shared/components/CategoryMark';
import { PhotoImage } from '../shared/components/PhotoImage';
import { useToast } from '../shared/components/Toast';
import { ago, count, date, PRICE, rating } from '../shared/format';

type Status = PlaceSummary['status'];
type Sort = 'newest' | 'best' | 'most_commented';

const KEY = ['admin', 'places'];
const PLACES: [string, string, string] = ['miejsce', 'miejsca', 'miejsc'];
const STATUSES = Object.keys(STATUS_LABEL) as Status[];
const SORTS: [Sort, string][] = [
  ['newest', 'Najnowsze'],
  ['best', 'Najlepsze'],
  ['most_commented', 'Najczęściej komentowane'],
];

/**
 * Places for admins: find any place (closed too), change its status, fix its details, remove photos and comments,
 * delete it. Uses the same API as the app — admins may edit and delete everything.
 */
export function Places() {
  useCategories();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [includeClosed, setIncludeClosed] = useState(true);
  const [sort, setSort] = useState<Sort>('newest');
  const query = {
    q: q.trim() || undefined,
    categories: category || undefined,
    include_closed: includeClosed ? ('true' as const) : undefined,
    sort,
    limit: 30,
  };
  const list = useInfiniteQuery({
    queryKey: [...KEY, query],
    queryFn: ({ pageParam }) => unwrap(api.GET('/places', { params: { query: { ...query, cursor: pageParam } } })),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  });
  const items = list.data?.pages.flatMap((p) => p.items) ?? [];
  const total = list.data?.pages[0]?.total;

  return (
    <section aria-label="Miejsca">
      <form className="place-filters panel" role="search" onSubmit={(e) => e.preventDefault()}>
        <div className="field grow">
          <label htmlFor="places-q">Szukaj</label>
          <input
            id="places-q"
            type="search"
            placeholder="Nazwa, adres, opis, tag…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="places-category">Kategoria</label>
          <select id="places-category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Wszystkie</option>
            {categoryChoices([category]).map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="places-sort">Kolejność</label>
          <select id="places-sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            {SORTS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <label className="check">
          <input type="checkbox" checked={includeClosed} onChange={(e) => setIncludeClosed(e.target.checked)} /> Także
          zamknięte
        </label>
      </form>
      <p className="label">{total == null ? 'Ładowanie…' : count(total, PLACES)}</p>
      {items.length > 0 && (
        <ol className="place-admin-list panel">
          {items.map((p) => (
            <PlaceRow key={p.id} place={p} />
          ))}
        </ol>
      )}
      {list.hasNextPage && (
        <div className="row">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={list.isFetchingNextPage}
            onClick={() => list.fetchNextPage()}
          >
            Pokaż więcej
          </button>
        </div>
      )}
    </section>
  );
}

/** Admin list and everything in the app showing places. */
function useRefresh() {
  const client = useQueryClient();
  return () =>
    Promise.all([client.invalidateQueries({ queryKey: KEY }), client.invalidateQueries({ queryKey: ['places'] })]).then(
      () => undefined,
    );
}

function PlaceRow({ place: p }: { place: PlaceSummary }) {
  const refresh = useRefresh();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const path = { params: { path: { id: p.id } } };
  const setStatus = useMutation({
    mutationFn: (status: Status) => unwrap(api.PATCH('/places/{id}', { ...path, body: { status } })),
    onSuccess: async (next) => {
      toast.ok(`${next.name}: ${STATUS_LABEL[next.status].toLowerCase()}.`);
      await refresh();
    },
    onError: toast.fail,
  });
  const remove = useMutation({
    mutationFn: () => unwrap(api.DELETE('/places/{id}', path)),
    onSuccess: async () => {
      toast.ok(`Usunięto ${p.name} razem z ocenami, zdjęciami i komentarzami.`);
      await refresh();
    },
    onError: toast.fail,
  });
  const confirmDelete = () =>
    confirm(
      `Usunąć „${p.name}” na zawsze? Znikną też ${count(p.rating_count, ['ocena', 'oceny', 'ocen'])}, zdjęcia, ` +
        `gwiazdki i ${count(p.comment_count, ['komentarz', 'komentarze', 'komentarzy'])}.\n\n` +
        'Jeśli miejsce po prostu nie działa, zmień status na „Zamknięte”.',
    ) && remove.mutate();

  return (
    <li className={`place-admin-row${p.status === 'closed' ? ' retired' : ''}`} aria-label={p.name}>
      <div className="place-admin-line">
        {p.cover_photo ? (
          <PhotoImage photo={p.cover_photo} thumb alt="" className="place-admin-thumb" />
        ) : (
          <span className="place-admin-thumb place-admin-thumb-empty">
            <CategoryMark category={p.category_id} size={28} />
          </span>
        )}
        <div className="place-admin-name">
          <a href={`/places/${p.id}`} target="_blank" rel="noreferrer">
            <strong>{p.name}</strong>
          </a>
          <span className="data muted">
            <CategoryMark category={p.category_id} size={12} /> {categoryInfo(p.category_id).label} ·{' '}
            {p.author.display_name} · {date(p.created_at)}
          </span>
          <span className="data muted">
            {p.rating_count
              ? `${rating(p.rating_avg)} · ${count(p.rating_count, ['ocena', 'oceny', 'ocen'])}`
              : 'bez ocen'}{' '}
            · {count(p.comment_count, ['komentarz', 'komentarze', 'komentarzy'])}
            {p.gold_star_count > 0 && ` · ★ ${p.gold_star_count}`}
          </span>
        </div>
        <select
          aria-label={`Status: ${p.name}`}
          value={p.status}
          disabled={setStatus.isPending}
          onChange={(e) => setStatus.mutate(e.target.value as Status)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <div className="category-actions">
          <button
            type="button"
            className="btn btn-small btn-secondary"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? 'Zwiń' : 'Zarządzaj'}
          </button>
          <button
            type="button"
            className="btn btn-small btn-danger"
            disabled={remove.isPending}
            onClick={confirmDelete}
          >
            Usuń
          </button>
        </div>
      </div>
      {open && <PlaceManager id={p.id} />}
    </li>
  );
}

/** Details, photos and comments of one place (loaded when opened). */
function PlaceManager({ id }: { id: string }) {
  const detail = useQuery({
    queryKey: [...KEY, 'detail', id],
    queryFn: () => unwrap(api.GET('/places/{id}', { params: { path: { id } } })),
  });
  if (detail.isLoading) return <p className="label">Ładowanie…</p>;
  if (!detail.data) return null;
  const place = detail.data;
  return (
    <div className="place-manager">
      <PlaceEditor place={place} />
      <PlacePhotos place={place} />
      <PlaceComments place={place} />
    </div>
  );
}

type Draft = {
  name: string;
  category_id: string;
  status: Status;
  address: string;
  description: string;
  tags: string;
  price_level: number | null;
};

const draftOf = (p: PlaceDetail): Draft => ({
  name: p.name,
  category_id: p.category_id,
  status: p.status,
  address: p.address ?? '',
  description: p.description ?? '',
  tags: p.tags.join(', '),
  price_level: p.price_level,
});

function PlaceEditor({ place }: { place: PlaceDetail }) {
  const refresh = useRefresh();
  const client = useQueryClient();
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>(() => draftOf(place));
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft({ ...draft, [key]: value });
  const save = useMutation({
    mutationFn: () =>
      unwrap(
        api.PATCH('/places/{id}', {
          params: { path: { id: place.id } },
          body: {
            name: draft.name.trim(),
            category_id: draft.category_id,
            status: draft.status,
            address: draft.address.trim() || null,
            description: draft.description.trim() || null,
            tags: draft.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean),
            price_level: draft.price_level,
          },
        }),
      ),
    onSuccess: async (next) => {
      toast.ok(`Zapisano ${next.name}.`);
      setDraft(draftOf(next));
      client.setQueryData([...KEY, 'detail', place.id], next);
      await refresh();
    },
    onError: toast.fail,
  });
  return (
    <form
      className="category-edit"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <h3 className="label">Dane miejsca</h3>
      <div className="add-category-names">
        <div className="field grow">
          <label htmlFor={`name-${place.id}`}>Nazwa</label>
          <input
            id={`name-${place.id}`}
            required
            maxLength={120}
            value={draft.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={`category-${place.id}`}>Kategoria</label>
          <select
            id={`category-${place.id}`}
            value={draft.category_id}
            onChange={(e) => set('category_id', e.target.value)}
          >
            {categoryChoices([place.category_id]).map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
                {c.active ? '' : ' (wycofana)'}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`status-${place.id}`}>Status</label>
          <select
            id={`status-${place.id}`}
            value={draft.status}
            onChange={(e) => set('status', e.target.value as Status)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`price-${place.id}`}>Cena</label>
          <select
            id={`price-${place.id}`}
            value={draft.price_level ?? ''}
            onChange={(e) => set('price_level', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">—</option>
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {PRICE[n]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor={`address-${place.id}`}>Adres</label>
        <input id={`address-${place.id}`} value={draft.address} onChange={(e) => set('address', e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor={`description-${place.id}`}>Opis</label>
        <textarea
          id={`description-${place.id}`}
          rows={3}
          maxLength={500}
          value={draft.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor={`tags-${place.id}`}>Tagi (po przecinku)</label>
        <input id={`tags-${place.id}`} value={draft.tags} onChange={(e) => set('tags', e.target.value)} />
      </div>
      <div className="row">
        <button type="submit" className="btn btn-primary btn-small" disabled={!draft.name.trim() || save.isPending}>
          Zapisz
        </button>
        <a className="btn btn-secondary btn-small" href={`/places/${place.id}/edit`} target="_blank" rel="noreferrer">
          Lokalizacja i wygląd karty — w aplikacji
        </a>
      </div>
    </form>
  );
}

function PlacePhotos({ place }: { place: PlaceDetail }) {
  const client = useQueryClient();
  const refresh = useRefresh();
  const toast = useToast();
  const remove = useMutation({
    mutationFn: (photoId: string) => unwrap(api.DELETE('/photos/{id}', { params: { path: { id: photoId } } })),
    onSuccess: async () => {
      toast.ok('Usunięto zdjęcie.');
      await client.invalidateQueries({ queryKey: [...KEY, 'detail', place.id] });
      await refresh();
    },
    // 409 rating_needs_photo: the last photo of a rating — the API explains it.
    onError: toast.fail,
  });
  return (
    <div className="place-manager-section">
      <h3 className="label">Zdjęcia · {place.photos.length}</h3>
      {place.photos.length === 0 ? (
        <p className="data muted">Bez zdjęć.</p>
      ) : (
        <ul className="place-photos">
          {place.photos.map((photo) => (
            <li key={photo.id}>
              <a href={photo.url} target="_blank" rel="noreferrer">
                <PhotoImage photo={photo} thumb alt="" className="place-photo" />
              </a>
              <button
                type="button"
                className="btn btn-small btn-danger"
                disabled={remove.isPending}
                onClick={() => confirm('Usunąć to zdjęcie?') && remove.mutate(photo.id)}
              >
                Usuń
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PlaceComments({ place }: { place: PlaceDetail }) {
  const client = useQueryClient();
  const refresh = useRefresh();
  const toast = useToast();
  const remove = useMutation({
    mutationFn: (commentId: string) => unwrap(api.DELETE('/comments/{id}', { params: { path: { id: commentId } } })),
    onSuccess: async () => {
      toast.ok('Usunięto komentarz.');
      await client.invalidateQueries({ queryKey: [...KEY, 'detail', place.id] });
      await refresh();
    },
    onError: toast.fail,
  });
  return (
    <div className="place-manager-section">
      <h3 className="label">Komentarze · {place.comments.length}</h3>
      {place.comments.length === 0 ? (
        <p className="data muted">Bez komentarzy.</p>
      ) : (
        <ul className="place-comments">
          {place.comments.map((c) => (
            <li key={c.id}>
              <div>
                <strong>{c.author.display_name}</strong> <span className="data muted">{ago(c.created_at)}</span>
                <p>{c.body}</p>
              </div>
              <button
                type="button"
                className="btn btn-small btn-danger"
                disabled={remove.isPending}
                onClick={() => confirm(`Usunąć komentarz ${c.author.display_name}?`) && remove.mutate(c.id)}
              >
                Usuń
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
