// src/pages/EventDetail/EventDetailPage.jsx
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { MapPin, Calendar, Users, Share2, Heart, ChevronLeft, BadgeCheck } from 'lucide-react';
import { useEventDetail } from '../../features/events/hooks/useEventDetail';
import { toggleSavedEvent } from '../../features/auth/slices/authSlice';
import { formatPrice } from '../../utils/formatPrice';
import { formatEventTime } from '../../utils/eventDate';
import { ROUTES, buildRoute } from '../../constants/routes';
import { EVENT_CATEGORIES } from '../../constants/categories';
import Spinner from '../../components/ui/Spinner/Spinner';
import EmptyState from '../../components/ui/EmptyState/EmptyState';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { eventsService } from '../../services/events.service';
import EventMediaCarousel from '../../components/events/EventMediaCarousel';
import EventArtists from '../../components/events/EventArtists';
import CreateVideoButton from '../../components/creator-video/CreateVideoButton';
import CreateVideoModal from '../../components/creator-video/CreateVideoModal';
import CreatorEditor from '../../components/creator-video/CreatorEditor';
import { uploadService } from '../../services/upload.service';
import { creatorVideoService } from '../../services/creatorVideo.service';
import CommunityCreations from '../../components/creator-video/CommunityCreations';
import CameraCapture from '../../components/creator-video/CameraCapture';
import { liveStreamService } from '../../services/liveStream.service';

