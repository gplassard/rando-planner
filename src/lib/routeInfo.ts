import type { JsonObject } from 'protomaps-leaflet';

/** Display-ready information about a hiking route, read from tile properties. */
export interface RouteInfo {
  /** Display name, falling back to a placeholder for unnamed trails. */
  name: string;
  /** Official trail code (OSM `ref`), e.g. 'HO6' or 'GR 223'. */
  ref: string | null;
  /** 'A → B' when at least one endpoint is tagged. */
  endpoints: string | null;
  /** Route length in km (OSM `distance`), when tagged. */
  distanceKm: number | null;
  /** Raw OSM `duration` tag (usually 'h:mm'), when tagged. */
  duration: string | null;
  /** Whether the trail is a loop (OSM `roundtrip=yes`). */
  roundtrip: boolean;
}

/** 'Sentier sans nom' placeholder for unnamed trails. */
export const UNNAMED_ROUTE = 'Sentier sans nom';

/** Trims a tile property to a non-empty string, null otherwise. */
const asText = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * Normalizes the sparse OpenStreetMap attributes carried by the
 * `hiking_routes` vector tiles (see scripts/data/tiles.ts) into display-ready
 * route info. OSM tags every field sparsely, so each one degrades to null
 * when absent from the tile.
 */
export const routeInfo = (props: JsonObject): RouteInfo => {
  const from = asText(props.from);
  const to = asText(props.to);
  const distance = asText(props.distance);
  const parsedDistance = distance === null ? Number.NaN : Number(distance.replace(',', '.'));
  return {
    name: asText(props.name) ?? UNNAMED_ROUTE,
    ref: asText(props.ref),
    endpoints: [from, to].some(endpoint => endpoint !== null)
      ? [from, to].filter(endpoint => endpoint !== null).join(' → ')
      : null,
    distanceKm: Number.isFinite(parsedDistance) && parsedDistance > 0 ? parsedDistance : null,
    duration: asText(props.duration),
    roundtrip: asText(props.roundtrip) === 'yes',
  };
};
