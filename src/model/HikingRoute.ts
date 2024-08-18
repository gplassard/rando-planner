import { LatLngBounds } from 'leaflet';

export interface HikingRoute {
    id: string
    name: string | null
    from: string | null
    to: string | null
    bbox: LatLngBounds
}

export function hikingRouteName(route: Omit<HikingRoute, 'bbox'>): string | null {
    if (route.name) {
        return route.name;
    }
    if (route.from && route.to) {
        return `${route.from} - ${route.to}`
    }
    return route.from ?? route.to;
}
