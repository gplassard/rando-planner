#!/bin/bash
set -e

jq -c ".features[]" data/rando.json > data/rando_lines.json
jq  ".features | map({id: .id, properties: .properties})" data/rando.json > data/database.json
npx @tmcw/togeojson-cli data/rando.kml > data/rando.geojson