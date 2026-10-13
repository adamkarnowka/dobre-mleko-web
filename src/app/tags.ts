import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api, unwrap } from '../shared/api';

export const MAX_TAGS = 10;
export const MAX_TAG_LENGTH = 30;

/** Tags already used on places (GET /tags): matching `q`, or the most used; a category's own first. */
export function useTagSuggestions(q: string, category: string | null = null, limit = 10, enabled = true) {
  return useQuery({
    enabled,
    queryKey: ['tags', q, category, limit],
    queryFn: () =>
      unwrap(api.GET('/tags', { params: { query: { q: q || undefined, category: category ?? undefined, limit } } })),
    select: (r) => r.items,
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
}

/** Adds `tag` unless already there (in any case); a suggestion's spelling wins over what was typed. */
export function addTag(tags: string[], tag: string, known: string[] = []): string[] {
  const clean = tag.trim().replace(/\s+/g, ' ').slice(0, MAX_TAG_LENGTH);
  if (!clean || tags.length >= MAX_TAGS) return tags;
  const lower = clean.toLowerCase();
  if (tags.some((t) => t.toLowerCase() === lower)) return tags;
  return [...tags, known.find((k) => k.toLowerCase() === lower) ?? clean];
}
