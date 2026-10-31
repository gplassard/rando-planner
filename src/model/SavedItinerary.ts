/**
 * An itinerary persisted in the browser's localStorage (see
 * src/lib/itineraryStorage.ts). Only station ids are stored; stations are
 * resolved against data/prepared/stations.json when loading.
 */
export interface SavedItinerary {
  id: string;
  name: string;
  /** ISO-8601 datetime of when the itinerary was saved. */
  savedAt: string;
  startId?: string;
  endId?: string;
  stepIds: string[];
}
