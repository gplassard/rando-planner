import { TypescriptApplicationProject } from '@gplassard/projen-extensions';
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
    include: [
      'scripts/**/*.ts',
      'vite.config.ts',
    ],
  },
});
project.addScripts( {
  dev: 'vite',
  build: 'tsc && vite build',
  serve: 'vite preview',
  run_prepare: 'pnpm run prepare_2 && pnpm run prepare_3',
  prepare_2: './scripts/2_prepare.sh',
  prepare_3: 'ts-node scripts/3_prepare_hiking_route.ts',
});
project.synth();
