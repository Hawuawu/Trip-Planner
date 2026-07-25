import { describe, it, expect } from 'vitest';
import { visibleCheckpoints } from './checkpointVisibility';
import type { Checkpoint, Route } from '../types';

function makeCheckpoint(overrides: Partial<Checkpoint> = {}): Checkpoint {
  return {
    id: 'cp-1',
    type: 'poi',
    name: 'Fushimi Inari',
    startTime: '2026-10-06T08:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeRoute(overrides: Partial<Route> = {}): Route {
  return {
    id: 'route-1',
    name: 'Nature route',
    days: ['2026-10-06'],
    checkpointIds: [],
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('visibleCheckpoints', () => {
  const cp1 = makeCheckpoint({ id: 'cp-1', startTime: '2026-10-05T08:00:00.000Z' });
  const cp2 = makeCheckpoint({ id: 'cp-2', startTime: '2026-10-06T08:00:00.000Z' });
  const cp3 = makeCheckpoint({ id: 'cp-3', startTime: '2026-10-06T20:00:00.000Z' });
  const checkpoints = [cp1, cp2, cp3];

  it('returns all checkpoints unchanged when nothing is selected', () => {
    const result = visibleCheckpoints(checkpoints, {
      selectedDay: null,
      selectedRouteId: null,
      routes: [],
    });
    expect(result).toBe(checkpoints);
  });

  it('filters to a single day when selectedDay is set', () => {
    const result = visibleCheckpoints(checkpoints, {
      selectedDay: '2026-10-06',
      selectedRouteId: null,
      routes: [],
    });
    expect(result.map((c) => c.id)).toEqual(['cp-2', 'cp-3']);
  });

  it('filters to a route checkpointIds membership when selectedRouteId is set', () => {
    const route = makeRoute({ id: 'route-1', checkpointIds: ['cp-1', 'cp-3'] });
    const result = visibleCheckpoints(checkpoints, {
      selectedDay: null,
      selectedRouteId: 'route-1',
      routes: [route],
    });
    expect(result.map((c) => c.id)).toEqual(['cp-1', 'cp-3']);
  });

  it('combines route and day filters as an intersection (AND)', () => {
    // Route includes cp-1 (Oct 5) and cp-3 (Oct 6 evening); narrowing to
    // Oct 6 should keep only cp-3, not cp-1.
    const route = makeRoute({ id: 'route-1', checkpointIds: ['cp-1', 'cp-3'] });
    const result = visibleCheckpoints(checkpoints, {
      selectedDay: '2026-10-06',
      selectedRouteId: 'route-1',
      routes: [route],
    });
    expect(result.map((c) => c.id)).toEqual(['cp-3']);
  });

  it('returns an empty array when route and day filters have no overlap', () => {
    const route = makeRoute({ id: 'route-1', checkpointIds: ['cp-1'] });
    const result = visibleCheckpoints(checkpoints, {
      selectedDay: '2026-10-06',
      selectedRouteId: 'route-1',
      routes: [route],
    });
    expect(result).toEqual([]);
  });

  it('returns an empty array when the route has no matching checkpoints', () => {
    const route = makeRoute({ id: 'route-1', checkpointIds: ['does-not-exist'] });
    const result = visibleCheckpoints(checkpoints, {
      selectedDay: null,
      selectedRouteId: 'route-1',
      routes: [route],
    });
    expect(result).toEqual([]);
  });

  it('silently omits a checkpointId referencing a since-deleted checkpoint', () => {
    const route = makeRoute({ id: 'route-1', checkpointIds: ['cp-1', 'deleted-cp'] });
    const result = visibleCheckpoints(checkpoints, {
      selectedDay: null,
      selectedRouteId: 'route-1',
      routes: [route],
    });
    expect(result.map((c) => c.id)).toEqual(['cp-1']);
  });

  it('falls back to unfiltered checkpoints if selectedRouteId points at a missing route', () => {
    const result = visibleCheckpoints(checkpoints, {
      selectedDay: null,
      selectedRouteId: 'route-does-not-exist',
      routes: [],
    });
    expect(result).toBe(checkpoints);
  });

  it('returns an empty array when no checkpoints match the selected day', () => {
    const result = visibleCheckpoints(checkpoints, {
      selectedDay: '2026-10-09',
      selectedRouteId: null,
      routes: [],
    });
    expect(result).toEqual([]);
  });
});
