import * as fs from 'node:fs/promises';
import type { Feature, LineString, MultiLineString, Position } from 'geojson';

function coordsToSelectedCoords(geometry: MultiLineString | LineString): Position[] {
  const veryFirst = geometry.type === 'MultiLineString' ? geometry.coordinates[0][0] : geometry.coordinates[0];
  const veryLast = geometry.type === 'MultiLineString' ? geometry.coordinates.at(-1)!.at(-1)! : geometry.coordinates.at(-1)!;
  if (geometry.type === 'MultiLineString' && geometry.coordinates.length > 3) {
    if (geometry.coordinates.length >= 6) {
      const factor = Math.floor(geometry.coordinates.length / 5);
      return [
        veryFirst,
        ...[1, 2, 3, 4].map(i => geometry.coordinates[i * factor][0]),
        veryLast,
      ];

    } else {
      return [
        ...geometry.coordinates.slice(-1).map(c => c[0]),
        veryLast,
      ];
    }
  } else {
    const flattened = geometry.type === 'MultiLineString' ? geometry.coordinates.flat(1) : geometry.coordinates;
    if (flattened.length < 6) {
      return flattened;
    } else {
      const factor = Math.floor(flattened.length / 5);
      return [
        veryFirst,
        ...[1, 2, 3, 4].map(i => flattened[i * factor]),
        veryLast,
      ];
    }
  }
}

(async () => {
  const content = await fs.readFile('./data/rando.geojson');
  const data = JSON.parse(content.toString());
  const features = data.features
    .map((d: Feature<MultiLineString | LineString>) => {
      return {
        id: d.id,
        name: d.properties!.name,
        from: d.properties!.from,
        to: d.properties!.to,
        bbox: d.properties!.bbox,
        approximatePath: coordsToSelectedCoords(d.geometry),
      };
    });

  await fs.writeFile('./data/prepared/hiking-routes.json', JSON.stringify(features, undefined, 2));
})();
