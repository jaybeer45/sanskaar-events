// src/pages/Home/components/EventCard.jsx
// Exact reference card:
// - Hatched image placeholder OR actual image
// - Black uppercase category badge (top-left)
// - Heart icon (top-right)
// - Body: red "STARTS X:XX PM" · bold title · venue+distance · crowd note · price bold + Book/Set reminder button
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, MapPin, Users } from 'lucide-react';
import { toggleSaveEvent } from '../../../features/auth/slices/authSlice';
import { formatPrice } from '../../../utils/formatPrice';
import { buildRoute } from '../../../constants/routes';

const CROWD_NOTE = {
  high: 'filling fast',
  medium: 'relaxed crowd',
  low: 'family-friendly',
};

const EventCard = ({ event }) => {
  const dispatch    = useDispatch();
  const savedEvents = useSelector((s) => s.auth.savedEvents);
  const isSaved     = savedEvents.includes(event.id);

  const isFree      = !event.price || event.price?.free || event.price?.min === 0;
  const crowdNote   = CROWD_NOTE[event.crowdLevel] || '';
  const goingCount  = event.attendees || event.going || 0;
  const goingLabel  = goingCount > 300 ? '300+ going' : goingCount > 0 ? `${goingCount} going` : '';
  const hasImage    = !!event.images?.[0];

  const handleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleSaveEvent(event.id));
  };

  return (
    <Link to={buildRoute.eventDetail(event.id)} className="block group">
      <article className="bg-white h-full hover:shadow-md transition-shadow duration-200">
        {/* Image area */}
        <div
          className="relative h-48 overflow-hidden"
          style={{
            backgroundImage: hasImage
              ? undefined
              : 'repeating-linear-gradient(135deg, #d1d5db 0px, #d1d5db 1px, #e5e7eb 1px, #e5e7eb 10px)',
            backgroundColor: '#e5e7eb',
          }}
        >
          {hasImage && (
            <img
              src={event.images[0]}
              alt={event.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          )}

          {/* Category badge */}
          <span className="absolute top-3 left-3 bg-black text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
            {event.category?.replace(/-/g, ' ')}
          </span>

          {/* Live badge */}
          {event.isLive && (
            <span className="absolute top-3 left-3 mt-7 bg-brand-red text-white text-[10px] font-bold px-2 py-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" /> LIVE
            </span>
          )}

          {/* Heart / save */}
          <button
            onClick={handleSave}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center bg-white/90 hover:bg-white transition-colors"
          >
            <Heart
              size={13}
              className={isSaved ? 'fill-brand-red text-brand-red' : 'text-gray-500'}
            />
          </button>
        </div>

        {/* Card body */}
        <div className="p-4">
          {/* Time (red) */}
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand-red mb-1.5">
            Starts {event.time}
          </p>

          {/* Title */}
          <h3 className="font-black text-[17px] leading-snug text-gray-900 mb-2 line-clamp-2 group-hover:text-brand-red transition-colors">
            {event.title}
          </h3>

          {/* Venue */}
          <p className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <MapPin size={11} />
            {event.venue?.name}{event.venue?.distance ? ` · ${event.venue.distance}` : ''}
          </p>

          {/* Going / crowd */}
          {(goingLabel || crowdNote) && (
            <p className="flex items-center gap-1 text-xs text-gray-500 mb-3">
              <Users size={11} />
              {[goingLabel, crowdNote].filter(Boolean).join(' · ')}
            </p>
          )}

          {/* Price + CTA */}
          <div className="flex items-center justify-between mt-2">
            <span className="font-black text-xl text-gray-900">
              {isFree ? 'Free' : formatPrice(event.price)}
            </span>
            {isFree ? (
              <button
                onClick={(e) => e.preventDefault()}
                className="border border-gray-300 text-gray-700 text-xs font-semibold px-4 py-2 hover:border-gray-500 transition-colors"
              >
                Set reminder
              </button>
            ) : (
              <button
                onClick={(e) => e.preventDefault()}
                className="bg-brand-red hover:bg-brand-red-hover text-white text-sm font-bold px-5 py-2 transition-colors"
              >
                Book
              </button>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
};

export default EventCard;
