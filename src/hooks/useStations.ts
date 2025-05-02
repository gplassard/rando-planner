import { LatLng } from 'leaflet';
import { useState, useEffect } from 'react';
import { Station } from '../model/Station';

export const useStations: () => {
  stations: Station[];
  loading: boolean;
} = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStations = async () => {
      try {
        setLoading(true);
        // Dynamic import to load the data only when needed
        const module = await import('../../data/prepared/stations.json');
        const data = module.default;

        // Transform the data
        const transformedStations = data.map((d: any) => ({
          ...d,
          location: new LatLng(d.location[0], d.location[1]),
        }));

        setStations(transformedStations);
      } catch (error) {
        console.error('Error loading station data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Handle the promise to avoid ESLint error
    void loadStations();
  }, []);

  return { stations, loading };
};
