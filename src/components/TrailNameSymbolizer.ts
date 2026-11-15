import type { Feature, Label, LabelSymbolizer, Layout } from 'protomaps-leaflet';

/** Minimal structural stand-in for @mapbox/point-geometry (not a direct dependency). */
interface Pt {
  x: number;
  y: number;
}

export interface TrailNameSymbolizerOptions {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  /** Max characters kept in the drawn label; longer names are truncated with an ellipsis. */
  maxLabelChars?: number;
  /** Minimum trail length (screen px) required for a fragment to be labeled. */
  minTrailLengthPx?: number;
  /** Minimum screen px between two labels carrying the same route name. */
  deduplicationDistance?: number;
}

/** Truncates a name to `maxChars` characters, adding an ellipsis when cut. */
export const truncateLabel = (name: string, maxChars: number): string => {
  if (name.length <= maxChars) {
    return name;
  }
  const cut = Math.max(1, maxChars - 1);
  return `${name.slice(0, cut).trimEnd()}…`;
};

/**
 * Longest line of the geometry (by arc length) and its arc-length midpoint.
 * Returns undefined when the geometry has no complete segment.
 */
export const longestLineMidpoint = (
  geom: Pt[][],
): { mid: Pt; length: number } | undefined => {
  let best: { mid: Pt; length: number } | undefined;
  for (const line of geom) {
    if (line.length < 2) {
      continue;
    }
    const segs: number[] = [];
    let total = 0;
    for (let i = 1; i < line.length; i++) {
      const seg = Math.hypot(line[i].x - line[i - 1].x, line[i].y - line[i - 1].y);
      segs.push(seg);
      total += seg;
    }
    if (!best || total > best.length) {
      // Walk the segments to the arc-length midpoint.
      let acc = 0;
      let mid = { x: line[0].x, y: line[0].y };
      for (let i = 0; i < segs.length; i++) {
        if (acc + segs[i] >= total / 2) {
          const r = segs[i] === 0 ? 0 : (total / 2 - acc) / segs[i];
          mid = {
            x: line[i].x + r * (line[i + 1].x - line[i].x),
            y: line[i].y + r * (line[i + 1].y - line[i].y),
          };
          break;
        }
        acc += segs[i];
      }
      best = { mid, length: total };
    }
  }
  return best;
};

/**
 * Materializes the interpolated midpoint as a real point-geometry Point.
 * protomaps' dedup machinery calls anchor.dist() on stored labels, so the
 * anchor must be an actual Point: we clone a geometry vertex (transformGeom
 * hands us genuine Point instances) and overwrite its coordinates.
 */
const midpointAnchor = (geom: Pt[][], mid: Pt): Label['anchor'] | undefined => {
  const vertex = geom.find(line => line.length > 0)?.[0] as { x: number; y: number; clone(): LucidVertex } | undefined;
  if (!vertex || typeof vertex.clone !== 'function') {
    return undefined;
  }
  const anchor = vertex.clone();
  anchor.x = mid.x;
  anchor.y = mid.y;
  return anchor as Label['anchor'];
};

interface LucidVertex {
  x: number;
  y: number;
  clone(): LucidVertex;
}

/**
 * Draws each trail's name once, horizontally, at the arc-length midpoint of its
 * longest line, with a white halo. Collision and repeat avoidance are left to
 * the protomaps labeler (bboxes + deduplication key).
 *
 * This replaces protomaps' LineLabelSymbolizer for `hiking_routes`: that
 * symbolizer only labels a line when it contains a straight-ish run (no bend
 * over 4 degrees) at least as long as the full label text — with long French
 * route names on sinuous trails, that condition is almost never met and names
 * never showed up.
 */
export class TrailNameSymbolizer implements LabelSymbolizer {
  private readonly font: string;
  private readonly fill: string;
  private readonly stroke: string;
  private readonly strokeWidth: number;
  private readonly maxLabelChars: number;
  private readonly minTrailLengthPx: number;
  private readonly deduplicationDistance: number;

  constructor(options: TrailNameSymbolizerOptions = {}) {
    const weight = options.fontWeight ?? 700;
    const size = options.fontSize ?? 12;
    const family = options.fontFamily ?? 'sans-serif';
    this.font = `${weight} ${size}px ${family}`;
    // Red with a strong white halo, echoing GR red-on-white trail markings:
    // readable on the OSM basemap and clearly distinct from the green traces.
    this.fill = options.fill ?? '#c62828';
    this.stroke = options.stroke ?? '#ffffff';
    this.strokeWidth = options.strokeWidth ?? 4;
    this.maxLabelChars = options.maxLabelChars ?? 24;
    this.minTrailLengthPx = options.minTrailLengthPx ?? 64;
    this.deduplicationDistance = options.deduplicationDistance ?? 300;
  }

  place(layout: Layout, geom: Pt[][], feature: Feature): Label[] | undefined {
    const raw = typeof feature.props.name === 'string' ? feature.props.name.trim() : '';
    if (!raw) {
      return undefined;
    }
    const name = truncateLabel(raw, this.maxLabelChars);

    const longest = longestLineMidpoint(geom);
    if (!longest || longest.length < this.minTrailLengthPx) {
      return undefined;
    }
    const anchor = midpointAnchor(geom, longest.mid);
    if (!anchor) {
      return undefined;
    }

    layout.scratch.font = this.font;
    const metrics = layout.scratch.measureText(name);
    const width = metrics.width;
    const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    return [
      {
        anchor,
        bboxes: [
          {
            minX: longest.mid.x - width / 2,
            minY: longest.mid.y - height / 2,
            maxX: longest.mid.x + width / 2,
            maxY: longest.mid.y + height / 2,
          },
        ],
        draw: (ctx) => {
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.lineJoin = 'round';
          if (this.strokeWidth > 0) {
            ctx.lineWidth = this.strokeWidth;
            ctx.strokeStyle = this.stroke;
            ctx.strokeText(name, 0, 0);
          }
          ctx.fillStyle = this.fill;
          ctx.fillText(name, 0, 0);
        },
        deduplicationKey: raw,
        deduplicationDistance: this.deduplicationDistance,
      },
    ];
  }
}

/** True when a trail name is short enough (GR codes and the like) to be shown at low zooms. */
export const isShortTrailName = (feature: Feature): boolean => {
  const name = typeof feature.props.name === 'string' ? feature.props.name : '';
  return name.length > 0 && name.length <= 12;
};
