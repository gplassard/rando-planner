/**
 * Deployment environment of the running app, detected from the URL and the
 * Vite dev flag:
 *
 * - dev: local Vite dev server (`pnpm dev`)
 * - preview: PR preview published to GitHub Pages under `<site>/previews/pr-<n>/`
 *   (see the preview-website workflow; the prod site is served at `<site>/`)
 * - prod: the public site
 */
export type Environment =
  | { kind: 'dev' }
  | { kind: 'preview'; prNumber: number; prodPath: string }
  | { kind: 'prod' };

const PREVIEW_SEGMENT = /\/previews\/pr-(\d+)(?:\/|$)/;

export const detectEnvironment = (pathname: string, isDev: boolean): Environment => {
  if (isDev) {
    return { kind: 'dev' };
  }
  const match = PREVIEW_SEGMENT.exec(pathname);
  if (!match) {
    return { kind: 'prod' };
  }
  return {
    kind: 'preview',
    prNumber: Number(match[1]),
    prodPath: `${pathname.slice(0, match.index)}/`,
  };
};
