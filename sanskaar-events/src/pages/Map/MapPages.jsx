// src/pages/Map/MapPages.jsx
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { fetchEvents } from "../../features/events/slices/eventsSlice";
import { ROUTES, buildRoute } from "../../constants/routes";
import { formatPrice } from "../../utils/formatPrice";
import { formatEventTime, isToday, compareByStart } from "../../utils/eventDate";
import LeafletMap from "./components/LeafletMap";

// One colour per category, used for the numbered pins and the filter chips
export const CATEGORY_META = {
  "live-music": { label: "Music", color: "#EC3013" },
  "meetups": { label: "Meetups", color: "#2563EB" },
  "comedy": { label: "Comedy", color: "#B45309" },
  "spiritual": { label: "Spiritual", color: "#7C3AED" },
  "workshops": { label: "Workshops", color: "#0E7490" },
  "restaurant-events": { label: "Food", color: "#EA580C" },
  "art-culture": { label: "Culture", color: "#1A1445" },
  "sports": { label: "Sports", color: "#15803D" },
  "kids-activities": { label: "Kids", color: "#DB2777" },
};
const DEFAULT_COLOR = "#1A1445";

const hasPin = (event) =>
  Number.isFinite(event.venue?.lat) && Number.isFinite(event.venue?.lng);

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

  // Today's events in the selected city, earliest first (pin numbers follow this order)
  const cityTonightEvents = useMemo(
    () =>
      events
        .filter(
          (e) =>
            isToday(e.date) &&
            e.venue?.address?.toLowerCase().includes(selectedCity.name.toLowerCase())
      )
        .sort(compareByStart),
    [events, selectedCity]
  );

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
    // 4rem = navbar; on small screens another 4rem for the bottom tab bar
    <div className="h-[calc(100dvh-8rem)] lg:h-[calc(100dvh-4rem)] bg-surface">
      <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden bg-white md:flex-row md:border-x md:border-mist">
        {/* List (below the map on phones, left column on desktop) */}
        <aside className="order-2 flex h-[55%] w-full shrink-0 flex-col border-t border-mist md:order-1 md:h-full md:w-[390px] md:border-r md:border-t-0">
          <div className="border-b border-mist px-5 pb-4 pt-5">
            <Link
              to={ROUTES.HOME}
              className="inline-flex items-center gap-1 text-sm text-ink/60 transition-colors hover:text-night"
            >
              <ChevronLeft size={16} /> Discover
            </Link>
            <h1 className="mt-2 font-heading text-2xl font-extrabold text-night">Tonight on the map</h1>
            <p className="mt-0.5 text-sm text-ink/60">
              {selectedCity.name}, {filteredEvents.length} {filteredEvents.length === 1 ? "event" : "events"}
            </p>

            <div className="scrollbar-none mt-4 flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setCategory("all")}
                aria-pressed={category === "all"}
                className={`h-9 shrink-0 rounded-pill px-4 text-sm font-medium transition-colors ${category === "all" ? "bg-night text-white" : "bg-moonlight text-ink/70 hover:bg-night/10"
                  }`}
              >
                All
              </button>
              {availableCategories.map(([key, meta]) => {
                const active = category === key;
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setCategory(key)}
                    aria-pressed={active}
                    className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-pill px-4 text-sm font-medium transition-colors ${active ? "text-white" : "bg-moonlight text-ink/70 hover:bg-night/10"
                    }`}
                    style={active ? { backgroundColor: meta.color } : undefined}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: active ? "#fff" : meta.color }}
                    />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {status === "loading" && (
              <div className="space-y-3 p-5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="skeleton h-16" />
                ))}
              </div>
            )}

            {status !== "loading" && filteredEvents.length === 0 && (
              <div className="px-5 py-10 text-center">
                <p className="font-heading text-lg font-semibold text-night">Nothing on tonight</p>
                <p className="mt-1 text-sm text-ink/60">
                  There are no events in {selectedCity.name} today. Try another city or check upcoming events.
                </p>
                <Link to={ROUTES.HOME} className="btn-brand mt-4 inline-block text-sm">
                  See upcoming events
                </Link>
              </div>
            )}

            <ul>
              {filteredEvents.map((event, idx) => {
                const color = CATEGORY_META[event.category]?.color || DEFAULT_COLOR;
                const isSelected = selectedId === event.id;
                const meta = [formatEventTime(event.time), event.venue?.name].filter(Boolean).join(" at ");

                return (
                  <li key={event.id} className="border-b border-mist/70">
                    <button
                      type="button"
                      onClick={() => setSelectedId(event.id)}
                      aria-pressed={isSelected}
                      className={`flex w-full items-start gap-3 border-l-4 px-5 py-4 text-left transition-colors ${isSelected ? "border-l-night bg-night/5" : "border-l-transparent hover:bg-moonlight"
                        }`}
                    >
                      <span
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-heading text-sm font-bold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {idx + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-night">{event.title}</span>
                        <span className="block truncate text-sm text-ink/60">{meta}</span>
                        {!hasPin(event) && (
                          <span className="block text-xs text-ink/50">No map location for this event</span>
                        )}
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-night">{formatPrice(event.price)}</span>
                    </button>

                    {isSelected && (
                      <Link
                        to={buildRoute.eventDetail(event.id)}
                        className="mb-3 ml-[4.25rem] inline-block text-sm font-semibold text-night underline underline-offset-4 hover:text-brand-red"
                      >
                        View event
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* Map (on top for phones) */}
        <div className="relative order-1 h-[45%] min-h-[220px] flex-1 md:order-2 md:h-auto">
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