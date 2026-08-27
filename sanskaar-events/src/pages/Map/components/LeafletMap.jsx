import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./leafletIconFix";

const DEFAULT_ZOOM = 13;
const CITY_ZOOM = 12;

const buildIcon = (number, color, active) => {
  const size = active ? 34 : 28;
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:${size}px;height:${size}px;
        background:${color};
        border-radius:6px;
        border:2px solid white;
        box-shadow:0 2px 6px rgba(0,0,0,.35);
        display:flex;align-items:center;justify-content:center;
        color:white;font-weight:700;font-size:${active ? 14 : 12}px;
        transform:${active ? "scale(1.05)" : "scale(1)"};
      ">${number}</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
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

const FlyToCity = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, CITY_ZOOM, { duration: 0.8 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1]]);
  return null;
};

const LeafletMap = ({ events, categoryMeta, defaultColor, selectedId, onSelect, cityCenter }) => {
  const selectedEvent = events.find((e) => e.id === selectedId);
  const selectedPos = selectedEvent
    ? [selectedEvent.venue.lat, selectedEvent.venue.lng]
    : null;

  return (
    <MapContainer
      center={cityCenter}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {events.map((event, idx) => {
        const color = categoryMeta[event.category]?.color || defaultColor;
        return (
          <Marker
            key={event.id}
            position={[event.venue.lat, event.venue.lng]}
            icon={buildIcon(idx + 1, color, event.id === selectedId)}
            eventHandlers={{ click: () => onSelect?.(event.id) }}
          >
            <Popup>
              <span className="font-semibold">{event.title}</span>
              <br />
              {event.venue?.name}
            </Popup>
          </Marker>
        );
      })}

      <FlyToSelected position={selectedPos} />
      <FlyToCity center={cityCenter} />
    </MapContainer>
  );
};

export default LeafletMap;