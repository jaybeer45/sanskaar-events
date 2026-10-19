// src/pages/Profile/ProfilePage.jsx
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Heart, MapPin, LogOut, Settings, Ticket, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import { logout, updateProfile } from '../../features/auth/slices/authSlice';
import { ROUTES } from '../../constants/routes';
import { selectEventsList } from '../../features/events/selectors/eventsSelectors';
import RewardsPanel from '../../components/profile/RewardsPanel';
import { fetchMyBookings, cancelBooking, rescheduleBooking } from '../../features/bookings/slices/bookingsSlice';
import { eventsService } from '../../services/events.service';
import { getEventDateParts, formatEventTime } from '../../utils/eventDate';
import EventCard from '../Home/components/EventCard';

const Toggle = ({ checked, onChange, label }) => (
  <label className="flex cursor-pointer items-center justify-between border-b border-mist/70 py-3 last:border-0">
    <span className="text-sm text-ink">{label}</span>
    <span className="relative inline-flex">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span className="h-6 w-11 rounded-full bg-mist transition-colors peer-checked:bg-night peer-focus-visible:ring-2 peer-focus-visible:ring-night/40" />
      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
    </span>
  </label>
);

const STATUS_STYLE = {
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-200 text-gray-700',
  pending: 'bg-amber-100 text-amber-800',
};

