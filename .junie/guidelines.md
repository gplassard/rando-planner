# Rando Planner Development Guidelines

This document provides specific information for developers working on the Rando Planner project.

## Build/Configuration Instructions

### Prerequisites
- Node.js (version specified in package.json)
- pnpm (version specified in package.json)
- jq (command-line JSON processor, required for data preparation scripts)
- wget (required for data download scripts)

### Project Setup
1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start development server:
   ```bash
   pnpm dev
   ```

3. Build for production:
   ```bash
   pnpm build
   ```

4. Preview production build:
   ```bash
   pnpm serve
   ```

### Data Preparation
The application requires specific data files to function properly. The data preparation process involves two steps:

1. Download raw data:
   ```bash
   ./scripts/1_download.sh
   ```
   This script downloads:
   - Train station data from data.gouv.fr
   - Hiking route data from magosm.magellium.com (Note: This URL may need to be updated as it's marked as not working anymore)

2. Process the data:
   ```bash
   ./scripts/2_prepare.sh
   ```
   This script processes the raw data using jq to create:
   - rando_lines.json: Individual features from rando.geojson
   - database.json: ID and properties from rando.geojson
   - small_database.json: Subset of properties (id, name, from, to, bbox)
   - small.json: First 10 features from rando.geojson (for testing)
   - stations.json: Filtered and processed train station data

## Project Structure

### Key Directories
- `src/`: Source code
  - `components/`: React components
  - `hooks/`: React hooks
  - `model/`: TypeScript interfaces and types
- `data/`: Data files
  - `prepared/`: Processed data files
- `scripts/`: Data preparation scripts
- `public/`: Static assets
- `dist/`: Build output

### Key Files
- `vite.config.ts`: Vite configuration (sets base URL to '/rando-planner/')
- `.projenrc.ts`: Projen configuration for project generation
- `package.json`: Dependencies and scripts

## Development Information

### Technology Stack
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Project Configuration**: Projen
- **Map Library**: Leaflet via react-leaflet
- **Styling**: SCSS

### Application Architecture
The application follows a typical React architecture:
- **Components**: Reusable UI elements (Map, Sidebar)
- **Hooks**: State management and data fetching (useStations, useItinerary)
- **Models**: TypeScript interfaces for data structures (Station, Itinerary)

### Data Flow
1. Station data is loaded from the prepared JSON file
2. The Map component displays stations as GeoJSON points
3. Users can select stations as start, steps, or end points
4. The Sidebar displays the current itinerary
5. The application state is managed using React hooks

### Base URL Configuration
The application is configured to be served from the '/rando-planner/' path (see vite.config.ts). If deploying to a different path, update this configuration.

### Known Issues
- The URL for downloading hiking route data in scripts/1_download.sh is marked as not working anymore and may need to be updated.

### Useful Resources
- [GraphHopper](https://www.graphhopper.com/) - Routing service
- [data.gouv.fr](https://www.data.gouv.fr/fr/datasets/itineraires-de-randonnee-dans-openstreetmap/#) - Dataset source
- [Leaflet](https://leafletjs.com/) - Map library
- [React Leaflet](https://react-leaflet.js.org/docs/) - React components for Leaflet
