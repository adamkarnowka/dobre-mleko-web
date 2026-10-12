import { CRITERIA, SCORE_WORDS, type CriterionKey } from '../../shared/categories';
import { rating } from '../../shared/format';

export type ScoresDraft = Record<CriterionKey, number | null>;

export const EMPTY_SCORES: ScoresDraft = { vibe: null, offer: null, service: null, value: null };

/** Overall = average of the criteria that apply (as the API computes it). */
export function overall(s: ScoresDraft): number | null {
  const given = Object.values(s).filter((v): v is number => v != null);
  return given.length ? given.reduce((a, b) => a + b, 0) / given.length : null;
}

export const scoresComplete = (s: ScoresDraft) => s.vibe != null && s.offer != null;

/** Squares 1–5 per criterion; service and value can be "nie dotyczy" (null). Squares = input, number = result. */
export function RatingInput({ value, onChange }: { value: ScoresDraft; onChange: (s: ScoresDraft) => void }) {
  const total = overall(value);
  return (
    <div className="rating-input">
      <div className="rating-total">
        <span className="label">Łącznie</span>
        <span className="numeral">{rating(total)}</span>
      </div>
      {CRITERIA.map((c) => {
        const v = value[c.key];
        const na = !c.required && v == null;
        return (
          <fieldset key={c.key} className="criterion">
            <legend>
              <span className="criterion-label">
                {c.label}
                {c.required && <span aria-hidden="true"> *</span>}
              </span>
              <span className="criterion-word">{v == null ? (c.required ? '—' : 'Nie dotyczy') : SCORE_WORDS[v]}</span>
            </legend>
            <p className="criterion-hint">{c.hint}</p>
            <div className="squares">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className="square"
                  aria-pressed={v != null && n <= v}
                  aria-label={`${c.label}: ${n} na 5`}
                  onClick={() => onChange({ ...value, [c.key]: n })}
                />
              ))}
              {!c.required && (
                <button
                  type="button"
                  className="chip"
                  aria-pressed={na}
                  onClick={() => onChange({ ...value, [c.key]: null })}
                >
                  N/D
                </button>
              )}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
