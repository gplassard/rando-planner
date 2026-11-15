import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { Feature, FeatureCollection } from 'geojson';
import { PREPARED_DIR, RAW_DIR } from './config';

const execFileAsync = promisify(execFile);

/**
 * PMTiles archive with the full geometry of every hiking route, served by the app
 * and rendered as a vector tile layer. See docs/adr/2026-10-31-hiking-routes-geometry-pmtiles.md.
 */
export const HIKING_ROUTES_PMTILES = join(PREPARED_DIR, 'hiking-routes.pmtiles');

/** Enriched copy of the raw extract, written to data/raw (gitignored). */
const HIKING_ROUTES_WITH_IDS = join(RAW_DIR, 'hiking_routes_with_ids.geojson');

/**
 * Copies each feature's top-level GeoJSON id (magOSM
 * `hiking_foot_routes_line.*`, see prepare.ts) into its `properties.id`.
 * tippecanoe's `--include` only keeps GeoJSON properties, and protomaps-leaflet
 * only exposes tile *properties* (not MVT feature ids) to paint-rule filters
 * and feature picking, so the app can only identify the selected route if the
 * id travels as a regular property. The top-level id is dropped: tippecanoe
 * cannot represent string GeoJSON ids as numeric MVT feature ids.
 */
async function addRouteIds(input: string, output: string): Promise<void> {
  const collection = JSON.parse(await readFile(input, 'utf8')) as FeatureCollection;
  for (const feature of collection.features as Array<Feature & { properties?: Record<string, unknown> }>) {
    if (typeof feature.id === 'string') {
      (feature.properties ??= {}).id = feature.id;
    }
    delete feature.id;
  }
  await writeFile(output, JSON.stringify(collection));
}

/**
 * Converts the raw magOSM hiking routes extract into `data/prepared/hiking-routes.pmtiles`
 * with tippecanoe. Requires tippecanoe >= 2.26 (writes .pmtiles directly):
 * `sudo apt-get install -y tippecanoe` on Ubuntu.
 */
export async function generateHikingRoutesPmtiles(): Promise<void> {
  const input = join(RAW_DIR, 'hiking_routes.geojson');
  await addRouteIds(input, HIKING_ROUTES_WITH_IDS);
  const args = [
    '--force',
    '--output', HIKING_ROUTES_PMTILES,
    '--layer', 'hiking_routes',
    '--maximum-zoom', '13', // beyond z13 the OSM basemap detail dominates; keeps the archive < 100 MB for git
    '--buffer', '8',
    // Keep tiles under the size limit at low zooms by thinning dense/short routes.
    '--drop-densest-as-needed',
    '--drop-smallest-as-needed',
    // Only keep the attributes the app displays, to bound the archive size.
    // id identifies the route for the selection highlight, ref/distance/
    // duration/roundtrip feed the route info popup (see src/lib/routeInfo.ts).
    '--include', 'id',
    '--include', 'name',
    '--include', 'from',
    '--include', 'to',
    '--include', 'ref',
    '--include', 'distance',
    '--include', 'duration',
    '--include', 'roundtrip',
    HIKING_ROUTES_WITH_IDS,
  ];
  await mkdir(PREPARED_DIR, { recursive: true });
  try {
    // tippecanoe logs a progress line per tile to stderr, far beyond the 1 MB
    // default execFile buffer.
    await execFileAsync('tippecanoe', args, { maxBuffer: 32 * 1024 * 1024 });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      throw new Error('tippecanoe is not installed. Install it with `sudo apt-get install -y tippecanoe` (Ubuntu) and re-run.');
    }
    throw error;
  }
  console.log(`Generated ${HIKING_ROUTES_PMTILES}`);
}

if (require.main === module) {
  generateHikingRoutesPmtiles().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
