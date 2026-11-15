import { describe, expect, it } from 'vitest';
import { routeInfo } from '../src/lib/routeInfo';

describe('routeInfo', () => {
  it('falls back to a placeholder name and drops all unknown fields', () => {
    expect(routeInfo({})).toEqual({
      name: 'Sentier sans nom',
      ref: null,
      endpoints: null,
      distanceKm: null,
      duration: null,
      roundtrip: false,
    });
  });

  it('trims values and ignores empty strings and non-string tags', () => {
    expect(routeInfo({
      name: '  Sentier des crêtes  ',
      from: '   ',
      to: null,
      ref: null,
      distance: 42,
    })).toEqual({
      name: 'Sentier des crêtes',
      ref: null,
      endpoints: null,
      distanceKm: null,
      duration: null,
      roundtrip: false,
    });
  });

  it('joins partial endpoints', () => {
    expect(routeInfo({ from: 'Francueil' }).endpoints).toBe('Francueil');
    expect(routeInfo({ to: 'Boulogne-sur-Mer' }).endpoints).toBe('Boulogne-sur-Mer');
    expect(routeInfo({ from: 'Calais', to: 'Boulogne-sur-Mer' }).endpoints).toBe('Calais → Boulogne-sur-Mer');
  });

  it('parses the OSM distance tag (km), tolerating commas and junk', () => {
    expect(routeInfo({ distance: '11' }).distanceKm).toBe(11);
    expect(routeInfo({ distance: '11,5' }).distanceKm).toBe(11.5);
    expect(routeInfo({ distance: 'n/a' }).distanceKm).toBeNull();
    expect(routeInfo({ distance: '0' }).distanceKm).toBeNull();
  });

  it('passes the duration through and detects loop routes', () => {
    expect(routeInfo({ roundtrip: 'yes', duration: '3:00' })).toMatchObject({
      duration: '3:00',
      roundtrip: true,
    });
    expect(routeInfo({ roundtrip: 'no', duration: '3 h' })).toMatchObject({
      duration: '3 h',
      roundtrip: false,
    });
  });
});
