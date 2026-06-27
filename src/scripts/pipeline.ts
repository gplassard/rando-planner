import { fetchStations } from './fetchStations';
import { fetchHikingRoutes } from './fetchHikingRoutes';

async function runPipeline(): Promise<void> {
  console.log('Starting data pipeline...');
  console.log('');
  
  try {
    // Fetch and process stations data
    console.log('=== Processing Stations Data ===');
    await fetchStations();
    console.log('');
    
    // Fetch and process hiking routes data
    console.log('=== Processing Hiking Routes Data ===');
    await fetchHikingRoutes();
    console.log('');
    
    console.log('Data pipeline completed successfully!');
  } catch (error) {
    console.error('Data pipeline failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
const isMainModule = require.main === module;
if (isMainModule) {
  runPipeline().catch(() => process.exit(1));
}

export { runPipeline };
