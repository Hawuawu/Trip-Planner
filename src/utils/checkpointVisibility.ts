import type { Checkpoint, Route } from '../types';
import { localDayKey } from './date';

// Day and route filters are independent and combine with AND semantics —
// selecting a route doesn't clear an active day (and vice versa), so a user
// can narrow to "this route, on this day" at once.
export function visibleCheckpoints(
  checkpoints: Checkpoint[],
  {
    selectedDay,
    selectedRouteId,
    routes,
  }: { selectedDay: string | null; selectedRouteId: string | null; routes: Route[] }
): Checkpoint[] {
  let result = checkpoints;

  if (selectedRouteId) {
    const route = routes.find((r) => r.id === selectedRouteId);
    if (route) result = result.filter((cp) => route.checkpointIds.includes(cp.id));
  }

  if (selectedDay) {
    result = result.filter((cp) => localDayKey(cp.startTime) === selectedDay);
  }

  return result;
}
