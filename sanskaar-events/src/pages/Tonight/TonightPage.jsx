// src/pages/Tonight/TonightPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { fetchTonight } from '../../features/events/slices/eventsSlice';
import { selectTonight, selectTonightStatus } from '../../features/events/selectors/eventsSelectors';
import { buildRoute, ROUTES } from '../../constants/routes';
import { compareByStart, timeToMinutes } from '../../utils/eventDate';
import EventCard from '../Home/components/EventCard';
import EmptyState from '../../components/ui/EmptyState/EmptyState';
import { SkeletonGrid } from '../../components/ui/SkeletonCard/SkeletonCard';

const PAGE_SIZE = 9;
const SORT_OPTIONS = ['Starting soon', 'Most popular', 'Price: Low to High'];

const eventPrice = (e) => (e.price?.free ? 0 : e.price?.min ?? 0);

// 75 -> "1 h 15 min", 40 -> "40 min"
const formatCountdown = (minutes) => {
  if (minutes < 1) return 'less than a minute';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
};

const TonightPage = () => {
  const dispatch = useDispatch();
  const allEvents = useSelector(selectTonight);
  const status = useSelector(selectTonightStatus);
  const selectedCity = useSelector((s) => s.location.selectedCity);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [sort, setSort] = useState('Starting soon');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => { dispatch(fetchTonight()); }, [dispatch]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedCity, sort]);

  // Keep the "next up" line fresh
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const events = useMemo(() => {
    const inCity = allEvents.filter((e) =>
      e.venue?.address?.toLowerCase().includes(selectedCity.name.toLowerCase())
    );
    const list = [...inCity];
    switch (sort) {
      case 'Most popular':
        return list.sort((a, b) => (b.attendees || b.going || 0) - (a.attendees || a.going || 0));
      case 'Price: Low to High':
        return list.sort((a, b) => eventPrice(a) - eventPrice(b));
      default:
        return list.sort(compareByStart);
    }
  }, [allEvents, selectedCity, sort]);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const nextUp = useMemo(() => {
    const upcoming = events
      .filter((e) => {
        const start = timeToMinutes(e.time);
        return Number.isFinite(start) && start > nowMinutes;
      })
      .sort(compareByStart);
    return upcoming[0] || null;
  }, [events, nowMinutes]);

  const visibleEvents = events.slice(0, visibleCount);
  const hasMore = visibleCount < events.length;

  const todayLabel = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div>
      {/* Night header */}
      <section className="surface-night bg-night text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-12">
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-marigold transition-colors"
          >
            <ChevronLeft size={16} /> Discover
          </Link>

          <h1 className="mt-4 font-heading font-extrabold text-4xl sm:text-5xl leading-[1.05]">
            Tonight in {selectedCity.name}
          </h1>
          <p className="mt-3 text-white/70">
            {todayLabel}, {events.length} {events.length === 1 ? 'event' : 'events'}
          </p>

          {nextUp && (
            <Link
              to={buildRoute.eventDetail(nextUp.id)}
              className="mt-6 inline-flex max-w-full items-center gap-3 rounded-pill bg-white/10 hover:bg-white/15 px-4 py-2.5 text-sm transition-colors"
            >
              <span className="w-2 h-2 shrink-0 rounded-full bg-marigold animate-pulse" />
              <span className="truncate">
                <span className="font-semibold">Next up:</span> {nextUp.title}, starts in{' '}
                {formatCountdown(timeToMinutes(nextUp.time) - nowMinutes)}
              </span>
            </Link>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {events.length > 0 && (
          <div className="flex justify-end mb-6">
            <div className="relative">
              <select
                aria-label="Sort events"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none h-10 rounded-pill border border-mist bg-white pl-4 pr-9 text-sm text-ink focus:outline-none focus:border-night transition-colors"
              >
                {SORT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-night/50 pointer-events-none" />
            </div>
          </div>
        )}

        {status === 'loading' && events.length === 0 && <SkeletonGrid count={6} />}

        {status === 'succeeded' && events.length === 0 && (
          <EmptyState
            icon="🌙"
            title="Nothing on tonight"
            message={`No events tonight in ${selectedCity.name}. Try another city or look at upcoming events.`}
            action={<Link to={ROUTES.HOME} className="btn-brand inline-block">See upcoming events</Link>}
          />
        )}

        {events.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-10">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="btn-outline"
                >
                  Show more events
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TonightPage;