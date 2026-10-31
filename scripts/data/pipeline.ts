import { fetchAll } from './fetch';
import { prepareAll } from './prepare';
import { generateHikingRoutesPmtiles } from './tiles';

async function main(): Promise<void> {
  console.log('Fetching raw datasets...');
  await fetchAll();
  console.log('Preparing data files...');
  await prepareAll();
  console.log('Generating PMTiles archive...');
  await generateHikingRoutesPmtiles();
  console.log('Done.');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
