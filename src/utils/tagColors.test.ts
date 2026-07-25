import { describe, it, expect } from 'vitest';
import { getTagColor } from './tagColors';

describe('getTagColor', () => {
  it('is deterministic — the same tag always returns the same color', () => {
    expect(getTagColor('food')).toEqual(getTagColor('food'));
  });

  it('returns a bg/fg pair', () => {
    const color = getTagColor('rainy-day');
    expect(typeof color.bg).toBe('string');
    expect(typeof color.fg).toBe('string');
  });

  it('is stable across calls regardless of casing/content differences producing distinct tags', () => {
    const a = getTagColor('must-see');
    const b = getTagColor('must-see');
    const c = getTagColor('Must-See');
    expect(a).toEqual(b);
    // Different strings are allowed (not required) to collide, but the
    // function itself must not throw and must return a valid palette entry.
    expect(typeof c.bg).toBe('string');
  });
});
