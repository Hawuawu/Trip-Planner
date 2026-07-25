import { describe, it, expect } from 'vitest';
import { collectAllTags, matchesAnyTag } from './tags';

describe('collectAllTags', () => {
  it('returns an empty array for empty inputs', () => {
    expect(collectAllTags([], [])).toEqual([]);
  });

  it('dedupes tags across both checkpoints and alternatives', () => {
    const checkpoints = [{ tags: ['food', 'must-see'] }, { tags: ['food'] }];
    const alternatives = [{ tags: ['rainy-day'] }, { tags: ['must-see'] }];
    expect(collectAllTags(checkpoints, alternatives)).toEqual(['food', 'must-see', 'rainy-day']);
  });

  it('sorts alphabetically', () => {
    expect(collectAllTags([{ tags: ['zoo', 'apple'] }], [])).toEqual(['apple', 'zoo']);
  });

  it('ignores items with no tags field at all', () => {
    expect(collectAllTags([{}, { tags: ['x'] }], [{}])).toEqual(['x']);
  });
});

describe('matchesAnyTag', () => {
  it('matches everything when no tags are selected', () => {
    expect(matchesAnyTag(undefined, [])).toBe(true);
    expect(matchesAnyTag(['a'], [])).toBe(true);
  });

  it('matches when the item has at least one selected tag', () => {
    expect(matchesAnyTag(['a', 'b'], ['b', 'c'])).toBe(true);
  });

  it('does not match when the item has none of the selected tags', () => {
    expect(matchesAnyTag(['a'], ['b', 'c'])).toBe(false);
  });

  it('does not match when the item has no tags but a filter is active', () => {
    expect(matchesAnyTag(undefined, ['a'])).toBe(false);
  });
});
