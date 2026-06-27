import * as fs from 'fs';
import * as path from 'path';

interface GeoJsonFeature {
  type: string;
  id: string;
  properties: {
    name: string | null;
    from: string | null;
    to: string | null;
    bbox: [number, number, number, number];
  };
  geometry: any;
}

interface GeoJson {
  type: string;
  features: GeoJsonFeature[];
}

interface SmallHikingRoute {
  id: string;
  name: string | null;
  from: string | null;
  to: string | null;
  bbox: [number, number, number, number];
}

interface FullHikingRoute {
  id: string;
  properties: any;
}

const HIKING_ROUTES_URL = 'https://www.data.gouv.fr/api/1/datasets/r/42beb276-d262-410b-b7ae-922b60854f14';
const RAW_DATA_PATH = path.join(process.cwd(), 'data', 'rando.geojson');
const SMALL_DATABASE_PATH = path.join(process.cwd(), 'data', 'small_database.json');
const DATABASE_PATH = path.join(process.cwd(), 'data', 'database.json');

async function fetchHikingRoutes(): Promise<void> {
  console.log('Fetching hiking routes data from data.gouv.fr...');
  
  try {
    // Ensure directories exist
    const rawDir = path.dirname(RAW_DATA_PATH);
    
    if (!fs.existsSync(rawDir)) {
      fs.mkdirSync(rawDir, { recursive: true });
    }

    // Fetch raw data
    const response = await fetch(HIKING_ROUTES_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const rawData: GeoJson = await response.json();
    
    // Write raw data
    fs.writeFileSync(RAW_DATA_PATH, JSON.stringify(rawData, null, 2));
    console.log(`Raw hiking routes data written to ${RAW_DATA_PATH}`);

    // Transform data for small_database.json
    const smallDatabase: SmallHikingRoute[] = rawData.features.map(f => ({
      id: f.id,
      name: f.properties.name,
      from: f.properties.from,
      to: f.properties.to,
      bbox: f.properties.bbox,
    }));

    // Write small database
    fs.writeFileSync(SMALL_DATABASE_PATH, JSON.stringify(smallDatabase, null, 2));
    console.log(`Small database written to ${SMALL_DATABASE_PATH}`);
    console.log(`Processed ${smallDatabase.length} hiking routes for small database`);

    // Transform data for database.json
    const database: FullHikingRoute[] = rawData.features.map(f => ({
      id: f.id,
      properties: f.properties,
    }));

    // Write full database
    fs.writeFileSync(DATABASE_PATH, JSON.stringify(database, null, 2));
    console.log(`Full database written to ${DATABASE_PATH}`);
    console.log(`Processed ${database.length} hiking routes for full database`);
    
  } catch (error) {
    console.error('Error fetching hiking routes data:', error);
    process.exit(1);
  }
}

// Run if executed directly
const isMainModule = require.main === module;
if (isMainModule) {
  fetchHikingRoutes().catch(() => process.exit(1));
}

export { fetchHikingRoutes };
