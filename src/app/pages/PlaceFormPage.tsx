import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, unwrap, type CardStyle, type Category, type PlaceDetail } from '../../shared/api';
import { DEFAULT_CARD_STYLE } from '../../shared/cardStyle';
import { CATEGORY, CATEGORY_IDS, STATUS_LABEL } from '../../shared/categories';
import { CategoryMark } from '../../shared/components/CategoryMark';
import { useToast } from '../../shared/components/Toast';
import { PRICE } from '../../shared/format';
import { useMeta } from '../../shared/session';
import { CardStyleFields } from '../components/CardStyleFields';
import { MapView } from '../components/MapView';
import { PhotoPicker, type Uploaded } from '../components/PhotoPicker';
import { EMPTY_SCORES, RatingInput, scoresComplete, type ScoresDraft } from '../components/RatingInput';
import { useGeo, WARSAW, type Coords } from '../geo';
import { usePlace } from './PlacePage';

type Draft = {
  name: string;
  category: Category | null;
  location: Coords | null;
  address: string;
  description: string;
  price: number | null;
  tags: string;
  status: PlaceDetail['status'];
  style: CardStyle;
};

const fromPlace = (p: PlaceDetail): Draft => ({
  name: p.name,
  category: p.category_id,
  location: p.location,
  address: p.address ?? '',
  description: p.description ?? '',
  price: p.price_level,
  tags: p.tags.join(', '),
  status: p.status,
  style: p.card_style,
});

const EMPTY: Draft = {
  name: '',
  category: null,
  location: null,
  address: '',
  description: '',
  price: null,
  tags: '',
  status: 'active',
  style: DEFAULT_CARD_STYLE,
};

const parseTags = (s: string) =>
  [
    ...new Set(
      s
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  ]
    .slice(0, 10)
    .map((t) => t.slice(0, 30));

/** Adding a place needs the author's rating and at least one photo, sent together (POST /places). */
export function AddPlacePage() {
  const meta = useMeta().data;
  const toast = useToast();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [scores, setScores] = useState<ScoresDraft>(EMPTY_SCORES);
  const [photos, setPhotos] = useState<Uploaded[]>([]);
  const [goldStar, setGoldStar] = useState(false);
  const ready = draft.name.trim() && draft.category && draft.location && scoresComplete(scores) && photos.length > 0;

  const create = useMutation({
    mutationFn: () =>
      unwrap(
        api.POST('/places', {
          body: {
            name: draft.name.trim(),
            category_id: draft.category!,
            location: draft.location!,
            address: draft.address.trim() || null,
            description: draft.description.trim() || null,
            price_level: draft.price,
            tags: parseTags(draft.tags),
            rating: { vibe: scores.vibe!, offer: scores.offer!, service: scores.service, value: scores.value },
            photo_ids: photos.map((x) => x.id),
            gold_star: goldStar,
            card_style: draft.style,
          },
        }),
      ),
    onSuccess: async (p) => {
      toast.ok('Dodano miejsce.');
      await client.invalidateQueries({ queryKey: ['places'] });
      navigate(`/places/${p.id}`);
    },
    onError: toast.fail,
  });

  return (
    <form
      className="page narrow place-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) create.mutate();
      }}
    >
      <header className="page-head">
        <h1 className="display">Dodaj miejsce</h1>
        <p className="muted">Tylko dobre miejsca: dodajesz je razem ze swoją oceną i zdjęciem.</p>
      </header>
      <PlaceFields draft={draft} onChange={setDraft} />
      <section className="place-section">
        <h2 className="title">Twoja ocena</h2>
        <RatingInput value={scores} onChange={setScores} />
      </section>
      <section className="place-section">
        <h2 className="label">Zdjęcia</h2>
        <PhotoPicker value={photos} onChange={setPhotos} max={meta?.max_photos_per_rating ?? 6} required />
      </section>
      <CardStyleFields
        value={draft.style}
        onChange={(style) => setDraft({ ...draft, style })}
        category={draft.category}
        name={draft.name}
        photo={photos[0] ? { url: photos[0].preview, thumb_url: photos[0].preview, blurhash: null } : null}
      />
      <label className="check">
        <input type="checkbox" checked={goldStar} onChange={(e) => setGoldStar(e.target.checked)} />
        <span>
          Złota gwiazdka · „musisz tam iść” <span className="muted">(z Twojej puli na ten miesiąc)</span>
        </span>
      </label>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={!ready || create.isPending}>
          Dodaj miejsce
        </button>
      </div>
      {!ready && (
        <p className="data muted">
          Potrzebne: nazwa, kategoria, miejsce na mapie, klimat i oferta oraz co najmniej jedno zdjęcie.
        </p>
      )}
    </form>
  );
}

export function EditPlacePage() {
  const { id = '' } = useParams();
  const place = usePlace(id);
  if (place.isLoading) return <p className="page label">Ładowanie…</p>;
  if (!place.data) return <p className="page notice">Nie ma takiego miejsca.</p>;
  return <EditPlace p={place.data} />;
}