// One selectable row (used for dates and ticket types in the booking ticket)
const OptionRow = ({ name, checked, disabled, onChange, title, subtitle, trailing }) => (
  <label
    className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
      } ${checked ? 'border-night bg-night/5' : 'border-mist hover:border-night/40'}`}
  >
    <span className="flex items-center gap-3 min-w-0">
      <input
        type="radio"
        name={name}
        disabled={disabled}
        checked={checked}
        onChange={onChange}
        className="accent-night"
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-night">{title}</span>
        <span className="block text-xs text-ink/60">{subtitle}</span>
      </span>
    </span>
    {trailing}
  </label>
);

const EventDetailPage = () => {
  const { eventId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { event, status } = useEventDetail(eventId);
  const savedEvents = useSelector((s) => s.auth.savedEvents);
  const user = useSelector((s) => s.auth.user);
  const isSaved = event && savedEvents.includes(event.id);

  const [variants, setVariants] = useState([]);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [selectedEventDateId, setSelectedEventDateId] = useState(null);
  const [showCreateVideo, setShowCreateVideo] = useState(false);
  const [creatorFile, setCreatorFile] = useState(null);
  const [exportingVideo, setExportingVideo] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [initialFilter, setInitialFilter] = useState('none');
  const [videoRefreshKey, setVideoRefreshKey] = useState(0);
  const [activeLive, setActiveLive] = useState(null);

  useEffect(() => {
    if (!event?.id) return;
    liveStreamService
      .getActiveForEvent(event.id)
      .then((res) => setActiveLive(res.data.stream))
      .catch(() => { });
  }, [event?.id]);

  useEffect(() => {
    if (event?.eventDates?.length > 0 && !selectedEventDateId) {
      setSelectedEventDateId(event.eventDates[0]._id); // default to the first date
    }
  }, [event, selectedEventDateId]);

  useEffect(() => {
    if (!event?.id) return;
    eventsService.getVariants(event.id).then((res) => {
      const results = res.data.results || [];
      setVariants(results);
      if (results.length > 0) setSelectedVariantId(results[0]._id); // cheapest first (already sorted by price)
    });
  }, [event?.id]);

  const handleSave = () => {
    dispatch(toggleSavedEvent(event.id));
    toast.success(isSaved ? 'Removed from saved' : 'Event saved!');
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success('Link copied!');
  };

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

  const handleCreateVideoClick = () => {
    if (!user) {
      toast.error('Please log in to create a video');
      navigate('/login', { state: { from: { pathname: `/events/${event.id}` } } });
      return;
    }
    setShowCreateVideo(true);
  };

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-[60vh]"><Spinner size="lg" /></div>;
  }
  if (!event) {
    return (
      <EmptyState
        icon="❌"
        title="Event not found"
        message="This event may have been removed."
        action={<Link to={ROUTES.HOME} className="btn-brand inline-block">Browse events</Link>}
      />
    );
  }

  const isFree = !event.price || event.price?.free || event.price?.min === 0;
  const priceLabel = isFree ? 'Free' : formatPrice(event.price);
  const selectedVariant = variants.find((v) => v._id === selectedVariantId);
  const displayPrice = selectedVariant ? `₹${selectedVariant.price.toLocaleString('en-IN')}` : priceLabel;

  const dateLabel = event.date
    ? new Date(event.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const timeLabel = formatEventTime(event.time);

  const category = EVENT_CATEGORIES.find((c) => c.id === event.category);
  const categoryLabel = category?.label || event.category?.replace(/-/g, ' ');

  const totalCapacity = event.eventDates?.length > 0
    ? event.eventDates.reduce((sum, d) => sum + (d.capacity || 0), 0)
    : event.inventory?.total ?? 0;

  const totalGoing = event.eventDates?.length > 0
    ? event.eventDates.reduce((sum, d) => sum + (d.soldCount || 0), 0)
    : (event.inventory?.total ?? 0) - (event.inventory?.remaining ?? 0);

  const bookLabel = isFree ? 'Get free ticket' : 'Book now';

  const infoItems = [
    { icon: <Calendar size={16} />, label: 'Date and time', value: [dateLabel, timeLabel].filter(Boolean).join(' at ') },
    {
      icon: <MapPin size={16} />,
      label: 'Venue',
      value: `${event.venue?.name || ''}${event.venue?.distance ? `, ${event.venue.distance} away` : ''}`,
    },
    { icon: <Users size={16} />, label: 'Attendance', value: `${totalGoing} of ${totalCapacity} going` },
  ];

  return (
    <div className="bg-surface min-h-screen">
      {/* Back bar */}
      <div className="bg-white border-b border-mist">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center gap-1 text-sm text-ink/60 hover:text-night transition-colors"
          >
            <ChevronLeft size={16} /> Back to events
          </Link>
        </div>
      </div>


      {/* Hero media */}
      <div className="relative overflow-hidden">
        <EventMediaCarousel event={event} />

        {/* Soft dark scrim so the badges stay readable on bright photos */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-24 z-[5] bg-gradient-to-b from-black/40 to-transparent"
        />

        <div className="absolute top-4 left-4 flex gap-2 z-10">
          {event.isLive && (
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-brand-red text-white text-xs font-semibold px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Live now
            </span>
          )}
          {categoryLabel && (
            <span className="rounded-pill bg-white/90 text-night text-xs font-semibold px-3 py-1">
              {categoryLabel}
            </span>
          )}
        </div>
      </div>

      {/* Main content (extra bottom padding on mobile for the sticky booking bar) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-28 lg:pb-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: event details */}
          <div className="lg:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-heading font-extrabold text-3xl md:text-5xl leading-tight text-night">
                {event.title}
              </h1>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSave}
                  aria-label={isSaved ? 'Remove from saved events' : 'Save event'}
                  aria-pressed={isSaved}
                  className="w-11 h-11 rounded-full border border-mist bg-white flex items-center justify-center hover:border-night transition-colors"
                >
                  <Heart size={18} className={isSaved ? 'fill-brand-red text-brand-red' : 'text-night/60'} />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Copy event link"
                  className="w-11 h-11 rounded-full border border-mist bg-white flex items-center justify-center hover:border-night transition-colors"
                >
                  <Share2 size={18} className="text-night/60" />
                </button>
              </div>
            </div>

            {activeLive && (
              <button
                type="button"
                onClick={() => navigate(buildRoute.liveViewer(activeLive._id))}
                className="mt-4 flex items-center gap-2 rounded-pill bg-red-50 text-brand-red text-sm font-semibold px-4 py-2"
              >
                <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse" />
                {activeLive.host?.name} is live now. Watch
              </button>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <CreateVideoButton onClick={handleCreateVideoClick} />
              <button
                type="button"
                onClick={() => navigate(buildRoute.goLive(event.id))}
                className="inline-flex items-center gap-1.5 rounded-pill border border-brand-red/40 text-brand-red text-sm font-semibold px-4 py-2 hover:bg-red-50 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse" /> Go live
              </button>
            </div>

            {/* Key facts */}
            <div className="card mt-6 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-mist">
              {infoItems.map(({ icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 p-5">
                  <span className="w-9 h-9 rounded-full bg-marigold-soft text-night flex items-center justify-center shrink-0">
                    {icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-ink/60">{label}</p>
                    <p className="mt-0.5 text-sm font-semibold text-night">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <section className="card mt-6 p-6">
              <h2 className="font-heading font-bold text-xl text-night mb-3">About this event</h2>
              <p className="text-ink/80 leading-relaxed whitespace-pre-line">{event.description}</p>
            </section>

            <div className="mt-6">
              <EventArtists artists={event.artists} />
              <CommunityCreations key={videoRefreshKey} eventId={event.id} />
            </div>

            {event.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {event.tags.map((tag) => (
                  <span key={tag} className="rounded-pill bg-white border border-mist text-ink/70 text-sm px-3 py-1">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {event.organizer && (
              <div className="card p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-night text-white font-heading font-bold flex items-center justify-center overflow-hidden shrink-0">
                  {event.organizer.avatar ? (
                    <img src={event.organizer.avatar} alt={event.organizer.name} className="w-full h-full object-cover" />
                  ) : (
                    event.organizer.name?.[0]?.toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-night">{event.organizer.name}</p>
                  <p className="text-sm text-ink/60">Event organizer</p>
                  {event.organizer.verified && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-pill bg-night/5 text-night text-xs font-semibold px-2 py-0.5">
                      <BadgeCheck size={13} /> Verified
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: booking ticket */}
          <aside className="lg:col-span-1">
            <div className="ticket sticky top-24">
              {event.eventDates?.length > 0 && (
                <div className="p-5 border-b border-mist">
                  <p className="text-sm font-semibold text-night mb-3">Select a date</p>
                  <div className="space-y-2">
                    {event.eventDates.map((d) => {
                      const remaining = d.capacity > 0 ? d.capacity - d.soldCount : null;
                      const soldOut = remaining !== null && remaining <= 0;
                      const dateText = new Date(d.date).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      });
                      return (
                        <OptionRow
                          key={d._id}
                          name="eventDate"
                          disabled={soldOut}
                          checked={selectedEventDateId === d._id}
                          onChange={() => setSelectedEventDateId(d._id)}
                          title={`${dateText}${d.label ? ` (${d.label})` : ''}`}
                          subtitle={soldOut ? 'Sold out' : remaining !== null ? `${remaining} left` : 'Open'}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {variants.length > 0 && (
                <div className="p-5">
                  <p className="text-sm font-semibold text-night mb-3">Select ticket type</p>
                  <div className="space-y-2">
                    {variants.map((v) => {
                      const remaining = v.capacity - v.soldCount;
                      const soldOut = remaining <= 0;
                      return (
                        <OptionRow
                          key={v._id}
                          name="variant"
                          disabled={soldOut}
                          checked={selectedVariantId === v._id}
                          onChange={() => setSelectedVariantId(v._id)}
                          title={v.name}
                          subtitle={soldOut ? 'Sold out' : `${remaining} left`}
                          trailing={
                            <span className="font-heading font-bold text-night">
                              ₹{v.price.toLocaleString('en-IN')}
                            </span>
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {(event.eventDates?.length > 0 || variants.length > 0) && <div className="ticket-perf" />}

              <div className="p-5">
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <p className="text-xs text-ink/60">Price</p>
                    <p className="font-heading font-extrabold text-3xl text-night">{displayPrice}</p>
                  </div>
                </div>

                <button type="button" onClick={handleBookNow} className="btn-brand w-full py-3.5 text-base">
                  {bookLabel}
                </button>

                <div className="mt-5 pt-4 border-t border-mist">
                  <div className="flex justify-between text-xs text-ink/60 mb-2">
                    <span className="font-semibold">Crowd level</span>
                    <span>{totalGoing} attending</span>
                  </div>
                  <div className="h-2 rounded-full bg-mist/70 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${event.crowdLevel === 'high'
                        ? 'bg-brand-red w-4/5'
                        : event.crowdLevel === 'medium'
                          ? 'bg-marigold w-1/2'
                          : 'bg-emerald-500 w-1/4'
                        }`}
                    />
                  </div>
                  <p className="text-xs text-ink/60 mt-2">
                    {event.crowdLevel === 'high'
                      ? 'Filling fast, book soon'
                      : event.crowdLevel === 'medium'
                        ? 'Getting popular'
                        : 'Plenty of room'}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <CreateVideoModal
          isOpen={showCreateVideo}
          onClose={() => setShowCreateVideo(false)}
          onUpload={(file) => {
            setCreatorFile(file);
            setShowCreateVideo(false);
          }}
          onCamera={() => {
            setShowCreateVideo(false);
            setShowCamera(true);
          }}
        />

        {showCamera && (
          <CameraCapture
            onClose={() => setShowCamera(false)}
            onCapture={(file, filter) => {
              setCreatorFile(file);
              setInitialFilter(filter);
              setShowCamera(false);
            }}
          />
        )}

        {creatorFile && (
          <CreatorEditor
            file={creatorFile}
            event={event}
            initialFilter={initialFilter}
            onClose={() => setCreatorFile(null)}
            onExport={async (data) => {
              setExportingVideo(true);
              try {
                const uploadRes = await uploadService.uploadEventVideo(data.file);

                await creatorVideoService.create({
                  eventId: event.id,
                  videoUrl: uploadRes.data.url,
                  duration: data.trimRange.end - data.trimRange.start,
                  visibility: data.visibility,
                  trimStart: data.trimRange.start,
                  trimEnd: data.trimRange.end,
                  filterCss: data.selectedFilter,
                  textOverlays: data.textOverlays.map((o) => ({
                    content: o.content,
                    x: o.x,
                    y: o.y,
                    fontSize: o.fontSize,
                    color: o.color,
                  })),
                });

                toast.success('Your event video is ready!');
                setCreatorFile(null);
                setVideoRefreshKey((k) => k + 1);
              } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to save your video. Please try again.');
              } finally {
                setExportingVideo(false);
              }
            }}
            isExporting={exportingVideo}
          />
        )}
      </div>

      {/* Mobile booking bar, sits just above the bottom tab bar */}
      <div
        className="lg:hidden fixed inset-x-0 z-30 bg-white border-t border-mist px-4 py-3 flex items-center justify-between gap-4"
        style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom))' }}
      >
        <div>
          <p className="text-xs text-ink/60">Price</p>
          <p className="font-heading font-extrabold text-xl text-night">{displayPrice}</p>
        </div>
        <button type="button" onClick={handleBookNow} className="btn-brand px-8">
          {bookLabel}
        </button>
      </div>
    </div>
  );
};

export default EventDetailPage;