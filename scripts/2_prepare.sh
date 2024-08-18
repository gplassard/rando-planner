#!/bin/bash
set -ex

mkdir -p data/prepared
jq -c '.features[]' data/rando.geojson > data/rando_lines.json
#jq  '.features | map({id: .id, properties: .properties})' data/rando.json > data/database.json
#npx @tmcw/togeojson-cli data/rando.kml > data/rando.geojson
jq  '.features | map({id: .id, properties: .properties})' data/rando.geojson > data/database.json

jq '.features = .features[0:10]' data/rando.geojson > data/small.json

jq  '.features | map(select(.properties.voyageurs == "O")) | group_by(.properties.code_uic) | map({id: .[0].properties.code_uic, label: .[0].properties.libelle, lineIds: map(.properties.code_ligne), city: .[0].properties.commune, location: .[0].geometry.coordinates})' data/gares.geojson > data/prepared/stations.json