function EditPlace({ p }: { p: PlaceDetail }) {
  const toast = useToast();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [draft, setDraft] = useState<Draft>(() => fromPlace(p));
  const path = { params: { path: { id: p.id } } };
  const refresh = () =>
    client
      .invalidateQueries({ queryKey: ['places'] })
      .then(() => client.invalidateQueries({ queryKey: ['place', p.id] }));

  const update = useMutation({
    mutationFn: () =>
      unwrap(
        api.PATCH('/places/{id}', {
          ...path,
          body: {
            name: draft.name.trim(),
            category_id: draft.category!,
            location: draft.location!,
            address: draft.address.trim() || null,
            description: draft.description.trim() || null,
            price_level: draft.price,
            tags: parseTags(draft.tags),
            status: draft.status,
            card_style: draft.style,
          },
        }),
      ),
    onSuccess: async () => {
      toast.ok('Zapisano zmiany.');
      await refresh();
      navigate(`/places/${p.id}`);
    },
    onError: toast.fail,
  });
  const remove = useMutation({
    mutationFn: () => unwrap(api.DELETE('/places/{id}', path)),
    onSuccess: async () => {
      toast.ok('Usunięto miejsce.');
      await client.invalidateQueries({ queryKey: ['places'] });
      navigate('/');
    },
    onError: toast.fail,
  });

  return (
    <form
      className="page narrow place-form"
      onSubmit={(e) => {
        e.preventDefault();
        update.mutate();
      }}
    >
      <header className="page-head">
        <p className="label">Edycja</p>
        <h1 className="display">{p.name}</h1>
      </header>
      <PlaceFields draft={draft} onChange={setDraft} />
      <CardStyleFields
        value={draft.style}
        onChange={(style) => setDraft({ ...draft, style })}
        category={draft.category}
        name={draft.name}
        photo={p.cover_photo}
      />
      <fieldset className="field">
        <legend className="label">Status</legend>
        <div className="chips">
          {(Object.keys(STATUS_LABEL) as Draft['status'][]).map((s) => (
            <button
              key={s}
              type="button"
              className="chip"
              aria-pressed={draft.status === s}
              onClick={() => setDraft({ ...draft, status: s })}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={!draft.name.trim() || update.isPending}>
          Zapisz
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => navigate(`/places/${p.id}`)}>
          Anuluj
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() =>
            confirm(
              'Usunąć to miejsce razem z ocenami, zdjęciami i komentarzami? Jeśli już nie istnieje, lepiej oznacz je jako zamknięte.',
            ) && remove.mutate()
          }
        >
          Usuń miejsce
        </button>
      </div>
    </form>
  );
}

function PlaceFields({ draft, onChange }: { draft: Draft; onChange: (d: Draft) => void }) {
  const geo = useGeo();
  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch });
  return (
    <>
      <div className="field">
        <label htmlFor="place-name">Nazwa</label>
        <input
          id="place-name"
          required
          maxLength={120}
          value={draft.name}
          onChange={(e) => set({ name: e.target.value })}
        />
      </div>

      <fieldset className="field">
        <legend className="label">Kategoria</legend>
        <div className="chips">
          {CATEGORY_IDS.map((c) => (
            <button
              key={c}
              type="button"
              className="chip"
              aria-pressed={draft.category === c}
              onClick={() => set({ category: c })}
            >
              <CategoryMark category={c} size={14} /> {CATEGORY[c].label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="field">
        <legend className="label">Miejsce na mapie</legend>
        <p className="data muted">Kliknij mapę, żeby postawić pinezkę.</p>
        <MapView
          center={draft.location ?? geo.coords ?? WARSAW}
          zoom={draft.location ? 16 : 13}
          pin={draft.location}
          onMapClick={(c) =>
            set({ location: { lat: Math.round(c.lat * 1e6) / 1e6, lng: Math.round(c.lng * 1e6) / 1e6 } })
          }
          className="map-picker"
        />
        <div className="row">
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={() => (geo.coords ? set({ location: geo.coords }) : geo.request())}
          >
            {geo.coords ? 'Tu, gdzie jestem' : geo.status === 'pending' ? 'Szukam…' : 'Użyj mojej lokalizacji'}
          </button>
          {draft.location && (
            <span className="data muted">
              {draft.location.lat.toFixed(5)}, {draft.location.lng.toFixed(5)}
            </span>
          )}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor="place-address">Adres</label>
        <input
          id="place-address"
          maxLength={200}
          placeholder="ul. Nowy Świat 22"
          value={draft.address}
          onChange={(e) => set({ address: e.target.value })}
        />
      </div>

      <div className="field">
        <label htmlFor="place-description">Dlaczego warto</label>
        <textarea
          id="place-description"
          rows={3}
          maxLength={500}
          value={draft.description}
          onChange={(e) => set({ description: e.target.value })}
        />
        <span className="data muted">{draft.description.length}/500</span>
      </div>

      <fieldset className="field">
        <legend className="label">Ceny</legend>
        <div className="chips">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              className="chip"
              aria-pressed={draft.price === n}
              onClick={() => set({ price: draft.price === n ? null : n })}
            >
              {PRICE[n]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor="place-tags">Tagi</label>
        <input
          id="place-tags"
          placeholder="Ogródek, Późno w nocy, Wege"
          value={draft.tags}
          onChange={(e) => set({ tags: e.target.value })}
        />
        <span className="data muted">Po przecinku, do 10.</span>
      </div>
    </>
  );
}
