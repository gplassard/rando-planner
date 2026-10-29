import { fetchAll } from './fetch';
import { prepareAll } from './prepare';

async function main(): Promise<void> {
  console.log('Fetching raw datasets...');
  await fetchAll();
  console.log('Preparing data files...');
  await prepareAll();
  console.log('Done.');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
