#!/bin/bash
set -e

mkdir -p data/
# lien de l'export https://www.data.gouv.fr/fr/datasets/itineraires-de-randonnee-dans-openstreetmap/#/resources/42beb276-d262-410b-b7ae-922b60854f14
wget -O data/rando.geojson "https://magosm.magellium.com/geoserver/wfs?request=GetFeature&version=2.0.0&count=5000000&outputFormat=application/json&typeName=magosm:france_hiking_foot_routes_line&srsName=EPSG:4326&bbox=-1538728.3025657746,4558105.012117158,2570526.338045301,6805965.139927621"
