/**
 * Pure search helpers for the map-first UI search bar: matching over train
 * stations (gares) and hiking routes (sentiers). No Leaflet import so the
 * module stays unit-testable in Node.
 */

export interface SearchableStation {
  id: string;
  label: string;
  city: string;
}

export interface SearchableRoute {
  id: string;
  name: string | null;
  from: string | null;
  to: string | null;
  /** [minLng, minLat, maxLng, maxLat] — GeoJSON bbox order. */
  bbox: [number, number, number, number];
}

export type SearchFilter = 'all' | 'stations' | 'routes';

export type SearchResult<
  TStation extends SearchableStation = SearchableStation,
  TRoute extends SearchableRoute = SearchableRoute,
> =
  | { kind: 'station'; station: TStation }
  | { kind: 'route'; route: TRoute };

/** Lowercases and strips diacritics so "chateau" matches "Château". */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

interface Scored<T> {
  score: number;
  key: string;
  item: T;
}

function rank<T>(candidates: Array<Scored<T>>, limit: number): T[] {
  return candidates
    .sort((a, b) => a.score - b.score || a.key.localeCompare(b.key))
    .slice(0, limit)
    .map(c => c.item);
}

/**
 * Searches stations by label or city. Ranking: label prefix < city prefix <
 * label contains < city contains.
 */
export function searchStations<T extends SearchableStation>(
  stations: T[],
  query: string,
  limit = 8,
): T[] {
  const q = normalizeText(query);
  if (!q) {
    return [];
  }
  const scored: Array<Scored<T>> = [];
  for (const station of stations) {
    const label = normalizeText(station.label);
    const city = normalizeText(station.city);
    let score = -1;
    if (label.startsWith(q)) score = 0;
    else if (city.startsWith(q)) score = 1;
    else if (label.includes(q)) score = 2;
    else if (city.includes(q)) score = 3;
    if (score >= 0) {
      scored.push({ score, key: label, item: station });
    }
  }
  return rank(scored, limit);
}

/**
 * Searches hiking routes by name, `from` or `to`. Routes without a name are
 * still reachable through their endpoints. Ranking: name prefix < from/to
 * prefix < name contains < from/to contains.
 */
export function searchRoutes<T extends SearchableRoute>(
  routes: T[],
  query: string,
  limit = 8,
): T[] {
  const q = normalizeText(query);
  if (!q) {
    return [];
  }
  const scored: Array<Scored<T>> = [];
  for (const route of routes) {
    const name = route.name ? normalizeText(route.name) : '';
    const endpoints = normalizeText(`${route.from ?? ''} ${route.to ?? ''}`);
    let score = -1;
    if (name.startsWith(q)) score = 0;
    else if (endpoints.startsWith(q)) score = 1;
    else if (name.includes(q)) score = 2;
    else if (endpoints.includes(q)) score = 3;
    if (score >= 0) {
      scored.push({ score, key: name || endpoints, item: route });
    }
  }
  return rank(scored, limit);
}

/**
 * Combined search used by the search bar: applies the gares/sentiers filter
 * and merges both sources, stations first.
 */
export function search<
  TStation extends SearchableStation,
  TRoute extends SearchableRoute,
>(
  query: string,
  filter: SearchFilter,
  stations: TStation[],
  routes: TRoute[],
  limit = 8,
): Array<SearchResult<TStation, TRoute>> {
  const results: Array<SearchResult<TStation, TRoute>> = [];
  if (filter === 'all' || filter === 'stations') {
    results.push(...searchStations(stations, query, limit).map(station => ({ kind: 'station' as const, station })));
  }
  if (filter === 'all' || filter === 'routes') {
    results.push(...searchRoutes(routes, query, limit).map(route => ({ kind: 'route' as const, route })));
  }
  return results.slice(0, limit);
}
