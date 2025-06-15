import { LatLngBounds } from 'leaflet';
import data from '../../data/small_database.json';
import { HikingRoute } from '../model/HikingRoute';

const hikingRoutes: HikingRoute[] = data.map(d => ({
  ...d,
  bounds: new LatLngBounds(
    [d.bbox[1], d.bbox[0]], // Southwest corner [lat, lng]
    [d.bbox[3], d.bbox[2]], // Northeast corner [lat, lng]
  ),
}));

export const useHikingRoutes: () => { hikingRoutes: HikingRoute[] } = () => {
  return { hikingRoutes };
};
