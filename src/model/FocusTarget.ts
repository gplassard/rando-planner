/**
 * A request to center the map, issued by the search bar, the timeline or the
 * "Mes itinéraires" drawer. Leaflet-free so it stays unit-testable.
 *
 * - `point`: center on a [lat, lng] coordinate, optionally at a given zoom.
 * - `bounds`: fit the view to a [minLng, minLat, maxLng, maxLat] bbox (GeoJSON order).
 */
export type FocusTarget =
  | { kind: 'point'; center: [number, number]; zoom?: number }
  | { kind: 'bounds'; bounds: [number, number, number, number] };
