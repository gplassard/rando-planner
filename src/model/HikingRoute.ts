import { LatLngBounds } from 'leaflet';

export interface HikingRoute {
  id: string;
  name: string | null;
  from: string | null;
  to: string | null;
  bounds: LatLngBounds;
}
