import type { Location } from '../types';

export function buildGoogleMapsUrl(location: Location | undefined, fallbackQuery: string): string {
  const query = location ? `${location.lat},${location.lng}` : fallbackQuery;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function buildGoogleSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}
