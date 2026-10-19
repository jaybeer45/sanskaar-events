// src/pages/Map/components/LeafletMap.jsx
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./leafletIconFix";
import { buildRoute } from "../../../constants/routes";
import { formatEventTime } from "../../../utils/eventDate";

const DEFAULT_ZOOM = 13;
const CITY_ZOOM = 12;

const hasPin = (event) =>
  Number.isFinite(event.venue?.lat) && Number.isFinite(event.venue?.lng);

// Numbered round pin in the category colour; the selected one is bigger with a marigold ring
const buildIcon = (number, color, active) => {
  const size = active ? 40 : 32;
  return L.divIcon({
    className: "sk-marker",
    html: `
      <div style="
        width:${size}px;height:${size}px;
        background:${color};
        border-radius:9999px;
        border:3px solid ${active ? "#F5A623" : "#ffffff"};
        box-shadow:0 4px 10px rgba(26,20,69,.35);
        display:flex;align-items:center;justify-content:center;
        color:#ffffff;font:700 ${active ? 15 : 13}px 'Bricolage Grotesque', sans-serif;
      ">${number}</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

const FlyToSelected = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, Math.max(map.getZoom(), 15), { duration: 0.6 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);
  return null;
};

// Frames all visible pins when the list or the city changes (not when a pin is selected)
const FitToView = ({ points, center }) => {
  const map = useMap();
  const key = points.map((p) => p.join(",")).join("|");

  useEffect(() => {
    // The container can change size after the first render (layout, hot reload),
    // so re-measure it before framing the pins.
    map.invalidateSize();

    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [56, 56], maxZoom: 15, duration: 0.6 });
    } else if (points.length === 1) {
      map.flyTo(points[0], 15, { duration: 0.6 });
    } else if (center) {
      map.flyTo(center, CITY_ZOOM, { duration: 0.8 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, center[0], center[1]]);

  return null;
};

const LeafletMap = ({ events, categoryMeta, defaultColor, selectedId, onSelect, cityCenter }) => {
  const selectedEvent = events.find((e) => e.id === selectedId);
  const selectedPos =
    selectedEvent && hasPin(selectedEvent) ? [selectedEvent.venue.lat, selectedEvent.venue.lng] : null;

  const points = events.filter(hasPin).map((e) => [e.venue.lat, e.venue.lng]);

  return (
    <MapContainer
      center={cityCenter}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      zoomControl={false}
      className="h-full w-full !rounded-none"
    >
      {/* Standard OpenStreetMap tiles (no API key needed). The sk-tiles class softens
          the colours in index.css. For heavy production traffic use a hosted map provider. */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        className="sk-tiles"
      />
      <ZoomControl position="bottomright" />

      {events.map((event, idx) => {
        if (!hasPin(event)) return null;
        const color = categoryMeta[event.category]?.color || defaultColor;
        const active = event.id === selectedId;
        const when = [formatEventTime(event.time), event.venue?.name].filter(Boolean).join(" at ");

        return (
          <Marker
            key={event.id}
            position={[event.venue.lat, event.venue.lng]}
            icon={buildIcon(idx + 1, color, active)}
            zIndexOffset={active ? 1000 : 0}
            eventHandlers={{ click: () => onSelect?.(event.id) }}
          >
            <Popup className="sk-popup" closeButton={false}>
              <p className="font-heading text-base font-bold leading-snug text-night">{event.title}</p>
              {when && <p className="mt-1 text-sm text-ink/70">{when}</p>}
              <Link
                to={buildRoute.eventDetail(event.id)}
                className="sk-popup-link mt-2 inline-block text-sm font-semibold underline underline-offset-4"
              >
                View event
              </Link>
            </Popup>
          </Marker>
        );
      })}

      <FlyToSelected position={selectedPos} />
      <FitToView points={points} center={cityCenter} />
    </MapContainer>
  );
};

export default LeafletMap;