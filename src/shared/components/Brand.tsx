/** Red circle + wordmark, with an optional tag (e.g. "Admin"). */
export function Brand({ tag, href = '/' }: { tag?: string; href?: string }) {
  return (
    <a className="brand" href={href}>
      <span className="brand-mark" aria-hidden="true" />
      <span className="brand-name">Dobre Mleko</span>
      {tag && <span className="brand-tag">{tag}</span>}
    </a>
  );
}
