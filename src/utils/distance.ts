/**
 * Utility functions for calculating distances between geographic coordinates
 */
import { LatLng } from 'leaflet';
import { AugmentedRando, AugmentedRandoLight } from '../model/Rando';

/**
 * Earth radius in kilometers
 */
const EARTH_RADIUS_KM = 6371;

/**
 * Calculates the distance between two points using the Haversine formula
 * @param point1 First point (latitude, longitude)
 * @param point2 Second point (latitude, longitude)
 * @returns Distance in kilometers
 */
export const calculateHaversineDistance = (point1: LatLng, point2: LatLng): number => {
  // Convert latitude and longitude from degrees to radians
  const lat1 = point1.lat * Math.PI / 180;
  const lon1 = point1.lng * Math.PI / 180;
  const lat2 = point2.lat * Math.PI / 180;
  const lon2 = point2.lng * Math.PI / 180;

  // Haversine formula
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  return distance;
};

/**
 * Calculates the total distance along a path of coordinates
 * @param coordinates Array of coordinates (latitude, longitude)
 * @returns Total distance in kilometers
 */
export const calculatePathDistance = (coordinates: LatLng[]): number => {
  if (coordinates.length < 2) {
    return 0;
  }

  let totalDistance = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    totalDistance += calculateHaversineDistance(coordinates[i], coordinates[i + 1]);
  }

  return totalDistance;
};

/**
 * Calculates the distance along a hiking route using its geometry
 * @param route Hiking route with geometry
 * @returns Distance in kilometers, or undefined if geometry is not available
 */
export const calculateRouteDistance = (route: AugmentedRando): number | undefined => {
  if (!route.geometry || !route.geometry.coordinates || route.geometry.coordinates.length < 2) {
    return undefined;
  }

  return calculatePathDistance(route.geometry.coordinates);
};

/**
 * Estimates the distance of a route based on its bounding box
 * This is a fallback when detailed geometry is not available
 * @param route Route with bounding box
 * @returns Estimated distance in kilometers
 */
export const estimateRouteDistance = (route: AugmentedRandoLight): number => {
  const bounds = route.bbox;
  const southWest = bounds.getSouthWest();
  const northEast = bounds.getNorthEast();

  // Calculate the diagonal distance of the bounding box in kilometers
  const latDiff = northEast.lat - southWest.lat;
  const lngDiff = northEast.lng - southWest.lng;

  // Convert to kilometers
  const latKm = latDiff * 111; // 1 degree of latitude is approximately 111 km
  const lngKm = lngDiff * 111 * Math.cos(southWest.lat * Math.PI / 180); // Adjust for longitude

  return Math.sqrt(latKm * latKm + lngKm * lngKm);
};

/**
 * Calculates or estimates the distance of a route
 * Uses actual geometry if available, otherwise falls back to bounding box estimation
 * @param route Hiking route
 * @returns Distance in kilometers
 */
export const getRouteDistance = (route: AugmentedRando | AugmentedRandoLight): number => {
  // Check if it's an AugmentedRando with geometry
  if ('geometry' in route && route.geometry && route.geometry.coordinates) {
    const distance = calculateRouteDistance(route as AugmentedRando);
    if (distance !== undefined) {
      return distance;
    }
  }

  // Fall back to estimation based on bounding box
  return estimateRouteDistance(route);
};

/**
 * Estimates hiking time based on distance and optional elevation change
 * @param distanceKm Distance in kilometers
 * @param ascentM Optional ascent in meters
 * @param descentM Optional descent in meters
 * @returns Estimated time in minutes
 */
export const estimateHikingTime = (
  distanceKm: number,
  ascentM?: number,
  descentM?: number
): number => {
  // Base calculation: assume average hiking speed of 4 km/h on flat terrain
  let timeHours = distanceKm / 4;

  // Add time for elevation changes if available
  // Naismith's Rule: add 1 hour for every 600m of ascent
  if (ascentM) {
    timeHours += ascentM / 600;
  }

  // Add time for significant descent
  // Typically slower than flat but faster than ascent
  if (descentM && descentM > 1000) {
    timeHours += descentM / 1200;
  }

  // Convert to minutes and round
  return Math.round(timeHours * 60);
};
