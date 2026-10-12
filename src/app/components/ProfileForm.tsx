import { useState } from 'react';
import type { Category, Me } from '../../shared/api';
import { CATEGORY, CATEGORY_IDS } from '../../shared/categories';
import { CategoryMark } from '../../shared/components/CategoryMark';

export type ProfileDraft = { display_name: string; badge: string; favorite_categories: Category[] };

/** Display name, badge (max 16) and up to 3 favourite categories: onboarding and the profile page. */
export function ProfileForm({
  me,
  submitLabel,
  busy,
  onSubmit,
}: {
  me: Me;
  submitLabel: string;
  busy?: boolean;
  onSubmit: (d: ProfileDraft) => void;
}) {
  const [draft, setDraft] = useState<ProfileDraft>({
    display_name: me.display_name,
    badge: me.badge ?? '',
    favorite_categories: me.favorite_categories,
  });
  const fav = draft.favorite_categories;
  return (
    <form
      className="profile-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ ...draft, display_name: draft.display_name.trim(), badge: draft.badge.trim() });
      }}
    >
      <div className="field">
        <label htmlFor="display-name">Imię lub ksywka</label>
        <input
          id="display-name"
          required
          maxLength={60}
          value={draft.display_name}
          onChange={(e) => setDraft({ ...draft, display_name: e.target.value })}
        />
      </div>
      <div className="field">
        <label htmlFor="badge">Odznaka</label>
        <input
          id="badge"
          maxLength={16}
          placeholder="np. SzachMat"
          value={draft.badge}
          onChange={(e) => setDraft({ ...draft, badge: e.target.value })}
        />
        <span className="data muted">Do 16 znaków, opcjonalnie.</span>
      </div>
      <fieldset className="field">
        <legend className="label">Ulubione kategorie (do 3)</legend>
        <div className="chips">
          {CATEGORY_IDS.map((c) => {
            const on = fav.includes(c);
            return (
              <button
                key={c}
                type="button"
                className="chip"
                aria-pressed={on}
                disabled={!on && fav.length >= 3}
                onClick={() =>
                  setDraft({ ...draft, favorite_categories: on ? fav.filter((x) => x !== c) : [...fav, c] })
                }
              >
                <CategoryMark category={c} size={14} /> {CATEGORY[c].label}
              </button>
            );
          })}
        </div>
      </fieldset>
      <button type="submit" className="btn btn-primary" disabled={!draft.display_name.trim() || busy}>
        {submitLabel}
      </button>
    </form>
  );
}
