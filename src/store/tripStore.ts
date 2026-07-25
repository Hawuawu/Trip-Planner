import { create } from 'zustand';
import type { TripRepository } from '../data/TripRepository';
import type {
  Trip,
  Checkpoint,
  Alternative,
  Booking,
  Route,
  ActivityLogEntry,
  InviteMemberResult,
} from '../types';

interface TripState {
  trip: Trip | null;
  checkpoints: Checkpoint[];
  alternatives: Alternative[];
  bookings: Booking[];
  routes: Route[];
  activityLog: ActivityLogEntry[];
  selectedId: string | null;
  selectedDay: string | null;
  selectedRouteId: string | null;
  undoCheckpoint: Checkpoint | null;
  undoAlternative: Alternative | null;
  repo: TripRepository | null;
  tripId: string | null;

  init(tripId: string, repo: TripRepository): void;
  selectCheckpoint(id: string | null): void;
  selectDay(day: string | null): void;
  selectRoute(routeId: string | null): void;

  inviteMember(email: string): Promise<InviteMemberResult>;
  removeMember(uid: string): Promise<void>;
  leaveTrip(): Promise<void>;

  addCheckpoint(cp: Omit<Checkpoint, 'id' | 'updatedAt'>): Promise<void>;
  updateCheckpoint(
    id: string,
    changes: Partial<Omit<Checkpoint, 'id' | 'updatedAt'>>
  ): Promise<void>;
  deleteCheckpoint(id: string): Promise<void>;
  undoDelete(): Promise<void>;
  clearUndo(): void;

  reorderCheckpoints(fromIndex: number, toIndex: number): Promise<void>;

  addAlternative(alt: Omit<Alternative, 'id' | 'createdAt'>): Promise<void>;
  updateAlternative(
    id: string,
    changes: Partial<Omit<Alternative, 'id' | 'createdAt'>>
  ): Promise<void>;
  deleteAlternative(id: string): Promise<void>;
  undoDeleteAlternative(): Promise<void>;
  clearUndoAlternative(): void;
  promoteAlternative(alternativeId: string, startTime: string): Promise<void>;

  importCheckpoints(items: {
    checkpoints: Omit<Checkpoint, 'id' | 'updatedAt'>[];
    alternatives: Omit<Alternative, 'id' | 'createdAt'>[];
  }): Promise<void>;

  addBooking(booking: Omit<Booking, 'id'>): Promise<Booking>;
  updateBooking(id: string, changes: Partial<Omit<Booking, 'id'>>): Promise<void>;
  deleteBooking(id: string): Promise<void>;

  addRoute(route: Omit<Route, 'id' | 'updatedAt'>): Promise<void>;
  updateRoute(id: string, changes: Partial<Omit<Route, 'id' | 'updatedAt'>>): Promise<void>;
  deleteRoute(id: string): Promise<void>;
}

