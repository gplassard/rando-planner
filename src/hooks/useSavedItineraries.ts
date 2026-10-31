import { useState } from 'react';
import { readSavedItineraries, serializeItinerary, StorageLike, writeSavedItineraries } from '../lib/itineraryStorage';
import { Itinerary } from '../model/Itinerary';
import { SavedItinerary } from '../model/SavedItinerary';
import { Station } from '../model/Station';

export type UseSavedItineraries = (stations: Station[]) => {
  saved: SavedItinerary[];
  saveCurrent: (itinerary: Itinerary, name: string) => SavedItinerary;
  remove: (id: string) => void;
  /** Resolves saved station ids against the stations dataset; unknown ids are skipped. */
  resolve: (saved: SavedItinerary) => Itinerary | null;
};

const storage = (): StorageLike => window.localStorage;

/**
 * CRUD for the "Mes itinéraires" drawer, persisted in localStorage
 * (the only persistence mechanism of the app, see the project brief).
 */
export const useSavedItineraries: UseSavedItineraries = (stations) => {
  const [saved, setSaved] = useState<SavedItinerary[]>(() => readSavedItineraries(storage()));

  const persist = (list: SavedItinerary[]) => {
    setSaved(list);
    writeSavedItineraries(storage(), list);
  };

  return {
    saved,
    saveCurrent: (itinerary, name) => {
      const entry = serializeItinerary(itinerary, name, crypto.randomUUID(), new Date().toISOString());
      persist([...saved, entry]);
      return entry;
    },
    remove: (id) => persist(saved.filter(entry => entry.id !== id)),
    resolve: (entry) => {
      const byId = new Map(stations.map(s => [s.id, s]));
      const start = entry.startId ? byId.get(entry.startId) : undefined;
      const end = entry.endId ? byId.get(entry.endId) : undefined;
      const steps = entry.stepIds.map(id => byId.get(id)).filter((s): s is Station => s !== undefined);
      if (!start && !end && steps.length === 0) {
        return null;
      }
      return { start, end, steps };
    },
  };
};
