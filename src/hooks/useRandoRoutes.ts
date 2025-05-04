import { useMemo, useState, useEffect, useCallback } from 'react';
import { AugmentedRandoLight, RandoLight } from '../model/Rando';
import { Itinerary } from '../model/Itinerary';
import { Station } from '../model/Station';
import {
  loadRouteData,
  convertToAugmentedRoutes,
  clearRouteCache,
  filterRoutesByStations,
} from '../utils/routeUtils';

/**
 * Hook to load and manage hiking route data with enhanced lazy loading
 * @param itinerary The current itinerary to filter routes by
 * @param dataSource The data source to load from ('small', 'full', or a chunk identifier)
 * @returns Object containing the list of all routes, filtered routes, loading state, and error
 */
export const useRandoRoutes = (
  itinerary?: Itinerary,
  dataSource: 'small' | 'full' | string = 'small'
): {
  allRoutes: AugmentedRandoLight[];
  relevantRoutes: AugmentedRandoLight[];
  loading: boolean;
  error: Error | null;
  loadFullData: () => Promise<void>;
} => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [routeData, setRouteData] = useState<RandoLight[]>([]);
  const [dataLoaded, setDataLoaded] = useState<'small' | 'full' | string>('none');

  // Load the route data
  const loadData = useCallback(async (source: 'small' | 'full' | string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await loadRouteData(source);
      setRouteData(data);
      setDataLoaded(source);
    } catch (loadError) {
      console.error(`Error loading route data from ${source}:`, loadError);
      setError(loadError instanceof Error ? loadError : new Error(`Failed to load route data from ${source}`));

      // If we failed to load the requested source but have data from another source, keep it
      if (routeData.length === 0) {
        try {
          // Fall back to small database if available
          if (source !== 'small') {
            const fallbackData = await loadRouteData('small');
            setRouteData(fallbackData);
            setDataLoaded('small');
            setError(new Error(`Failed to load ${source} data, using small dataset instead`));
          }
        } catch (fallbackError) {
          // If even the fallback fails, we're out of options
          console.error('Error loading fallback route data:', fallbackError);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [routeData.length]);

  // Function to load the full dataset on demand
  const loadFullData = useCallback(async () => {
    if (dataLoaded === 'full') return;
    await loadData('full');
  }, [dataLoaded, loadData]);

  // Initial data load
  useEffect(() => {
    void loadData(dataSource);

    // Cleanup function to clear cache when component unmounts
    return () => {
      // Only clear the cache for chunks, not for small or full datasets
      if (dataSource !== 'small' && dataSource !== 'full') {
        clearRouteCache(dataSource);
      }
    };
  }, [dataSource, loadData]);

  // Convert the raw data to AugmentedRandoLight objects
  const allRoutes = useMemo(() => {
    return convertToAugmentedRoutes(routeData);
  }, [routeData]);

  // Filter routes based on the selected stations in the itinerary
  const relevantRoutes = useMemo(() => {
    if (!itinerary) {
      return allRoutes;
    }

    // Collect all stations from the itinerary
    const stations: Station[] = [];
    if (itinerary.start) stations.push(itinerary.start);
    if (itinerary.end) stations.push(itinerary.end);
    stations.push(...itinerary.steps);

    // Use the utility function to filter routes
    return filterRoutesByStations(allRoutes, stations);
  }, [allRoutes, itinerary]);

  return {
    allRoutes,
    relevantRoutes,
    loading,
    error,
    loadFullData,
  };
};
