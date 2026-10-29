/* eslint-disable import/no-extraneous-dependencies */
import { execSync } from 'node:child_process';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Injected at build time, see declarations in src/vite-env.d.ts.
const buildCommit = process.env.BUILD_COMMIT ?? (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
})();
const buildTime = process.env.BUILD_TIME ?? new Date().toISOString();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [viteReact({})],
  base: '/rando-planner/',
  define: {
    __BUILD_COMMIT__: JSON.stringify(buildCommit),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
});
