import React, { createContext, useContext, ReactNode } from 'react';
import { useItinerary } from '../hooks/useItinerary';
import { Itinerary, ItineraryHandlers } from '../model/Itinerary';
import { Station } from '../model/Station';
import { Leg } from '../model/Leg';

// Define the context type
interface ItineraryContextType {
  itinerary: Itinerary;
  handlers: ItineraryHandlers;
  validation: {
    valid: boolean;
    error?: string;
  };
}

// Create the context with a default value
const ItineraryContext = createContext<ItineraryContextType | undefined>(undefined);

// Provider component
interface ItineraryProviderProps {
  children: ReactNode;
}

export const ItineraryProvider: React.FC<ItineraryProviderProps> = ({ children }) => {
  // Use the existing hook to manage state
  const { itinerary, handlers, validation } = useItinerary();

  // Provide the state and handlers to the context
  return (
    <ItineraryContext.Provider value={{ itinerary, handlers, validation }}>
      {children}
    </ItineraryContext.Provider>
  );
};

// Custom hook to use the itinerary context
export const useItineraryContext = (): ItineraryContextType => {
  const context = useContext(ItineraryContext);
  if (context === undefined) {
    throw new Error('useItineraryContext must be used within an ItineraryProvider');
  }
  return context;
};

// Convenience hooks for specific parts of the itinerary
export const useItineraryState = (): Itinerary => {
  return useItineraryContext().itinerary;
};

export const useItineraryHandlers = (): ItineraryHandlers => {
  return useItineraryContext().handlers;
};

export const useItineraryValidation = (): { valid: boolean; error?: string } => {
  return useItineraryContext().validation;
};

// Specialized hooks for common operations
export const useStartPoint = (): [Station | undefined, (station?: Station) => void] => {
  const { itinerary, handlers } = useItineraryContext();
  return [itinerary.start, handlers.setStart];
};

export const useEndPoint = (): [Station | undefined, (station?: Station) => void] => {
  const { itinerary, handlers } = useItineraryContext();
  return [itinerary.end, handlers.setEnd];
};

export const useStepPoints = (): [Station[], {
  addStep: (station: Station) => void;
  removeStep: (station: Station) => void;
}] => {
  const { itinerary, handlers } = useItineraryContext();
  return [itinerary.steps, { addStep: handlers.addStep, removeStep: handlers.removeStep }];
};

export const useLegs = (): [Leg[], {
  addLeg: (leg: Leg) => void;
  removeLeg: (legId: string) => void;
  updateLeg: (leg: Leg) => void;
}] => {
  const { itinerary, handlers } = useItineraryContext();
  return [itinerary.legs, {
    addLeg: handlers.addLeg,
    removeLeg: handlers.removeLeg,
    updateLeg: handlers.updateLeg
  }];
};

export const useTripStats = (): { totalDistance?: number; totalTime?: number } => {
  const { itinerary } = useItineraryContext();
  return {
    totalDistance: itinerary.totalDistance,
    totalTime: itinerary.totalTime
  };
};
