import { LatLngBounds, LatLngLiteral } from 'leaflet';

export interface HikingRoute {
  id: string;
  name: string | null;
  from: string | null;
  to: string | null;
  bbox: LatLngBounds;
  approximatePath: LatLngLiteral[];
}

export function hikingRouteName(route: Pick<HikingRoute, 'name' | 'from'| 'to'>): string | null {
  if (route.name) {
    return route.name;
  }
  if (route.from && route.to) {
    return `${route.from} - ${route.to}`;
  }
  return route.from ?? route.to ?? 'Inconnu';
}
