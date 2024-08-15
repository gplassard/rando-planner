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
  Rectangle,
} from 'react-leaflet';

interface Props {
  features: any[];
  onMove?: (bbox: LatLngBounds) => any;
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
        {props.features.map((feature) => (
          <GeoJSON key={feature.id} data={feature as any}>
            <Tooltip>{feature.properties.name}</Tooltip>
          </GeoJSON>
        ))}
      </LayerGroup>

      {props.features.map((feature) => (
        <Rectangle
          key={feature.id}
          bounds={[
            [feature.properties.bbox[1], feature.properties.bbox[0]],
            [feature.properties.bbox[3], feature.properties.bbox[2]],
          ]}
        ></Rectangle>
      ))}
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
