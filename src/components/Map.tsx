import type { Point } from 'geojson';
import React, { FC, useContext, useEffect, useMemo, useState } from 'react';
import {
  LayerGroup,
  MapContainer,
  TileLayer,
  GeoJSON,
  Tooltip,
  useMap,
  useMapEvents, Popup, Rectangle, Polygon, Polyline,
} from 'react-leaflet';
import { MapState } from '../model/MapState';
import { Station } from '../model/Station';
import './Map.scss';
import { useHikingRoutes } from '../hooks/useHikingRoutes';
import { Map as LeafletMap } from 'leaflet';
import { stringHashCode } from '../utils/string-hashcode';

interface Props extends MapListenerProps{
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

const colors = ['green', 'blue', 'red', 'cyan', 'yellow', 'orange', 'black', 'purple', 'pink', 'lime'];

export const Map: FC<Props> = (props: Props) => {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const { hikingRoutes } = useHikingRoutes(map ? ({
    boundingBox: map.getBounds(),
    zoom: map.getZoom(),
  }) : null);

  const displayMap = useMemo(() => <MapContainer
    center={[44.856614, 2.35]}
    ref={setMap}
    zoom={6}
  >
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
    <LayerGroup>
      {hikingRoutes.map(r => (
        <Polyline positions={r.approximatePath} pathOptions={{ color: colors[stringHashCode(r.id) % colors.length] }}>
          <Tooltip>
            {r.name} {r.from && r.to && <>{r.from} - {r.to}</>}
          </Tooltip>
        </Polyline>
      ))}
    </LayerGroup>
  </MapContainer>, [hikingRoutes]);


  return (
    <div className="Map">
      {displayMap}
    </div>
  );
};

export interface MapListenerProps {
  onStateChange?: (mapState: MapState) => any;
}
const MapListener: FC<MapListenerProps> = (props) => {
  const map = useMap();
  useEffect(() => {
    // ugly trigger a move in order for the rest of the program to trigger a mapState update
    map.setZoom(7, { animate: true });
  }, []);
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
