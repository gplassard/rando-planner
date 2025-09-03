import { TypescriptApplicationProject } from '@gplassard/projen-extensions';
import { TypeScriptJsxMode, TypeScriptModuleResolution } from 'projen/lib/javascript';

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
      module: 'preserve',
      moduleResolution: TypeScriptModuleResolution.BUNDLER,
    },
    include: [
      'vite.config.ts',
    ],
  },
});
project.addScripts( {
  dev: 'vite',
  build: 'tsc && vite build',
  serve: 'vite preview',
});
project.synth();
