import { TypescriptApplicationProject } from '@gplassard/projen-extensions';
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
project.synth();
