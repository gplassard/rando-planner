import type { Point } from 'geojson';
import type { LatLng, Layer, LeafletMouseEvent, PopupEvent } from 'leaflet';
import { divIcon, popup as leafletPopup, tooltip as leafletTooltip } from 'leaflet';
import { leafletLayer, LineSymbolizer } from 'protomaps-leaflet';
import type { JsonObject, PickedFeature } from 'protomaps-leaflet';
import React, { FC, useEffect, useRef, useState } from 'react';
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
import { isShortTrailName, TrailNameSymbolizer } from './TrailNameSymbolizer';
import hikingRoutesPmtilesUrl from '../../data/prepared/hiking-routes.pmtiles?url';
import { routeInfo } from '../lib/routeInfo';
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
 * Zoom from which long hiking route names are labeled near the trace (short
 * names — GR codes and the like — are labeled earlier, from
 * SHORT_TRAIL_LABEL_MIN_ZOOM)
 */
const ROUTE_LABEL_MIN_ZOOM = 11;

/**
 * Zoom from which short hiking route names (GR codes) are labeled
 */
const SHORT_TRAIL_LABEL_MIN_ZOOM = 10;

/**
 * Max zoom inside the hiking routes PMTiles archive (tippecanoe
 * `--maximum-zoom` in scripts/data/tiles.ts). protomaps-leaflet assumes data
 * tiles up to z15 unless told otherwise: past Leaflet zoom 14 it would request
 * nonexistent z14+ tiles and the trails would disappear. With this cap it
 * overzooms the z13 tiles instead.
 */
const ROUTE_DATA_MAX_ZOOM = 13;

/** Brush radius (screen px) used to pick a hiking route under the cursor. */
const ROUTE_PICK_BRUSH_PX = 14;

/** Trace color of the default (unselected) hiking routes. */
const ROUTE_COLOR = '#2e7d32';

/**
 * Trace color and width of the selected route (the one whose info popup is
 * open): drawn on top of the base trace, thicker and in a contrasting accent.
 */
const ROUTE_SELECTED_COLOR = '#f57c00';
const ROUTE_SELECTED_WIDTH = 4;

/** Route id read from tile properties (see `--include id` in scripts/data/tiles.ts). */
const routeIdOf = (props: JsonObject): string | null =>
  typeof props.id === 'string' ? props.id : null;

/** Builds the hover tooltip content (name + endpoints) without HTML injection. */
const routeTooltipContent = (props: JsonObject): HTMLElement => {
  const info = routeInfo(props);
  const content = document.createElement('div');
  const title = document.createElement('strong');
  title.textContent = info.name;
  content.appendChild(title);
  if (info.endpoints) {
    const line = document.createElement('div');
    line.className = 'route-endpoints';
    line.textContent = info.endpoints;
    content.appendChild(line);
  }
  return content;
};

/** Builds the click popup content (name, ref, endpoints and tagged metrics). */
const routePopupContent = (props: JsonObject): HTMLElement => {
  const info = routeInfo(props);
  const content = routeTooltipContent(props);
  const details = document.createElement('ul');
  details.className = 'route-details';
  const addDetail = (label: string, value: string): void => {
    const item = document.createElement('li');
    item.textContent = `${label} : ${value}`;
    details.appendChild(item);
  };
  if (info.ref) {
    addDetail('Balise', info.ref);
  }
  if (info.distanceKm !== null) {
    addDetail('Distance', `${info.distanceKm.toLocaleString('fr-FR')} km`);
  }
  if (info.duration) {
    addDetail('Durée', info.duration);
  }
  if (info.roundtrip) {
    addDetail('Type', 'boucle');
  }
  if (details.firstChild) {
    content.appendChild(details);
  }
  return content;
};

/**
 * Full hiking trail geometry, served as a PMTiles archive and rendered as a
 * canvas vector tile layer (see docs/adr/2026-10-31-hiking-routes-geometry-pmtiles.md).
 * Besides the trace, route names are labeled at the midpoint of the trail
 * (from ROUTE_LABEL_MIN_ZOOM, GR codes from SHORT_TRAIL_LABEL_MIN_ZOOM), a
 * tooltip shows name + endpoints on hover and clicking a route opens a popup
 * with the details available in the tiles (name, ref, endpoints, distance,
 * duration, loop), see routePopupContent. While that popup is open, every
 * tile fragment of the clicked route is re-drawn on top of the base trace in
 * the accent color, thicker (bold).
 */
