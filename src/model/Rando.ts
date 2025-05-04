import { LatLng, LatLngBounds } from 'leaflet';

/**
 * Basic information about a hiking route
 */
export interface RandoLight {
  id: string;
  name?: string;
  from?: string;
  to?: string;
  bbox: [number, number, number, number];
}

/**
 * RandoLight with Leaflet LatLngBounds instead of raw coordinates
 */
export type AugmentedRandoLight = Omit<RandoLight, 'bbox'> & {bbox: LatLngBounds};

/**
 * Difficulty level of a hiking route
 */
export enum DifficultyLevel {
  EASY = 'EASY',
  MODERATE = 'MODERATE',
  DIFFICULT = 'DIFFICULT',
  VERY_DIFFICULT = 'VERY_DIFFICULT',
}

/**
 * Type of surface for a hiking route
 */
export enum SurfaceType {
  PAVED = 'PAVED',
  GRAVEL = 'GRAVEL',
  DIRT = 'DIRT',
  ROCKY = 'ROCKY',
  MIXED = 'MIXED',
}

/**
 * Detailed properties for a hiking route
 */
export interface RandoProperties {
  name?: string;
  description?: string;
  difficulty?: DifficultyLevel;
  surface?: SurfaceType;
  distance?: number; // in kilometers
  estimatedTime?: number; // in minutes
  ascent?: number; // in meters
  descent?: number; // in meters
  maxElevation?: number; // in meters
  minElevation?: number; // in meters
  source?: string; // data source
  website?: string; // official website
  lastUpdated?: string; // ISO date string
}

/**
 * Coordinate point in a hiking route
 */
export interface RandoPoint {
  coordinates: [number, number]; // [longitude, latitude]
  elevation?: number; // in meters
  name?: string;
  type?: 'waypoint' | 'poi' | 'junction';
  description?: string;
}

/**
 * Geometry of a hiking route
 */
export interface RandoGeometry {
  type: 'LineString';
  coordinates: [number, number][]; // Array of [longitude, latitude] pairs
  points?: RandoPoint[]; // Points of interest along the route
}

/**
 * Complete hiking route with detailed information
 */
export interface Rando extends RandoLight {
  properties?: RandoProperties;
  geometry?: RandoGeometry;
}

/**
 * Augmented version of Rando with Leaflet objects
 */
export interface AugmentedRando extends Omit<Rando, 'bbox' | 'geometry'> {
  bbox: LatLngBounds;
  geometry?: {
    type: 'LineString';
    coordinates: LatLng[]; // Array of Leaflet LatLng objects
    points?: (RandoPoint & { latLng: LatLng })[]; // Points with Leaflet LatLng
  };
  properties?: RandoProperties;
}
