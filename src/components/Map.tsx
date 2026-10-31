import type { Point } from 'geojson';
import type { Layer } from 'leaflet';
import { divIcon } from 'leaflet';
import { leafletLayer, LineSymbolizer } from 'protomaps-leaflet';
import React, { FC, useEffect } from 'react';
import {
  LayerGroup,
  MapContainer,
  Marker,
  TileLayer,
  GeoJSON,
  Tooltip,
  Popup,
  useMap,
} from 'react-leaflet';
import hikingRoutesPmtilesUrl from '../../data/prepared/hiking-routes.pmtiles?url';
import { FocusTarget } from '../model/FocusTarget';
import { Itinerary } from '../model/Itinerary';
import { Station } from '../model/Station';
import './Map.scss';

interface Props {
  stations: Station[];
  itinerary: Itinerary;
  focusTarget: FocusTarget | null;
  onSelectStart: (station: Station) => any;
  onSelectEnd: (station: Station) => any;
  onSelectStep: (station: Station) => any;
}

/**
 * Full hiking trail geometry, served as a PMTiles archive and rendered as a
 * canvas vector tile layer (see docs/adr/2026-10-31-hiking-routes-geometry-pmtiles.md).
 */
const HikingRoutesLayer: FC = () => {
  const map = useMap();
  useEffect(() => {
    const layer = leafletLayer({
      url: hikingRoutesPmtilesUrl,
      backgroundColor: 'transparent',
      paintRules: [
        {
          dataLayer: 'hiking_routes',
          symbolizer: new LineSymbolizer({ color: '#2e7d32', width: 2, opacity: 0.9 }),
        },
      ],
    });
    layer.addTo(map);
    return () => {
      map.removeLayer(layer as unknown as Layer);
    };
  }, [map]);
  return null;
};

/**
 * Applies focus requests (search bar, timeline, drawer) to the map: the
 * search is the only user-facing way to center the map (wireframes v1).
 */
const FocusController: FC<{ target: FocusTarget | null }> = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (!target) {
      return;
    }
    if (target.kind === 'point') {
      const [lat, lng] = target.center;
      map.flyTo([lat, lng], target.zoom ?? Math.max(map.getZoom(), 13), { animate: true });
    } else {
      const [minLng, minLat, maxLng, maxLat] = target.bounds;
      map.flyToBounds([[minLat, minLng], [maxLat, maxLng]], { padding: [40, 40], animate: true });
    }
  }, [target, map]);
  return null;
};

const markerIcon = (kind: 'start' | 'step' | 'end', label: string) => divIcon({
  className: `itinerary-marker ${kind}`,
  html: `<span>${label}</span>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

/** Markers for the selected start / steps / end of the current itinerary. */
const ItineraryMarkers: FC<{ itinerary: Itinerary }> = ({ itinerary }) => (
  <LayerGroup>
    {itinerary.start && (
      <Marker position={itinerary.start.location} icon={markerIcon('start', 'D')}>
        <Tooltip direction="top" offset={[0, -14]}>Départ : {itinerary.start.label}</Tooltip>
      </Marker>
    )}
    {itinerary.steps.map((step, index) => (
      <Marker key={step.id} position={step.location} icon={markerIcon('step', String(index + 1))}>
        <Tooltip direction="top" offset={[0, -14]}>Étape {index + 1} : {step.label}</Tooltip>
      </Marker>
    ))}
    {itinerary.end && (
      <Marker position={itinerary.end.location} icon={markerIcon('end', 'A')}>
        <Tooltip direction="top" offset={[0, -14]}>Arrivée : {itinerary.end.label}</Tooltip>
      </Marker>
    )}
  </LayerGroup>
);

function stationToGeoJson(station: Station): Point {
  return {
    ...station,
    type: 'Point',
    coordinates: [
      station.location.lng,
      station.location.lat,
    ],
  };
}

export const Map: FC<Props> = (props: Props) => {
  return (
    <div className="Map">
      <MapContainer center={[46.6, 2.4]} zoom={6}>
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FocusController target={props.focusTarget} />
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
        <ItineraryMarkers itinerary={props.itinerary} />
        <HikingRoutesLayer />
      </MapContainer>
    </div>
  );
};
