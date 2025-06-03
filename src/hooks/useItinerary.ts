import { useState } from 'react';
import { Itinerary, ItineraryHandlers } from '../model/Itinerary';
import { Station } from '../model/Station';

export type UseItinerary = () => {
  itinerary: Itinerary;
  handlers: ItineraryHandlers;
};

export const useItinerary: UseItinerary = () => {
  const [start, setStart] = useState<Station>();
  const [end, setEnd] = useState<Station>();
  const [steps, setSteps] = useState<Station[]>([]);

  return {
    itinerary: {
      start,
      end,
      steps,
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
    },
  };
};
