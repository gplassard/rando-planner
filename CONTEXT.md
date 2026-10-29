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

## Data Pipeline

Raw datasets are downloaded and preprocessed by the pipeline in `scripts/data/` (`pnpm run data`, run weekly by the `update-data` GitHub Actions workflow, which commits refreshed data to `main` and triggers a website deploy):

- Hiking routes: magOSM WFS extract of OpenStreetMap hiking routes
- Train stations: SNCF "liste des gares" export

Outputs consumed by the app:

- `data/prepared/stations.json`: stations open to travellers, aggregated by UIC code
- `data/small_database.json`: hiking routes with computed bboxes

Raw downloads land in `data/raw/` (gitignored) and are never committed.

## File Layout

```
src/
├── model/          # Domain types
├── components/     # Map, Sidebar
├── hooks/          # useStations, useHikingRoutes, useItinerary
└── App.tsx         # Root

scripts/
└── data/           # Data pipeline: fetch, prepare, pipeline entrypoints

data/
├── raw/            # Downloaded raw datasets (gitignored)
├── prepared/stations.json
└── small_database.json
```

## Data Format

JSON: coordinates are [lng, lat]. Leaflet: LatLng(lat, lng), LatLngBounds(southWest, northEast).
