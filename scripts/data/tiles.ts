import { execFile } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { PREPARED_DIR, RAW_DIR } from './config';

const execFileAsync = promisify(execFile);

/**
 * PMTiles archive with the full geometry of every hiking route, served by the app
 * and rendered as a vector tile layer. See docs/adr/2026-10-31-hiking-routes-geometry-pmtiles.md.
 */
export const HIKING_ROUTES_PMTILES = join(PREPARED_DIR, 'hiking-routes.pmtiles');

/**
 * Converts the raw magOSM hiking routes extract into `data/prepared/hiking-routes.pmtiles`
 * with tippecanoe. Requires tippecanoe >= 2.26 (writes .pmtiles directly):
 * `sudo apt-get install -y tippecanoe` on Ubuntu.
 */
export async function generateHikingRoutesPmtiles(): Promise<void> {
  const input = join(RAW_DIR, 'hiking_routes.geojson');
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
    '--include', 'name',
    '--include', 'from',
    '--include', 'to',
    input,
  ];
  await mkdir(PREPARED_DIR, { recursive: true });
  try {
    await execFileAsync('tippecanoe', args);
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
