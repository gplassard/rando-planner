import { useState, useEffect } from 'react';
import { Station } from '../model/Station';
import { transformStationData } from '../utils/stationUtils';

export interface UseStationsResult {
  stations: Station[];
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

/**
 * Hook for loading and managing station data
 */
export const useStations = (): UseStationsResult => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const loadStations = async () => {
      try {
        setLoading(true);
        setError(null);

        // Dynamic import to load the data only when needed
        const module = await import('../../data/prepared/stations.json');
        const data = module.default;

        // Transform and validate the data using the utility function
        const transformedStations = transformStationData(data);
        setStations(transformedStations);
      } catch (error) {
        console.error('Error loading station data:', error);
        setError(error instanceof Error ? error : new Error('Unknown error loading station data'));
        // Keep the previous stations if available
      } finally {
        setLoading(false);
      }
    };

    // Handle the promise to avoid ESLint error
    void loadStations();
  }, [retryCount]); // Depend on retryCount to allow manual reloading

  // Function to manually reload the data
  const reload = () => {
    setRetryCount(prev => prev + 1);
  };

  return { stations, loading, error, reload };
};
