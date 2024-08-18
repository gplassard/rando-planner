import { LatLngBounds } from 'leaflet';
import data from '../../data/prepared/hiking-routes.json';
import { HikingRoute, hikingRouteName } from '../model/HikingRoute';
import { MapState } from '../model/MapState';

const hikingRoutes: HikingRoute[] = data.map(d => ({
  ...d,
  from: d.from,
  to: d.to,
  name: hikingRouteName(d),
  bbox: new LatLngBounds(
    [d.bbox[1], d.bbox[0]],
    [d.bbox[3], d.bbox[2]],
  ),
  approximatePath: d.approximatePath.map(p => ({ lat: p[1], lng: p[0] })),
}));

export const useHikingRoutes: (mapState: MapState | null) => { hikingRoutes: HikingRoute[] } = (mapState) => {
  if (mapState === null || mapState.zoom < 0) {
    return { hikingRoutes: [] };
  }
  const filteredRoutes = hikingRoutes
    .filter(route => mapState.boundingBox.intersects(route.bbox));

  return { hikingRoutes: filteredRoutes };
};
