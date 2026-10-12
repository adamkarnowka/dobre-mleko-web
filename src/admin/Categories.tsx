import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, unwrap, type Schemas } from '../shared/api';
import { CARD_COLOR_IDS, CARD_COLORS } from '../shared/cardStyle';
import { SHAPES, type Shape } from '../shared/categories';
import { ShapeIcon } from '../shared/components/CategoryMark';
import { useToast } from '../shared/components/Toast';
import { ago, count } from '../shared/format';
import { ID_PATTERN, slug } from './slug';

type AdminCategory = Schemas['AdminCategory'];
type Draft = { label: string; color: string; shape: Shape };

const KEY = ['admin', 'categories'];
const PLACES: [string, string, string] = ['miejsce', 'miejsca', 'miejsc'];

/** Categories for everyone (web, iOS, Android read them from /meta): add, edit, reorder, retire, delete. */
export function Categories() {
  const list = useQuery({ queryKey: KEY, queryFn: () => unwrap(api.GET('/admin/categories')) });
  const refresh = useRefresh();
  const toast = useToast();
  const reorder = useMutation({
    mutationFn: (ids: string[]) => unwrap(api.PUT('/admin/categories/order', { body: { ids } })),
    onSuccess: refresh,
    onError: toast.fail,
  });
  if (list.isLoading) return <p className="label">Ładowanie…</p>;
  if (!list.data) return null;
  const items = list.data.items;
  const active = items.filter((c) => c.active).length;

  const move = (index: number, by: -1 | 1) => {
    const ids = items.map((c) => c.id);
    [ids[index], ids[index + by]] = [ids[index + by]!, ids[index]!];
    reorder.mutate(ids);
  };

  return (
    <section aria-label="Kategorie">
      <AddCategory />
      <p className="label">
        {active} aktywnych · {items.length - active} wycofanych. Aplikacje pobierają kategorie z serwera — zmiany widać
        po odświeżeniu.
      </p>
      <ol className="category-list panel">
        {items.map((c, i) => (
          <CategoryRow
            key={c.id}
            category={c}
            onUp={i > 0 ? () => move(i, -1) : undefined}
            onDown={i < items.length - 1 ? () => move(i, 1) : undefined}
            busy={reorder.isPending}
          />
        ))}
      </ol>
    </section>
  );
}

/** Admin list and /meta (the app's categories) both change. */
function useRefresh() {
  const client = useQueryClient();
  return () =>
    Promise.all([client.invalidateQueries({ queryKey: KEY }), client.invalidateQueries({ queryKey: ['meta'] })]).then(
      () => undefined,
    );
}

function AddCategory() {
  const refresh = useRefresh();
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>({ label: '', color: CARD_COLORS.teal.hex, shape: 'circle' });
  const [id, setId] = useState<string | null>(null); // null: follows the name
  const finalId = id ?? slug(draft.label);
  const add = useMutation({
    mutationFn: () =>
      unwrap(api.POST('/admin/categories', { body: { id: finalId, label: draft.label.trim(), ...pick(draft) } })),
    onSuccess: async (c) => {
      toast.ok(`Dodano kategorię ${c.label}.`);
      setDraft({ ...draft, label: '' });
      setId(null);
      await refresh();
    },
    onError: toast.fail,
  });
  return (
    <form
      className="add-category panel"
      onSubmit={(e) => {
        e.preventDefault();
        add.mutate();
      }}
    >
      <h2 className="title">Nowa kategoria</h2>
      <div className="add-category-names">
        <div className="field grow">
          <label htmlFor="category-label">Nazwa</label>
          <input
            id="category-label"
            required
            maxLength={40}
            placeholder="Sauna"
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="category-id">Identyfikator</label>
          <input
            id="category-id"
            required
            maxLength={32}
            pattern={ID_PATTERN.source}
            className="data"
            value={finalId}
            onChange={(e) => setId(e.target.value)}
          />
          <span className="data muted">Stały — miejsca się do niego odwołują.</span>
        </div>
      </div>
      <Appearance draft={draft} onChange={setDraft} />
      <div className="row">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!draft.label.trim() || !ID_PATTERN.test(finalId) || add.isPending}
        >
          Dodaj kategorię
        </button>
      </div>
    </form>
  );
}

