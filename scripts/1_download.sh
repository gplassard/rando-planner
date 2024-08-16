#!/bin/bash
set -e

mkdir -p data/
# lien de l'export https://www.data.gouv.fr/fr/datasets/r/dc517700-4534-48fb-ab14-6c232b1a7562
wget -O data/gares.geojson "https://www.data.gouv.fr/fr/datasets/r/dc517700-4534-48fb-ab14-6c232b1a7562"
# lien de l'export https://www.data.gouv.fr/fr/datasets/itineraires-de-randonnee-dans-openstreetmap/#/resources/42beb276-d262-410b-b7ae-922b60854f14
# need to be fixed, doesn't work anymore...
wget -O data/rando.geojson "https://magosm.magellium.com/geoserver/wfs?request=GetFeature&version=2.0.0&count=5000000&outputFormat=application/json&typeName=magosm:france_hiking_foot_routes_line&srsName=EPSG:4326&bbox=-1538728.3025657746,4558105.012117158,2570526.338045301,6805965.139927621"
