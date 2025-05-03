import { useCallback, useEffect, useState } from 'react';
import { Itinerary, ItineraryHandlers } from '../model/Itinerary';
import { Station } from '../model/Station';
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
    if (legs.length === 0) {
      setTotalDistance(undefined);
      setTotalTime(undefined);
      return;
    }

    const distance = legs.reduce((total, leg) => {
      return total + (leg.distance || 0);
    }, 0);

    const time = legs.reduce((total, leg) => {
      return total + (leg.estimatedTime || 0);
    }, 0);

    setTotalDistance(distance > 0 ? distance : undefined);
    setTotalTime(time > 0 ? time : undefined);
  }, [legs]);

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
  }, [start, end, legs]);

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
