/** Black-and-white avatar; a yellow ring marks me (or an admin in the dashboard). */
export function Avatar({
  name,
  url,
  size = 40,
  ring,
}: {
  name: string;
  url: string | null | undefined;
  size?: number;
  ring?: 'me' | 'admin';
}) {
  return (
    <span className={`avatar${ring ? ` ${ring}` : ''}`} style={{ width: size, height: size }} aria-hidden="true">
      {url ? (
        <img src={url} alt="" referrerPolicy="no-referrer" loading="lazy" />
      ) : (
        (name || '?').slice(0, 1).toUpperCase()
      )}
    </span>
  );
}
