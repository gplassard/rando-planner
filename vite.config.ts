/* eslint-disable import/no-extraneous-dependencies */
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [viteReact({})],
  base: '/rando-planner/',
});
