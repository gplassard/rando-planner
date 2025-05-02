import { useCallback, useEffect, useState } from 'react';
import { Itinerary, ItineraryHandlers } from '../model/Itinerary';
import { Station } from '../model/Station';
import { Leg } from '../model/Leg';

export type UseItinerary = () => {
  itinerary: Itinerary;
  handlers: ItineraryHandlers;
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
  };
};
