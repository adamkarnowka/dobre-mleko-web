import type { CardStyle, Category, Photo } from '../../shared/api';
import { CARD_COLOR_IDS, CARD_COLORS, FILTERS, LAYOUTS, textOn, type PhotoFilter } from '../../shared/cardStyle';
import { categoryInfo } from '../../shared/categories';
import { CategoryMark } from '../../shared/components/CategoryMark';
import { CardArt } from './CardArt';

/** The author's choice of how the place looks to everyone: layout, colour, photo filter and its strength. */
export function CardStyleFields({
  value,
  onChange,
  category,
  name,
  photo,
}: {
  value: CardStyle;
  onChange: (style: CardStyle) => void;
  category: Category | null;
  name: string;
  photo: Pick<Photo, 'url' | 'thumb_url' | 'blurhash'> | null;
}) {
  const set = (patch: Partial<CardStyle>) => onChange({ ...value, ...patch });
  const cat = category ?? 'other';
  return (
    <section className="place-section card-style">
      <h2 className="title">Wygląd karty</h2>
      <p className="muted">Tak wszyscy zobaczą to miejsce na liście. Filtr działa też na głównym zdjęciu.</p>
      <div className="card-style-grid">
        <div>
          <fieldset className="field">
            <legend className="label">Układ</legend>
            <div className="chips">
              {(Object.keys(LAYOUTS) as CardStyle['layout'][]).map((l) => (
                <button
                  key={l}
                  type="button"
                  className="chip"
                  aria-pressed={value.layout === l}
                  title={LAYOUTS[l].hint}
                  onClick={() => set({ layout: l })}
                >
                  {LAYOUTS[l].label}
                </button>
              ))}
            </div>
            <span className="data muted">{LAYOUTS[value.layout].hint}</span>
          </fieldset>

          <fieldset className="field">
            <legend className="label">Kolor</legend>
            <div className="swatches">
              <button
                type="button"
                className="swatch swatch-category"
                aria-pressed={value.color === null}
                aria-label={`Kolor kategorii (${categoryInfo(cat).label})`}
                title="Kolor kategorii"
                style={{ background: categoryInfo(cat).color }}
                onClick={() => set({ color: null })}
              >
                <CategoryMark category={cat} size={16} color={textOn(categoryInfo(cat).color)} />
              </button>
              {CARD_COLOR_IDS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="swatch"
                  aria-pressed={value.color === c}
                  aria-label={CARD_COLORS[c].label}
                  title={CARD_COLORS[c].label}
                  style={{ background: CARD_COLORS[c].hex }}
                  onClick={() => set({ color: c })}
                />
              ))}
            </div>
            <span className="data muted">
              {value.color ? CARD_COLORS[value.color].label : `Kolor kategorii · ${categoryInfo(cat).label}`}
            </span>
          </fieldset>

          <fieldset className="field">
            <legend className="label">Filtr zdjęcia</legend>
            <div className="chips">
              {(Object.keys(FILTERS) as PhotoFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  className="chip"
                  aria-pressed={value.photo_filter === f}
                  onClick={() => set({ photo_filter: f })}
                >
                  {FILTERS[f]}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="field">
            <label htmlFor="filter-intensity">Siła filtra · {value.filter_intensity}%</label>
            <input
              id="filter-intensity"
              type="range"
              min={0}
              max={100}
              step={5}
              value={value.filter_intensity}
              disabled={value.photo_filter === 'none'}
              onChange={(e) => set({ filter_intensity: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="card-style-preview" aria-label="Podgląd karty">
          <span className="label">Podgląd</span>
          <div className="place-card panel">
            <CardArt category={cat} style={value} photo={photo} position={0} />
            <div className="place-card-body">
              <h3 className="place-card-name">{name.trim() || 'Nazwa miejsca'}</h3>
              <p className="label place-card-meta">{categoryInfo(cat).label}</p>
            </div>
          </div>
          {!photo && value.layout !== 'b' && <span className="data muted">Bez zdjęcia karta jest plakatem.</span>}
        </div>
      </div>
    </section>
  );
}