export const useTripStore = create<TripState>((set, get) => ({
  trip: null,
  checkpoints: [],
  alternatives: [],
  bookings: [],
  routes: [],
  activityLog: [],
  selectedId: null,
  selectedDay: null,
  selectedRouteId: null,
  undoCheckpoint: null,
  undoAlternative: null,
  repo: null,
  tripId: null,

  init(tripId, repo) {
    set({ repo, tripId });
    repo.subscribeToTrip(tripId, (trip) => set({ trip }));
    repo.subscribeToCheckpoints(tripId, (checkpoints) => set({ checkpoints }));
    repo.subscribeToAlternatives(tripId, (alternatives) => set({ alternatives }));
    repo.subscribeToBookings(tripId, (bookings) => set({ bookings }));
    repo.subscribeToRoutes(tripId, (routes) => set({ routes }));
    repo.subscribeToActivityLog(tripId, (activityLog) => set({ activityLog }));
    repo.recordAccess(tripId).catch(() => {});
  },

  async inviteMember(email) {
    const { repo, tripId } = get();
    if (!repo || !tripId) throw new Error('No repo or tripId');
    return repo.inviteMember(tripId, email);
  },

  async removeMember(uid) {
    const { repo, tripId, trip } = get();
    if (!repo || !tripId || !trip) return;
    const prev = trip;
    set({ trip: { ...trip, memberIds: trip.memberIds.filter((id) => id !== uid) } });
    try {
      await repo.removeMember(tripId, uid);
    } catch (err) {
      set({ trip: prev });
      throw err;
    }
  },

  async leaveTrip() {
    const { repo, tripId } = get();
    if (!repo || !tripId) return;
    await repo.leaveTrip(tripId);
  },

  selectCheckpoint(id) {
    const { selectedId } = get();
    set({ selectedId: selectedId === id ? null : id });
  },

  selectDay(day) {
    set({ selectedDay: day });
  },

  selectRoute(routeId) {
    set({ selectedRouteId: routeId });
  },

  async addCheckpoint(cp) {
    const { repo, tripId, checkpoints } = get();
    if (!repo || !tripId) return;
    const optimistic: Checkpoint = {
      ...cp,
      id: `__optimistic-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    set({
      checkpoints: [...checkpoints, optimistic].sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      ),
    });
    const saved = await repo.addCheckpoint(tripId, cp);
    set((s) => ({
      checkpoints: s.checkpoints
        .map((c) => (c.id === optimistic.id ? saved : c))
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }));
  },

  async updateCheckpoint(id, changes) {
    const { repo, tripId, checkpoints } = get();
    if (!repo || !tripId) return;
    const prev = checkpoints.find((c) => c.id === id);
    set({
      checkpoints: checkpoints
        .map((c) => (c.id === id ? { ...c, ...changes, updatedAt: new Date().toISOString() } : c))
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    });
    try {
      await repo.updateCheckpoint(tripId, id, changes);
    } catch (err) {
      if (prev) set((s) => ({ checkpoints: s.checkpoints.map((c) => (c.id === id ? prev : c)) }));
      throw err;
    }
  },

  async deleteCheckpoint(id) {
    const { repo, tripId, checkpoints } = get();
    if (!repo || !tripId) return;
    const target = checkpoints.find((c) => c.id === id);
    set({ checkpoints: checkpoints.filter((c) => c.id !== id), undoCheckpoint: target ?? null });
    try {
      await repo.deleteCheckpoint(tripId, id);
    } catch (err) {
      if (target)
        set((s) => ({
          checkpoints: [...s.checkpoints, target].sort((a, b) =>
            a.startTime.localeCompare(b.startTime)
          ),
          undoCheckpoint: s.undoCheckpoint === target ? null : s.undoCheckpoint,
        }));
      throw err;
    }
  },

  async undoDelete() {
    const { repo, tripId, undoCheckpoint } = get();
    if (!repo || !tripId || !undoCheckpoint) return;
    set({ undoCheckpoint: null });
    const { id: _id, updatedAt: _ua, ...cp } = undoCheckpoint;
    await get().addCheckpoint(cp);
  },

  clearUndo() {
    set({ undoCheckpoint: null });
  },

  async reorderCheckpoints(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    const { repo, tripId, checkpoints } = get();
    if (!repo || !tripId) return;

    const updated = [...checkpoints];
    const fromStartTime = updated[fromIndex].startTime;
    const toStartTime = updated[toIndex].startTime;

    // Swap startTimes so sort order reflects the new visual order
    updated[fromIndex] = {
      ...updated[fromIndex],
      startTime: toStartTime,
      updatedAt: new Date().toISOString(),
    };
    updated[toIndex] = {
      ...updated[toIndex],
      startTime: fromStartTime,
      updatedAt: new Date().toISOString(),
    };

    // Apply optimistically, re-sort so state stays consistent
    set({
      checkpoints: [...updated].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    });

    // Persist both changes
    await Promise.all([
      repo.updateCheckpoint(tripId, updated[fromIndex].id, {
        startTime: toStartTime,
      }),
      repo.updateCheckpoint(tripId, updated[toIndex].id, {
        startTime: fromStartTime,
      }),
    ]);
  },

  async addAlternative(alt) {
    const { repo, tripId, alternatives } = get();
    if (!repo || !tripId) return;
    const optimistic: Alternative = {
      ...alt,
      id: `__optimistic-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    set({ alternatives: [...alternatives, optimistic] });
    const saved = await repo.addAlternative(tripId, alt);
    set((s) => ({ alternatives: s.alternatives.map((a) => (a.id === optimistic.id ? saved : a)) }));
  },

  async updateAlternative(id, changes) {
    const { repo, tripId, alternatives } = get();
    if (!repo || !tripId) return;
    const prev = alternatives.find((a) => a.id === id);
    set({ alternatives: alternatives.map((a) => (a.id === id ? { ...a, ...changes } : a)) });
    try {
      await repo.updateAlternative(tripId, id, changes);
    } catch (err) {
      if (prev) set((s) => ({ alternatives: s.alternatives.map((a) => (a.id === id ? prev : a)) }));
      throw err;
    }
  },

  async deleteAlternative(id) {
    const { repo, tripId, alternatives } = get();
    if (!repo || !tripId) return;
    const target = alternatives.find((a) => a.id === id);
    set({
      alternatives: alternatives.filter((a) => a.id !== id),
      undoAlternative: target ?? null,
    });
    try {
      await repo.deleteAlternative(tripId, id);
    } catch (err) {
      if (target)
        set((s) => ({
          alternatives: [...s.alternatives, target],
          undoAlternative: s.undoAlternative === target ? null : s.undoAlternative,
        }));
      throw err;
    }
  },

  async undoDeleteAlternative() {
    const { repo, tripId, undoAlternative } = get();
    if (!repo || !tripId || !undoAlternative) return;
    set({ undoAlternative: null });
    const { id: _id, createdAt: _createdAt, ...alt } = undoAlternative;
    await get().addAlternative(alt);
  },

  clearUndoAlternative() {
    set({ undoAlternative: null });
  },

  async promoteAlternative(alternativeId, startTime) {
    const { repo, tripId } = get();
    if (!repo || !tripId) return;
    set((s) => ({ alternatives: s.alternatives.filter((a) => a.id !== alternativeId) }));
    await repo.promoteAlternative(tripId, alternativeId, startTime);
  },

  async importCheckpoints({ checkpoints, alternatives }) {
    const { repo, tripId } = get();
    if (!repo || !tripId) return;
    if (checkpoints.length > 0) await repo.addCheckpoints(tripId, checkpoints);
    if (alternatives.length > 0) await repo.addAlternatives(tripId, alternatives);
    // No manual set() — the live subscribeToCheckpoints/subscribeToAlternatives
    // listeners from init() push the new items in, same as every other write.
  },

  async addBooking(booking) {
    const { repo, tripId, bookings } = get();
    if (!repo || !tripId) throw new Error('No repo or tripId');
    const optimistic: Booking = { ...booking, id: `__optimistic-booking-${Date.now()}` };
    set({ bookings: [...bookings, optimistic] });
    const saved = await repo.addBooking(tripId, booking);
    set((s) => ({ bookings: s.bookings.map((b) => (b.id === optimistic.id ? saved : b)) }));
    return saved;
  },

  async updateBooking(id, changes) {
    const { repo, tripId, bookings } = get();
    if (!repo || !tripId) return;
    const prev = bookings.find((b) => b.id === id);
    set({
      bookings: bookings.map((b) => (b.id === id ? { ...b, ...changes } : b)),
    });
    try {
      await repo.updateBooking(tripId, id, changes);
    } catch (err) {
      if (prev) set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? prev : b)) }));
      throw err;
    }
  },

  async deleteBooking(id) {
    const { repo, tripId, bookings } = get();
    if (!repo || !tripId) return;
    set({ bookings: bookings.filter((b) => b.id !== id) });
    await repo.deleteBooking(tripId, id);
  },

  async addRoute(route) {
    const { repo, tripId, routes } = get();
    if (!repo || !tripId) return;
    const optimistic: Route = {
      ...route,
      id: `__optimistic-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    set({ routes: [...routes, optimistic] });
    const saved = await repo.addRoute(tripId, route);
    set((s) => ({ routes: s.routes.map((r) => (r.id === optimistic.id ? saved : r)) }));
  },

  async updateRoute(id, changes) {
    const { repo, tripId, routes } = get();
    if (!repo || !tripId) return;
    const prev = routes.find((r) => r.id === id);
    set({
      routes: routes.map((r) =>
        r.id === id ? { ...r, ...changes, updatedAt: new Date().toISOString() } : r
      ),
    });
    try {
      await repo.updateRoute(tripId, id, changes);
    } catch (err) {
      if (prev) set((s) => ({ routes: s.routes.map((r) => (r.id === id ? prev : r)) }));
      throw err;
    }
  },

  async deleteRoute(id) {
    const { repo, tripId, routes } = get();
    if (!repo || !tripId) return;
    const prev = routes;
    set({ routes: routes.filter((r) => r.id !== id) });
    try {
      await repo.deleteRoute(tripId, id);
    } catch (err) {
      set({ routes: prev });
      throw err;
    }
  },
}));
