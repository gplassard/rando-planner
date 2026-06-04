import { TypescriptApplicationProject, WorkflowActionsX } from '@gplassard/projen-extensions';
import { GithubWorkflow } from 'projen/lib/github';
import { JobPermission } from 'projen/lib/github/workflows-model';
import { TypeScriptJsxMode } from 'projen/lib/javascript';

const project = new TypescriptApplicationProject({
  name: 'rando-planner',
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
  dev: 'vite',
  build: 'tsc && vite build',
  serve: 'vite preview',
});
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
    WorkflowActionsX.setupPnpm({}),
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
project.synth();
