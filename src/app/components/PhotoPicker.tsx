import { useRef, useState } from 'react';
import { uploadImage, type Photo } from '../../shared/api';
import { useToast } from '../../shared/components/Toast';
import { preparePhoto } from '../../shared/image';

export type Uploaded = { id: string; preview: string };

/**
 * Picks photos, shrinks them to 2048 px JPEG with a blurhash, uploads each one (POST /photos) and reports their ids.
 * The photos only show up once they are attached to a rating.
 */
export function PhotoPicker({
  value,
  onChange,
  max,
  required,
}: {
  value: Uploaded[];
  onChange: (photos: Uploaded[]) => void;
  max: number;
  required?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const [busy, setBusy] = useState(0);
  const left = max - value.length;

  async function add(files: FileList | null) {
    if (!files?.length) return;
    const picked = [...files].slice(0, Math.max(0, left));
    setBusy((b) => b + picked.length);
    const done: Uploaded[] = [];
    for (const file of picked) {
      try {
        const { blob, blurhash, preview } = await preparePhoto(file);
        const photo = await uploadImage<Photo>('/photos', blob, blurhash);
        done.push({ id: photo.id, preview });
      } catch (err) {
        toast.fail(err);
      } finally {
        setBusy((b) => b - 1);
      }
    }
    onChange([...value, ...done]);
    if (input.current) input.current.value = '';
  }

  return (
    <div className="photo-picker">
      <div className="photo-picker-grid">
        {value.map((p) => (
          <div key={p.id} className="photo-picker-item">
            <img src={p.preview} alt="" />
            <button
              type="button"
              className="btn btn-small photo-remove"
              aria-label="Usuń zdjęcie"
              onClick={() => onChange(value.filter((x) => x.id !== p.id))}
            >
              ×
            </button>
          </div>
        ))}
        {Array.from({ length: busy }, (_, i) => (
          <div key={`busy-${i}`} className="photo-picker-item busy">
            <span className="label">Wysyłanie…</span>
          </div>
        ))}
        {left > 0 && (
          <button type="button" className="photo-picker-add" onClick={() => input.current?.click()}>
            <span aria-hidden="true">+</span>
            <span className="label">Dodaj zdjęcie</span>
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple
        hidden
        onChange={(e) => add(e.target.files)}
      />
      <p className="data muted">
        {required ? 'Każda ocena ma co najmniej jedno zdjęcie. ' : ''}Do {max} zdjęć.
      </p>
    </div>
  );
}
