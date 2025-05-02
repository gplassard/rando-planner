import { useMemo } from 'react';
import { AugmentedRandoLight, RandoLight } from '../model/Rando';
import { LatLngBounds } from 'leaflet';
import { Itinerary } from '../model/Itinerary';
import { Station } from '../model/Station';
import smallDatabase from '../../data/small_database.json';

/**
 * Hook to load and manage hiking route data
 * @param itinerary The current itinerary to filter routes by
 * @returns Object containing the list of all routes and filtered routes
 */
export const useRandoRoutes = (itinerary?: Itinerary): {
  allRoutes: AugmentedRandoLight[];
  relevantRoutes: AugmentedRandoLight[];
} => {
  // Convert the raw data to AugmentedRandoLight objects
  const allRoutes = useMemo(() => {
    return (smallDatabase as RandoLight[]).map(route => {
      // Convert the bbox array to a LatLngBounds object
      const [minLng, minLat, maxLng, maxLat] = route.bbox;
      const bounds = new LatLngBounds(
        [minLat, minLng],
        [maxLat, maxLng],
      );

      return {
        ...route,
        bbox: bounds,
      };
    });
  }, []);

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

    // If no stations are selected, return all routes
    if (stations.length === 0) {
      return allRoutes;
    }

    // Filter routes that are connected to at least one of the selected stations
    return allRoutes.filter(route => {
      // Check if any of the selected stations has this route in its lineIds
      return stations.some(station =>
        station.lineIds.includes(route.id),
      );
    });
  }, [allRoutes, itinerary]);

  return { allRoutes, relevantRoutes };
};