const HikingRoutesLayer: FC = () => {
  const map = useMap();
  /**
   * Id of the selected route (tile property `id`). Kept in a ref, not state:
   * the paint-rule filter below is built once per layer and must read the
   * current selection without being re-created.
   */
  const selectedRouteRef = useRef<string | null>(null);
  const layerRef = useRef<ReturnType<typeof leafletLayer> | null>(null);

  /** Repaints the loaded tiles after the selected route changed. */
  const setSelectedRoute = (id: string | null): void => {
    if (selectedRouteRef.current === id) {
      return;
    }
    selectedRouteRef.current = id;
    layerRef.current?.rerenderTiles();
  };

  useEffect(() => {
    const layer = leafletLayer({
      url: hikingRoutesPmtilesUrl,
      maxDataZoom: ROUTE_DATA_MAX_ZOOM,
      backgroundColor: 'transparent',
      paintRules: [
        {
          dataLayer: 'hiking_routes',
          symbolizer: new LineSymbolizer({ color: ROUTE_COLOR, width: 2, opacity: 0.9 }),
        },
        {
          dataLayer: 'hiking_routes',
          filter: (_zoom, feature) => selectedRouteRef.current !== null
            && feature.props.id === selectedRouteRef.current,
          symbolizer: new LineSymbolizer({
            color: ROUTE_SELECTED_COLOR,
            width: ROUTE_SELECTED_WIDTH,
            opacity: 1,
          }),
        },
      ],
      labelRules: [
        {
          dataLayer: 'hiking_routes',
          minzoom: SHORT_TRAIL_LABEL_MIN_ZOOM,
          filter: (_zoom, feature) => isShortTrailName(feature),
          symbolizer: new TrailNameSymbolizer(),
        },
        {
          dataLayer: 'hiking_routes',
          minzoom: ROUTE_LABEL_MIN_ZOOM,
          filter: (_zoom, feature) => !isShortTrailName(feature),
          symbolizer: new TrailNameSymbolizer(),
        },
      ],
    });
    layerRef.current = layer;
    layer.addTo(map);

    // The layer renders to canvas, so hover and click picking go through its
    // feature query; the tooltip and popup are managed imperatively.
    const hoverTooltip = leafletTooltip({
      direction: 'top',
      offset: [0, -10],
      className: 'hiking-route-tooltip',
      opacity: 1,
    });
    const routePopup = leafletPopup({ className: 'hiking-route-popup' });
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

    // Picks the most relevant route under a geographic position: a named one
    // when several route fragments overlap the brush, the first one otherwise.
    const pickRoute = (latlng: LatLng): PickedFeature | undefined => {
      const picked = layer.queryTileFeaturesDebug(latlng.lng, latlng.lat, ROUTE_PICK_BRUSH_PX);
      // queryTileFeaturesDebug keys the result map by *source* name — the
      // empty string for this single-PMTiles layer — not by the in-tile layer
      // name ('hiking_routes', which only exists for the paint/label rules).
      const features = [...picked.values()].flat();
      return features.find(f => typeof f.feature.props.name === 'string' && f.feature.props.name)
        ?? features[0];
    };

    const pick = (e: LeafletMouseEvent) => {
      const best = pickRoute(e.latlng);
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

    // Clicking a route opens its info popup and selects it (bold accent trace
    // until the popup closes). Clicks that landed on an interactive layer (gare
    // markers, which have their own popup) keep their default behavior; clicking
    // away from any route simply lets Leaflet close the popup
    // (closePopupOnClick).
    const onMapClick = (e: LeafletMouseEvent) => {
      const target = e.originalEvent.target as Element | null;
      if (target?.closest?.('.leaflet-interactive')) {
        return;
      }
      hideTooltip();
      const best = pickRoute(e.latlng);
      if (!best) {
        return;
      }
      setSelectedRoute(routeIdOf(best.feature.props));
      routePopup.setContent(routePopupContent(best.feature.props));
      routePopup.setLatLng(e.latlng);
      routePopup.openOn(map);
    };

    // Closing the route popup (Close button, click away, or another popup such
    // as a gare's taking its place) clears the selection highlight.
    const onPopupClose = (e: PopupEvent) => {
      if (e.popup === routePopup) {
        setSelectedRoute(null);
      }
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
    map.on('click', onMapClick);
    map.on('popupclose', onPopupClose);
    map.on('mouseout', hideTooltip);
    map.on('zoomstart', hideTooltip);
    return () => {
      if (frame !== 0) {
        cancelAnimationFrame(frame);
      }
      map.off('mousemove', onMouseMove);
      map.off('click', onMapClick);
      map.off('popupclose', onPopupClose);
      map.off('mouseout', hideTooltip);
      map.off('zoomstart', hideTooltip);
      hideTooltip();
      if (map.hasLayer(routePopup)) {
        map.removeLayer(routePopup);
      }
      map.removeLayer(layer as unknown as Layer);
      layerRef.current = null;
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
