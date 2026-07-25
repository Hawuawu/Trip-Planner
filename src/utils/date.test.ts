import { describe, it, expect, afterEach } from 'vitest';
import { parseLocalDate, enumerateDays, localDayKey, formatDayLabel } from './date';

describe('parseLocalDate', () => {
  it('builds a Date from the local calendar components of a bare date string', () => {
    const d = parseLocalDate('2026-10-01');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(9);
    expect(d.getDate()).toBe(1);
  });
});

describe('enumerateDays', () => {
  it('returns a single-element array when start === end', () => {
    expect(enumerateDays('2026-10-01', '2026-10-01')).toEqual(['2026-10-01']);
  });

  it('is inclusive of both boundaries', () => {
    expect(enumerateDays('2026-10-01', '2026-10-03')).toEqual([
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
    ]);
  });

  it('spans a month boundary correctly', () => {
    expect(enumerateDays('2026-10-30', '2026-11-01')).toEqual([
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ]);
  });
});

describe('localDayKey', () => {
  it('extracts the local calendar day from an ISO datetime', () => {
    expect(localDayKey('2026-10-06T08:00:00.000Z')).toMatch(/^2026-10-0[56]$/);
  });
});

describe('formatDayLabel', () => {
  it('formats a day key as a short month/day label', () => {
    const label = formatDayLabel('2026-10-02');
    expect(label).toMatch(/Oct/);
    expect(label).toMatch(/2/);
  });
});

describe('timezone safety (negative UTC offset)', () => {
  const originalTz = process.env.TZ;

  afterEach(() => {
    process.env.TZ = originalTz;
  });

  it("doesn't roll dateRange.start back a day in America/Los_Angeles", () => {
    process.env.TZ = 'America/Los_Angeles';
    expect(enumerateDays('2026-10-01', '2026-10-01')).toEqual(['2026-10-01']);
  });

  it('buckets a checkpoint crossing UTC midnight into its LA-local day', () => {
    process.env.TZ = 'America/Los_Angeles';
    // 2026-10-02T02:00:00Z is 2026-10-01T19:00:00 PDT (UTC-7) — still Oct 1 locally.
    expect(localDayKey('2026-10-02T02:00:00.000Z')).toBe('2026-10-01');
  });
});
