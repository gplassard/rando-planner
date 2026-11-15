import { describe, expect, it } from 'vitest';
import { detectEnvironment } from '../src/lib/environment';

describe('detectEnvironment', () => {
  it('detects the dev server regardless of the path', () => {
    expect(detectEnvironment('/', true)).toEqual({ kind: 'dev' });
    expect(detectEnvironment('/rando-planner/previews/pr-12/', true)).toEqual({ kind: 'dev' });
  });

  it('detects a PR preview and points back at the prod site', () => {
    expect(detectEnvironment('/rando-planner/previews/pr-12/', false)).toEqual({
      kind: 'preview',
      prNumber: 12,
      prodPath: '/rando-planner/',
    });
  });

  it('detects a preview served directly at the domain root', () => {
    expect(detectEnvironment('/previews/pr-3/', false)).toEqual({
      kind: 'preview',
      prNumber: 3,
      prodPath: '/',
    });
  });

  it('detects the prod site', () => {
    expect(detectEnvironment('/rando-planner/', false)).toEqual({ kind: 'prod' });
    expect(detectEnvironment('/rando-planner/?q=sentier', false).kind).toBe('prod');
  });
});
