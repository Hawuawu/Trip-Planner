/// <reference types="vitest/globals" />
import '@testing-library/jest-dom/vitest';

// MUI needs ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// MUI breakpoints need window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// MUI components call scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Node's own experimental global `localStorage` (unconfigured, throws without
// --localstorage-file) shadows jsdom's window.localStorage in this test
// environment, leaving `localStorage` reading as `undefined` — LocalTripRepository's
// save*() calls (no try/catch, unlike their load*() counterparts) throw as a
// result. Force a real in-memory Storage in its place.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  writable: true,
  value: new MemoryStorage(),
});
