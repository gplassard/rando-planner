import { useState, useEffect } from 'react';
import { LatLng } from 'leaflet';
import { AugmentedRandoLight } from '../model/Rando';

/**
 * Interface for route geometry data
 */
interface RouteGeometry {
  id: string;
  type: 'LineString';
  coordinates: [number, number][];
}

/**
 * Interface for route geometry with Leaflet LatLng objects
 */
interface AugmentedRouteGeometry {
  id: string;
  type: 'LineString';
  coordinates: LatLng[];
}

/**
 * Hook to load and provide geometry data for routes
 * @param routes The routes to load geometry for
 * @returns Object containing the geometry data and loading state
 */
export const useRouteGeometry = (routes: AugmentedRandoLight[]): {
  geometries: Record<string, AugmentedRouteGeometry>;
  loading: boolean;
} => {
  const [loading, setLoading] = useState(true);
  const [geometries, setGeometries] = useState<Record<string, AugmentedRouteGeometry>>({});

  // Load geometry data for the specified routes
  useEffect(() => {
    if (routes.length === 0) {
      setLoading(false);
      return;
    }

    const loadGeometries = async () => {
      try {
        setLoading(true);

        // Dynamic import to load the data only when needed
        const module = await import('../../data/rando_lines.json');
        const allGeometries = module.default as RouteGeometry[];

        // Filter geometries for the specified routes
        const routeIds = new Set(routes.map(route => route.id));
        const filteredGeometries = allGeometries.filter(geo => routeIds.has(geo.id));

        // Transform coordinates to LatLng objects
        const transformedGeometries: Record<string, AugmentedRouteGeometry> = {};

        filteredGeometries.forEach(geo => {
          transformedGeometries[geo.id] = {
            ...geo,
            coordinates: geo.coordinates.map(([lng, lat]) => new LatLng(lat, lng))
          };
        });

        setGeometries(transformedGeometries);
      } catch (error) {
        console.error('Error loading route geometries:', error);
      } finally {
        setLoading(false);
      }
    };

    // Handle the promise to avoid ESLint error
    void loadGeometries();
  }, [routes]);

  return { geometries, loading };
};
