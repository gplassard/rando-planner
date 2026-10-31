import { SavedItinerary } from '../model/SavedItinerary';

/**
 * localStorage persistence for "Mes itinéraires". Pure functions around a
 * minimal StorageLike interface so they stay unit-testable in Node.
 */

export const STORAGE_KEY = 'rando-planner:itineraries';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Structural view of an itinerary: only station ids are persisted. */
export interface ItineraryLike {
  start?: { id: string } | undefined;
  end?: { id: string } | undefined;
  steps: Array<{ id: string }>;
}

export function serializeItinerary(
  itinerary: ItineraryLike,
  name: string,
  id: string,
  savedAt: string,
): SavedItinerary {
  return {
    id,
    name,
    savedAt,
    startId: itinerary.start?.id,
    endId: itinerary.end?.id,
    stepIds: itinerary.steps.map(step => step.id),
  };
}

function isSavedItinerary(value: unknown): value is SavedItinerary {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string'
    && typeof candidate.name === 'string'
    && typeof candidate.savedAt === 'string'
    && Array.isArray(candidate.stepIds)
    && candidate.stepIds.every(id => typeof id === 'string')
    && (candidate.startId === undefined || typeof candidate.startId === 'string')
    && (candidate.endId === undefined || typeof candidate.endId === 'string')
  );
}

/** Tolerant parse: invalid JSON or invalid entries are dropped, never thrown. */
export function parseSavedItineraries(json: string | null): SavedItinerary[] {
  if (!json) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isSavedItinerary);
  } catch {
    return [];
  }
}

export function readSavedItineraries(storage: StorageLike): SavedItinerary[] {
  return parseSavedItineraries(storage.getItem(STORAGE_KEY));
}

export function writeSavedItineraries(storage: StorageLike, itineraries: SavedItinerary[]): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(itineraries));
}
