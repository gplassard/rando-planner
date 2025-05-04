import React, { createContext, useContext, ReactNode } from 'react';
import { useRouteGeometry } from '../hooks/useRouteGeometry';
import { LatLng } from 'leaflet';
import { useAllRoutes } from './RandoRoutesContext';

// Interface for route geometry with Leaflet LatLng objects
interface AugmentedRouteGeometry {
  id: string;
  type: 'LineString';
  coordinates: LatLng[];
}

// Define the context type
interface RouteGeometryContextType {
  geometries: Record<string, AugmentedRouteGeometry>;
  loading: boolean;
}

// Create the context with a default value
const RouteGeometryContext = createContext<RouteGeometryContextType | undefined>(undefined);

// Provider component
interface RouteGeometryProviderProps {
  children: ReactNode;
}

export const RouteGeometryProvider: React.FC<RouteGeometryProviderProps> = ({ children }) => {
  // Get the routes from the RandoRoutesContext
  const allRoutes = useAllRoutes();

  // Use the existing hook to manage state
  const { geometries, loading } = useRouteGeometry(allRoutes);

  // Provide the state to the context
  return (
    <RouteGeometryContext.Provider value={{ geometries, loading }}>
      {children}
    </RouteGeometryContext.Provider>
  );
};

// Custom hook to use the route geometry context
export const useRouteGeometryContext = (): RouteGeometryContextType => {
  const context = useContext(RouteGeometryContext);
  if (context === undefined) {
    throw new Error('useRouteGeometryContext must be used within a RouteGeometryProvider');
  }
  return context;
};

// Convenience hooks for specific parts of the route geometry state
export const useGeometries = (): Record<string, AugmentedRouteGeometry> => {
  return useRouteGeometryContext().geometries;
};

export const useGeometriesLoading = (): boolean => {
  return useRouteGeometryContext().loading;
};

// Hook to get geometry for a specific route
export const useRouteGeometryById = (routeId: string): AugmentedRouteGeometry | undefined => {
  const { geometries } = useRouteGeometryContext();
  return geometries[routeId];
};
