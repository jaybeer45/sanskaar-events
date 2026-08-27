import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { fetchEvents } from "../../features/events/slices/eventsSlice";
import { ROUTES } from "../../constants/routes";
import LeafletMap from "./components/LeafletMap";

export const CATEGORY_META = {
  "live-music":        { label: "Music",     color: "#DC2626" },
  "meetups":           { label: "Meetups",   color: "#2563EB" },
  "comedy":            { label: "Comedy",    color: "#F59E0B" },
  "spiritual":         { label: "Spiritual", color: "#7C3AED" },
  "workshops":         { label: "Workshops", color: "#0891B2" },
  "restaurant-events": { label: "Food",      color: "#EA580C" },
  "art-culture":       { label: "Culture",   color: "#111827" },
  "sports":            { label: "Sports",    color: "#16A34A" },
  "kids-activities":   { label: "Kids",      color: "#DB2777" },
};
const DEFAULT_COLOR = "#111827";

const formatPrice = (price) => {
  if (!price) return "";
  if (price.free) return "Free";
  if (price.min === price.max) return `₹${price.min}`;
  return `₹${price.min}–₹${price.max}`;
};

const MapPage = () => {
  const dispatch = useDispatch();
  const events = useSelector((state) => state.events.list);
  const status = useSelector((state) => state.events.listStatus);
  const selectedCity = useSelector((state) => state.location.selectedCity);

  const [category, setCategory] = useState("all");
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    dispatch(fetchEvents());
  }, [dispatch]);

  const cityTonightEvents = useMemo(() => {
  const todayStr = new Date().toDateString();
  return events.filter(
    (e) =>
      new Date(e.date).toDateString() === todayStr &&
      e.venue?.address?.toLowerCase().includes(selectedCity.name.toLowerCase())
  );
}, [events, selectedCity]);

  const availableCategories = useMemo(() => {
    const keys = new Set(cityTonightEvents.map((e) => e.category));
    return Object.entries(CATEGORY_META).filter(([key]) => keys.has(key));
  }, [cityTonightEvents]);

  const filteredEvents = useMemo(() => {
    if (category === "all") return cityTonightEvents;
    return cityTonightEvents.filter((e) => e.category === category);
  }, [cityTonightEvents, category]);

  useEffect(() => {
    setCategory("all");
    setSelectedId(null);
  }, [selectedCity]);

  return (
    <div className="h-[calc(100vh-64px)] bg-gray-50">
      <div className="mx-auto flex h-full max-w-7xl overflow-hidden border-x border-gray-200 bg-white shadow-sm">
        <aside className="flex w-[380px] shrink-0 flex-col border-r border-gray-200">
          <div className="border-b border-gray-100 px-6 pt-6 pb-4">
            <Link
              to={ROUTES.HOME}
              className="mb-3 inline-flex items-center gap-1 text-xs font-semibold tracking-wide text-brand-red hover:underline"
            >
              <ChevronLeft size={14} /> DISCOVER
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Tonight in {selectedCity.name}{" "}
              <span className="font-normal text-gray-400">·</span>{" "}
              {filteredEvents.length} events
            </h1>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setCategory("all")}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  category === "all"
                    ? "bg-brand-red text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              {availableCategories.map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => setCategory(key)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    category === key ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  style={category === key ? { backgroundColor: meta.color } : undefined}
                >
                  {meta.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {status === "loading" && (
              <div className="px-6 py-10 text-sm text-gray-400">Loading events…</div>
            )}

            {status !== "loading" && filteredEvents.length === 0 && (
              <div className="px-6 py-10 text-sm text-gray-400">
                {selectedCity.name} me abhi tonight ke liye koi event nahi hai.
              </div>
            )}

            {filteredEvents.map((event, idx) => {
              const color = CATEGORY_META[event.category]?.color || DEFAULT_COLOR;
              const isSelected = selectedId === event.id;

              return (
                <button
                  key={event.id}
                  onClick={() => setSelectedId(event.id)}
                  className={`flex w-full items-start gap-3 border-b border-gray-100 px-6 py-4 text-left transition-colors ${
                    isSelected ? "bg-red-50" : "hover:bg-gray-50"
                  }`}
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {idx + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-gray-900">
                      {event.title}
                    </span>
                    <span className="block truncate text-sm text-gray-500">
                      {event.venue?.name} · {event.time} · {formatPrice(event.price)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="relative flex-1">
          <LeafletMap
            events={filteredEvents}
            categoryMeta={CATEGORY_META}
            defaultColor={DEFAULT_COLOR}
            selectedId={selectedId}
            onSelect={setSelectedId}
            cityCenter={[selectedCity.lat, selectedCity.lng]}
          />
        </div>
      </div>
    </div>
  );
};

export default MapPage;