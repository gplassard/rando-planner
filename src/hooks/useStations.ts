import { LatLng } from 'leaflet';
import data from '../../data/prepared/stations.json';
import { Station } from '../model/Station';

const stations: Station[] = data.map(d => ({
  ...d,
  location: new LatLng(d.location[1], d.location[0]),
}));

export const useStations: () => { stations: Station[] } = () => {
  return { stations };
};
