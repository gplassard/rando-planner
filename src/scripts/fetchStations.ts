import * as fs from 'fs';
import * as path from 'path';

interface GeoJsonFeature {
  type: string;
  properties: {
    voyageurs: string;
    code_uic: string;
    libelle: string;
    code_ligne: string;
    commune: string;
  };
  geometry: {
    coordinates: [number, number];
  };
}

interface GeoJson {
  type: string;
  features: GeoJsonFeature[];
}

interface Station {
  id: string;
  label: string;
  lineIds: string[];
  city: string;
  location: [number, number];
}

const STATIONS_URL = 'https://www.data.gouv.fr/fr/datasets/r/dc517700-4534-48fb-ab14-6c232b1a7562';
const RAW_DATA_PATH = path.join(process.cwd(), 'data', 'gares.geojson');
const PREPARED_DATA_PATH = path.join(process.cwd(), 'data', 'prepared', 'stations.json');

async function fetchStations(): Promise<void> {
  console.log('Fetching stations data from data.gouv.fr...');
  
  try {
    // Ensure directories exist
    const rawDir = path.dirname(RAW_DATA_PATH);
    const preparedDir = path.dirname(PREPARED_DATA_PATH);
    
    if (!fs.existsSync(rawDir)) {
      fs.mkdirSync(rawDir, { recursive: true });
    }
    if (!fs.existsSync(preparedDir)) {
      fs.mkdirSync(preparedDir, { recursive: true });
    }

    // Fetch raw data
    const response = await fetch(STATIONS_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const rawData: GeoJson = await response.json();
    
    // Write raw data
    fs.writeFileSync(RAW_DATA_PATH, JSON.stringify(rawData, null, 2));
    console.log(`Raw stations data written to ${RAW_DATA_PATH}`);

    // Transform data
    const features = rawData.features;
    
    // Filter features where voyageurs == "O"
    const openStations = features.filter(f => f.properties.voyageurs === 'O');
    
    // Group by code_uic
    const grouped = new Map<string, GeoJsonFeature[]>();
    for (const feature of openStations) {
      const codeUic = feature.properties.code_uic;
      if (!grouped.has(codeUic)) {
        grouped.set(codeUic, []);
      }
      grouped.get(codeUic)!.push(feature);
    }

    // Transform to expected format
    const stations: Station[] = Array.from(grouped.values()).map(group => ({
      id: group[0].properties.code_uic,
      label: group[0].properties.libelle,
      lineIds: group.map(f => f.properties.code_ligne),
      city: group[0].properties.commune,
      location: group[0].geometry.coordinates,
    }));

    // Write transformed data
    fs.writeFileSync(PREPARED_DATA_PATH, JSON.stringify(stations, null, 2));
    console.log(`Transformed stations data written to ${PREPARED_DATA_PATH}`);
    console.log(`Processed ${stations.length} stations`);
    
  } catch (error) {
    console.error('Error fetching stations data:', error);
    process.exit(1);
  }
}

// Run if executed directly
const isMainModule = require.main === module;
if (isMainModule) {
  fetchStations().catch(() => process.exit(1));
}

export { fetchStations };
