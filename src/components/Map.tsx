import type { Point } from 'geojson';
import type { Layer, LeafletMouseEvent } from 'leaflet';
import { divIcon, tooltip as leafletTooltip } from 'leaflet';
import { leafletLayer, LineLabelPlacement, LineLabelSymbolizer, LineSymbolizer } from 'protomaps-leaflet';
import type { JsonObject } from 'protomaps-leaflet';
import React, { FC, useEffect, useState } from 'react';
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
 * Zoom from which gare markers are drawn
 */
const STATIONS_MIN_ZOOM = 9;

/**
 * Zoom from which hiking route names are labeled along the trace
 */
const ROUTE_LABEL_MIN_ZOOM = 11;

/** Brush radius (screen px) used to pick a hiking route under the cursor. */
const ROUTE_HOVER_BRUSH_PX = 14;

/** Builds the hover tooltip content (name + endpoints) without HTML injection. */
const routeTooltipContent = (props: JsonObject): HTMLElement => {
  const name = typeof props.name === 'string' && props.name ? props.name : 'Sentier sans nom';
  const endpoints = [props.from, props.to]
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .join(' → ');
  const content = document.createElement('div');
  const title = document.createElement('strong');
  title.textContent = name;
  content.appendChild(title);
  if (endpoints) {
    const line = document.createElement('div');
    line.className = 'route-endpoints';
    line.textContent = endpoints;
    content.appendChild(line);
  }
  return content;
};

/**
 * Full hiking trail geometry, served as a PMTiles archive and rendered as a
 * canvas vector tile layer (see docs/adr/2026-10-31-hiking-routes-geometry-pmtiles.md).
 * Besides the trace, route names are labeled along the line from
 * ROUTE_LABEL_MIN_ZOOM and a tooltip shows name + endpoints on hover.
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
      labelRules: [
        {
          dataLayer: 'hiking_routes',
          minzoom: ROUTE_LABEL_MIN_ZOOM,
          symbolizer: new LineLabelSymbolizer({
            labelProps: ['name'],
            fill: '#1b5e20',
            stroke: 'rgba(255, 255, 255, 0.85)',
            width: 3,
            fontSize: 11,
            fontWeight: 600,
            maxLabelChars: 40,
            repeatDistance: 250,
            position: LineLabelPlacement.Center,
          }),
        },
      ],
    });
    layer.addTo(map);

    // The layer renders to canvas, so hover picking goes through its feature
    // query; the tooltip is managed imperatively.
    const hoverTooltip = leafletTooltip({
      direction: 'top',
      offset: [0, -10],
      className: 'hiking-route-tooltip',
      opacity: 1,
    });
    let pending: LeafletMouseEvent | null = null;
    let frame = 0;
    let lastX = -1;
    let lastY = -1;

    const hideTooltip = () => {
      if (map.hasLayer(hoverTooltip)) {
        map.removeLayer(hoverTooltip);
      }
      map.getContainer().style.cursor = '';
    };

    const pick = (e: LeafletMouseEvent) => {
      const picked = layer.queryTileFeaturesDebug(e.latlng.lng, e.latlng.lat, ROUTE_HOVER_BRUSH_PX);
      const features = picked.get('hiking_routes') ?? [];
      const best = features.find(f => typeof f.feature.props.name === 'string' && f.feature.props.name)
        ?? features[0];
      if (!best) {
        hideTooltip();
        return;
      }
      hoverTooltip.setContent(routeTooltipContent(best.feature.props));
      hoverTooltip.setLatLng(e.latlng);
      if (!map.hasLayer(hoverTooltip)) {
        hoverTooltip.addTo(map);
      }
      map.getContainer().style.cursor = 'pointer';
    };

    // Coalesce mousemove events into one picking query per frame, and skip
    // queries when the cursor barely moved.
    const onMouseMove = (e: LeafletMouseEvent) => {
      pending = e;
      if (frame === 0) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          const ev = pending;
          pending = null;
          if (!ev) {
            return;
          }
          const p = ev.containerPoint;
          if (Math.abs(p.x - lastX) < 3 && Math.abs(p.y - lastY) < 3) {
            return;
          }
          lastX = p.x;
          lastY = p.y;
          pick(ev);
        });
      }
    };

    map.on('mousemove', onMouseMove);
    map.on('mouseout', hideTooltip);
    map.on('zoomstart', hideTooltip);
    return () => {
      if (frame !== 0) {
        cancelAnimationFrame(frame);
      }
      map.off('mousemove', onMouseMove);
      map.off('mouseout', hideTooltip);
      map.off('zoomstart', hideTooltip);
      hideTooltip();
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

interface StationsLayerProps {
  stations: Station[];
  onSelectStart: (station: Station) => any;
  onSelectEnd: (station: Station) => any;
  onSelectStep: (station: Station) => any;
}

/**
 * Gare markers, rendered only from STATIONS_MIN_ZOOM on: at lower zooms all
 * ~3000 stations at once are unreadable and slow down the map.
 */
const StationsLayer: FC<StationsLayerProps> = (props) => {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  useEffect(() => {
    const onZoomEnd = () => setZoom(map.getZoom());
    map.on('zoomend', onZoomEnd);
    return () => {
      map.off('zoomend', onZoomEnd);
    };
  }, [map]);
  if (zoom < STATIONS_MIN_ZOOM) {
    return null;
  }
  return (
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
  );
};

export const Map: FC<Props> = (props: Props) => {
  return (
    <div className="Map">
      <MapContainer center={[46.6, 2.4]} zoom={6}>
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FocusController target={props.focusTarget} />
        <StationsLayer
          stations={props.stations}
          onSelectStart={props.onSelectStart}
          onSelectStep={props.onSelectStep}
          onSelectEnd={props.onSelectEnd}
        />
        <ItineraryMarkers itinerary={props.itinerary} />
        <HikingRoutesLayer />
      </MapContainer>
    </div>
  );
};
