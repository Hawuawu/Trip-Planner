export function collectAllTags(
  checkpoints: { tags?: string[] }[],
  alternatives: { tags?: string[] }[]
): string[] {
  const set = new Set<string>();
  for (const item of [...checkpoints, ...alternatives]) {
    for (const tag of item.tags ?? []) set.add(tag);
  }
  return Array.from(set).sort();
}

export function matchesAnyTag(itemTags: string[] | undefined, selectedTags: string[]): boolean {
  if (selectedTags.length === 0) return true;
  return itemTags?.some((t) => selectedTags.includes(t)) ?? false;
}
