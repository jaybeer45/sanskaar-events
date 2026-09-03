// src/pages/EventDetail/EventDetailPage.jsx

import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { MapPin, Clock, Users, Share2, Heart, Calendar, ExternalLink, ChevronLeft } from 'lucide-react';
import { useEventDetail } from '../../features/events/hooks/useEventDetail';
import { toggleSaveEvent } from '../../features/auth/slices/authSlice';
import { formatPrice } from '../../utils/formatPrice';
import { ROUTES, buildRoute } from '../../constants/routes';
import Spinner from '../../components/ui/Spinner/Spinner';
import EmptyState from '../../components/ui/EmptyState/EmptyState';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { eventsService } from '../../services/events.service';



const EventDetailPage = () => {
  const { eventId } = useParams();
  const dispatch = useDispatch();
  const { event, status } = useEventDetail(eventId);
  const savedEvents = useSelector((s) => s.auth.savedEvents);
  const isSaved = event && savedEvents.includes(event.id);

  const [variants, setVariants] = useState([]);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [selectedEventDateId, setSelectedEventDateId] = useState(null);

  useEffect(() => {
    if (event?.eventDates?.length > 0 && !selectedEventDateId) {
      setSelectedEventDateId(event.eventDates[0]._id); // default first date
    }
  }, [event, selectedEventDateId]);

  useEffect(() => {
    if (!event?.id) return;
    eventsService.getVariants(event.id).then((res) => {
      const results = res.data.results || [];
      setVariants(results);
      if (results.length > 0) setSelectedVariantId(results[0]._id); // default to cheapest (already sorted by price)
    });
  }, [event?.id]);

  const handleSave = () => { dispatch(toggleSaveEvent(event.id)); toast.success(isSaved ? 'Removed from saved' : 'Event saved!'); };
  const handleShare = () => { navigator.clipboard?.writeText(window.location.href); toast.success('Link copied!'); };
  const navigate = useNavigate();

  const user = useSelector((s) => s.auth.user);

 const handleBookNow = () => {
  if (!user) {
    toast.error('Please log in to book');
    navigate('/login', { state: { from: { pathname: buildRoute.confirmBooking(event.id) } } });
    return;
  }
  navigate(buildRoute.confirmBooking(event.id), {
    state: { variantId: selectedVariantId, eventDateId: selectedEventDateId },
  });
};

  if (status === 'loading') return <div className="flex justify-center items-center min-h-[60vh]"><Spinner size="lg" /></div>;
  if (!event) return <EmptyState icon="❌" title="Event not found" message="This event may have been removed" action={<Link to={ROUTES.HOME} className="bg-brand-red text-white font-bold px-6 py-3">Browse Events</Link>} />;

  const isFree = !event.price || event.price?.free || event.price?.min === 0;
  const priceLabel = isFree ? 'Free' : formatPrice(event.price);
  const date = new Date(event.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const totalCapacity = event.eventDates?.length > 0
  ? event.eventDates.reduce((sum, d) => sum + (d.capacity || 0), 0)
  : event.inventory?.total ?? 0;

const totalGoing = event.eventDates?.length > 0
  ? event.eventDates.reduce((sum, d) => sum + (d.soldCount || 0), 0)
  : (event.inventory?.total ?? 0) - (event.inventory?.remaining ?? 0);

  return (
    <div className="bg-[#f5f5f4] min-h-screen">
      {/* Back nav */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <Link to={ROUTES.HOME} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ChevronLeft size={15} /> Back to events
          </Link>
        </div>
      </div>

      {/* Hero image */}
      <div
        className="relative h-64 md:h-80 overflow-hidden"
        style={{
          backgroundImage: event.images?.[0]
            ? undefined
            : 'repeating-linear-gradient(135deg, #d1d5db 0px, #d1d5db 1px, #e5e7eb 1px, #e5e7eb 10px)',
          backgroundColor: '#e5e7eb',
        }}
      >
        {event.images?.[0] && (
          <img src={event.images[0]} alt={event.title} className="w-full h-full object-cover" />
        )}
        {/* Live + category badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {event.isLive && (
            <span className="bg-brand-red text-white text-[10px] font-bold px-2.5 py-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" /> LIVE
            </span>
          )}
          <span className="bg-black text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
            {event.category?.replace(/-/g, ' ')}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left — event details */}
          <div className="lg:col-span-2">
            {/* Title + actions */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <h1 className="font-black text-3xl md:text-4xl text-gray-900 leading-tight">{event.title}</h1>
              <div className="flex gap-2 shrink-0">
                <button onClick={handleSave} className="w-9 h-9 border border-gray-300 bg-white flex items-center justify-center hover:border-brand-red transition-colors">
                  <Heart size={15} className={isSaved ? 'fill-brand-red text-brand-red' : 'text-gray-500'} />
                </button>
                <button onClick={handleShare} className="w-9 h-9 border border-gray-300 bg-white flex items-center justify-center hover:border-brand-red transition-colors">
                  <Share2 size={15} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-gray-200 mb-8 bg-white">
              {[
                { icon: <Clock size={16} />, label: 'Date & Time', value: `${date} · ${event.time}` },
                { icon: <MapPin size={16} />, label: 'Venue', value: `${event.venue?.name}${event.venue?.distance ? ' · ' + event.venue.distance : ''}` },
                { icon: <Users size={16} />, label: 'Attendance', value: `${totalGoing} / ${totalCapacity} going` },
              ].map(({ icon, label, value }, i) => (
                <div key={label} className={`px-5 py-4 ${i < 2 ? 'border-b sm:border-b-0 sm:border-r border-gray-200' : ''}`}>
                  <div className="flex items-center gap-2 text-brand-red mb-1">{icon}<span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</span></div>
                  <p className="font-semibold text-gray-900 text-sm">{value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="bg-white border border-gray-200 p-6 mb-6">
              <h2 className="font-black text-lg text-gray-900 mb-3">About this event</h2>
              <p className="text-gray-600 leading-relaxed text-sm">{event.description}</p>
            </div>

            {/* Tags */}
            {event.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {event.tags.map((tag) => (
                  <span key={tag} className="border border-gray-300 text-gray-600 text-xs px-3 py-1">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Organizer */}
            {event.organizer && (
              <div className="bg-white border border-gray-200 p-5 flex items-center gap-4">
                <div
                  className="w-12 h-12 shrink-0"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(135deg, #d1d5db 0px, #d1d5db 1px, #e5e7eb 1px, #e5e7eb 6px)',
                    backgroundColor: '#e5e7eb',
                  }}
                >
                  {event.organizer.avatar && <img src={event.organizer.avatar} alt={event.organizer.name} className="w-full h-full object-cover" />}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{event.organizer.name}</p>
                  <p className="text-xs text-gray-500">Event Organizer</p>
                  {event.organizer.verified && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-red border border-brand-red px-1.5 py-0.5 mt-1">
                      ◎ VERIFIED
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right — booking sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-white border border-gray-200">
              {event.eventDates?.length > 0 && (
                <div className="p-6 border-b border-gray-200">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Select date</p>
                  <div className="space-y-2">
                    {event.eventDates.map((d) => {
                      const remaining = d.capacity > 0 ? d.capacity - d.soldCount : null;
                      const soldOut = remaining !== null && remaining <= 0;
                      return (
                        <label
                          key={d._id}
                          className={`flex items-center justify-between border px-4 py-3 cursor-pointer transition-colors ${selectedEventDateId === d._id ? 'border-brand-red bg-red-50' : 'border-gray-200'
                            } ${soldOut ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="eventDate"
                              disabled={soldOut}
                              checked={selectedEventDateId === d._id}
                              onChange={() => setSelectedEventDateId(d._id)}
                            />
                            <div>
                              <p className="font-bold text-sm text-gray-900">
                                {new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                                {d.label ? ` · ${d.label}` : ''}
                              </p>
                              <p className="text-xs text-gray-400">{soldOut ? 'Sold out' : remaining !== null ? `${remaining} left` : 'Open'}</p>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Price / Ticket variants */}
              {variants.length > 0 ? (
                <div className="p-6 border-b border-gray-200">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Select ticket type</p>
                  <div className="space-y-2">
                    {variants.map((v) => {
                      const remaining = v.capacity - v.soldCount;
                      const soldOut = remaining <= 0;
                      return (
                        <label
                          key={v._id}
                          className={`flex items-center justify-between border px-4 py-3 cursor-pointer transition-colors ${selectedVariantId === v._id ? 'border-brand-red bg-red-50' : 'border-gray-200'
                            } ${soldOut ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="variant"
                              disabled={soldOut}
                              checked={selectedVariantId === v._id}
                              onChange={() => setSelectedVariantId(v._id)}
                            />
                            <div>
                              <p className="font-bold text-sm text-gray-900">{v.name}</p>
                              <p className="text-xs text-gray-400">{soldOut ? 'Sold out' : `${remaining} left`}</p>
                            </div>
                          </div>
                          <p className="font-black text-gray-900">₹{v.price.toLocaleString('en-IN')}</p>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-6 border-b border-gray-200">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Price</p>
                  <p className="font-black text-4xl text-gray-900">{priceLabel}</p>
                </div>
              )}

              {/* Book CTA */}
              <div className="p-6 border-b border-gray-200">
                {isFree ? (
                  <button className="w-full border border-gray-300 text-gray-700 font-bold py-3.5 text-sm hover:border-gray-500 transition-colors mb-3">
                    Set reminder
                  </button>
                ) : (
                  <button
                    onClick={handleBookNow}
                    className="flex items-center justify-center gap-2 w-full bg-brand-red hover:bg-brand-red-hover text-white font-bold py-3.5 text-sm transition-colors mb-3"
                  >
                    Book Now
                  </button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleSave} className={`flex items-center justify-center gap-1.5 py-2.5 border text-sm font-medium transition-all ${isSaved ? 'border-brand-red bg-red-50 text-brand-red' : 'border-gray-200 text-gray-600 hover:border-brand-red hover:text-brand-red'}`}>
                    <Heart size={13} className={isSaved ? 'fill-brand-red' : ''} />
                    {isSaved ? 'Saved' : 'Save'}
                  </button>
                  <button onClick={handleShare} className="flex items-center justify-center gap-1.5 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 hover:border-brand-red hover:text-brand-red transition-all">
                    <Share2 size={13} /> Share
                  </button>
                </div>
              </div>

              {/* Crowd meter */}
              <div className="p-6">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span className="font-semibold">Crowd level</span>
                  <span>{totalGoing} attending</span>
                </div>
                <div className="h-1.5 bg-gray-100 overflow-hidden">
                  <div className={`h-full transition-all ${event.crowdLevel === 'high' ? 'bg-brand-red w-4/5' : event.crowdLevel === 'medium' ? 'bg-amber-400 w-1/2' : 'bg-green-400 w-1/4'}`} />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {event.crowdLevel === 'high' ? 'Filling fast — book soon' : event.crowdLevel === 'medium' ? 'Getting popular' : 'Plenty of room'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
