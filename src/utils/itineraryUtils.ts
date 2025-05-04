import { Itinerary } from '../model/Itinerary';
import { Leg } from '../model/Leg';

/**
 * Validates an itinerary for coherence
 * @param itinerary The itinerary to validate
 * @returns An object with a valid flag and an optional error message
 */
export const validateItinerary = (itinerary: Itinerary): { valid: boolean; error?: string } => {
  const { start, end, legs } = itinerary;

  // If there are no legs, the itinerary is valid but empty
  if (legs.length === 0) {
    return { valid: true };
  }

  // Check if legs form a continuous path
  for (let i = 0; i < legs.length - 1; i++) {
    const currentLeg = legs[i];
    const nextLeg = legs[i + 1];

    if (currentLeg.to.id !== nextLeg.from.id) {
      return {
        valid: false,
        error: `Discontinuity detected: Leg ${i + 1} ends at ${currentLeg.to.name} but leg ${i + 2} starts at ${nextLeg.from.name}`,
      };
    }
  }

  // Check if start station matches the first leg's from station
  if (start && legs.length > 0 && start.id !== legs[0].from.id) {
    return {
      valid: false,
      error: `Start station (${start.name}) doesn't match the first leg's starting point (${legs[0].from.name})`,
    };
  }

  // Check if end station matches the last leg's to station
  if (end && legs.length > 0 && end.id !== legs[legs.length - 1].to.id) {
    return {
      valid: false,
      error: `End station (${end.name}) doesn't match the last leg's ending point (${legs[legs.length - 1].to.name})`,
    };
  }

  // Check for duplicate legs
  const legIds = legs.map(leg => leg.id);
  if (new Set(legIds).size !== legIds.length) {
    return { valid: false, error: 'Duplicate legs detected in the itinerary' };
  }

  return { valid: true };
};

/**
 * Calculates the total distance of an itinerary
 * @param legs The legs of the itinerary
 * @returns The total distance in kilometers, or undefined if no legs have distance information
 */
export const calculateTotalDistance = (legs: Leg[]): number | undefined => {
  if (legs.length === 0) {
    return undefined;
  }

  const distance = legs.reduce((total, leg) => {
    return total + (leg.distance || 0);
  }, 0);

  return distance > 0 ? distance : undefined;
};

/**
 * Calculates the total estimated time of an itinerary
 * @param legs The legs of the itinerary
 * @returns The total time in minutes, or undefined if no legs have time information
 */
export const calculateTotalTime = (legs: Leg[]): number | undefined => {
  if (legs.length === 0) {
    return undefined;
  }

  const time = legs.reduce((total, leg) => {
    return total + (leg.estimatedTime || 0);
  }, 0);

  return time > 0 ? time : undefined;
};

/**
 * Saves the itinerary to local storage
 * @param itinerary The itinerary to save
 */
export const saveItineraryToLocalStorage = (itinerary: Itinerary): void => {
  try {
    // Convert Leaflet objects to serializable format
    const serializableItinerary = {
      ...itinerary,
      start: itinerary.start ? {
        ...itinerary.start,
        location: [itinerary.start.location.lat, itinerary.start.location.lng]
      } : undefined,
      end: itinerary.end ? {
        ...itinerary.end,
        location: [itinerary.end.location.lat, itinerary.end.location.lng]
      } : undefined,
      steps: itinerary.steps.map(step => ({
        ...step,
        location: [step.location.lat, step.location.lng]
      })),
      legs: itinerary.legs.map(leg => {
        const baseLeg = {
          ...leg,
          from: {
            ...leg.from,
            location: [leg.from.location.lat, leg.from.location.lng]
          },
          to: {
            ...leg.to,
            location: [leg.to.location.lat, leg.to.location.lng]
          }
        };

        if (leg.type === 'HIKING') {
          return {
            ...baseLeg,
            route: {
              ...leg.route,
              bbox: [
                leg.route.bbox.getSouthWest().lat,
                leg.route.bbox.getSouthWest().lng,
                leg.route.bbox.getNorthEast().lat,
                leg.route.bbox.getNorthEast().lng
              ]
            },
            editedCoordinates: leg.editedCoordinates?.map(coord => [coord.lat, coord.lng])
          };
        } else if (leg.type === 'REST') {
          return {
            ...baseLeg,
            location: {
              ...leg.location,
              location: [leg.location.location.lat, leg.location.location.lng]
            }
          };
        }
        return baseLeg;
      })
    };

    localStorage.setItem('rando-planner-itinerary', JSON.stringify(serializableItinerary));
  } catch (error) {
    console.error('Error saving itinerary to local storage:', error);
  }
};

/**
 * Loads the itinerary from local storage
 * @returns The loaded itinerary or undefined if none exists
 */
export const loadItineraryFromLocalStorage = (): any | undefined => {
  try {
    const serializedItinerary = localStorage.getItem('rando-planner-itinerary');
    if (!serializedItinerary) {
      return undefined;
    }

    // Note: This returns the serialized version. The hook will need to convert
    // the coordinates back to Leaflet objects.
    return JSON.parse(serializedItinerary);
  } catch (error) {
    console.error('Error loading itinerary from local storage:', error);
    return undefined;
  }
};
