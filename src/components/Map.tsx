import type { Point, LineString } from 'geojson';
import React, { FC, useState, useCallback } from 'react';
import {
  LayerGroup,
  MapContainer,
  TileLayer,
  GeoJSON,
  Tooltip,
  useMap,
  useMapEvents,
  Popup,
  Polyline,
  CircleMarker,
  Marker,
} from 'react-leaflet';
import { LatLng, Icon, DivIcon } from 'leaflet';
import { MapState } from '../model/MapState';
import { Station } from '../model/Station';
import { AugmentedRandoLight } from '../model/Rando';
import { Itinerary } from '../model/Itinerary';
import { HikingLeg, LegType } from '../model/Leg';
import { RouteSelector } from './RouteSelector';
import './Map.scss';

interface Props extends MapListenerProps{
  stations: Station[];
  routes?: AugmentedRandoLight[];
  routeGeometries?: Record<string, {
    id: string;
    type: 'LineString';
    coordinates: LatLng[];
  }>;
  itinerary?: Itinerary;
  itineraryHandlers?: {
    addLeg: (leg: HikingLeg) => void;
    updateLeg?: (leg: HikingLeg) => void;
  };
  loading?: boolean;
  onSelectStart: (station: Station) => any;
  onSelectEnd: (station: Station) => any;
  onSelectStep: (station: Station) => any;
}

function stationToGeoJson(station: Station): Point {
  return {
    ...station,
    type: 'Point',
    coordinates: [
      station.location.lat,
      station.location.lng,
    ],
  };
}

