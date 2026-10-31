import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Smoke test for the pipeline artifact consumed by the map (scripts/data/tiles.ts).
describe('data/prepared/hiking-routes.pmtiles', () => {
  it('is a valid PMTiles v3 archive', async () => {
    const buffer = await readFile(join(__dirname, '..', 'data', 'prepared', 'hiking-routes.pmtiles'));
    expect(buffer.subarray(0, 7).toString('ascii')).toBe('PMTiles');
    expect(buffer[7]).toBe(3);
  });
});
