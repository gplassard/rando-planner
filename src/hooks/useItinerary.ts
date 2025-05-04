import { useCallback, useEffect, useState } from 'react';
import { LatLng, LatLngBounds } from 'leaflet';
import { Itinerary, ItineraryHandlers } from '../model/Itinerary';
import { Station } from '../model/Station';
import { Leg, LegType, HikingLeg, RestLeg } from '../model/Leg';
import {
  validateItinerary,
  calculateTotalDistance,
  calculateTotalTime,
  saveItineraryToLocalStorage,
  loadItineraryFromLocalStorage,
} from '../utils/itineraryUtils';

export type UseItinerary = () => {
  itinerary: Itinerary;
  handlers: ItineraryHandlers;
  validation: {
    valid: boolean;
    error?: string;
  };
}

/**
 * Hook for managing the itinerary state
 */
export const useItinerary: UseItinerary = () => {
  const [start, setStart] = useState<Station>();
  const [end, setEnd] = useState<Station>();
  const [steps, setSteps] = useState<Station[]>([]);
  const [legs, setLegs] = useState<Leg[]>([]);
  const [totalDistance, setTotalDistance] = useState<number | undefined>(undefined);
  const [totalTime, setTotalTime] = useState<number | undefined>(undefined);
  const [validation, setValidation] = useState<{ valid: boolean; error?: string }>({ valid: true });

  // Calculate total distance and time whenever legs change
  useEffect(() => {
    setTotalDistance(calculateTotalDistance(legs));
    setTotalTime(calculateTotalTime(legs));
  }, [legs]);

  // Load itinerary from local storage on initialization
  useEffect(() => {
    try {
      const savedItinerary = loadItineraryFromLocalStorage();
      if (!savedItinerary) return;

      // Convert serialized coordinates back to Leaflet objects
      if (savedItinerary.start) {
        const location = savedItinerary.start.location;
        savedItinerary.start.location = new LatLng(location[0], location[1]);
        setStart(savedItinerary.start);
      }

      if (savedItinerary.end) {
        const location = savedItinerary.end.location;
        savedItinerary.end.location = new LatLng(location[0], location[1]);
        setEnd(savedItinerary.end);
      }

      if (savedItinerary.steps && Array.isArray(savedItinerary.steps)) {
        const convertedSteps = savedItinerary.steps.map(step => ({
          ...step,
          location: new LatLng(step.location[0], step.location[1]),
        }));
        setSteps(convertedSteps);
      }

      if (savedItinerary.legs && Array.isArray(savedItinerary.legs)) {
        const convertedLegs = savedItinerary.legs.map(leg => {
          const baseLeg = {
            ...leg,
            from: {
              ...leg.from,
              location: new LatLng(leg.from.location[0], leg.from.location[1]),
            },
            to: {
              ...leg.to,
              location: new LatLng(leg.to.location[0], leg.to.location[1]),
            },
          };

          if (leg.type === LegType.HIKING) {
            const hikingLeg = baseLeg as HikingLeg;
            const bbox = leg.route.bbox;
            hikingLeg.route = {
              ...leg.route,
              bbox: new LatLngBounds(
                new LatLng(bbox[0], bbox[1]),
                new LatLng(bbox[2], bbox[3]),
              ),
            };

            if (leg.editedCoordinates) {
              hikingLeg.editedCoordinates = leg.editedCoordinates.map(
                coord => new LatLng(coord[0], coord[1]),
              );
            }

            return hikingLeg;
          } else if (leg.type === LegType.REST) {
            const restLeg = baseLeg as RestLeg;
            restLeg.location = {
              ...leg.location,
              location: new LatLng(leg.location.location[0], leg.location.location[1]),
            };
            return restLeg;
          }

          return baseLeg;
        });

        setLegs(convertedLegs);
      }
    } catch (error) {
      console.error('Error loading itinerary from local storage:', error);
      // Continue with empty itinerary if loading fails
    }
  }, []);

  // Validate the itinerary whenever relevant parts change
  useEffect(() => {
    try {
      const currentItinerary = {
        start,
        end,
        steps,
        legs,
        totalDistance,
        totalTime,
      };

      const result = validateItinerary(currentItinerary);
      setValidation(result);
    } catch (error) {
      console.error('Error validating itinerary:', error);
      setValidation({
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error occurred',
      });
    }
  }, [start, end, legs, steps, totalDistance, totalTime]);

  // Save itinerary to local storage whenever it changes
  useEffect(() => {
    // Only save if we have at least a start or end point
    if (start || end || legs.length > 0) {
      const currentItinerary = {
        start,
        end,
        steps,
        legs,
        totalDistance,
        totalTime,
      };

      try {
        saveItineraryToLocalStorage(currentItinerary);
      } catch (error) {
        console.error('Error saving itinerary to local storage:', error);
        // We don't need to update the UI for this error, just log it
      }
    }
  }, [start, end, steps, legs, totalDistance, totalTime]);

  // Add a leg to the itinerary
  const addLeg = useCallback((leg: Leg) => {
    setLegs(previous => {
      const alreadyPresent = previous.find(p => p.id === leg.id);
      return alreadyPresent ? previous : [...previous, leg];
    });
  }, []);

  // Remove a leg from the itinerary
  const removeLeg = useCallback((legId: string) => {
    setLegs(previous => previous.filter(p => p.id !== legId));
  }, []);

  // Update an existing leg
  const updateLeg = useCallback((updatedLeg: Leg) => {
    setLegs(previous => {
      return previous.map(leg => leg.id === updatedLeg.id ? updatedLeg : leg);
    });
  }, []);

  return {
    itinerary: {
      start,
      end,
      steps,
      legs,
      totalDistance,
      totalTime,
    },
    handlers: {
      setStart,
      setEnd,
      addStep: (station: Station) => setSteps(previous => {
        const alreadyPresent = previous.find(p => p.id === station.id);
        return alreadyPresent ? previous : [...previous, station];
      }),
      removeStep: (station: Station) => setSteps(previous => {
        return previous.filter(p => p.id !== station.id);
      }),
      addLeg,
      removeLeg,
      updateLeg,
    },
    validation,
  };
};
