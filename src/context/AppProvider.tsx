import React, { ReactNode } from 'react';
import { ItineraryProvider } from './ItineraryContext';
import { StationsProvider } from './StationsContext';
import { RandoRoutesProvider } from './RandoRoutesContext';
import { RouteGeometryProvider } from './RouteGeometryContext';

interface AppProviderProps {
  children: ReactNode;
}

/**
 * Provider component that combines all the context providers
 * The order of providers is important due to dependencies between them:
 * 1. StationsProvider (no dependencies)
 * 2. ItineraryProvider (depends on stations)
 * 3. RandoRoutesProvider (depends on itinerary)
 * 4. RouteGeometryProvider (depends on routes)
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <StationsProvider>
      <ItineraryProvider>
        <RandoRoutesProvider>
          <RouteGeometryProvider>
            {children}
          </RouteGeometryProvider>
        </RandoRoutesProvider>
      </ItineraryProvider>
    </StationsProvider>
  );
};
