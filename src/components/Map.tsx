import type { Point } from 'geojson';
import { LatLngBounds } from 'leaflet';
import React, { FC } from 'react';
import {
  LayerGroup,
  MapContainer,
  TileLayer,
  GeoJSON,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';
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
  return (
    <MapContainer center={[44.856614, 2.35]} zoom={7} scrollWheelZoom={false}>
      <MapListener {...props}></MapListener>
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LayerGroup>
        {props.stations.map((station) => (
          <GeoJSON key={station.id} data={stationToGeoJson(station)}>
            <Tooltip>{station.label}</Tooltip>
          </GeoJSON>
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
