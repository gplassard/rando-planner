import React, { createContext, useContext, ReactNode } from 'react';
import { useRandoRoutes } from '../hooks/useRandoRoutes';
import { AugmentedRandoLight } from '../model/Rando';
import { useItineraryState } from './ItineraryContext';

// Define the context type
interface RandoRoutesContextType {
  allRoutes: AugmentedRandoLight[];
  relevantRoutes: AugmentedRandoLight[];
  loading: boolean;
}

// Create the context with a default value
const RandoRoutesContext = createContext<RandoRoutesContextType | undefined>(undefined);

// Provider component
interface RandoRoutesProviderProps {
  children: ReactNode;
}

export const RandoRoutesProvider: React.FC<RandoRoutesProviderProps> = ({ children }) => {
  // Get the itinerary state from the ItineraryContext
  const itinerary = useItineraryState();

  // Use the existing hook to manage state
  const { allRoutes, relevantRoutes, loading } = useRandoRoutes(itinerary);

  // Provide the state to the context
  return (
    <RandoRoutesContext.Provider value={{ allRoutes, relevantRoutes, loading }}>
      {children}
    </RandoRoutesContext.Provider>
  );
};

// Custom hook to use the rando routes context
export const useRandoRoutesContext = (): RandoRoutesContextType => {
  const context = useContext(RandoRoutesContext);
  if (context === undefined) {
    throw new Error('useRandoRoutesContext must be used within a RandoRoutesProvider');
  }
  return context;
};

// Convenience hooks for specific parts of the rando routes state
export const useAllRoutes = (): AugmentedRandoLight[] => {
  return useRandoRoutesContext().allRoutes;
};

export const useRelevantRoutes = (): AugmentedRandoLight[] => {
  return useRandoRoutesContext().relevantRoutes;
};

export const useRoutesLoading = (): boolean => {
  return useRandoRoutesContext().loading;
};
