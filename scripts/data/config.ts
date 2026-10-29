import { join } from 'node:path';

export const DATA_DIR = join(__dirname, '..', '..', 'data');
export const RAW_DIR = join(DATA_DIR, 'raw');
export const PREPARED_DIR = join(DATA_DIR, 'prepared');

/**
 * Raw datasets downloaded by `pnpm run data:fetch` into `data/raw/`.
 */
export interface DataSource {
  name: string;
  url: string;
  file: string;
}

export const DATA_SOURCES: DataSource[] = [
  {
    // Itinéraires de randonnée OSM (magOSM, extracted daily from OpenStreetMap)
    name: 'hiking routes',
    url: 'https://magosm.magellium.com/geoserver/wfs?request=GetFeature&version=2.0.0&count=500000&outputFormat=application/json&typeName=magosm:hiking_foot_routes_line&srsName=EPSG:4326',
    file: 'hiking_routes.geojson',
  },
  {
    // Référentiel des gares SNCF (liste des gares, SNCF open data)
    name: 'train stations',
    url: 'https://ressources.data.sncf.com/api/explore/v2.1/catalog/datasets/liste-des-gares/exports/geojson',
    file: 'gares.geojson',
  },
];
