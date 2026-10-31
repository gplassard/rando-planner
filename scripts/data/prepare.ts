import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Feature, FeatureCollection, Geometry, Point, Position } from 'geojson';
import { DATA_DIR, PREPARED_DIR, RAW_DIR } from './config';

type Bbox = [number, number, number, number];

interface RawStationProperties {
  code_uic?: string | null;
  libelle?: string | null;
  voyageurs?: string | null;
  code_ligne?: string | null;
  commune?: string | null;
}

export interface PreparedStation {
  id: string;
  label: string;
  lineIds: string[];
  city: string;
  location: [number, number];
}

interface RawRouteProperties {
  name?: string | null;
  from?: string | null;
  to?: string | null;
  [key: string]: unknown;
}

export interface PreparedRoute {
  id: string;
  name: string | null;
  from: string | null;
  to: string | null;
  bbox: Bbox;
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

/**
 * Computes a [minX, minY, maxX, maxY] bbox from a geometry's coordinates,
 * rounded to 4 decimals to keep the prepared files small.
 */
export function computeBbox(geometry: Geometry): Bbox {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  const visit = (coordinates: Position | Position[]): void => {
    if (typeof coordinates[0] === 'number') {
      const [x, y] = coordinates as Position;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      return;
    }
    for (const child of coordinates as Position[]) {
      visit(child as Position | Position[]);
    }
  };
  const visitGeometry = (geometry: Geometry): void => {
    if (geometry.type === 'GeometryCollection') {
      geometry.geometries.forEach(visitGeometry);
      return;
    }
    visit(geometry.coordinates as Position | Position[]);
  };
  visitGeometry(geometry);
  const round = (n: number): number => Math.round(n * 10000) / 10000;
  return [round(minX), round(minY), round(maxX), round(maxY)];
}

/**
 * Transforms the SNCF "liste des gares" export into `data/prepared/stations.json`:
 * keeps stations open to travellers (voyageurs = "O") and aggregates them by UIC code.
 */
export async function prepareStations(): Promise<PreparedStation[]> {
  const collection = await readJson(join(RAW_DIR, 'gares.geojson')) as FeatureCollection<Point, RawStationProperties>;
  const stationsByUic = new Map<string, PreparedStation>();
  for (const feature of collection.features) {
    const properties = feature.properties;
    if (!properties?.code_uic || properties.voyageurs !== 'O' || !feature.geometry) {
      continue;
    }
    const existing = stationsByUic.get(properties.code_uic);
    if (existing) {
      // Same station on multiple railway lines: only collect the additional line.
      if (properties.code_ligne && !existing.lineIds.includes(properties.code_ligne)) {
        existing.lineIds.push(properties.code_ligne);
      }
      continue;
    }
    stationsByUic.set(properties.code_uic, {
      id: properties.code_uic,
      label: properties.libelle ?? properties.code_uic,
      lineIds: properties.code_ligne ? [properties.code_ligne] : [],
      city: properties.commune ?? '',
      location: [feature.geometry.coordinates[0], feature.geometry.coordinates[1]],
    });
  }
  const stations = [...stationsByUic.values()].sort((a, b) => a.id.localeCompare(b.id));
  await writeJson(join(PREPARED_DIR, 'stations.json'), stations);
  return stations;
}

/**
 * Transforms the magOSM hiking routes export into:
 * - `data/database.json`: id + full OSM properties (bbox included)
 * - `data/small_database.json`: id/name/from/to/bbox metadata (the app renders
 *   geometry from `data/prepared/hiking-routes.pmtiles` instead, see tiles.ts)
 * - `data/small.json`: a small sample collection for local development
 * - `data/prepared/hiking-routes-index.json`: minified id/name/from/to/bbox index,
 *   lazy-fetched by the app for the route search (not bundled into the JS)
 */
export async function prepareHikingRoutes(): Promise<PreparedRoute[]> {
  const collection = await readJson(join(RAW_DIR, 'hiking_routes.geojson')) as FeatureCollection;
  const database: Array<{ id: string; properties: RawRouteProperties }> = [];
  const routes: PreparedRoute[] = [];
  for (const feature of collection.features) {
    const id = feature.id as string;
    const bbox = computeBbox(feature.geometry);
    const properties = { ...feature.properties as RawRouteProperties, bbox };
    database.push({ id, properties });
    routes.push({
      id,
      name: properties.name ?? null,
      from: properties.from ?? null,
      to: properties.to ?? null,
      bbox,
    });
  }
  const sample: FeatureCollection = {
    type: 'FeatureCollection',
    features: collection.features.slice(0, 10),
  };
  await writeJson(join(DATA_DIR, 'database.json'), database);
  await writeJson(join(DATA_DIR, 'small_database.json'), routes);
  await writeJson(join(DATA_DIR, 'small.json'), sample);
  // Minified search index consumed by the app (lazy-fetched, not bundled into the JS).
  await writeFile(join(PREPARED_DIR, 'hiking-routes-index.json'), JSON.stringify(routes));
  return routes;
}

export async function prepareAll(): Promise<void> {
  const stations = await prepareStations();
  const routes = await prepareHikingRoutes();
  console.log(`Prepared ${stations.length} stations and ${routes.length} hiking routes.`);
}

if (require.main === module) {
  prepareAll().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
