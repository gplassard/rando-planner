#!/bin/bash
set -e

jq -c ".features[]" data/rando.geojson > data/rando_lines.json
#jq  ".features | map({id: .id, properties: .properties})" data/rando.json > data/database.json
#npx @tmcw/togeojson-cli data/rando.kml > data/rando.geojson
jq  ".features | map({id: .id, properties: .properties})" data/rando.geojson > data/database.json
jq  ".features | map({id: .id, name: .properties.name, from: .properties.from, to: .properties.to, bbox: .properties.bbox})" data/rando.geojson > data/small_database.json

jq ".features = .features[0:10]" data/rando.geojson > data/small.json