function CategoryRow({
  category: c,
  onUp,
  onDown,
  busy,
}: {
  category: AdminCategory;
  onUp?: () => void;
  onDown?: () => void;
  busy: boolean;
}) {
  const refresh = useRefresh();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>({ label: c.label, color: c.color, shape: c.shape });
  const path = { params: { path: { id: c.id } } };

  const update = useMutation({
    mutationFn: (body: Partial<Draft> & { active?: boolean }) =>
      unwrap(api.PATCH('/admin/categories/{id}', { ...path, body })),
    onSuccess: async (next, body) => {
      toast.ok(
        body.active === false
          ? `Wycofano ${next.label}. Jej miejsca zostają.`
          : body.active
            ? `Przywrócono ${next.label}.`
            : 'Zapisano kategorię.',
      );
      setEditing(false);
      await refresh();
    },
    onError: toast.fail,
  });
  const remove = useMutation({
    mutationFn: () => unwrap(api.DELETE('/admin/categories/{id}', path)),
    onSuccess: async () => {
      toast.ok(`Usunięto ${c.label}.`);
      await refresh();
    },
    onError: toast.fail,
  });

  return (
    <li className={`category-row${c.active ? '' : ' retired'}`} aria-label={c.label}>
      <div className="category-line">
        <div className="category-order">
          <button
            type="button"
            className="btn btn-small btn-secondary"
            aria-label={`Przesuń ${c.label} wyżej`}
            disabled={!onUp || busy}
            onClick={onUp}
          >
            ↑
          </button>
          <button
            type="button"
            className="btn btn-small btn-secondary"
            aria-label={`Przesuń ${c.label} niżej`}
            disabled={!onDown || busy}
            onClick={onDown}
          >
            ↓
          </button>
        </div>
        <ShapeIcon shape={c.shape} color={c.color} size={32} />
        <div className="category-name">
          <strong>{c.label}</strong>
          <span className="data muted">
            {c.id} · {count(c.places, PLACES)}
            {c.updated_by && ` · zmienił(a) ${c.updated_by.display_name} ${ago(c.updated_at)}`}
          </span>
        </div>
        {!c.active && <span className="badge">Wycofana</span>}
        <div className="category-actions">
          <button
            type="button"
            className="btn btn-small btn-secondary"
            aria-expanded={editing}
            onClick={() => {
              setDraft({ label: c.label, color: c.color, shape: c.shape });
              setEditing(!editing);
            }}
          >
            Edytuj
          </button>
          <button
            type="button"
            className="btn btn-small btn-secondary"
            disabled={update.isPending}
            title={c.active ? 'Miejsca zostają, ale nie można dodawać nowych' : undefined}
            onClick={() => update.mutate({ active: !c.active })}
          >
            {c.active ? 'Wycofaj' : 'Przywróć'}
          </button>
          <button
            type="button"
            className="btn btn-small btn-danger"
            disabled={c.places > 0 || remove.isPending}
            title={c.places > 0 ? 'Ma miejsca — możesz ją tylko wycofać' : undefined}
            onClick={() => confirm(`Usunąć kategorię ${c.label}?`) && remove.mutate()}
          >
            Usuń
          </button>
        </div>
      </div>
      {editing && (
        <form
          className="category-edit"
          onSubmit={(e) => {
            e.preventDefault();
            update.mutate({ label: draft.label.trim(), ...pick(draft) });
          }}
        >
          <div className="field">
            <label htmlFor={`label-${c.id}`}>Nazwa</label>
            <input
              id={`label-${c.id}`}
              required
              maxLength={40}
              value={draft.label}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            />
          </div>
          <Appearance draft={draft} onChange={setDraft} />
          <div className="row">
            <button type="submit" className="btn btn-primary btn-small" disabled={!draft.label.trim()}>
              Zapisz
            </button>
            <button type="button" className="btn btn-secondary btn-small" onClick={() => setEditing(false)}>
              Anuluj
            </button>
          </div>
        </form>
      )}
    </li>
  );
}

const pick = (d: Draft) => ({ color: d.color, shape: d.shape });

/** Colour (the design system's card palette) and shape, with a preview. */
function Appearance({ draft, onChange }: { draft: Draft; onChange: (d: Draft) => void }) {
  const inPalette = CARD_COLOR_IDS.some((c) => CARD_COLORS[c].hex === draft.color);
  return (
    <div className="category-appearance">
      <fieldset className="field">
        <legend className="label">Kolor</legend>
        <div className="swatches">
          {!inPalette && (
            <button
              type="button"
              className="swatch"
              aria-pressed
              aria-label={draft.color}
              style={{ background: draft.color }}
            />
          )}
          {CARD_COLOR_IDS.map((c) => (
            <button
              key={c}
              type="button"
              className="swatch"
              aria-pressed={CARD_COLORS[c].hex === draft.color}
              aria-label={CARD_COLORS[c].label}
              title={CARD_COLORS[c].label}
              style={{ background: CARD_COLORS[c].hex }}
              onClick={() => onChange({ ...draft, color: CARD_COLORS[c].hex })}
            />
          ))}
        </div>
      </fieldset>
      <fieldset className="field">
        <legend className="label">Kształt</legend>
        <div className="chips">
          {SHAPES.map((s) => (
            <button
              key={s.id}
              type="button"
              className="chip"
              aria-pressed={draft.shape === s.id}
              onClick={() => onChange({ ...draft, shape: s.id })}
            >
              <ShapeIcon shape={s.id} color={draft.color} size={14} /> {s.label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="category-preview" aria-label="Podgląd">
        <ShapeIcon shape={draft.shape} color={draft.color} size={56} />
        <span className="chip">
          <ShapeIcon shape={draft.shape} color={draft.color} size={14} /> {draft.label.trim() || 'Nazwa'}
        </span>
      </div>
    </div>
  );
}
