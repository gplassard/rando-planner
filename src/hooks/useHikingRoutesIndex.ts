import { useCallback, useRef, useState } from 'react';
import hikingRoutesIndexUrl from '../../data/prepared/hiking-routes-index.json?url';
import { SearchableRoute } from '../lib/search';

export type UseHikingRoutesIndex = () => {
  routes: SearchableRoute[];
  loading: boolean;
  /** Fetches the ~6 MB route index on first call; subsequent calls are no-ops. */
  ensureLoaded: () => void;
};

/**
 * Lazy-loads data/prepared/hiking-routes-index.json (46k routes) as a static
 * asset instead of bundling it into the JS: the fetch only starts when the
 * user interacts with the search bar.
 */
export const useHikingRoutesIndex: UseHikingRoutesIndex = () => {
  const [routes, setRoutes] = useState<SearchableRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const started = useRef(false);

  const ensureLoaded = useCallback(() => {
    if (started.current) {
      return;
    }
    started.current = true;
    setLoading(true);
    void fetch(hikingRoutesIndexUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load hiking routes index: ${response.status}`);
        }
        return response.json();
      })
      .then((json: SearchableRoute[]) => setRoutes(json))
      .catch(() => setRoutes([]))
      .finally(() => setLoading(false));
  }, []);

  return { routes, loading, ensureLoaded };
};
