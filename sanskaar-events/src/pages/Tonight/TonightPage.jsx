// src/pages/Tonight/TonightPage.jsx
// Matches reference: white bg, list of tonight events with category badge, time, venue, crowd, price, Book/Join button
import { useEffect , useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Users, ChevronLeft, ChevronDown } from 'lucide-react';
import { fetchTonight } from '../../features/events/slices/eventsSlice';
import { selectTonight, selectTonightStatus } from '../../features/events/selectors/eventsSelectors';
import { formatPrice } from '../../utils/formatPrice';
import { buildRoute, ROUTES } from '../../constants/routes';
import Spinner from '../../components/ui/Spinner/Spinner';
import EmptyState from '../../components/ui/EmptyState/EmptyState';


const CROWD_NOTE = {
  high: 'filling fast',
  medium: 'relaxed crowd',
  low: 'family-friendly',
};

const PAGE_SIZE = 9;

const TonightPage = () => {
  const dispatch = useDispatch();
  const allEvents   = useSelector(selectTonight);
  const status   = useSelector(selectTonightStatus);
  const selectedCity = useSelector((s) => s.location.selectedCity);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => { dispatch(fetchTonight()); }, [dispatch]);

   useEffect(()=>{
    setVisibleCount(PAGE_SIZE);   
   },[selectedCity])

    const events = useMemo(()=>{
      return allEvents.filter((e)=>
      e.venue?.address?.toLowerCase().includes(selectedCity.name.toLowerCase())
    ) ;
    },[allEvents , selectedCity])

    const visibleEvents = events.slice(0, visibleCount);
    const hasMore = visibleCount < events.length;

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="bg-[#f5f5f4] min-h-screen">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link to={ROUTES.HOME} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                <ChevronLeft size={15} /> Discover
              </Link>
            </div>
            <h1 className="font-black text-2xl text-gray-900">
              Tonight in {selectedCity.name}
              <span className="font-normal text-gray-400 text-base ml-3">{today} · {events.length} events</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Sort</span>
            <div className="flex items-center gap-1 border border-gray-300 bg-white px-3 py-1.5">
              <span>Starting soon</span>
              <ChevronDown size={13} />
            </div>
          </div>
        </div>
      </div>

      {/* Events list */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {status === 'loading' && (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        )}

        {status === 'succeeded' && events.length === 0 && (
          <EmptyState
            icon="🌙"
            title="No events tonight"
           message={`No events tonight in ${selectedCity.name} — try a different city`}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200">
          {visibleEvents.map((event) => {
            const isFree = !event.price || event.price?.free || event.price?.min === 0;
            const crowdNote = CROWD_NOTE[event.crowdLevel] || '';
            const goingCount = event.attendees || event.going || 0;
            const goingLabel = goingCount > 300 ? '300+ going' : goingCount > 0 ? `${goingCount} going` : '';

            return (
              <Link key={event.id} to={buildRoute.eventDetail(event.id)} className="block group">
                <article className="border-0 bg-white hover:shadow-md transition-shadow duration-200 h-full">
                  {/* Image */}
                  <div
                    className="relative h-48 overflow-hidden"
                    style={{
                      backgroundImage: event.images?.[0]
                        ? undefined
                        : 'repeating-linear-gradient(135deg, #d1d5db 0px, #d1d5db 1px, #e5e7eb 1px, #e5e7eb 10px)',
                      backgroundColor: '#e5e7eb',
                    }}
                  >
                    {event.images?.[0] && (
                      <img
                        src={event.images[0]}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    {/* Category badge */}
                    <div className="absolute top-3 left-3 bg-black text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
                      {event.category?.replace(/-/g, ' ')}
                    </div>
                    {/* Live badge */}
                    {event.isLive && (
                      <div className="absolute top-3 right-10 bg-brand-red text-white text-[10px] font-bold px-2 py-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" /> LIVE
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-brand-red mb-1.5">
                      Starts {event.time}
                    </p>
                    <h3 className="font-black text-[17px] leading-snug text-gray-900 mb-2 group-hover:text-brand-red transition-colors line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                      <MapPin size={11} />
                      {event.venue?.name}{event.venue?.distance ? ` · ${event.venue.distance}` : ''}
                    </p>
                    {(goingLabel || crowdNote) && (
                      <p className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                        <Users size={11} />
                        {[goingLabel, crowdNote].filter(Boolean).join(' · ')}
                      </p>
                    )}
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
          })}
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

      </div>
    </div>
  );
};

export default TonightPage;
