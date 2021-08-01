#!/bin/bash
set -e

mkdir -p data/
wget -O data/rando.json https://www.data.gouv.fr/fr/datasets/r/42beb276-d262-410b-b7ae-922b60854f14
## lattitude & longitude are trash in json and metadata are trash in kml
##KML is not complete
wget -O data/rando.kml https://www.data.gouv.fr/fr/datasets/r/8bb987be-e152-4d64-931c-00b9cc4e43e9