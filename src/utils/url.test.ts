import { describe, it, expect } from 'vitest';
import { isHttpUrl } from './url';

describe('isHttpUrl', () => {
  it('accepts http and https URLs', () => {
    expect(isHttpUrl('http://example.com')).toBe(true);
    expect(isHttpUrl('https://example.com/path?query=1')).toBe(true);
  });

  it('rejects javascript: URLs', () => {
    expect(isHttpUrl('javascript:alert(1)')).toBe(false);
  });

  it('rejects data: URLs', () => {
    expect(isHttpUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('rejects malformed strings', () => {
    expect(isHttpUrl('not a url')).toBe(false);
    expect(isHttpUrl('')).toBe(false);
  });

  it('trims whitespace before validating', () => {
    expect(isHttpUrl('  https://example.com  ')).toBe(true);
  });
});
