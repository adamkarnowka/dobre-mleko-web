import { useEffect, useId, useState } from 'react';
import { count } from '../../shared/format';
import { addTag, MAX_TAG_LENGTH, MAX_TAGS, useTagSuggestions } from '../tags';

/**
 * Tags as chips. Typing suggests tags friends already use (Enter or comma adds the highlighted one, or the text);
 * below, the most used tags of the place's category, one tap each.
 */
export function TagInput({
  value,
  onChange,
  category,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  category: string | null;
}) {
  const id = useId();
  const [text, setText] = useState('');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const full = value.length >= MAX_TAGS;

  useEffect(() => {
    const t = setTimeout(() => setQ(text.trim()), 200);
    return () => clearTimeout(t);
  }, [text]);

  const chosen = new Set(value.map((t) => t.toLowerCase()));
  const notChosen = <T extends { tag: string }>(items: T[] = []) =>
    items.filter((s) => !chosen.has(s.tag.toLowerCase()));
  const matches = notChosen(useTagSuggestions(q, category, 8).data).slice(0, 6);
  const popular = notChosen(useTagSuggestions('', category, 16).data).slice(0, 8);
  const show = open && q.length > 0 && matches.length > 0;

  const add = (tag: string) => {
    onChange(
      addTag(
        value,
        tag,
        matches.map((m) => m.tag),
      ),
    );
    setText('');
    setQ('');
    setActive(-1);
  };

  return (
    <div className="field tag-input">
      <label htmlFor={`${id}-input`}>Tagi</label>
      {value.length > 0 && (
        <div className="chips" role="group" aria-label="Wybrane tagi">
          {value.map((t) => (
            <button
              key={t}
              type="button"
              className="chip"
              aria-pressed
              onClick={() => onChange(value.filter((x) => x !== t))}
            >
              {t} <span aria-hidden="true">×</span>
              <span className="visually-hidden">(usuń tag)</span>
            </button>
          ))}
        </div>
      )}
      <div className="place-search-box">
        <input
          id={`${id}-input`}
          role="combobox"
          aria-expanded={show}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={show && active >= 0 ? `${id}-${active}` : undefined}
          autoComplete="off"
          maxLength={MAX_TAG_LENGTH}
          disabled={full}
          placeholder={full ? `Najwyżej ${MAX_TAGS} tagów` : 'Ogródek, Późno w nocy, Wege…'}
          value={text}
          onChange={(e) => {
            const v = e.target.value;
            // A comma (typed or pasted) closes a tag.
            if (v.includes(',')) {
              let next = value;
              for (const part of v.split(',').slice(0, -1))
                next = addTag(
                  next,
                  part,
                  matches.map((m) => m.tag),
                );
              onChange(next);
              setText(v.slice(v.lastIndexOf(',') + 1));
            } else setText(v);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              if (!matches.length) return;
              e.preventDefault();
              setOpen(true);
              setActive((a) =>
                e.key === 'ArrowDown' ? (a + 1) % matches.length : a <= 0 ? matches.length - 1 : a - 1,
              );
            } else if (e.key === 'Enter') {
              e.preventDefault(); // never submit the form from here
              const pick = show && active >= 0 ? matches[active]!.tag : text;
              if (pick.trim()) add(pick);
            } else if (e.key === 'Backspace' && !text && value.length) {
              onChange(value.slice(0, -1));
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
        />
        {show && (
          <ul id={`${id}-list`} role="listbox" className="place-search-list" aria-label="Podpowiedzi tagów">
            {matches.map((m, i) => (
              <li
                key={m.tag}
                id={`${id}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  add(m.tag);
                }}
                onMouseEnter={() => setActive(i)}
              >
                <span>
                  <strong>{m.tag}</strong>
                  <span className="data muted">{count(m.places, ['miejsce', 'miejsca', 'miejsc'])}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {!full && popular.length > 0 && (
        <div className="tag-popular">
          <span className="data muted">Popularne:</span>
          {popular.map((p) => (
            <button key={p.tag} type="button" className="chip chip-suggest" onClick={() => add(p.tag)}>
              + {p.tag}
            </button>
          ))}
        </div>
      )}
      <span className="data muted">
        {value.length}/{MAX_TAGS} · Enter albo przecinek dodaje tag.
      </span>
    </div>
  );
}
