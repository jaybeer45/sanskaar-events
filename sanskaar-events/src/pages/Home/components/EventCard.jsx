// src/pages/Home/components/EventCard.jsx
// Portrait ticket: image on top, dashed perforation, details below.
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, MapPin, Users } from 'lucide-react';
import { toggleSavedEvent } from '../../../features/auth/slices/authSlice';
import { formatPrice } from '../../../utils/formatPrice';
import { getEventDateParts, formatEventTime } from '../../../utils/eventDate';
import { buildRoute } from '../../../constants/routes';
import { EVENT_CATEGORIES } from '../../../constants/categories';

const CROWD_NOTE = {
  high: 'filling fast',
  medium: 'relaxed crowd',
  low: 'family-friendly',
};

const EventCard = ({ event }) => {
  const dispatch = useDispatch();
  const savedEvents = useSelector((s) => s.auth.savedEvents);
  const isSaved = savedEvents.includes(event.id);

  const isFree = !event.price || event.price?.free || event.price?.min === 0;
  const crowdNote = CROWD_NOTE[event.crowdLevel] || '';
  const goingCount = event.attendees || event.going || 0;
  const goingLabel = goingCount > 300 ? '300+ going' : goingCount > 0 ? `${goingCount} going` : '';
  const hasImage = !!event.images?.[0];
  const date = getEventDateParts(event.date);
  const time = formatEventTime(event.time);

  const category = EVENT_CATEGORIES.find((c) => c.id === event.category);
  const categoryLabel = category?.label || event.category?.replace(/-/g, ' ');

  const handleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleSavedEvent(event.id));
  };

  return (
    <Link to={buildRoute.eventDetail(event.id)} className="block h-full rounded-ticket">
      <article className="ticket h-full flex flex-col">
        {/* Image area. Events without an image get a night gradient with the category icon. */}
        <div className="relative aspect-[16/10] overflow-hidden bg-night">
          {hasImage ? (
            <img src={event.images[0]} alt={event.title} loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <div
                aria-hidden="true"
                className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-night via-night-soft to-night"
              >
                {category?.emoji || '🎟️'}
              </div>
          )}

          {categoryLabel && (
            <span className="absolute top-3 left-3 rounded-pill bg-white/90 text-night text-xs font-semibold px-2.5 py-1">
              {categoryLabel}
            </span>
          )}

          <button
            type="button"
            onClick={handleSave}
            aria-label={isSaved ? 'Remove from saved events' : 'Save event'}
            aria-pressed={isSaved}
            className="absolute top-2 right-2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-colors"
          >
            <Heart size={16} className={isSaved ? 'fill-brand-red text-brand-red' : 'text-night/60'} />
          </button>

          {event.isLive && (
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-pill bg-brand-red text-white text-xs font-semibold px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Live now
            </span>
          )}
        </div>

        <div className="ticket-perf" />

        <div className="p-4 flex flex-col flex-1">
          <div className="flex gap-3">
            {date && (
              <div className="shrink-0 w-11 text-center">
                <p className="font-heading font-extrabold text-2xl leading-none text-night">{date.day}</p>
                <p className="mt-1 text-xs font-medium text-ink/60">{date.month}</p>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-heading font-bold text-lg leading-snug text-night line-clamp-2">
                {event.title}
              </h3>
              <p className="mt-1 text-sm text-ink/70">
                {time}
                {time && event.venue?.name ? ' at ' : ''}
                {event.venue?.name}
              </p>
              {event.venue?.distance && (
                <p className="flex items-center gap-1 text-xs text-ink/50 mt-0.5">
                  <MapPin size={11} /> {event.venue.distance} away
                </p>
              )}
            </div>
          </div>

          {(goingLabel || crowdNote) && (
            <p className="flex items-center gap-1.5 text-xs text-ink/60 mt-3">
              <Users size={12} />
              {[goingLabel, crowdNote].filter(Boolean).join(', ')}
            </p>
          )}

          <div className="mt-auto pt-4 flex items-center justify-between">
            <span className="font-heading font-extrabold text-xl text-night">
              {isFree ? 'Free' : formatPrice(event.price)}
            </span>
            {/* Plain labels, not buttons: the whole card is the link to the event page */}
            {isFree ? (
              <span className="rounded-pill border border-night/30 text-night text-sm font-semibold px-4 py-2">
                View details
              </span>
            ) : (
                <span className="rounded-pill bg-brand-red text-white text-sm font-semibold px-5 py-2">
                Book
                </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
};

export default EventCard;