import { Station } from './Station';

export interface Itinerary {
  start?: Station;
  end?: Station;
  steps: Station[];
}

export interface ItineraryHandlers {
  setStart: (station: Station | undefined) => any;
  setEnd: (station: Station | undefined) => any;
  addStep: (station: Station) => any;
  removeStep: (station: Station) => any;
}
