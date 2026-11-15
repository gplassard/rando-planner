import type { Feature, Layout } from 'protomaps-leaflet';
import { describe, expect, it } from 'vitest';
import {
  isShortTrailName,
  longestLineMidpoint,
  TrailNameSymbolizer,
  truncateLabel,
} from '../src/components/TrailNameSymbolizer';

describe('truncateLabel', () => {
  it('keeps names within the limit untouched', () => {
    expect(truncateLabel('GR 22', 24)).toBe('GR 22');
  });

  it('truncates longer names with an ellipsis and no trailing space', () => {
    expect(truncateLabel('De la Manche aux Pyrénées 02, Pont-d\'Ouilly - Ecouché', 24))
      .toBe('De la Manche aux Pyréné…');
  });

  it('never returns an empty label', () => {
    expect(truncateLabel('abalade', 1)).toBe('a…');
  });
});

describe('longestLineMidpoint', () => {
  it('returns the midpoint and length of a single segment', () => {
    const line = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ];
    expect(longestLineMidpoint([line])).toEqual({ mid: { x: 5, y: 0 }, length: 10 });
  });

  it('interpolates the midpoint inside a segment', () => {
    const line = [
      { x: 0, y: 0 },
      { x: 0, y: 4 },
      { x: 4, y: 4 },
    ];
    const result = longestLineMidpoint([line]);
    expect(result?.length).toBe(8);
    expect(result?.mid.x).toBe(0);
    expect(result?.mid.y).toBe(4);
  });

  it('picks the longest line of a multi-line geometry', () => {
    const short = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ];
    const long = [
      { x: 5, y: 5 },
      { x: 5, y: 25 },
    ];
    const result = longestLineMidpoint([short, long]);
    expect(result?.length).toBe(20);
    expect(result?.mid).toEqual({ x: 5, y: 15 });
  });

  it('returns undefined for empty geometries', () => {
    expect(longestLineMidpoint([])).toBeUndefined();
    expect(longestLineMidpoint([[], [{ x: 0, y: 0 }]])).toBeUndefined();
  });
});

describe('isShortTrailName', () => {
  const feature = (name: unknown): Feature => (
    { props: { name }, bbox: { minX: 0, minY: 0, maxX: 1, maxY: 1 }, geomType: 2, geom: [], numVertices: 0 } as unknown as Feature
  );

  it('accepts short GR-like codes', () => {
    expect(isShortTrailName(feature('22B'))).toBe(true);
    expect(isShortTrailName(feature('GRP 22'))).toBe(true);
  });

  it('rejects long or missing names', () => {
    expect(isShortTrailName(feature('Sentier des forts'))).toBe(false);
    expect(isShortTrailName(feature(''))).toBe(false);
    expect(isShortTrailName(feature(null))).toBe(false);
  });
});

describe('TrailNameSymbolizer.place', () => {
  const layout = {
    zoom: 11,
    overzoom: 0,
    order: 0,
    index: {},
    scratch: {
      font: '',
      measureText: (text: string) => ({
        width: text.length * 6,
        actualBoundingBoxAscent: 8,
        actualBoundingBoxDescent: 2,
      }),
    },
  } as unknown as Layout;

  // Mirrors @mapbox/point-geometry: the labeler clones vertices in
  // transformGeom and calls anchor.dist() on stored labels for deduplication.
  class Vertex {
    x: number;
    y: number;
    constructor(x: number, y: number) {
      this.x = x;
      this.y = y;
    }
    clone() {
      return new Vertex(this.x, this.y);
    }
    dist(other: { x: number; y: number }) {
      return Math.hypot(this.x - other.x, this.y - other.y);
    }
  }

  const feature = (name: unknown, geom: { x: number; y: number }[][]): Feature => (
    { props: { name }, bbox: { minX: 0, minY: 0, maxX: 256, maxY: 256 }, geomType: 2, geom, numVertices: 42 } as unknown as Feature
  );

  const longTrail = [[
    new Vertex(0, 0),
    new Vertex(0, 100),
  ]];

  it('labels a long trail at its midpoint, keyed by the full name', () => {
    const symbolizer = new TrailNameSymbolizer();
    const labels = symbolizer.place(layout, longTrail, feature('GR 22', longTrail));
    expect(labels).toHaveLength(1);
    expect(labels?.[0].anchor).toEqual({ x: 0, y: 50 });
    expect(labels?.[0].deduplicationKey).toBe('GR 22');
    expect(labels?.[0].bboxes[0].maxX - labels?.[0].bboxes[0].minX).toBe(5 * 6);
  });

  it('returns a real point-geometry anchor, not a plain { x, y } object', () => {
    const symbolizer = new TrailNameSymbolizer();
    const labels = symbolizer.place(layout, longTrail, feature('GR 22', longTrail)) ?? [];
    const anchor = labels[0].anchor as unknown as Vertex;
    // Regression: protomaps' deduplicationCollides calls anchor.dist() on
    // stored labels; a plain { x, y } anchor throws and blanks the tile.
    expect(typeof anchor.dist).toBe('function');
    expect(anchor.dist({ x: 0, y: 0 })).toBe(50);
    expect(anchor).toBeInstanceOf(Vertex);
  });

  it('truncates long names but keeps the full name as deduplication key', () => {
    const name = 'De la Manche aux Pyrénées 02, Pont-d\'Ouilly - Ecouché';
    const symbolizer = new TrailNameSymbolizer({ maxLabelChars: 20 });
    const labels = symbolizer.place(layout, longTrail, feature(name, longTrail));
    expect(labels).toHaveLength(1);
    expect(labels?.[0].deduplicationKey).toBe(name);
    expect(labels?.[0].bboxes[0].maxX - labels?.[0].bboxes[0].minX).toBe(20 * 6);
  });

  it('skips unnamed trails and tiny fragments', () => {
    const symbolizer = new TrailNameSymbolizer();
    expect(symbolizer.place(layout, longTrail, feature(null, longTrail))).toBeUndefined();
    expect(symbolizer.place(layout, longTrail, feature('   ', longTrail))).toBeUndefined();
    const tiny = [[
      { x: 0, y: 0 },
      { x: 20, y: 0 },
    ]];
    expect(symbolizer.place(layout, tiny, feature('GR 22', tiny))).toBeUndefined();
  });
});