// One booking as a ticket: event details on the left, price/status/actions on the stub
const BookingTicket = ({ booking: b, rescheduling, onReschedule, onCancel }) => {
  const bookedDate =
    b.eventDateId && b.event?.eventDates?.length
      ? b.event.eventDates.find((d) => d._id === b.eventDateId)
      : null;
  const dateParts = getEventDateParts(bookedDate?.date || b.event?.date);
  const time = formatEventTime(b.event?.time);
  const when = [
    dateParts && `${dateParts.weekday}, ${dateParts.day} ${dateParts.month}`,
    bookedDate?.label && `(${bookedDate.label})`,
    time && `at ${time}`,
  ]
    .filter(Boolean)
    .join(' ');
  const organizerName = b.event?.organizerName?.trim() || b.event?.organizer?.displayName;

  const isCancelled = b.status === 'cancelled';
  const statusKey = isCancelled ? 'cancelled' : STATUS_STYLE[b.paymentStatus] ? b.paymentStatus : 'pending';
  const statusLabel = isCancelled ? 'Cancelled' : b.paymentStatus;
  const canManage = b.paymentStatus === 'paid' && !isCancelled;

  return (
    <li className="ticket flex flex-col sm:flex-row">
      <div className="min-w-0 flex-1 p-5">
        <h3 className="font-heading text-lg font-bold leading-snug text-night">{b.event?.title || 'Event'}</h3>
        {when && <p className="mt-1 text-sm text-ink/80">{when}</p>}
        {b.event?.venue?.name && (
          <p className="mt-1 flex items-start gap-1.5 text-sm text-ink/60">
            <MapPin size={14} className="mt-0.5 shrink-0" />
            <span>
              {b.event.venue.name}
              {b.event.venue.address ? `, ${b.event.venue.address}` : ''}
            </span>
          </p>
        )}
        {organizerName && <p className="mt-1 text-sm text-ink/60">Organized by {organizerName}</p>}
      </div>

      <div className="relative flex flex-col gap-3 border-t-2 border-dashed border-mist p-5 sm:w-52 sm:border-l-2 sm:border-t-0">
        {/* Notches on the perforation: top-left always, then top-right (stacked) or bottom-left (side by side) */}
        <span aria-hidden="true" className="absolute -left-[11px] -top-[11px] h-5 w-5 rounded-full border border-mist bg-surface" />
        <span aria-hidden="true" className="absolute -right-[11px] -top-[11px] h-5 w-5 rounded-full border border-mist bg-surface sm:-bottom-[11px] sm:-left-[11px] sm:right-auto sm:top-auto" />

        <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-start">
          <p className="font-heading text-2xl font-extrabold text-night">₹{b.totalAmount?.toLocaleString('en-IN')}</p>
          <span className={`rounded-pill px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLE[statusKey]}`}>
            {statusLabel}
          </span>
        </div>

        <div className="text-sm text-ink/60">
          <p>
            {b.quantity} {b.quantity === 1 ? 'ticket' : 'tickets'}
          </p>
          <p className="mt-0.5">
            Code <span className="font-mono font-semibold text-night">{b.ticketCode || 'N/A'}</span>
          </p>
        </div>

        {canManage && (
          <div className="flex flex-wrap gap-2">
            {b.eventDateId && (
              <button
                type="button"
                onClick={() => onReschedule(b)}
                disabled={rescheduling}
                className="h-10 rounded-pill border border-night/30 px-4 text-sm font-semibold text-night transition-colors hover:bg-night/5 disabled:opacity-50"
              >
                Reschedule
              </button>
            )}
            <button
              type="button"
              onClick={() => onCancel(b._id)}
              className="h-10 rounded-pill px-4 text-sm font-semibold text-brand-red transition-colors hover:bg-red-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </li>
  );
};

const ProfilePage = () => {
  const dispatch = useDispatch();
  const savedEvents = useSelector((s) => s.auth.savedEvents);
  const user = useSelector((s) => s.auth.user);
  const allEvents = useSelector(selectEventsList);
  const selectedCity = useSelector((s) => s.location.selectedCity);

  const [rescheduleModal, setRescheduleModal] = useState(null); // { booking, dates } | null
  const [selectedNewDateId, setSelectedNewDateId] = useState(null);
  const [rescheduling, setRescheduling] = useState(false);

  const myBookings = useSelector((s) => s.bookings.myBookings);
  const myBookingsStatus = useSelector((s) => s.bookings.myBookingsStatus);

  const savedList = allEvents.filter((e) => savedEvents.includes(e.id));

  useEffect(() => {
    dispatch(fetchMyBookings());
  }, [dispatch]);

  // Escape closes the reschedule dialog
  useEffect(() => {
    if (!rescheduleModal) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setRescheduleModal(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [rescheduleModal]);

  const handleCancelBooking = (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? A refund will be processed according to the refund policy.')) return;
    dispatch(cancelBooking(bookingId));
  };

  const handleOpenReschedule = async (booking) => {
    if (!booking.event?._id) return;
    setRescheduling(true);
    try {
      const res = await eventsService.getById(booking.event._id);
      const allDates = res.data.eventDates || [];
      const otherDates = allDates.filter((d) => d._id !== booking.eventDateId);
      if (otherDates.length === 0) {
        toast.error('No other dates are available for this event.');
        return;
      }
      setRescheduleModal({ booking, dates: otherDates });
      setSelectedNewDateId(null);
    } finally {
      setRescheduling(false);
    }
  };

  const handleConfirmReschedule = () => {
    if (!selectedNewDateId || !rescheduleModal) return;
    dispatch(rescheduleBooking({ bookingId: rescheduleModal.booking._id, newEventDateId: selectedNewDateId }))
      .unwrap()
      .then(() => {
        setRescheduleModal(null);
        toast.success('Booking rescheduled.');
      })
      .catch((err) => toast.error(typeof err === 'string' ? err : 'Could not reschedule. Please try again.'));
  };

  const alertPrefs = [
    { key: 'push', label: 'Push notifications' },
    { key: 'email', label: 'Email notifications' },
    { key: 'whatsapp', label: 'WhatsApp notifications' },
  ];

  const quickLinks = [
    { label: 'My bookings', href: '#my-bookings', icon: Ticket, count: myBookings.length },
    { label: 'Saved events', href: '#saved-events', icon: Heart, count: savedEvents.length },
    { label: 'My creator videos', to: ROUTES.MY_CREATOR_VIDEOS, icon: Video },
    { label: 'Edit profile', to: ROUTES.PROFILE_EDIT, icon: Settings },
  ];

  return (
    <div>
      {/* Profile banner */}
      <section className="surface-night bg-night text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-10">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-night-soft font-heading text-3xl font-extrabold text-marigold ring-2 ring-marigold ring-offset-2 ring-offset-night">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                user?.name?.[0]?.toUpperCase() || '?'
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="truncate font-heading text-3xl font-extrabold sm:text-4xl">{user?.name || 'Guest user'}</h1>
              <p className="truncate text-white/70">{user?.email || 'Sign in to save events'}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/70">
                <MapPin size={14} /> {selectedCity.name}, {selectedCity.state}
              </p>
            </div>

            <Link
              to={ROUTES.PROFILE_EDIT}
              className="inline-flex items-center gap-2 rounded-pill border border-white/30 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white/10"
            >
              <Settings size={15} /> Edit profile
            </Link>
          </div>

          <div className="mt-6 flex gap-8">
            <div>
              <p className="font-heading text-2xl font-extrabold">{myBookings.length}</p>
              <p className="text-sm text-white/60">Bookings</p>
            </div>
            <div>
              <p className="font-heading text-2xl font-extrabold">{savedEvents.length}</p>
              <p className="text-sm text-white/60">Saved events</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[20rem_1fr]">

          {/* Main column (first on phones) */}
          <div className="order-1 min-w-0 lg:order-2">
            {/* Quick links for phones; on desktop the same links are in the sidebar */}
            <nav aria-label="Profile sections" className="scrollbar-none -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 lg:hidden">
              {quickLinks.map(({ label, href, to, icon: Icon }) => {
                const className =
                  'inline-flex h-10 shrink-0 items-center gap-2 rounded-pill border border-mist bg-white px-4 text-sm font-medium text-night';
                return href ? (
                  <a key={label} href={href} className={className}><Icon size={15} /> {label}</a>
                ) : (
                  <Link key={label} to={to} className={className}><Icon size={15} /> {label}</Link>
                );
              })}
            </nav>

            {/* My bookings */}
            <section id="my-bookings" className="mb-12 scroll-mt-24">
              <h2 className="mb-5 font-heading text-2xl font-bold text-night">My bookings</h2>

              {myBookingsStatus === 'loading' && (
                <div className="space-y-4">
                  <div className="skeleton h-36" />
                  <div className="skeleton h-36" />
                </div>
              )}

              {myBookingsStatus === 'succeeded' && myBookings.length === 0 && (
                <div className="card px-6 py-12 text-center">
                  <Ticket size={36} className="mx-auto mb-3 text-night/30" />
                  <p className="font-heading text-lg font-semibold text-night">No bookings yet</p>
                  <p className="mt-1 text-sm text-ink/60">Your tickets will show up here once you book an event.</p>
                  <Link to={ROUTES.HOME} className="btn-brand mt-5 inline-block">Browse events</Link>
                </div>
              )}

              {myBookings.length > 0 && (
                <ul className="space-y-4">
                  {myBookings.map((b) => (
                    <BookingTicket
                      key={b._id}
                      booking={b}
                      rescheduling={rescheduling}
                      onReschedule={handleOpenReschedule}
                      onCancel={handleCancelBooking}
                    />
                  ))}
                </ul>
              )}
            </section>

            {/* Saved events */}
            <section id="saved-events" className="scroll-mt-24">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-heading text-2xl font-bold text-night">
                  Saved events
                  {savedList.length > 0 && <span className="ml-2 text-base font-normal text-ink/50">({savedList.length})</span>}
                </h2>
                <Link to={ROUTES.HOME} className="text-sm font-semibold text-night underline underline-offset-4 hover:text-brand-red">
                  Browse events
                </Link>
              </div>

              {savedList.length === 0 ? (
                <div className="card px-6 py-12 text-center">
                  <Heart size={36} className="mx-auto mb-3 text-night/30" />
                  <p className="font-heading text-lg font-semibold text-night">No saved events yet</p>
                  <p className="mt-1 text-sm text-ink/60">Tap the heart on any event to keep it here.</p>
                  <Link to={ROUTES.HOME} className="btn-brand mt-5 inline-block">Explore events</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {savedList.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar (below the content on phones) */}
          <aside className="order-2 space-y-4 lg:order-1">
            <nav aria-label="Profile sections" className="card hidden divide-y divide-mist/70 lg:block">
              {quickLinks.map(({ label, href, to, icon: Icon, count }) => {
                const className = 'flex items-center gap-3 px-5 py-3.5 text-sm font-medium text-night transition-colors hover:bg-night/5';
                const inner = (
                  <>
                    <Icon size={16} className="text-night/60" />
                    <span className="flex-1">{label}</span>
                    {count !== undefined && <span className="text-ink/50">{count}</span>}
                  </>
                );
                return href ? (
                  <a key={label} href={href} className={className}>{inner}</a>
                ) : (
                  <Link key={label} to={to} className={className}>{inner}</Link>
                );
              })}
            </nav>

            <section className="card p-5">
              <h3 className="mb-1 font-heading text-base font-bold text-night">Notifications</h3>
              {alertPrefs.map(({ key, label }) => (
                <Toggle
                  key={key}
                  label={label}
                  checked={user?.alertPrefs?.[key] ?? true}
                  onChange={(e) => {
                    const newPrefs = { ...user.alertPrefs, [key]: e.target.checked };
                    dispatch(updateProfile({ alertPrefs: newPrefs }));
                  }}
                />
              ))}
            </section>

            <RewardsPanel user={user} bookingCount={myBookings.length} />

            <button
              type="button"
              onClick={() => dispatch(logout())}
              className="flex w-full items-center justify-center gap-2 rounded-pill border border-mist bg-white py-3 text-sm font-semibold text-ink/70 transition-colors hover:border-brand-red hover:text-brand-red"
            >
              <LogOut size={15} /> Sign out
            </button>
          </aside>
        </div>
      </div>

      {/* Reschedule dialog */}
      {rescheduleModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-night-deep/70 px-4"
          onClick={() => setRescheduleModal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reschedule-title"
            className="w-full max-w-sm rounded-2xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="reschedule-title" className="font-heading text-xl font-bold text-night">Reschedule booking</h3>
            <p className="mb-4 mt-1 text-sm text-ink/60">Choose a new date.</p>

            <div className="mb-5 space-y-2">
              {rescheduleModal.dates.map((d) => {
                const checked = selectedNewDateId === d._id;
                return (
                  <label
                    key={d._id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${checked ? 'border-night bg-night/5' : 'border-mist hover:border-night/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="newDate"
                      checked={checked}
                      onChange={() => setSelectedNewDateId(d._id)}
                      className="accent-night"
                    />
                    <span className="text-sm font-semibold text-night">
                      {new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {d.label ? ` (${d.label})` : ''}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRescheduleModal(null)}
                className="btn-outline flex-1 !py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReschedule}
                disabled={!selectedNewDateId}
                className="btn-brand flex-1 !py-2.5 text-sm disabled:opacity-40"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;