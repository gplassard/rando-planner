import { TypescriptApplicationProject, WorkflowActionsX } from '@gplassard/projen-extensions';
import { GithubWorkflow } from 'projen/lib/github';
import { JobPermission } from 'projen/lib/github/workflows-model';
import { TypeScriptJsxMode } from 'projen/lib/javascript';

const project = new TypescriptApplicationProject({
  name: 'rando-planner',
  agentConfigurationEnabled: true,
  deps: [
    'leaflet', 'react', 'react-dom', 'react-leaflet',
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
const deployWebsite = new GithubWorkflow(project.github!, 'deploy-website', {
  limitConcurrency: true,
  concurrencyOptions: {
    group: 'deploy-website',
    cancelInProgress: true,
  },
});
deployWebsite.on({
  push: {
    branches: ['main'],
  },
  workflowDispatch: {},
});
deployWebsite.addJob('deploy', {
  name: 'deploy',
  environment: {
    name: 'github-pages',
    url: '${{ steps.deployment.outputs.deployment_url }}',
  },
  runsOn: ['ubuntu-latest'],
  permissions: {
    contents: JobPermission.READ,
    packages: JobPermission.READ,
    pages: JobPermission.WRITE,
    idToken: JobPermission.WRITE,
  },
  steps: [
    WorkflowActionsX.checkout({}),
    WorkflowActionsX.setupPnpm({ install: false }),
    WorkflowActionsX.setupNode({}),
    WorkflowActionsX.installDependencies({}),
    {
      name: 'Build',
      run: 'pnpm run build',
    },
    {
      name: 'Setup pages',
      uses: 'actions/configure-pages@v5',
    },
    {
      name: 'Upload artifact',
      uses: 'actions/upload-pages-artifact@v3',
      with: {
        path: './dist',
      },
    },
    {
      name: 'Deploy to Github Pages',
      uses: 'actions/deploy-pages@v4',
    },
  ],
});
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
