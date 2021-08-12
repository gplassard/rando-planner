import './style.scss'
import * as L from "leaflet";
import * as small from "./../data/small.json";

const map = L.map('mapid').setView([44.856614, 2.35], 7);
const osmLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', { // LIGNE 20
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19
});
map.addLayer(osmLayer);

const onEachFeature = (feature: any, layer: L.Layer) => {
  // does this feature have a property named popupContent?
  if (feature.properties && feature.properties.name) {
      layer.bindPopup(feature.properties.name);
  }
}

const randos = new L.LayerGroup();
map.addLayer(randos);
for (const feature of small.features) {
  L.geoJSON(feature as any, {onEachFeature}).addTo(randos);
}

setTimeout(() => {
  map.removeLayer(randos);
}, 5000)