import { ScheduledUpgradeWorkflow, TypescriptApplicationProject } from '@gplassard/projen-extensions';
import { TypeScriptJsxMode } from 'projen/lib/javascript';

const project = new TypescriptApplicationProject({
  name: 'rando-planner',
  deployGithubPagesWorkflowEnabled: true,
  deployGithubPagesWorkflowOptions: {
    includePreviews: true,
  },
  deps: [
    'leaflet', 'protomaps-leaflet', 'react', 'react-dom', 'react-leaflet',
  ],
  devDeps: [
    '@types/leaflet',
    '@types/geojson',
    '@types/react',
    '@types/react-dom',
    '@vitejs/plugin-react',
    'sass',
    'vite',
  ],
  tsconfig: {
    compilerOptions: {
      lib: ['dom', 'es2019'],
      jsx: TypeScriptJsxMode.REACT_JSX,
    },
    include: [
      'src/**/*.tsx',
    ],
  },
  tsconfigDev: {
    compilerOptions: {
      module: 'nodenext',
    },
    include: [
      'vite.config.ts',
    ],
  },
  pnpmWorkspace: {
    allowBuilds: {
      '@parcel/watcher': false,
    },
  },
});
project.addScripts( {
  'dev': 'vite',
  'build': 'tsc && vite build',
  'serve': 'vite preview',
  'data': 'tsx scripts/data/pipeline.ts',
  'data:fetch': 'tsx scripts/data/fetch.ts',
  'data:prepare': 'tsx scripts/data/prepare.ts',
});
// Raw datasets are downloaded by the data pipeline, they are not committed.
project.gitignore.addPatterns('/data/raw/');
// database.json is a large pipeline output unused by the app, keep it out of git.
project.gitignore.addPatterns('/data/database.json');


// Monthly data refresh. Changes are submitted as a pull request.
new ScheduledUpgradeWorkflow(project.github!, {
  workflowName: 'update-data',
  cronSchedule: '0 4 1 * *',
  timeoutMinutes: 30,
  limitConcurrency: true,
  concurrencyGroup: 'update-data',
  pullRequestTitle: 'chore(data): refresh prepared data',
  pullRequestDescription: 'Automated data refresh from the update-data workflow.',
  setupSteps: [
    {
      name: 'Install tippecanoe (GeoJSON -> PMTiles)',
      run: 'sudo apt-get update && sudo apt-get install -y tippecanoe',
    },
  ],
  upgradeSteps: [
    {
      name: 'Fetch and prepare data',
      run: 'pnpm run data',
    },
  ],
  labels: [],
});
project.synth();
