import type { Point } from 'geojson';
import React, { FC } from 'react';
import {
  LayerGroup,
  MapContainer,
  TileLayer,
  GeoJSON,
  Tooltip,
  useMap,
  useMapEvents, Popup,
} from 'react-leaflet';
import { MapState } from '../model/MapState';
import { Station } from '../model/Station';
import './Map.scss';

interface Props extends MapListenerProps {
  stations: Station[];
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
