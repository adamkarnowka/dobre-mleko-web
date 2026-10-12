const POLISH: Record<string, string> = { ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z' };

/** A category id from its name: "Kawiarnie & Bary" → "kawiarnie_bary" (the API's id format). */
export function slug(name: string): string {
  const s = name
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (ch) => POLISH[ch]!)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^[^a-z]+|_+$/g, '')
    .slice(0, 32)
    .replace(/_+$/, '');
  return s;
}

export const ID_PATTERN = /^[a-z][a-z0-9_]{1,31}$/;
