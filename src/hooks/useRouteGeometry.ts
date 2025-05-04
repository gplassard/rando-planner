import type { MultiLineString } from 'geojson';
import { useState, useEffect } from 'react';
import { AugmentedRandoLight } from '../model/Rando';

export type HikingGeometry = MultiLineString;

/**
 * Hook to load and provide geometry data for routes
 * @param routes The routes to load geometry for
 * @returns Object containing the geometry data and loading state
 */
export const useRouteGeometry = (routes: AugmentedRandoLight[]): {
  geometries: Record<string, HikingGeometry>;
  loading: boolean;
} => {
  const [loading, setLoading] = useState(true);
  const [geometries, setGeometries] = useState<Record<string, HikingGeometry>>({});

  // Load geometry data for the specified routes
  useEffect(() => {
    if (routes.length === 0) {
      setLoading(false);
      return;
    }

    const loadGeometries = async () => {
      try {
        setLoading(true);

        const module = await import('../../data/small.json');
        const allGeometries = module.default.features;

        // Filter geometries for the specified routes
        const routeIds = new Set(routes.map(route => route.id));
        const filteredGeometries = allGeometries.filter(geo => routeIds.has(geo.id));

        const g: Record<string, HikingGeometry> = {};
        filteredGeometries.forEach(geo => {
          g[geo.id] = geo.geometry as HikingGeometry;
        });

        setGeometries(g);
      } catch (error) {
        console.error('Error loading route geometries:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadGeometries();
  }, [routes]);

  return { geometries, loading };
};
