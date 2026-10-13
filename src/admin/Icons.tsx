import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, unwrap, type Schemas } from '../shared/api';
import { CARD_COLORS } from '../shared/cardStyle';
import { ICON_PATH, pastedIconPath } from '../shared/categories';
import { IconMark } from '../shared/components/CategoryMark';
import { useToast } from '../shared/components/Toast';
import { ago, count } from '../shared/format';
import { ID_PATTERN, slug } from './slug';

type AdminIcon = Schemas['AdminIcon'];

export const ICONS_KEY = ['admin', 'icons'];
const CATEGORIES: [string, string, string] = ['kategoria', 'kategorie', 'kategorii'];
/** Preview colours: ink, and two palette colours to check the icon on colour and its holes. */
const PREVIEW = [CARD_COLORS.ink.hex, CARD_COLORS.red.hex, CARD_COLORS.blue.hex];

/** The icon library: pictograms (SVG paths on a 24×24 grid) that categories point at; every app draws them. */
export function Icons() {
  const list = useIcons();
  if (list.isLoading) return <p className="label">Ładowanie…</p>;
  if (!list.data) return null;
  const items = list.data.items;
  return (
    <section aria-label="Ikony">
      <AddIcon />
      <p className="label">
        {count(items.length, ['ikona', 'ikony', 'ikon'])} · kategorie wskazują ikonę w zakładce Kategorie. Aplikacje
        rysują ścieżkę z serwera — zmiana ikony zmienia ją wszędzie.
      </p>
      <ul className="icon-grid">
        {items.map((icon) => (
          <IconCard key={icon.id} icon={icon} />
        ))}
      </ul>
    </section>
  );
}

export function useIcons() {
  return useQuery({ queryKey: ICONS_KEY, queryFn: () => unwrap(api.GET('/admin/icons')) });
}

/** Icons, categories (they embed the path) and /meta all change. */
function useRefresh() {
  const client = useQueryClient();
  return () =>
    Promise.all(
      [ICONS_KEY, ['admin', 'categories'], ['meta']].map((queryKey) => client.invalidateQueries({ queryKey })),
    ).then(() => undefined);
}

function AddIcon() {
  const refresh = useRefresh();
  const toast = useToast();
  const [label, setLabel] = useState('');
  const [id, setId] = useState<string | null>(null); // null: follows the name
  const [path, setPath] = useState('');
  const finalId = id ?? slug(label);
  const add = useMutation({
    mutationFn: () => unwrap(api.POST('/admin/icons', { body: { id: finalId, label: label.trim(), path } })),
    onSuccess: async (icon) => {
      toast.ok(`Dodano ikonę ${icon.label}.`);
      setLabel('');
      setId(null);
      setPath('');
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
      <h2 className="title">Nowa ikona</h2>
      <div className="add-category-names">
        <div className="field grow">
          <label htmlFor="icon-label">Nazwa</label>
          <input
            id="icon-label"
            required
            maxLength={40}
            placeholder="Sauna"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="icon-id">Identyfikator</label>
          <input
            id="icon-id"
            required
            maxLength={32}
            pattern={ID_PATTERN.source}
            className="data"
            value={finalId}
            onChange={(e) => setId(e.target.value)}
          />
        </div>
      </div>
      <PathField id="icon-path" path={path} onChange={setPath} />
      <div className="row">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!label.trim() || !ID_PATTERN.test(finalId) || !ICON_PATH.test(path) || add.isPending}
        >
          Dodaj ikonę
        </button>
      </div>
    </form>
  );
}

function IconCard({ icon }: { icon: AdminIcon }) {
  const refresh = useRefresh();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(icon.label);
  const [path, setPath] = useState(icon.path);
  const params = { params: { path: { id: icon.id } } };
  const update = useMutation({
    mutationFn: () => unwrap(api.PATCH('/admin/icons/{id}', { ...params, body: { label: label.trim(), path } })),
    onSuccess: async () => {
      toast.ok('Zapisano ikonę.');
      setEditing(false);
      await refresh();
    },
    onError: toast.fail,
  });
  const remove = useMutation({
    mutationFn: () => unwrap(api.DELETE('/admin/icons/{id}', params)),
    onSuccess: async () => {
      toast.ok(`Usunięto ikonę ${icon.label}.`);
      await refresh();
    },
    onError: toast.fail,
  });
  return (
    <li className="icon-card panel" aria-label={icon.label}>
      <div className="icon-card-previews">
        {PREVIEW.map((color) => (
          <IconMark key={color} path={icon.path} color={color} size={40} />
        ))}
      </div>
      <strong>{icon.label}</strong>
      <span className="data muted">
        {icon.id} · {count(icon.categories, CATEGORIES)}
        {icon.updated_by && ` · ${icon.updated_by.display_name} ${ago(icon.updated_at)}`}
      </span>
      <div className="row">
        <button
          type="button"
          className="btn btn-small btn-secondary"
          aria-expanded={editing}
          onClick={() => {
            setLabel(icon.label);
            setPath(icon.path);
            setEditing(!editing);
          }}
        >
          Edytuj
        </button>
        <button
          type="button"
          className="btn btn-small btn-danger"
          disabled={icon.categories > 0 || remove.isPending}
          title={icon.categories > 0 ? 'Używają jej kategorie — najpierw zmień im ikonę' : undefined}
          onClick={() => confirm(`Usunąć ikonę ${icon.label}?`) && remove.mutate()}
        >
          Usuń
        </button>
      </div>
      {editing && (
        <form
          className="category-edit"
          onSubmit={(e) => {
            e.preventDefault();
            update.mutate();
          }}
        >
          <div className="field">
            <label htmlFor={`icon-label-${icon.id}`}>Nazwa</label>
            <input
              id={`icon-label-${icon.id}`}
              required
              maxLength={40}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <PathField id={`icon-path-${icon.id}`} path={path} onChange={setPath} />
          <div className="row">
            <button
              type="submit"
              className="btn btn-primary btn-small"
              disabled={!label.trim() || !ICON_PATH.test(path) || update.isPending}
            >
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

/** Path data, or a pasted SVG (its paths are taken), with a live preview on the 24×24 grid. */
function PathField({ id, path, onChange }: { id: string; path: string; onChange: (path: string) => void }) {
  const [offGrid, setOffGrid] = useState(false);
  const valid = ICON_PATH.test(path);
  return (
    <div className="icon-path">
      <div className="field grow">
        <label htmlFor={id}>Ścieżka SVG</label>
        <textarea
          id={id}
          required
          rows={4}
          className="data"
          placeholder='M4 20 L20 20 L12 4 Z — albo wklej cały plik SVG z viewBox="0 0 24 24"'
          value={path}
          onChange={(e) => {
            const pasted = pastedIconPath(e.target.value);
            setOffGrid(!pasted.grid);
            onChange(pasted.path);
          }}
        />
        <span className="data muted" style={valid || !path ? undefined : { color: 'var(--red)' }}>
          {offGrid
            ? 'To SVG ma inny viewBox niż 0 0 24 24 — narysuj ikonę na siatce 24×24.'
            : valid || !path
              ? 'Siatka 24×24, jeden kolor, dziury jako osobne kontury (wypełnienie even-odd).'
              : 'Tylko polecenia ścieżki (M L H V C S Q T A Z) i liczby.'}
        </span>
      </div>
      <div className="icon-preview" aria-label="Podgląd">
        {valid && PREVIEW.map((color) => <IconMark key={color} path={path} color={color} size={72} />)}
      </div>
    </div>
  );
}
