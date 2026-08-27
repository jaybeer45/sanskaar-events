
// src/pages/Home/HomePage.jsx
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { fetchEvents, fetchLiveNow, setFilter } from '../../features/events/slices/eventsSlice';
import { fetchVendors } from '../../features/vendors/slices/vendorsSlice';
import { selectFilteredEvents, selectLiveNow, selectListStatus, selectEventsFilters } from '../../features/events/selectors/eventsSelectors';
import { useDebounce } from '../../hooks/useDebounce';
import { buildRoute, ROUTES } from '../../constants/routes';
import HeroSection from './components/HeroSection';
import CategoryPills from './components/CategoryPills';
import LiveNowStrip from './components/LiveNowStrip';
import EventCard from './components/EventCard';
import EmptyState from '../../components/ui/EmptyState/EmptyState';
import { SkeletonGrid } from '../../components/ui/SkeletonCard/SkeletonCard';

const SORT_OPTIONS = ['Starting soon', 'Most popular', 'Newest first', 'Price: Low to High'];
const PAGE_SIZE = 9; 

const HomePage = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState('Starting soon');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE); 
  const debouncedSearch = useDebounce(searchInput, 400);

  const allEvents = useSelector(selectFilteredEvents);
  const liveNow   = useSelector(selectLiveNow);
  const status    = useSelector(selectListStatus);
  const filters   = useSelector(selectEventsFilters);
  const vendors   = useSelector((s) => s.vendors.list);
  const selectedCity = useSelector((s) => s.location.selectedCity); 

  useEffect(() => {
    const cat = searchParams.get('category') || 'all';
    dispatch(setFilter({ category: cat }));
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
  }, [selectedCity]);


  const cityEvents = useMemo(() => {
    return allEvents.filter((e) =>
      e.venue?.address?.toLowerCase().includes(selectedCity.name.toLowerCase())
    );
  }, [allEvents, selectedCity]);

  
  const visibleEvents = cityEvents.slice(0, visibleCount);
  const hasMore = visibleCount < cityEvents.length;

  const handleCategoryChange = (cat) => {
    setSearchParams(cat !== 'all' ? { category: cat } : {});
    dispatch(setFilter({ category: cat }));
  };

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const spotlightVendors = [...vendors].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4);

  return (
    <div className="animate-fade-in">
      <HeroSection onSearch={setSearchInput} />

      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <CategoryPills active={filters.category} onChange={handleCategoryChange} />
        </div>
      </div>

      {liveNow.length > 0 && <LiveNowStrip events={liveNow} />}

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-black text-2xl text-gray-900">
              Today in {selectedCity.name} 
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">{today} · {cityEvents.length} events</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="hidden sm:inline">Sort</span>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none border border-gray-300 bg-white px-3 py-1.5 pr-7 text-sm focus:outline-none focus:border-brand-red transition-colors"
              >
                {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {status === 'loading' && <SkeletonGrid count={6} />}

        {status === 'succeeded' && cityEvents.length === 0 && (
          <EmptyState icon="🔍" title="No events found" message={`No events in ${selectedCity.name} yet — try a different city or category`} />
        )}

        {status !== 'loading' && cityEvents.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200">
              {visibleEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)} 
                  className="border border-gray-300 bg-white text-gray-700 font-semibold px-8 py-3 text-sm hover:border-gray-500 transition-colors"
                >
                  Load more events
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="bg-[#201e1d] text-white px-8 py-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-red mb-2">Vendor Marketplace</p>
          <h2 className="font-black text-2xl leading-tight mb-3">
            Planning an event?<br />
            <span className="text-brand-red">We'll match you</span><br />
            with the best vendors.
          </h2>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            Photographers, DJs, anchors, decorators — tell us your budget and we'll send qualified leads to verified vendors.
          </p>
          <Link to={ROUTES.MARKETPLACE} className="inline-flex items-center gap-2 bg-brand-red hover:bg-brand-red-hover text-white font-bold px-6 py-3 text-sm transition-colors">
            Get free quotes →
          </Link>
        </div>

        <div className="bg-[#2f2d2c] px-8 py-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Vendor Spotlight</p>
          <h2 className="font-black text-xl text-white mb-4">Top-rated vendors</h2>
          <div className="space-y-3">
            {spotlightVendors.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 bg-white/10 shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 bg-white/10 mb-1.5 w-2/3" />
                    <div className="h-2 bg-white/10 w-1/3" />
                  </div>
                </div>
              ))
            ) : (
              spotlightVendors.map((vendor) => (
                <Link key={vendor.id} to={buildRoute.vendorProfile(vendor.id)} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <div
                    className="w-10 h-10 shrink-0"
                    style={{ backgroundImage: 'repeating-linear-gradient(135deg, #4b4b4b 0, #4b4b4b 1px, #3c3c3c 1px, #3c3c3c 8px)', backgroundColor: '#3c3c3c' }}
                  >
                    {vendor.logo && <img src={vendor.logo} alt={vendor.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{vendor.name}</p>
                    <p className="text-gray-400 text-xs">{vendor.services?.[0]} · ⭐ {vendor.rating}</p>
                  </div>
                  <span className="text-xs text-brand-red font-bold shrink-0">View →</span>
                </Link>
              ))
            )}
          </div>
          <Link to={ROUTES.VENDORS} className="inline-flex mt-5 text-xs text-gray-400 hover:text-white transition-colors">
            View all vendors →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
