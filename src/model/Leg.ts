import { Station } from './Station';
import { AugmentedRandoLight } from './Rando';
import { LatLng } from 'leaflet';

/**
 * Represents the type of a leg in an itinerary
 */
export enum LegType {
  HIKING = 'HIKING',
  REST = 'REST'
}

/**
 * Base interface for all types of legs
 */
export interface BaseLeg {
  id: string;
  type: LegType;
  from: Station;
  to: Station;
  distance?: number; // in kilometers
  estimatedTime?: number; // in minutes
}

/**
 * Represents a hiking leg between two stations
 */
export interface HikingLeg extends BaseLeg {
  type: LegType.HIKING;
  route: AugmentedRandoLight;
  difficulty?: string;
  editedCoordinates?: LatLng[]; // Custom edited path coordinates
}

/**
 * Represents a rest leg at a specific location
 */
export interface RestLeg extends BaseLeg {
  type: LegType.REST;
  location: Station;
  notes?: string;
}

/**
 * Union type for all leg types
 */
export type Leg = HikingLeg | RestLeg;
