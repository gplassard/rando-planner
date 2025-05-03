import type { Point, LineString } from 'geojson';
import React, { FC } from 'react';
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
} from 'react-leaflet';
import { LatLng } from 'leaflet';
import { MapState } from '../model/MapState';
import { Station } from '../model/Station';
import { AugmentedRandoLight } from '../model/Rando';
import { Itinerary } from '../model/Itinerary';
import { LegType } from '../model/Leg';
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
  return (
    <div className="Map">
      <MapContainer center={[44.856614, 2.35]} zoom={7} scrollWheelZoom={false}>
        <MapListener {...props}></MapListener>
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
              const isSelected = props.itinerary?.legs.some(
                leg => leg.type === LegType.HIKING && 'route' in leg && leg.route.id === route.id,
              );

              // Apply different styles based on whether the route is selected or not
              const color = isSelected ? '#ff4500' : '#3388ff'; // Orange for selected, blue for available
              const weight = isSelected ? 5 : 3;
              const opacity = isSelected ? 0.9 : 0.6;

              return (
                <Polyline
                  key={route.id}
                  positions={geometry.coordinates}
                  color={color}
                  weight={weight}
                  opacity={opacity}
                >
                  <Tooltip>
                    <div style={{ fontWeight: 'bold' }}>
                      {route.name || `Route ${route.id}`}
                      {isSelected && ' (Selected)'}
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
              );
            })}
          </LayerGroup>
        )}

        {/* Display stations */}
        <LayerGroup>
          {props.stations.map((station) => {
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
                  </Popup>
                </CircleMarker>
              </React.Fragment>
            );
          })}
        </LayerGroup>
      </MapContainer>
    </div>
  );
};

export interface MapListenerProps {
  onStateChange?: (mapState: MapState) => any;
}
const MapListener: FC<MapListenerProps> = (props) => {
  const map = useMap();
  useMapEvents({
    moveend: () => {
      if (props.onStateChange) {
        props.onStateChange({
          boundingBox: map.getBounds(),
          zoom: map.getZoom(),
        });
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
