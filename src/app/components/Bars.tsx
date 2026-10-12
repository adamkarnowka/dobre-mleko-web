import { rating } from '../../shared/format';

/** Horizontal bars for 1–5 scores (criteria breakdown). */
export function CriteriaBars({ rows }: { rows: { label: string; value: number | null; strong?: boolean }[] }) {
  return (
    <div className="criteria-bars">
      {rows.map((r) => (
        <div key={r.label} className="criteria-row">
          <span className="criteria-label">{r.label}</span>
          <div className="criteria-track" aria-hidden="true">
            <div
              className="criteria-fill"
              style={{ width: `${((r.value ?? 0) / 5) * 100}%`, background: r.strong ? 'var(--red)' : 'var(--ink)' }}
            />
          </div>
          <span className="criteria-value">{rating(r.value)}</span>
        </div>
      ))}
    </div>
  );
}

/** Vertical bars with labels underneath (distribution, weekly activity). */
export function ColumnBars({ values, labels, title }: { values: number[]; labels: string[]; title: string }) {
  const max = Math.max(1, ...values);
  return (
    <figure className="columns" aria-label={title}>
      <div className="columns-plot">
        {values.map((v, i) => (
          <div key={i} className="column" title={`${labels[i]}: ${v}`}>
            <span className="column-value">{v}</span>
            <div className="column-fill" style={{ height: `${(v / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="columns-labels" aria-hidden="true">
        {labels.map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
    </figure>
  );
}
