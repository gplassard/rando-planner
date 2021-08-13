import { LatLngBounds } from "leaflet";

export interface RandoLight {
  id: string;
  name?: string;
  from?: string;
  to?: string;
  bbox: [number, number, number, number];
}

export type AugmentedRandoLight = Omit<RandoLight, 'bbox'> & {bbox: LatLngBounds};