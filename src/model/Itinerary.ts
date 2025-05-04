import { Station } from './Station';
import { Leg } from './Leg';

/**
 * Represents a complete hiking itinerary
 */
export interface Itinerary {
  start?: Station;
  end?: Station;
  steps: Station[];
  legs: Leg[];
  totalDistance?: number; // in kilometers
  totalTime?: number; // in minutes
}

/**
 * Handlers for modifying an itinerary
 */
export interface ItineraryHandlers {
  setStart: (station: Station | undefined) => any;
  setEnd: (station: Station | undefined) => any;
  addStep: (station: Station) => any;
  removeStep: (station: Station) => any;
  addLeg: (leg: Leg) => any;
  removeLeg: (legId: string) => any;
  updateLeg: (leg: Leg) => any;
}
