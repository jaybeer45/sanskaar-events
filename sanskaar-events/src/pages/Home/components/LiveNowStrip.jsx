// src/pages/Home/components/LiveNowStrip.jsx
// Matches reference: 2-col wide landscape cards, LIVE pill, category, title, location/time, attendees, "Join in →" red button
import { Link } from 'react-router-dom';
import { MapPin, Clock, Users } from 'lucide-react';
import { buildRoute, ROUTES } from '../../../constants/routes';

const LiveNowStrip = ({ events = [] }) => {
  if (!events.length) return null;
  return (
    <section className="py-6 border-b border-gray-200">
      <div className="flex items-center justify-between mb-4 px-6">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-red block animate-pulse" />
          <h2 className="font-black text-xl text-gray-900">Live now</h2>
          <span className="text-sm text-gray-500">{events.length} event{events.length !== 1 ? 's' : ''} happening this moment</span>
        </div>
        <Link to={ROUTES.TONIGHT} className="text-sm font-semibold text-brand-red hover:underline">
          See all →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-gray-200">
        {events.map((event, i) => (
          <Link
            key={event.id}
            to={buildRoute.eventDetail(event.id)}
            className={`block hover:bg-gray-50 transition-colors ${i === 0 && events.length > 1 ? 'border-r border-gray-200' : ''}`}
          >
            <div className="flex gap-0 h-[160px]">
              {/* Hatched image placeholder */}
              <div
                className="w-36 shrink-0 relative"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(135deg, #d1d5db 0px, #d1d5db 1px, #e5e7eb 1px, #e5e7eb 10px)',
                  backgroundColor: '#e5e7eb',
                }}
              >
                {event.images?.[0] && (
                  <img src={event.images[0]} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
                )}
                {/* LIVE badge */}
                <div className="absolute top-2 left-2 bg-black text-white text-[10px] font-bold px-2 py-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
                  LIVE
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-red mb-1">
                    {event.category?.replace(/-/g, ' ')}
                  </p>
                  <h3 className="font-black text-lg leading-tight text-gray-900 mb-2">{event.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} /> {event.venue?.name}{event.venue?.distance ? ` · ${event.venue.distance}` : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> Started {event.time}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-sm font-semibold text-gray-800">
                    <Users size={13} className="text-gray-400" />
                    {event.attendees || event.going || 48} here now
                  </span>
                  <button
                    onClick={(e) => e.preventDefault()}
                    className="bg-brand-red hover:bg-brand-red-hover text-white text-sm font-bold px-4 py-1.5 transition-colors"
                  >
                    Join in →
                  </button>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default LiveNowStrip;
