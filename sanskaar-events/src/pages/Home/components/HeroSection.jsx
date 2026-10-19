// src/pages/Home/components/HeroSection.jsx
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { MapPin } from 'lucide-react';
import { buildRoute, ROUTES } from '../../../constants/routes';
import { EVENT_CATEGORIES } from '../../../constants/categories';
import { formatPrice } from '../../../utils/formatPrice';
import {
  getEventDateParts,
  formatEventTime,
  getDayKey,
  isToday,
  compareByStart,
} from '../../../utils/eventDate';
import { selectListStatus } from '../../../features/events/selectors/eventsSelectors';

const MAX_TICKETS = 4;

// Landscape ticket: main body on the left, dashed perforation, date + price stub on the right
const HeroTicket = ({ event, index }) => {
  const date = getEventDateParts(event.date);
  const isFree = !event.price || event.price?.free || event.price?.min === 0;

  return (
    <Link
      to={buildRoute.eventDetail(event.id)}
      className="animate-ticket-in w-[300px] sm:w-[340px] min-h-[148px] shrink-0 snap-start flex bg-white rounded-ticket text-ink"
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <div className="flex-1 min-w-0 p-5 flex flex-col">
        <span className="inline-flex self-start items-center rounded-pill bg-marigold-soft text-night text-xs font-semibold px-3 py-1">
          {formatEventTime(event.time) || 'Time to be announced'}
        </span>
        <h3 className="mt-3 font-heading font-bold text-xl leading-snug text-night line-clamp-2">
          {event.title}
        </h3>
        <p className="mt-auto pt-3 flex items-center gap-1.5 text-sm text-ink/70">
          <MapPin size={14} className="shrink-0" />
          <span className="truncate">{event.venue?.name}</span>
        </p>
      </div>

      <div className="relative w-[104px] shrink-0 border-l-2 border-dashed border-mist p-4 flex flex-col items-center justify-center text-center">
        {/* Notches: same colour as the hero so they look punched out of the ticket */}
        <span aria-hidden="true" className="absolute -top-2.5 -left-[11px] w-5 h-5 rounded-full bg-night" />
        <span aria-hidden="true" className="absolute -bottom-2.5 -left-[11px] w-5 h-5 rounded-full bg-night" />

        {date && (
          <>
            <p className="text-xs font-medium text-ink/60">{date.weekday}</p>
            <p className="font-heading font-extrabold text-3xl leading-none text-night">{date.day}</p>
            <p className="text-sm font-medium text-ink/70">{date.month}</p>
          </>
        )}
        <p className="mt-3 text-sm font-bold text-night">{isFree ? 'Free' : formatPrice(event.price)}</p>
      </div>
    </Link>
  );
};

const TicketSkeleton = () => (
  <div className="w-[300px] sm:w-[340px] h-[148px] shrink-0 rounded-ticket bg-white/10 animate-pulse" />
);

// category: the active filter chip ('all' when none is selected). The events list
// in the store is already filtered by it, so the hero describes that category
// instead of claiming to show everything in the city.
const HeroSection = ({ category = 'all' }) => {
  const selectedCity = useSelector((s) => s.location.selectedCity);
  const allEvents = useSelector((s) => s.events.list);
  const status = useSelector(selectListStatus);

  const isFiltered = category !== 'all';
  const categoryLabel = EVENT_CATEGORIES.find((c) => c.id === category)?.label;

  const { flagged, today, upcoming, featured } = useMemo(() => {
    const inCity = allEvents.filter((e) =>
      e.venue?.address?.toLowerCase().includes(selectedCity.name.toLowerCase())
    );

    // Events marked as tonight by the backend, or simply happening today
    const flaggedList = inCity.filter((e) => e.isTonightEvent).sort(compareByStart);
    const todayList = inCity.filter((e) => isToday(e.date)).sort(compareByStart);

    const todayKey = getDayKey(new Date());
    const upcomingList = inCity
      .filter((e) => !e.date || getDayKey(e.date) >= todayKey)
      .sort(compareByStart);

    const base = isFiltered
      ? upcomingList
      : flaggedList.length
        ? flaggedList
        : todayList.length
          ? todayList
          : upcomingList;

    return {
      flagged: flaggedList,
      today: todayList,
      upcoming: upcomingList,
      featured: base.slice(0, MAX_TICKETS),
    };
  }, [allEvents, selectedCity, isFiltered]);

  const city = selectedCity.name;
  let headline = `What's on in ${city}`;
  let subline = upcoming.length
    ? `${upcoming.length} upcoming ${upcoming.length === 1 ? 'event' : 'events'} in your city.`
    : 'No events are listed in this city yet.';

  if (isFiltered) {
    headline = `${categoryLabel || 'Events'} in ${city}`;
    subline = upcoming.length
      ? `${upcoming.length} upcoming ${upcoming.length === 1 ? 'event' : 'events'} in this category.`
      : 'No events in this category yet.';
  } else if (flagged.length) {
    headline = `Tonight in ${city}`;
    subline = `${flagged.length} ${flagged.length === 1 ? 'event starts' : 'events start'} tonight.`;
  } else if (today.length) {
    headline = `Today in ${city}`;
    subline = `${today.length} ${today.length === 1 ? 'event is' : 'events are'} happening today.`;
  }

  return (
    <section className="surface-night bg-night text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[1.05] max-w-2xl">
          {headline}
        </h1>
        <p className="mt-4 text-base md:text-lg text-white/70 max-w-md">{subline}</p>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link to={ROUTES.TONIGHT} className="btn-marigold">
            See what's on tonight
          </Link>
          <Link
            to={ROUTES.MAP}
            className="text-sm font-medium text-white/80 hover:text-marigold underline underline-offset-4 transition-colors"
          >
            Browse the map
          </Link>
        </div>

        <div className="mt-10 -mx-4 px-4 sm:mx-0 sm:px-0 flex gap-4 overflow-x-auto snap-x scrollbar-none pb-2">
          {status === 'loading' && featured.length === 0 &&
            Array.from({ length: 3 }).map((_, i) => <TicketSkeleton key={i} />)}

          {featured.map((event, i) => (
            <HeroTicket key={event.id} event={event} index={i} />
          ))}

          {status !== 'loading' && featured.length === 0 && (
            <div className="rounded-ticket border border-white/20 p-6 max-w-sm">
              <p className="font-heading font-semibold text-lg">Be the first to list an event here</p>
              <p className="mt-1 text-sm text-white/70">
                Organizers can submit an event and it shows up on this page once it is approved.
              </p>
              <Link to={ROUTES.ORGANIZER_SUBMIT} className="btn-marigold inline-block mt-4 text-sm">
                Submit an event
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;