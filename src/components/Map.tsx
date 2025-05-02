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
                    {route.name || route.id}
                    {isSelected && ' (Selected)'}
                  </Tooltip>
                </Polyline>
              );
            })}
          </LayerGroup>
        )}

        {/* Display stations */}
        <LayerGroup>
          {props.stations.map((station) => (
            <GeoJSON
              key={station.id}
              data={stationToGeoJson(station)}>
              <Tooltip>{station.label}</Tooltip>
              <Popup>
                <h4>{station.label} ({station.city})</h4>
                <p>Utiliser comme :</p>
                <button onClick={() => props.onSelectStart(station)}>Départ</button>
                <button onClick={() => props.onSelectStep(station)}>Etape</button>
                <button onClick={() => props.onSelectEnd(station)}>Arrivée</button>
              </Popup>
            </GeoJSON>
          ))}
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
