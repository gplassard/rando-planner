import type { Point } from 'geojson';
import { DivIcon, Icon, LatLngBounds, LatLngExpression, StyleFunction } from 'leaflet';
import React, { FC } from 'react';
import {
  LayerGroup,
  MapContainer,
  TileLayer,
  GeoJSON,
  Tooltip,
  useMap,
  useMapEvents, Marker, MarkerProps,
} from 'react-leaflet';
import marker from '../../public/marker.svg';
import { Station } from '../model/Station';

interface Props extends MapListenerProps{
  stations: Station[];
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
  const icon = new DivIcon({
    html: `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" >
    <path class="poi" d="M16 30C12 22 10 20 10 14C10 9 13 6 16 6C19 6 22 9 22 14C22 20 20 22 16 30Z"/>
    <circle cx="16" cy="14" r="2.5" fill="#fff"/>
</svg>
`,
  });
  return (
    <MapContainer center={[44.856614, 2.35]} zoom={7} scrollWheelZoom={false}>
      <MapListener {...props}></MapListener>
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LayerGroup>
        {props.stations.map((station) => (
          <Marker key={station.id} position={station.location} icon={icon}>
            <Tooltip>{station.label}</Tooltip>
          </Marker>
        ))}
      </LayerGroup>
    </MapContainer>
  );
};

export interface MapListenerProps {
  onMove?: (bbox: LatLngBounds) => any;
}
const MapListener: FC<MapListenerProps> = (props) => {
  const map = useMap();
  useMapEvents({
    moveend: () => {
      if (props.onMove) {
        props.onMove(map.getBounds());
      }
    },
  });
  return null;
};
