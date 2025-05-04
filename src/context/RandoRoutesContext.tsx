import React, { createContext, useContext, ReactNode } from 'react';
import { useRandoRoutes } from '../hooks/useRandoRoutes';
import { AugmentedRandoLight } from '../model/Rando';
import { useItineraryState } from './ItineraryContext';

// Define the context type
interface RandoRoutesContextType {
  allRoutes: AugmentedRandoLight[];
  relevantRoutes: AugmentedRandoLight[];
  loading: boolean;
  error: Error | null;
  loadFullData: () => Promise<void>;
}

// Create the context with a default value
const RandoRoutesContext = createContext<RandoRoutesContextType | undefined>(undefined);

// Provider component
interface RandoRoutesProviderProps {
  children: ReactNode;
  dataSource?: 'small' | 'full' | string;
}

export const RandoRoutesProvider: React.FC<RandoRoutesProviderProps> = ({
  children,
  dataSource = 'small'
}) => {
  // Get the itinerary state from the ItineraryContext
  const itinerary = useItineraryState();

  // Use the enhanced hook to manage state with lazy loading
  const { allRoutes, relevantRoutes, loading, error, loadFullData } = useRandoRoutes(itinerary, dataSource);

  // Provide the state to the context
  return (
    <RandoRoutesContext.Provider value={{ allRoutes, relevantRoutes, loading, error, loadFullData }}>
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

export const useRoutesError = (): Error | null => {
  return useRandoRoutesContext().error;
};

export const useLoadFullData = (): (() => Promise<void>) => {
  return useRandoRoutesContext().loadFullData;
};
