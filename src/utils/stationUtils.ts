import { LatLng } from 'leaflet';
import { Station } from '../model/Station';

/**
 * Transforms raw station data into Station objects with proper Leaflet LatLng objects
 * @param data Raw station data from JSON
 * @returns Array of Station objects
 */
export const transformStationData = (data: any[]): Station[] => {
  if (!Array.isArray(data)) {
    throw new Error('Station data is not an array');
  }

  return data.map((d: any) => {
    if (!d.id || !d.label || !d.city || !Array.isArray(d.location) || d.location.length !== 2) {
      throw new Error(`Invalid station data format: ${JSON.stringify(d)}`);
    }

    return {
      ...d,
      location: new LatLng(d.location[0], d.location[1]),
    };
  });
};

/**
 * Filters stations by search term
 * @param stations Array of stations to filter
 * @param searchTerm Term to search for
 * @returns Filtered array of stations
 */
export const filterStationsBySearchTerm = (stations: Station[], searchTerm: string): Station[] => {
  if (!searchTerm) return stations;

  const lowerCaseSearchTerm = searchTerm.toLowerCase();

  return stations.filter(station =>
    station.label.toLowerCase().includes(lowerCaseSearchTerm) ||
    station.city.toLowerCase().includes(lowerCaseSearchTerm)
  );
};

/**
 * Finds stations near a given location
 * @param stations Array of stations to search
 * @param location Location to search near
 * @param maxDistanceKm Maximum distance in kilometers
 * @returns Array of stations within the specified distance
 */
export const findStationsNearLocation = (
  stations: Station[],
  location: LatLng,
  maxDistanceKm: number
): Station[] => {
  // Convert km to meters for Leaflet's distanceTo method
  const maxDistanceMeters = maxDistanceKm * 1000;

  return stations.filter(station =>
    station.location.distanceTo(location) <= maxDistanceMeters
  );
};
