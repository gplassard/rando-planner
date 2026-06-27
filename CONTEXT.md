# Rando Planner - Project Context

## Purpose
Hiking itinerary planner for France. Users select train stations as start, waypoints, and end points on an interactive map. Combines public transport access with hiking routes.

## Domain Terminology

- **Station**: Train station. Has id, label, city, lineIds, location (LatLng)
- **HikingRoute**: Hiking trail with id, name, from, to, bounds (LatLngBounds)
- **Itinerary**: start (Station), end (Station), steps (Station[])
- **MapState**: zoom (number), boundingBox (LatLngBounds)

## Architecture

Map (Leaflet) and Sidebar (React). Stations loaded from `data/prepared/stations.json`. Hiking routes from `data/small_database.json`. State managed via React hooks in App component.

## File Layout

```
src/
├── model/          # Domain types
├── components/     # Map, Sidebar
├── hooks/          # useStations, useHikingRoutes, useItinerary
└── App.tsx         # Root

data/
├── prepared/stations.json
└── small_database.json
```

## Data Format

JSON: coordinates are [lng, lat]. Leaflet: LatLng(lat, lng), LatLngBounds(southWest, northEast).
