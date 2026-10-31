import { describe, expect, it } from 'vitest';
import { normalizeText, search, searchRoutes, searchStations, SearchableRoute, SearchableStation } from '../src/lib/search';

const stations: SearchableStation[] = [
  { id: '1', label: 'Château-Gontier', city: 'CHATEAU-GONTIER' },
  { id: '2', label: 'Lille CHR', city: 'LILLE' },
  { id: '3', label: 'Gare de Lyon', city: 'PARIS' },
  { id: '4', label: 'Lille Europe', city: 'LILLE' },
];

const routes: SearchableRoute[] = [
  { id: 'r1', name: 'GR 223', from: 'Calais', to: 'Boulogne-sur-Mer', bbox: [1.8, 50.7, 1.9, 50.9] },
  { id: 'r2', name: null, from: 'Givet', to: null, bbox: [4.8, 50.1, 4.9, 50.2] },
  { id: 'r3', name: 'Circuit de la crête', from: null, to: null, bbox: [0, 0, 0, 0] },
];

describe('normalizeText', () => {
  it('lowercases and strips diacritics', () => {
    expect(normalizeText('  Château-d’Œuf  ÉCOLE ')).toBe('chateau-d’œuf ecole');
  });
});

describe('searchStations', () => {
  it('matches by label, accent-insensitive', () => {
    expect(searchStations(stations, 'chateau').map(s => s.id)).toEqual(['1']);
  });

  it('matches by city', () => {
    expect(searchStations(stations, 'lille').map(s => s.id)).toEqual(['2', '4']);
  });

  it('ranks label matches before city matches', () => {
    const mixed: SearchableStation[] = [
      { id: 'a', label: 'Paris Gare du Nord', city: 'PARIS' },
      { id: 'b', label: 'Paris-plage', city: 'LE TOUQUET' },
    ];
    expect(searchStations(mixed, 'paris').map(s => s.id)).toEqual(['a', 'b']);
  });

  it('returns nothing for an empty query and respects the limit', () => {
    expect(searchStations(stations, '   ')).toEqual([]);
    expect(searchStations(stations, 'lille', 1)).toHaveLength(1);
  });
});

describe('searchRoutes', () => {
  it('matches by name', () => {
    expect(searchRoutes(routes, 'gr 22').map(r => r.id)).toEqual(['r1']);
  });

  it('matches unnamed routes through their endpoints', () => {
    expect(searchRoutes(routes, 'givet').map(r => r.id)).toEqual(['r2']);
  });

  it('returns nothing for an empty query', () => {
    expect(searchRoutes(routes, '')).toEqual([]);
  });
});

describe('search', () => {
  it('merges stations and routes, stations first', () => {
    const results = search('l', 'all', stations, routes);
    expect(results[0].kind).toBe('station');
    expect(results.some(r => r.kind === 'route')).toBe(true);
  });

  it('applies the filter', () => {
    expect(search('gr', 'stations', stations, routes)).toHaveLength(0);
    expect(search('gr', 'routes', stations, routes).map(r => r.kind)).toEqual(['route']);
  });
});
