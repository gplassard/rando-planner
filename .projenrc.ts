import { TypescriptApplicationProject, WorkflowActionsX } from '@gplassard/projen-extensions';
import { GithubWorkflow } from 'projen/lib/github';
import { JobPermission } from 'projen/lib/github/workflows-model';
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


const updateData = new GithubWorkflow(project.github!, 'update-data', {
  limitConcurrency: true,
  concurrencyOptions: {
    group: 'update-data',
    cancelInProgress: true,
  },
});
updateData.on({
  schedule: [
    {
      cron: '0 4 * * 1',
    },
  ],
  workflowDispatch: {},
});
updateData.addJob('update-data', {
  name: 'update-data',
  runsOn: ['ubuntu-latest'],
  timeoutMinutes: 30,
  permissions: {
    contents: JobPermission.WRITE,
  },
  steps: [
    WorkflowActionsX.checkout({}),
    WorkflowActionsX.setupPnpm({ install: false }),
    WorkflowActionsX.setupNode({}),
    WorkflowActionsX.installDependencies({}),
    {
      name: 'Install tippecanoe (GeoJSON -> PMTiles)',
      run: 'sudo apt-get update && sudo apt-get install -y tippecanoe',
    },
    {
      name: 'Fetch and prepare data',
      run: 'pnpm run data',
    },
    {
      name: 'Commit and push data updates',
      run: [
        'git config user.name "github-actions[bot]"',
        'git config user.email "41898282+github-actions[bot]@users.noreply.github.com"',
        'git add data',
        'if ! git diff --cached --quiet; then',
        '  git commit -m "chore(data): refresh prepared data"',
        '  git push',
        'else',
        '  echo "No data changes"',
        'fi',
      ].join('\n'),
    },
  ],
});
project.synth();
