import { LatLngBounds } from 'leaflet';
import { AugmentedRandoLight, RandoLight } from '../model/Rando';

// Cache for route data
const routeCache: {
  small?: RandoLight[];
  full?: RandoLight[];
  chunks: Record<string, RandoLight[]>;
} = {
  chunks: {},
};

/**
 * Loads route data from the specified source
 * @param source The data source to load from ('small', 'full', or a chunk identifier)
 * @returns A promise that resolves to the loaded data
 */
export const loadRouteData = async (source: 'small' | 'full' | string = 'small'): Promise<RandoLight[]> => {
  try {
    // Check if the data is already in the cache
    if (source === 'small' && routeCache.small) {
      return routeCache.small;
    }
    if (source === 'full' && routeCache.full) {
      return routeCache.full;
    }
    if (source !== 'small' && source !== 'full' && routeCache.chunks[source]) {
      return routeCache.chunks[source];
    }

    // Load the data based on the source
    let data: RandoLight[];
    if (source === 'small') {
      const module = await import('../../data/small_database.json');
      data = module.default as RandoLight[];
      routeCache.small = data;
    } else if (source === 'full') {
      const module = await import('../../data/database.json');
      data = module.default as RandoLight[];
      routeCache.full = data;
    } else {
      // Load a specific chunk (not implemented yet, would require server-side support)
      // For now, fall back to small database
      const module = await import('../../data/small_database.json');
      data = module.default as RandoLight[];
      routeCache.chunks[source] = data;
    }

    return data;
  } catch (error) {
    console.error(`Error loading route data from ${source}:`, error);
    throw new Error(`Failed to load route data from ${source}`);
  }
};

/**
 * Converts raw route data to AugmentedRandoLight objects
 * @param routes The raw route data
 * @returns The converted routes
 */
export const convertToAugmentedRoutes = (routes: RandoLight[]): AugmentedRandoLight[] => {
  return routes.map(route => {
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
};

/**
 * Filters routes based on the provided stations
 * @param routes The routes to filter
 * @param stations The stations to filter by
 * @returns The filtered routes
 */
export const filterRoutesByStations = (
  routes: AugmentedRandoLight[],
  stations: { id: string; lineIds: string[] }[],
): AugmentedRandoLight[] => {
  if (stations.length === 0) {
    return routes;
  }

  return routes.filter(route => {
    // Check if any of the selected stations has this route in its lineIds
    return stations.some(station => station.lineIds.includes(route.id));
  });
};

/**
 * Clears the route cache
 * @param source The specific cache to clear (if not provided, clears all caches)
 */
export const clearRouteCache = (source?: 'small' | 'full' | string): void => {
  if (!source) {
    routeCache.small = undefined;
    routeCache.full = undefined;
    routeCache.chunks = {};
  } else if (source === 'small') {
    routeCache.small = undefined;
  } else if (source === 'full') {
    routeCache.full = undefined;
  } else {
    delete routeCache.chunks[source];
  }
};

/**
 * Preloads route data into the cache
 * @param source The data source to preload
 * @returns A promise that resolves when the data is loaded
 */
export const preloadRouteData = async (source: 'small' | 'full' | string = 'small'): Promise<void> => {
  try {
    await loadRouteData(source);
    console.log(`Preloaded route data from ${source}`);
  } catch (error) {
    console.error(`Error preloading route data from ${source}:`, error);
  }
};
