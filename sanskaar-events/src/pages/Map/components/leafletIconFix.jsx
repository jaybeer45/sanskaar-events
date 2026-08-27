// src/pages/Map/components/leafletIconFix.js
// Vite doesn't resolve Leaflet's default marker image paths correctly.
// Import this once (in LeafletMap.jsx) to fix broken/blank marker icons.
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});