export const Map: FC<Props> = (props: Props) => {
  // State for route selection
  const [routeSelectionVisible, setRouteSelectionVisible] = useState(false);
  const [fromStation, setFromStation] = useState<Station | null>(null);
  const [toStation, setToStation] = useState<Station | null>(null);
  const [consideringRouteIds, setConsideringRouteIds] = useState<string[]>([]);

  // State for route editing
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [editedCoordinates, setEditedCoordinates] = useState<LatLng[]>([]);

  // State for map zoom level
  const [currentZoom, setCurrentZoom] = useState<number>(7); // Default zoom level

  // Interface for station clusters
  interface StationCluster {
    id: string;
    stations: Station[];
    center: LatLng;
    count: number;
  }

  // Function to group stations into clusters based on zoom level
  const clusterStations = (stations: Station[], zoom: number): (Station | StationCluster)[] => {
    // If zoom level is high enough, don't cluster
    if (zoom >= 10) {
      return stations;
    }

    const clusters: StationCluster[] = [];
    const processedStations = new Set<string>();

    // Define clustering distance based on zoom level (in degrees)
    // Lower zoom = larger clustering distance
    const clusterDistance = zoom <= 7 ? 0.1 : 0.05;

    // Process each station
    stations.forEach(station => {
      // Skip if already in a cluster
      if (processedStations.has(station.id)) {
        return;
      }

      // Find nearby stations
      const nearbyStations = stations.filter(s =>
        !processedStations.has(s.id) &&
        Math.abs(s.location.lat - station.location.lat) < clusterDistance &&
        Math.abs(s.location.lng - station.location.lng) < clusterDistance
      );

      // If we have multiple stations, create a cluster
      if (nearbyStations.length > 1) {
        // Mark all stations in this cluster as processed
        nearbyStations.forEach(s => processedStations.add(s.id));

        // Calculate center of cluster
        const sumLat = nearbyStations.reduce((sum, s) => sum + s.location.lat, 0);
        const sumLng = nearbyStations.reduce((sum, s) => sum + s.location.lng, 0);
        const center = new LatLng(
          sumLat / nearbyStations.length,
          sumLng / nearbyStations.length
        );

        // Create cluster
        clusters.push({
          id: `cluster-${clusters.length}`,
          stations: nearbyStations,
          center,
          count: nearbyStations.length
        });
      } else {
        // Mark single station as processed
        processedStations.add(station.id);
      }
    });

    // Add individual stations that weren't clustered
    const individualStations = stations.filter(s => !processedStations.has(s.id));

    // Return both clusters and individual stations
    return [...clusters, ...individualStations];
  };

  // Handle station selection for route creation
  const handleStationSelect = (station: Station) => {
    // If we don't have a from station yet, set it
    if (!fromStation) {
      setFromStation(station);
      return;
    }

    // If we have a from station but not a to station, set the to station and show the route selector
    if (!toStation) {
      setToStation(station);
      setRouteSelectionVisible(true);
      return;
    }

    // If we have both stations, reset and start over with the new station
    setFromStation(station);
    setToStation(null);
    setRouteSelectionVisible(false);
  };

  // Handle route selection
  const handleRouteSelect = (leg: HikingLeg) => {
    props.onSelectStart?.(leg.from);
    props.onSelectEnd?.(leg.to);
    props.itineraryHandlers?.addLeg(leg);

    // Reset the route selection state
    setRouteSelectionVisible(false);
    setFromStation(null);
    setToStation(null);
  };

  // Handle route selection cancellation
  const handleRouteCancel = () => {
    setRouteSelectionVisible(false);
    setFromStation(null);
    setToStation(null);
  };

  // Start editing a route
  const handleStartEditing = useCallback((routeId: string, coordinates: LatLng[]) => {
    setEditingRouteId(routeId);
    setEditedCoordinates(coordinates);
  }, []);

  // Handle marker drag
  const handleMarkerDrag = useCallback((index: number, newPosition: LatLng) => {
    setEditedCoordinates(prev => {
      const newCoordinates = [...prev];
      newCoordinates[index] = newPosition;
      return newCoordinates;
    });
  }, []);

  // Save the edited route
  const handleSaveRoute = useCallback(() => {
    if (!editingRouteId || !props.itineraryHandlers?.updateLeg) return;

    // Find the leg with this route
    const hikingLeg = props.itinerary?.legs.find(
      currentLeg => currentLeg.type === LegType.HIKING && 'route' in currentLeg && currentLeg.route.id === editingRouteId,
    );

    if (hikingLeg && hikingLeg.type === LegType.HIKING && 'route' in hikingLeg) {
      // Create a new leg with the updated route
      const updatedLeg: HikingLeg = {
        ...hikingLeg,
        // We're not actually updating the route's geometry in the database,
        // just storing the edited coordinates in the leg for display purposes
        editedCoordinates: editedCoordinates,
      };

      props.itineraryHandlers.updateLeg(updatedLeg);
    }

    // Reset editing state
    setEditingRouteId(null);
    setEditedCoordinates([]);
  }, [editingRouteId, editedCoordinates, props.itinerary?.legs, props.itineraryHandlers]);

  // Cancel editing
  const handleCancelEditing = useCallback(() => {
    setEditingRouteId(null);
    setEditedCoordinates([]);
  }, []);

  return (
    <div className="Map">
      {/* Show the route selector when both from and to stations are selected */}
      {routeSelectionVisible && fromStation && toStation && props.routes && (
        <RouteSelector
          from={fromStation}
          to={toStation}
          availableRoutes={props.routes}
          onRouteSelect={handleRouteSelect}
          onCancel={handleRouteCancel}
        />
      )}

      <MapContainer center={[44.856614, 2.35]} zoom={7} scrollWheelZoom={false}>
        <MapListener {...props} onZoomChange={setCurrentZoom}></MapListener>
        {props.itinerary && props.routeGeometries && (
          <ItineraryBoundsHandler
            itinerary={props.itinerary}
            routeGeometries={props.routeGeometries}
          />
        )}
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Display hiking routes */}
        {!props.loading && props.routes && props.routeGeometries && (
          <LayerGroup>
            {props.routes.map((route) => {
              const geometry = props.routeGeometries?.[route.id];
              if (!geometry) return null;

              // Check if this route is part of the itinerary
              const hikingLeg = props.itinerary?.legs.find(
                leg => leg.type === LegType.HIKING && 'route' in leg && leg.route.id === route.id,
              );

              const isSelected = !!hikingLeg;
              const isEditing = editingRouteId === route.id;

              // Apply different styles based on whether the route is selected or not
              const color = isSelected ? '#ff4500' : '#3388ff'; // Orange for selected, blue for available
              const weight = isSelected ? 5 : 3;
              const opacity = isSelected ? 0.9 : 0.6;

              // Determine which coordinates to use
              let positions = geometry.coordinates;
              if (isEditing && editedCoordinates.length > 0) {
                positions = editedCoordinates;
              } else if (hikingLeg && hikingLeg.type === LegType.HIKING && hikingLeg.editedCoordinates) {
                positions = hikingLeg.editedCoordinates;
              }

              return (
                <React.Fragment key={route.id}>
                  <Polyline
                    positions={positions}
                    color={color}
                    weight={weight}
                    opacity={opacity}
                    eventHandlers={{
                      click: () => {
                        if (isSelected && !isEditing) {
                          handleStartEditing(route.id, [...positions]);
                        }
                      },
                    }}
                  >
                    <Tooltip>
                      <div style={{ fontWeight: 'bold' }}>
                        {route.name || `Route ${route.id}`}
                        {isSelected && !isEditing && ' (Selected - Click to edit)'}
                        {isEditing && ' (Editing)'}
                      </div>
                      {(route.from || route.to) && (
                        <div>
                          {route.from && <span>From: {route.from}</span>}
                          {route.from && route.to && <span> • </span>}
                          {route.to && <span>To: {route.to}</span>}
                        </div>
                      )}
                    </Tooltip>
                  </Polyline>

                  {/* Add draggable markers when in editing mode */}
                  {isEditing && editedCoordinates.map((coord, index) => (
                    <Marker
                      key={`marker-${index}`}
                      position={coord}
                      draggable={true}
                      eventHandlers={{
                        dragend: (e) => {
                          const marker = e.target;
                          const position = marker.getLatLng();
                          handleMarkerDrag(index, position);
                        },
                      }}
                    />
                  ))}

                  {/* Add editing controls when in editing mode */}
                  {isEditing && (
                    <div className="route-editing-controls" style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      zIndex: 1000,
                      backgroundColor: 'white',
                      padding: '10px',
                      borderRadius: '5px',
                      boxShadow: '0 0 10px rgba(0,0,0,0.2)',
                    }}>
                      <h4>Editing Route</h4>
                      <p>Drag the markers to modify the route</p>
                      <button onClick={handleSaveRoute}>Save Changes</button>
                      <button onClick={handleCancelEditing}>Cancel</button>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </LayerGroup>
        )}

        {/* Display stations with clustering */}
        <LayerGroup>
          {clusterStations(props.stations, currentZoom).map((item) => {
            // Check if this is a cluster or an individual station
            if ('count' in item) {
              // This is a cluster
              const cluster = item as StationCluster;

              // Render a cluster marker
              return (
                <React.Fragment key={cluster.id}>
                  <CircleMarker
                    center={[cluster.center.lat, cluster.center.lng]}
                    radius={Math.min(15, 10 + Math.log(cluster.count))}
                    pathOptions={{
                      color: '#3388ff',
                      fillColor: '#3388ff',
                      fillOpacity: 0.7,
                      weight: 2,
                    }}
                  >
                    <Tooltip>Groupe de {cluster.count} stations</Tooltip>
                    <Popup>
                      <h4>Groupe de {cluster.count} stations</h4>
                      <p>Stations dans ce groupe:</p>
                      <ul>
                        {cluster.stations.map(s => (
                          <li key={s.id}>
                            {s.label} ({s.city})
                            <div>
                              <button onClick={() => props.onSelectStart(s)}>Départ</button>
                              <button onClick={() => props.onSelectStep(s)}>Etape</button>
                              <button onClick={() => props.onSelectEnd(s)}>Arrivée</button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </Popup>
                  </CircleMarker>
                </React.Fragment>
              );
            } else {
              // This is an individual station
              const station = item as Station;

              // Determine if this station is a start, end, or step point in the itinerary
              const isStart = props.itinerary?.start?.id === station.id;
              const isEnd = props.itinerary?.end?.id === station.id;
              const isStep = props.itinerary?.steps.some(step => step.id === station.id);

              // Set different styles based on the station's role
              let color = '#3388ff'; // Default blue
              let radius = 8;
              let fillOpacity = 0.6;
              let tooltipContent = station.label;

              if (isStart) {
                color = '#00cc00'; // Green for start
                radius = 10;
                fillOpacity = 0.8;
                tooltipContent = `${station.label} (Départ)`;
              } else if (isEnd) {
                color = '#cc0000'; // Red for end
                radius = 10;
                fillOpacity = 0.8;
                tooltipContent = `${station.label} (Arrivée)`;
              } else if (isStep) {
                color = '#ff9900'; // Orange for steps
                radius = 9;
                fillOpacity = 0.7;
                tooltipContent = `${station.label} (Etape)`;
              }

              return (
                <React.Fragment key={station.id}>
                  <CircleMarker
                    center={[station.location.lat, station.location.lng]}
                    radius={radius}
                    pathOptions={{
                      color: color,
                      fillColor: color,
                      fillOpacity: fillOpacity,
                    }}
                  >
                    <Tooltip>{tooltipContent}</Tooltip>
                    <Popup>
                      <h4>{station.label} ({station.city})</h4>
                      <p>Utiliser comme :</p>
                      <button onClick={() => props.onSelectStart(station)}>Départ</button>
                      <button onClick={() => props.onSelectStep(station)}>Etape</button>
                      <button onClick={() => props.onSelectEnd(station)}>Arrivée</button>
                      <div className="route-creation">
                        <p>Ou créer un itinéraire :</p>
                        <button onClick={() => handleStationSelect(station)}>
                          {!fromStation ? 'Sélectionner comme point de départ' :
                            fromStation.id === station.id ? 'Déjà sélectionné' :
                              'Sélectionner comme destination'}
                        </button>
                      </div>
                    </Popup>
                  </CircleMarker>
                </React.Fragment>
              );
            }
          })}
        </LayerGroup>
      </MapContainer>
    </div>
  );
};

export interface MapListenerProps {
  onStateChange?: (mapState: MapState) => any;
  onZoomChange?: (zoom: number) => void;
}
const MapListener: FC<MapListenerProps> = (props) => {
  const map = useMap();
  useMapEvents({
    moveend: () => {
      const currentZoom = map.getZoom();

      if (props.onStateChange) {
        props.onStateChange({
          boundingBox: map.getBounds(),
          zoom: currentZoom,
        });
      }

      if (props.onZoomChange) {
        props.onZoomChange(currentZoom);
      }
    },
    click: (e) => map.setView(e.latlng, map.getZoom(), { animate: true }),
  });
  return null;
};

// Component to handle zooming to show the entire selected route
interface ItineraryBoundsHandlerProps {
  itinerary?: Itinerary;
  routeGeometries?: Record<string, {
    id: string;
    type: 'LineString';
    coordinates: LatLng[];
  }>;
}

const ItineraryBoundsHandler: FC<ItineraryBoundsHandlerProps> = ({ itinerary, routeGeometries }) => {
  const map = useMap();

  // Effect to zoom to the bounds of the selected route when the itinerary changes
  React.useEffect(() => {
    if (!itinerary || !routeGeometries) return;

    // Only proceed if we have a start and end point
    if (!itinerary.start || !itinerary.end) return;

    // Collect all points that are part of the itinerary (start, end, steps)
    const points: LatLng[] = [];

    // Add start point
    points.push(new LatLng(itinerary.start.location.lat, itinerary.start.location.lng));

    // Add step points
    itinerary.steps.forEach(step => {
      points.push(new LatLng(step.location.lat, step.location.lng));
    });

    // Add end point
    points.push(new LatLng(itinerary.end.location.lat, itinerary.end.location.lng));

    // Add route coordinates
    itinerary.legs.forEach(leg => {
      if (leg.type === LegType.HIKING && 'route' in leg) {
        const routeId = leg.route.id;
        const geometry = routeGeometries[routeId];
        if (geometry) {
          points.push(...geometry.coordinates);
        }
      }
    });

    // If we have points, create a bounds object and fit the map to it
    if (points.length > 0) {
      const bounds = points.reduce((acc, point) => acc.extend(point), new LatLng(points[0].lat, points[0].lng).toBounds(0));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12, animate: true });
    }
  }, [itinerary, routeGeometries, map]);

  return null;
};
