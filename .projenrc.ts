import { TypescriptApplicationProject } from '@gplassard/projen-extensions';

const project = new TypescriptApplicationProject({
  name: 'rando-planner',
  deps: [
    'leaflet', 'react', 'react-dom', 'react-leaflet',
  ],
  devDeps: [
    '@types/leaflet',
    '@types/react',
    '@types/react-dom',
    '@vitejs/plugin-react-refresh',
    'sass',
    'vite',
  ],
});
project.addScripts( {
  dev: 'vite',
  build: 'tsc && vite build',
  serve: 'vite preview',
});
project.synth();
