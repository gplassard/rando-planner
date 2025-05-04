#!/bin/bash
set -ex

# Create necessary directories
mkdir -p data/prepared

# Process hiking route data
echo "Processing hiking route data..."

# Extract individual features for line-by-line processing
jq -c '.features[]' data/rando.geojson > data/rando_lines.json

# Create a comprehensive database with all properties
jq '.features | map({
  id: .id,
  name: .properties.name,
  from: .properties.from,
  to: .properties.to,
  bbox: .properties.bbox,
  properties: {
    name: .properties.name,
    description: .properties.description,
    difficulty: (if .properties.sac_scale == "mountain_hiking" then "MODERATE"
                elif .properties.sac_scale == "demanding_mountain_hiking" then "DIFFICULT"
                elif .properties.sac_scale == "alpine_hiking" then "VERY_DIFFICULT"
                else "EASY" end),
    surface: (if .properties.surface == "paved" then "PAVED"
             elif .properties.surface == "gravel" then "GRAVEL"
             elif .properties.surface == "dirt" then "DIRT"
             elif .properties.surface == "rocky" then "ROCKY"
             else "MIXED" end),
    distance: (.properties.distance // null),
    estimatedTime: (if .properties.duration != null then (.properties.duration | tonumber * 60) else null end),
    ascent: (.properties.ascent // null),
    descent: (.properties.descent // null),
    maxElevation: (.properties.ele_max // null),
    minElevation: (.properties.ele_min // null),
    source: .properties.source,
    website: .properties.website,
    lastUpdated: .properties.last_update
  },
  geometry: {
    type: "LineString",
    coordinates: .geometry.coordinates
  }
})' data/rando.geojson > data/prepared/rando_database.json

# Create a smaller database with essential properties for faster loading
jq '.[] | {
  id: .id,
  name: .name,
  from: .from,
  to: .to,
  bbox: .bbox,
  properties: {
    difficulty: .properties.difficulty,
    distance: .properties.distance,
    estimatedTime: .properties.estimatedTime
  }
}' data/prepared/rando_database.json | jq -s '.' > data/prepared/small_database.json

# Create a sample file with 10 routes for testing
jq '.features = .features[0:10]' data/rando.geojson > data/prepared/small.json

# Process train station data
echo "Processing train station data..."

# Filter and transform train station data
jq '.features |
  map(select(.properties.voyageurs == "O")) |
  group_by(.properties.code_uic) |
  map({
    id: .[0].properties.code_uic,
    label: .[0].properties.libelle,
    lineIds: map(.properties.code_ligne),
    city: .[0].properties.commune,
    location: .[0].geometry.coordinates
  })' data/gares.geojson > data/prepared/stations.json

# Establish connections between stations and routes
echo "Establishing connections between stations and routes..."

# Create a temporary file with station locations
jq -c '.[] | {id: .id, lat: .location[1], lng: .location[0]}' data/prepared/stations.json > data/prepared/temp_stations.json

# Create a temporary file with route bounding boxes
jq -c '.[] | {id: .id, bbox: .bbox}' data/prepared/rando_database.json > data/prepared/temp_routes.json

# Create a connections file that maps stations to nearby routes
# This uses a simple approach: if a station is within or near a route's bounding box, they're connected
python3 - << 'EOF'
import json
import math
from collections import defaultdict

# Function to calculate distance between two points (in kilometers)
def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in kilometers
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat/2) * math.sin(dLat/2) + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon/2) * math.sin(dLon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

# Function to check if a point is within or near a bounding box
def is_near_bbox(lat, lng, bbox, max_distance_km=5):
    # Convert bbox from [minLng, minLat, maxLng, maxLat] to more readable form
    min_lng, min_lat, max_lng, max_lat = bbox

    # Check if point is within the bbox
    if min_lng <= lng <= max_lng and min_lat <= lat <= max_lat:
        return True

    # If not within, check distance to nearest edge
    closest_lat = max(min_lat, min(lat, max_lat))
    closest_lng = max(min_lng, min(lng, max_lng))

    # If the closest point is the point itself, it's outside the bbox
    if closest_lat == lat and closest_lng == lng:
        distance = haversine(lat, lng, closest_lat, closest_lng)
        return distance <= max_distance_km

    return True

# Load stations
stations = []
with open('data/prepared/temp_stations.json', 'r') as f:
    for line in f:
        stations.append(json.loads(line))

# Load routes
routes = []
with open('data/prepared/temp_routes.json', 'r') as f:
    for line in f:
        routes.append(json.loads(line))

# Create connections
station_to_routes = defaultdict(list)
route_to_stations = defaultdict(list)

for station in stations:
    for route in routes:
        if is_near_bbox(station['lat'], station['lng'], route['bbox']):
            station_to_routes[station['id']].append(route['id'])
            route_to_stations[route['id']].append(station['id'])

# Save connections
connections = {
    'stationToRoutes': {s_id: routes for s_id, routes in station_to_routes.items()},
    'routeToStations': {r_id: stations for r_id, stations in route_to_stations.items()}
}

with open('data/prepared/connections.json', 'w') as f:
    json.dump(connections, f)

# Update stations with connected routes
updated_stations = []
with open('data/prepared/stations.json', 'r') as f:
    stations_data = json.load(f)
    for station in stations_data:
        station_id = station['id']
        if station_id in station_to_routes:
            station['connectedRoutes'] = station_to_routes[station_id]
        else:
            station['connectedRoutes'] = []
        updated_stations.append(station)

with open('data/prepared/stations.json', 'w') as f:
    json.dump(updated_stations, f)

# Update routes with connected stations
updated_routes = []
with open('data/prepared/small_database.json', 'r') as f:
    routes_data = json.load(f)
    for route in routes_data:
        route_id = route['id']
        if route_id in route_to_stations:
            if 'properties' not in route:
                route['properties'] = {}
            route['properties']['connectedStations'] = route_to_stations[route_id]
        else:
            if 'properties' not in route:
                route['properties'] = {}
            route['properties']['connectedStations'] = []
        updated_routes.append(route)

with open('data/prepared/small_database.json', 'w') as f:
    json.dump(updated_routes, f)

print(f"Created connections between {len(station_to_routes)} stations and {len(route_to_stations)} routes")
EOF

# Create spatial indices for efficient searching
echo "Creating spatial indices..."

# Create a grid-based spatial index for routes
python3 - << 'EOF'
import json
import math

# Define grid parameters
GRID_SIZE_DEG = 0.5  # Grid cell size in degrees (roughly 50km at the equator)

# Function to get grid cell key for a point
def get_cell_key(lat, lng):
    lat_cell = math.floor(lat / GRID_SIZE_DEG)
    lng_cell = math.floor(lng / GRID_SIZE_DEG)
    return f"{lat_cell}:{lng_cell}"

# Function to get all grid cells that a bounding box intersects
def get_cells_for_bbox(bbox):
    min_lng, min_lat, max_lng, max_lat = bbox

    # Get cell coordinates for corners
    min_lat_cell = math.floor(min_lat / GRID_SIZE_DEG)
    min_lng_cell = math.floor(min_lng / GRID_SIZE_DEG)
    max_lat_cell = math.floor(max_lat / GRID_SIZE_DEG)
    max_lng_cell = math.floor(max_lng / GRID_SIZE_DEG)

    # Generate all cell keys in the rectangle
    cells = []
    for lat_cell in range(min_lat_cell, max_lat_cell + 1):
        for lng_cell in range(min_lng_cell, max_lng_cell + 1):
            cells.append(f"{lat_cell}:{lng_cell}")

    return cells

# Load routes
with open('data/prepared/rando_database.json', 'r') as f:
    routes = json.load(f)

# Create grid index
grid_index = {}
route_cells = {}  # Maps route IDs to their grid cells

for route in routes:
    route_id = route['id']
    bbox = route['bbox']

    # Get all cells this route intersects
    cells = get_cells_for_bbox(bbox)
    route_cells[route_id] = cells

    # Add route to each cell
    for cell in cells:
        if cell not in grid_index:
            grid_index[cell] = []
        grid_index[cell].append(route_id)

# Load stations
with open('data/prepared/stations.json', 'r') as f:
    stations = json.load(f)

# Add grid cell information to stations
for station in stations:
    lat = station['location'][1]
    lng = station['location'][0]
    cell_key = get_cell_key(lat, lng)
    station['gridCell'] = cell_key

# Save updated stations
with open('data/prepared/stations.json', 'w') as f:
    json.dump(stations, f)

# Save spatial indices
spatial_indices = {
    'gridIndex': grid_index,
    'routeCells': route_cells,
    'gridSizeDeg': GRID_SIZE_DEG
}

with open('data/prepared/spatial_indices.json', 'w') as f:
    json.dump(spatial_indices, f)

print(f"Created spatial index with {len(grid_index)} grid cells")
EOF

# Create a KD-tree index for nearest neighbor searches
python3 - << 'EOF'
import json
import numpy as np
from scipy.spatial import KDTree

# Load stations
with open('data/prepared/stations.json', 'r') as f:
    stations = json.load(f)

# Extract coordinates for KD-tree
coords = []
station_ids = []
for station in stations:
    # Convert to [lat, lng] for better distance calculations
    coords.append([station['location'][1], station['location'][0]])
    station_ids.append(station['id'])

# Create KD-tree
kdtree = KDTree(coords)

# Save KD-tree data
kdtree_data = {
    'coords': coords,
    'stationIds': station_ids
}

with open('data/prepared/kdtree_data.json', 'w') as f:
    json.dump(kdtree_data, f)

print(f"Created KD-tree index for {len(stations)} stations")
EOF

# Clean up temporary files
rm -f data/prepared/temp_stations.json data/prepared/temp_routes.json

echo "Data preparation complete!"
