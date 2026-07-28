import type { Alternative } from '../types';
import { matchesAnyTag } from './tags';

export interface AlternativesFilterOptions {
  search: string;
  tags: string[];
}

export function filterAlternatives(
  alternatives: Alternative[],
  { search, tags }: AlternativesFilterOptions
): Alternative[] {
  const q = search.trim().toLowerCase();
  return alternatives.filter((a) => {
    const matchesSearch =
      !q || [a.name, a.location?.label, a.notes].some((f) => f?.toLowerCase().includes(q));
    return matchesSearch && matchesAnyTag(a.tags, tags);
  });
}
