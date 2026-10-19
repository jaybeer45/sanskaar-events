// src/pages/Home/components/LiveNowStrip.jsx
// Events that are happening right now. Shows a few at first, the rest on request.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Users } from 'lucide-react';
import { buildRoute } from '../../../constants/routes';
import { formatEventTime } from '../../../utils/eventDate';

const INITIAL_VISIBLE = 4;
const STEP = 8;

const LiveNowStrip = ({ events = [] }) => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  if (!events.length) return null;

  const visible = events.slice(0, visibleCount);
  const remaining = events.length - visible.length;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-2.5 h-2.5 rounded-full bg-brand-red animate-pulse" />
        <h2 className="font-heading font-bold text-xl text-night">Live now</h2>
        <span className="text-sm text-ink/60">
          {events.length} {events.length === 1 ? 'event' : 'events'} happening right now
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visible.map((event) => {
          const here = event.attendees || event.going || 0;
          return (
            <Link
              key={event.id}
              to={buildRoute.eventDetail(event.id)}
              className="flex bg-white rounded-card border border-mist overflow-hidden min-h-[140px]"
            >
              <div className="relative w-32 sm:w-40 shrink-0 bg-gradient-to-br from-night via-night-soft to-night">
                {event.images?.[0] && (
                  <img
                    src={event.images[0]}
                    alt={event.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <span className="absolute top-2 left-2 inline-flex items-center gap-1.5 rounded-pill bg-brand-red text-white text-xs font-semibold px-2.5 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Live
                </span>
              </div>

              <div className="flex-1 min-w-0 p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-heading font-bold text-lg leading-snug text-night line-clamp-2">
                    {event.title}
                  </h3>
                  <div className="mt-2 space-y-1 text-sm text-ink/70">
                    <p className="flex items-center gap-1.5">
                      <MapPin size={13} className="shrink-0" />
                      <span className="truncate">{event.venue?.name}</span>
                    </p>
                    {event.time && (
                      <p className="flex items-center gap-1.5">
                        <Clock size={13} className="shrink-0" /> Started at {formatEventTime(event.time)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  {here > 0 ? (
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-night">
                      <Users size={14} /> {here} here now
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="rounded-pill bg-brand-red text-white text-sm font-semibold px-4 py-1.5">
                    Join now
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {(remaining > 0 || visibleCount > INITIAL_VISIBLE) && (
        <div className="mt-5 flex items-center justify-center gap-3">
          {remaining > 0 && (
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + STEP)}
              className="btn-outline text-sm"
            >
              Show {Math.min(STEP, remaining)} more live {Math.min(STEP, remaining) === 1 ? 'event' : 'events'}
            </button>
          )}
          {visibleCount > INITIAL_VISIBLE && (
            <button
              type="button"
              onClick={() => setVisibleCount(INITIAL_VISIBLE)}
              className="text-sm font-semibold text-night hover:underline underline-offset-4"
            >
              Show fewer
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default LiveNowStrip;