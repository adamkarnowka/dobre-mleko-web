import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, unwrap, type Setting } from '../shared/api';
import { useToast } from '../shared/components/Toast';
import { dateTime, number } from '../shared/format';

const KEY = ['admin', 'settings'];

const UNITS: Record<string, (v: number) => string> = {
  maxPhotoBytes: (v) => `= ${(v / 1024 / 1024).toLocaleString('pl-PL', { maximumFractionDigits: 2 })} MB`,
};

export function Settings() {
  const list = useQuery({ queryKey: KEY, queryFn: () => unwrap(api.GET('/admin/settings')) });
  if (list.isLoading) return <p className="label">Ładowanie…</p>;
  return (
    <section className="settings" aria-label="Ustawienia">
      {list.data?.items.map((s) => (
        <SettingCard key={s.key} setting={s} />
      ))}
    </section>
  );
}

function SettingCard({ setting: s }: { setting: Setting }) {
  const client = useQueryClient();
  const toast = useToast();
  const [value, setValue] = useState(String(s.value));
  const id = `setting-${s.key}`;
  const path = { params: { path: { key: s.key as never } } };
  const done = (message: string) => (next: Setting) => {
    toast.ok(message);
    setValue(String(next.value));
    return client.invalidateQueries({ queryKey: KEY });
  };
  const save = useMutation({
    mutationFn: () => unwrap(api.PUT('/admin/settings/{key}', { ...path, body: { value: Number(value) } })),
    onSuccess: done('Zapisano ustawienie.'),
    onError: toast.fail,
  });
  const reset = useMutation({
    mutationFn: () => unwrap(api.DELETE('/admin/settings/{key}', path)),
    onSuccess: done('Przywrócono domyślną wartość.'),
    onError: toast.fail,
  });
  const unit = UNITS[s.key];

  return (
    <form
      className="setting panel"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <div>
        <h2>
          <label htmlFor={id}>{s.label}</label>
        </h2>
        <p>{s.description}</p>
        <div className="data muted setting-meta">
          Domyślnie {number(s.default)} · zakres {number(s.min ?? 0)}–{number(s.max ?? 0)} ·{' '}
          {s.updated_at ? (
            <span className="changed">
              Zmienione {dateTime(s.updated_at)}
              {s.updated_by && ` przez ${s.updated_by.display_name}`}
            </span>
          ) : (
            'Wartość domyślna'
          )}
        </div>
      </div>
      <div className="setting-control">
        <input
          id={id}
          type="number"
          required
          value={value}
          min={s.min ?? undefined}
          max={s.max ?? undefined}
          step={s.integer ? 1 : 0.01}
          onChange={(e) => setValue(e.target.value)}
        />
        {unit && <span className="data muted">{unit(Number(value) || 0)}</span>}
        <div className="setting-actions">
          <button type="submit" className="btn btn-primary btn-small" disabled={save.isPending}>
            Zapisz
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            disabled={!s.updated_at || reset.isPending}
            onClick={() => reset.mutate()}
          >
            Domyślna
          </button>
        </div>
      </div>
    </form>
  );
}
