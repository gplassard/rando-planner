import { LatLngBounds } from 'leaflet';

export interface MapState {
  zoom: number;
  boundingBox: LatLngBounds;
}
