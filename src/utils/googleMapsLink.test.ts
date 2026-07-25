import { describe, it, expect } from 'vitest';
import { buildGoogleMapsUrl, buildGoogleSearchUrl } from './googleMapsLink';

const MAPS_BASE = 'https://www.google.com/maps/search/?api=1&query=';
const SEARCH_BASE = 'https://www.google.com/search?q=';

describe('buildGoogleMapsUrl', () => {
  it('uses lat,lng when location is present', () => {
    expect(buildGoogleMapsUrl({ lat: 35.6895, lng: 139.6917 }, 'fallback')).toBe(
      `${MAPS_BASE}${encodeURIComponent('35.6895,139.6917')}`
    );
  });

  it('falls back to the query when location is undefined', () => {
    expect(buildGoogleMapsUrl(undefined, 'Shinjuku, Tokyo')).toBe(
      `${MAPS_BASE}${encodeURIComponent('Shinjuku, Tokyo')}`
    );
  });

  it('URL-encodes non-ASCII fallback queries', () => {
    expect(buildGoogleMapsUrl(undefined, '浅草寺')).toBe(
      `${MAPS_BASE}${encodeURIComponent('浅草寺')}`
    );
  });
});

describe('buildGoogleSearchUrl', () => {
  it('URL-encodes a plain name query', () => {
    expect(buildGoogleSearchUrl('Ichiran Ramen')).toBe(
      `${SEARCH_BASE}${encodeURIComponent('Ichiran Ramen')}`
    );
  });

  it('URL-encodes names with & and spaces', () => {
    expect(buildGoogleSearchUrl('Salt & Pepper')).toBe(
      `${SEARCH_BASE}${encodeURIComponent('Salt & Pepper')}`
    );
  });

  it('URL-encodes non-ASCII names', () => {
    expect(buildGoogleSearchUrl('浅草寺')).toBe(`${SEARCH_BASE}${encodeURIComponent('浅草寺')}`);
  });
});
