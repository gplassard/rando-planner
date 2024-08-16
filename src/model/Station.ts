import { LatLng } from 'leaflet';

export interface Station {
  id: string;
  label: string;
  lineIds: string[];
  city: string;
  location: LatLng;
}
