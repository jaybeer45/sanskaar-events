// src/pages/Home/HomePage.jsx
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, Star, X } from 'lucide-react';
import { fetchEvents, fetchLiveNow, setFilter } from '../../features/events/slices/eventsSlice';
import { fetchVendors } from '../../features/vendors/slices/vendorsSlice';
import { selectFilteredEvents, selectLiveNow, selectListStatus, selectEventsFilters } from '../../features/events/selectors/eventsSelectors';
import { useDebounce } from '../../hooks/useDebounce';
import { buildRoute, ROUTES } from '../../constants/routes';
import { compareByStart } from '../../utils/eventDate';
import HeroSection from './components/HeroSection';
import CategoryPills from './components/CategoryPills';
import LiveNowStrip from './components/LiveNowStrip';
import EventCard from './components/EventCard';
import EmptyState from '../../components/ui/EmptyState/EmptyState';
import { SkeletonGrid } from '../../components/ui/SkeletonCard/SkeletonCard';

const SORT_OPTIONS = ['Starting soon', 'Most popular', 'Newest first', 'Price: Low to High'];
const PAGE_SIZE = 9;

const eventPrice = (e) => (e.price?.free ? 0 : e.price?.min ?? 0);

const HomePage = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState('Starting soon');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const debouncedSearch = useDebounce(searchInput, 400);

  const allEvents = useSelector(selectFilteredEvents);
  const liveNow = useSelector(selectLiveNow);
  const status = useSelector(selectListStatus);
  const filters = useSelector(selectEventsFilters);
  const vendors = useSelector((s) => s.vendors.list);
  const selectedCity = useSelector((s) => s.location.selectedCity);

  useEffect(() => {
    const cat = searchParams.get('category') || 'all';
    dispatch(setFilter({ category: cat }));
  }, [searchParams]);

  // The navbar search sends people here as /?q=...
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearchInput(q);
  }, [searchParams]);

  useEffect(() => {
    dispatch(fetchEvents({ ...filters, limit: 50 }));
    dispatch(fetchLiveNow());
    dispatch(fetchVendors({ limit: 50 }));
  }, [dispatch, filters.category]);

  useEffect(() => {
    dispatch(setFilter({ search: debouncedSearch }));
    dispatch(fetchEvents({ ...filters, search: debouncedSearch, limit: 50 }));
  }, [debouncedSearch]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedCity, sort]);

  const cityEvents = useMemo(() => {
    const inCity = allEvents.filter((e) =>
      e.venue?.address?.toLowerCase().includes(selectedCity.name.toLowerCase())
    );
    const list = [...inCity];
    switch (sort) {
      case 'Most popular':
        return list.sort((a, b) => (b.attendees || b.going || 0) - (a.attendees || a.going || 0));
      case 'Newest first':
        return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      case 'Price: Low to High':
        return list.sort((a, b) => eventPrice(a) - eventPrice(b));
      default:
        return list.sort(compareByStart);
    }
  }, [allEvents, selectedCity, sort]);

  // Live events for the selected city and the active category chip only
  const liveInCity = useMemo(() => {
    const city = selectedCity.name.toLowerCase();
    return liveNow.filter(
      (e) =>
        e.venue?.address?.toLowerCase().includes(city) &&
        (filters.category === 'all' || e.category === filters.category)
    );
  }, [liveNow, selectedCity, filters.category]);

  const visibleEvents = cityEvents.slice(0, visibleCount);
  const hasMore = visibleCount < cityEvents.length;

  const handleCategoryChange = (cat) => {
    setSearchParams(cat !== 'all' ? { category: cat } : {});
    dispatch(setFilter({ category: cat }));
  };

  const clearSearch = () => {
    setSearchInput('');
    const next = new URLSearchParams(searchParams);
    next.delete('q');
    setSearchParams(next);
  };

  const spotlightVendors = [...vendors].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4);

  return (
    <div>
      <HeroSection category={filters.category} />

      {/* Category filters stay visible while scrolling */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur border-b border-mist">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <CategoryPills active={filters.category} onChange={handleCategoryChange} />
        </div>
      </div>

      {liveInCity.length > 0 && <LiveNowStrip events={liveInCity} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-night">
              Events in {selectedCity.name}
            </h2>
            <p className="text-sm text-ink/60 mt-1">
              {cityEvents.length} {cityEvents.length === 1 ? 'event' : 'events'}
            </p>
            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                className="mt-3 inline-flex items-center gap-1.5 rounded-pill bg-night/5 px-3 py-1.5 text-sm text-night hover:bg-night/10 transition-colors"
              >
                Results for "{searchInput}" <X size={14} />
              </button>
            )}
          </div>

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

        {status === 'loading' && <SkeletonGrid count={6} />}

        {status === 'succeeded' && cityEvents.length === 0 && (
          <EmptyState
            icon="🔍"
            title="No events found"
            message={`No events in ${selectedCity.name} yet. Try a different city or category.`}
          />
        )}

        {status !== 'loading' && cityEvents.length > 0 && (
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

      {/* Vendor marketplace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <div className="surface-night rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
          <div className="bg-night text-white p-8 md:p-10">
            <h2 className="font-heading font-extrabold text-2xl md:text-3xl leading-tight">
              Planning an event? We'll match you with the right vendors.
            </h2>
            <p className="mt-4 text-white/70 text-sm md:text-base leading-relaxed max-w-md">
              Photographers, DJs, anchors and decorators. Tell us your budget and verified vendors send you quotes.
            </p>
            <Link to={ROUTES.MARKETPLACE} className="btn-marigold inline-block mt-6">
              Get free quotes
            </Link>
          </div>

          <div className="bg-night-soft text-white p-8 md:p-10">
            <h2 className="font-heading font-bold text-xl">Top-rated vendors</h2>
            <div className="mt-5 space-y-2">
              {spotlightVendors.length === 0
                ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                    <div className="w-11 h-11 rounded-xl bg-white/10 shrink-0" />
                    <div className="flex-1">
                      <div className="h-3 bg-white/10 rounded mb-2 w-2/3" />
                      <div className="h-2.5 bg-white/10 rounded w-1/3" />
                    </div>
                  </div>
                ))
                : spotlightVendors.map((vendor) => (
                  <Link
                    key={vendor.id}
                    to={buildRoute.vendorProfile(vendor.id)}
                    className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <div className="w-11 h-11 rounded-xl bg-night flex items-center justify-center font-heading font-bold text-marigold overflow-hidden shrink-0">
                      {vendor.logo ? (
                        <img src={vendor.logo} alt={vendor.name} className="w-full h-full object-cover" />
                      ) : (
                        vendor.name?.[0]?.toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{vendor.name}</p>
                      <p className="flex items-center gap-1.5 text-xs text-white/60">
                        {vendor.services?.[0]}
                        {vendor.rating ? (
                          <>
                            <Star size={11} className="fill-marigold text-marigold" /> {vendor.rating}
                          </>
                        ) : null}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-white/40 shrink-0" />
                  </Link>
                ))}
            </div>
            <Link to={ROUTES.VENDORS} className="inline-block mt-5 text-sm font-medium text-marigold hover:underline underline-offset-4">
              View all vendors
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 