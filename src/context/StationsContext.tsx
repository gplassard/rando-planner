import React, { createContext, useContext, ReactNode } from 'react';
import { useStations } from '../hooks/useStations';
import { Station } from '../model/Station';

// Define the context type
interface StationsContextType {
  stations: Station[];
  loading: boolean;
}

// Create the context with a default value
const StationsContext = createContext<StationsContextType | undefined>(undefined);

// Provider component
interface StationsProviderProps {
  children: ReactNode;
}

export const StationsProvider: React.FC<StationsProviderProps> = ({ children }) => {
  // Use the existing hook to manage state
  const { stations, loading } = useStations();

  // Provide the state to the context
  return (
    <StationsContext.Provider value={{ stations, loading }}>
      {children}
    </StationsContext.Provider>
  );
};

// Custom hook to use the stations context
export const useStationsContext = (): StationsContextType => {
  const context = useContext(StationsContext);
  if (context === undefined) {
    throw new Error('useStationsContext must be used within a StationsProvider');
  }
  return context;
};

// Convenience hooks for specific parts of the stations state
export const useStationsList = (): Station[] => {
  return useStationsContext().stations;
};

export const useStationsLoading = (): boolean => {
  return useStationsContext().loading;
};

// Hook to get a station by ID
export const useStationById = (stationId: string): Station | undefined => {
  const { stations } = useStationsContext();
  return stations.find(station => station.id === stationId);
};

// Hook to get stations by name (partial match)
export const useStationsByName = (name: string): Station[] => {
  const { stations } = useStationsContext();
  const lowerName = name.toLowerCase();
  return stations.filter(station =>
    station.name.toLowerCase().includes(lowerName) ||
    station.label.toLowerCase().includes(lowerName),
  );
};
