// // src/pages/Profile/ProfilePage.jsx
// import { useState, useEffect } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { Link } from 'react-router-dom';
// import { Heart, Bell, MapPin, LogOut, Settings, Ticket } from 'lucide-react';
// import { toggleSaveEvent, logout, updateProfile } from '../../features/auth/slices/authSlice';
// import { buildRoute, ROUTES } from '../../constants/routes';
// import { formatPrice } from '../../utils/formatPrice';
// import { selectEventsList } from '../../features/events/selectors/eventsSelectors';
// import RewardsPanel from '../../components/profile/RewardsPanel';
// import { fetchMyBookings, cancelBooking, rescheduleBooking } from '../../features/bookings/slices/bookingsSlice';
// import { eventsService } from '../../services/events.service';



// const ProfilePage = () => {
//   const dispatch = useDispatch();
//   const savedEvents = useSelector((s) => s.auth.savedEvents);
//   const user = useSelector((s) => s.auth.user);
//   const allEvents = useSelector(selectEventsList);
//   const selectedCity = useSelector((s) => s.location.selectedCity);
//   const [showNotifPrefs, setShowNotifPrefs] = useState(false);

//   const [rescheduleModal, setRescheduleModal] = useState(null); // { booking, dates } | null
//   const [selectedNewDateId, setSelectedNewDateId] = useState(null);
//   const [rescheduling, setRescheduling] = useState(false);

//   const myBookings = useSelector((s) => s.bookings.myBookings);
//   const myBookingsStatus = useSelector((s) => s.bookings.myBookingsStatus);

//   const savedList = allEvents.filter(e => savedEvents.includes(e.id));

//   useEffect(() => {
//     dispatch(fetchMyBookings());
//   }, [dispatch]);

//   const handleCancelBooking = (bookingId) => {
//     if (!window.confirm('Kya aap sach mein yeh booking cancel karna chahte ho? Refund policy ke hisaab se refund hoga.')) return;
//     dispatch(cancelBooking(bookingId));
//   };

//   const handleOpenReschedule = async (booking) => {
//     if (!booking.event?._id) return;
//     setRescheduling(true);
//     try {
//       const res = await eventsService.getById(booking.event._id);
//       const allDates = res.data.eventDates || [];
//       const otherDates = allDates.filter((d) => d._id !== booking.eventDateId);
//       if (otherDates.length === 0) {
//         alert('Is event ke liye koi aur date available nahi hai.');
//         return;
//       }
//       setRescheduleModal({ booking, dates: otherDates });
//       setSelectedNewDateId(null);
//     } finally {
//       setRescheduling(false);
//     }
//   };

//   const handleConfirmReschedule = () => {
//     if (!selectedNewDateId || !rescheduleModal) return;
//     dispatch(rescheduleBooking({ bookingId: rescheduleModal.booking._id, newEventDateId: selectedNewDateId }))
//       .unwrap()
//       .then(() => setRescheduleModal(null))
//       .catch((err) => alert(typeof err === 'string' ? err : 'Reschedule fail ho gaya'));
//   };

//   return (
//     <div className="bg-[#f5f5f4] min-h-screen">
//       {/* Header */}
//       <div className="bg-white border-b border-gray-200">
//         <div className="max-w-7xl mx-auto px-6 py-5">
//           <h1 className="font-black text-2xl text-gray-900">My Profile</h1>
//           <p className="text-sm text-gray-500 mt-0.5">Saved events and account settings</p>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-6 py-8">
//         <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

//           {/* Sidebar */}
//           <div className="lg:col-span-1 space-y-4">
//             {/* User card */}
//             <div className="bg-white border border-gray-200 p-5 text-center">
//               <div
//                 className="w-16 h-16 mx-auto mb-3"
//                 style={{ backgroundImage: 'repeating-linear-gradient(135deg, #d1d5db 0, #d1d5db 1px, #e5e7eb 1px, #e5e7eb 8px)', backgroundColor: '#e5e7eb' }}
//               >
//                 {user?.avatar && <img src={user.avatar} alt="" className="w-full h-full object-cover" />}
//               </div>
//               <p className="font-black text-gray-900">{user?.name || 'Guest User'}</p>
//               <p className="text-xs text-gray-400 mt-0.5">{user?.email || 'Sign in to save events'}</p>
//               <div className="flex items-center justify-center gap-1 mt-2">
//                 <MapPin size={11} className="text-brand-red" />
//                 <span className="text-xs text-gray-500">{selectedCity.name}, {selectedCity.state}</span>
//               </div>
//             </div>

//             {/* Nav */}
//             <div className="bg-white border border-gray-200 divide-y divide-gray-100">
//               <a href="#my-bookings" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:text-gray-900 transition-colors">
//                 <Ticket size={14} /> My Bookings ({myBookings.length})
//               </a>
//               <a href="#saved-events" className="flex items-center gap-3 px-4 py-3 text-sm text-brand-red font-bold">
//                 <Heart size={14} /> Saved events ({savedEvents.length})
//               </a>
//               <Link to={ROUTES.PROFILE_EDIT} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:text-gray-900 transition-colors">
//                 <Settings size={14} /> Edit Profile
//               </Link>
//               <button
//                 onClick={() => setShowNotifPrefs((v) => !v)}
//                 className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:text-gray-900 transition-colors"
//               >
//                 <Bell size={14} /> Notifications
//               </button>
//             </div>

//             {showNotifPrefs && (
//               <div className="bg-white border border-gray-200 p-5 mb-6">
//                 <h3 className="font-bold text-gray-900 mb-4 text-sm">Notification Preferences</h3>
//                 {[
//                   { key: 'push', label: 'Push notifications' },
//                   { key: 'email', label: 'Email notifications' },
//                   { key: 'whatsapp', label: 'WhatsApp notifications' },
//                 ].map(({ key, label }) => (
//                   <label key={key} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
//                     <span className="text-sm text-gray-700">{label}</span>
//                     <input
//                       type="checkbox"
//                       checked={user?.alertPrefs?.[key] ?? true}
//                       onChange={(e) => {
//                         const newPrefs = { ...user.alertPrefs, [key]: e.target.checked };
//                         dispatch(updateProfile({ alertPrefs: newPrefs }));
//                       }}
//                       className="w-4 h-4 accent-brand-red"
//                     />
//                   </label>
//                 ))}
//               </div>
//             )}
//             <RewardsPanel user={user} bookingCount={myBookings.length} />

//             {/* Sign out */}
//             <button
//               onClick={() => dispatch(logout())}
//               className="w-full flex items-center gap-2 text-sm text-gray-500 hover:text-brand-red transition-colors py-2"
//             >
//               <LogOut size={14} /> Sign out
//             </button>
//           </div>

//           {/* Main */}
//           <div className="lg:col-span-3">

//             {/* My Bookings */}
//             <div id="my-bookings" className="mb-10">
//               <h2 className="font-black text-lg text-gray-900 mb-5">My Bookings</h2>

//               {myBookingsStatus === 'loading' && (
//                 <div className="bg-white border border-gray-200 py-16 text-center text-sm text-gray-400">Loading...</div>
//               )}

//               {myBookingsStatus === 'succeeded' && myBookings.length === 0 && (
//                 <div className="bg-white border border-gray-200 py-16 text-center">
//                   <Ticket size={40} className="text-gray-300 mx-auto mb-3" />
//                   <p className="font-bold text-gray-500 text-sm">NO booiking </p>
//                 </div>
//               )}

//               {myBookings.length > 0 && (
//                 <div className="bg-white border border-gray-200 divide-y divide-gray-100">
//                   {myBookings.map((b) => (
//                     <div key={b._id} className="flex items-center justify-between p-4">
//                       <div>
//                         <p className="font-bold text-gray-900">{b.event?.title || 'Event'}</p>
//                         <p className="text-xs text-gray-500 mt-0.5">
//                           {b.event?.date ? new Date(b.event.date).toLocaleDateString('en-IN') : ''} · {b.quantity} ticket(s)
//                         </p>
//                         <p className="text-xs text-gray-400 mt-0.5">Ticket: {b.ticketCode || '—'}</p>
//                       </div>
//                       <div className="text-right">
//                         <p className="font-black text-gray-900">₹{b.totalAmount?.toLocaleString('en-IN')}</p>
//                         <span
//                           className={`text-[10px] font-bold uppercase px-2 py-1 mt-1 inline-block ${b.paymentStatus === 'paid'
//                             ? 'bg-green-100 text-green-700'
//                             : b.paymentStatus === 'failed'
//                               ? 'bg-red-100 text-red-700'
//                               : 'bg-amber-100 text-amber-700'
//                             }`}
//                         >
//                           {b.paymentStatus}
//                         </span>
//                         {b.paymentStatus === 'paid' && b.status !== 'cancelled' && (
//                           <div className="flex gap-2 mt-2 justify-end">
//                             {b.eventDateId && (
//                               <button
//                                 onClick={() => handleOpenReschedule(b)}
//                                 disabled={rescheduling}
//                                 className="text-[10px] font-bold text-gray-500 border border-gray-300 px-2 py-1 hover:border-gray-500 disabled:opacity-50"
//                               >
//                                 Reschedule
//                               </button>
//                             )}
//                             <button
//                               onClick={() => handleCancelBooking(b._id)}
//                               className="text-[10px] font-bold text-red-500 border border-red-200 px-2 py-1 hover:border-red-400"
//                             >
//                               Cancel
//                             </button>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>

//             {/* Saved events */}
//             <div id="saved-events">
//               <div className="flex items-center justify-between mb-5">
//                 <h2 className="font-black text-lg text-gray-900">
//                   Saved Events
//                   {savedList.length > 0 && <span className="font-normal text-gray-400 text-sm ml-2">({savedList.length})</span>}
//                 </h2>
//                 <Link to={ROUTES.HOME} className="text-sm font-semibold text-brand-red hover:underline">
//                   Browse events →
//                 </Link>
//               </div>

//               {savedList.length === 0 ? (
//                 <div className="bg-white border border-gray-200 py-16 text-center">
//                   <Heart size={40} className="text-gray-300 mx-auto mb-3" />
//                   <p className="font-bold text-gray-500 text-sm">No saved events yet</p>
//                   <p className="text-xs text-gray-400 mt-1">Click the ♥ on any event to save it here</p>
//                   <Link to={ROUTES.HOME} className="inline-block mt-4 bg-brand-red hover:bg-brand-red-hover text-white font-bold text-sm px-5 py-2.5 transition-colors">
//                     Explore events
//                   </Link>
//                 </div>
//               ) : (
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-200">
//                   {savedList.map((event) => {
//                     const isFree = !event.price || event.price?.free || event.price?.min === 0;
//                     return (
//                       <div key={event.id} className="bg-white hover:shadow-md transition-shadow duration-200">
//                         <div
//                           className="relative h-40 overflow-hidden"
//                           style={{
//                             backgroundImage: event.images?.[0] ? undefined : 'repeating-linear-gradient(135deg, #d1d5db 0px, #d1d5db 1px, #e5e7eb 1px, #e5e7eb 10px)',
//                             backgroundColor: '#e5e7eb',
//                           }}
//                         >
//                           {event.images?.[0] && <img src={event.images[0]} alt={event.title} className="w-full h-full object-cover" />}
//                           <button
//                             onClick={() => dispatch(toggleSaveEvent(event.id))}
//                             className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-white/90 hover:bg-white transition-colors"
//                           >
//                             <Heart size={13} className="fill-brand-red text-brand-red" />
//                           </button>
//                           <span className="absolute top-2 left-2 bg-black text-white text-[10px] font-bold uppercase px-2 py-1">
//                             {event.category?.replace(/-/g, ' ')}
//                           </span>
//                         </div>
//                         <div className="p-4">
//                           <p className="text-[11px] font-bold uppercase tracking-widest text-brand-red mb-1">Starts {event.time}</p>
//                           <h3 className="font-black text-base text-gray-900 line-clamp-2 mb-2">{event.title}</h3>
//                           <p className="text-xs text-gray-500 mb-3">{event.venue?.name}</p>
//                           <div className="flex items-center justify-between">
//                             <span className="font-black text-lg text-gray-900">{isFree ? 'Free' : formatPrice(event.price)}</span>
//                             <Link to={buildRoute.eventDetail(event.id)} className="text-xs font-bold text-brand-red hover:underline">
//                               View →
//                             </Link>
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Reschedule modal */}
//       {rescheduleModal && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
//           <div className="bg-white w-full max-w-sm p-6 border border-gray-200">
//             <h3 className="font-black text-base text-gray-900 mb-1">Reschedule booking</h3>
//             <p className="text-xs text-gray-500 mb-4">Naya date choose karo</p>

//             <div className="space-y-2 mb-5">
//               {rescheduleModal.dates.map((d) => (
//                 <label
//                   key={d._id}
//                   className={`flex items-center gap-3 border px-4 py-3 cursor-pointer transition-colors ${
//                     selectedNewDateId === d._id ? 'border-brand-red bg-red-50' : 'border-gray-200'
//                   }`}
//                 >
//                   <input
//                     type="radio"
//                     name="newDate"
//                     checked={selectedNewDateId === d._id}
//                     onChange={() => setSelectedNewDateId(d._id)}
//                   />
//                   <p className="font-bold text-sm text-gray-900">
//                     {new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
//                     {d.label ? ` · ${d.label}` : ''}
//                   </p>
//                 </label>
//               ))}
//             </div>

//             <div className="flex gap-2">
//               <button
//                 onClick={() => setRescheduleModal(null)}
//                 className="flex-1 border border-gray-300 text-gray-600 font-bold py-2.5 text-sm"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleConfirmReschedule}
//                 disabled={!selectedNewDateId}
//                 className="flex-1 bg-brand-red text-white font-bold py-2.5 text-sm disabled:opacity-40"
//               >
//                 Confirm
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ProfilePage;




import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Heart, Bell, MapPin, LogOut, Settings, Ticket } from 'lucide-react';

import {
  toggleSaveEvent,
  logout,
  updateProfile,
} from '../../features/auth/slices/authSlice';

import { buildRoute, ROUTES } from '../../constants/routes';
import { formatPrice } from '../../utils/formatPrice';
import { selectEventsList } from '../../features/events/selectors/eventsSelectors';
import RewardsPanel from '../../components/profile/RewardsPanel';

import {
  fetchMyBookings,
  cancelBooking,
  rescheduleBooking,
} from '../../features/bookings/slices/bookingsSlice';

import { eventsService } from '../../services/events.service';

const ProfilePage = () => {
  const dispatch = useDispatch();

  const savedEvents = useSelector((s) => s.auth.savedEvents);
  const user = useSelector((s) => s.auth.user);
  const allEvents = useSelector(selectEventsList);
  const selectedCity = useSelector((s) => s.location.selectedCity);

  const [showNotifPrefs, setShowNotifPrefs] = useState(false);

  const [rescheduleModal, setRescheduleModal] = useState(null);
  const [selectedNewDateId, setSelectedNewDateId] = useState(null);
  const [rescheduling, setRescheduling] = useState(false);

  const myBookings = useSelector((s) => s.bookings.myBookings);
  const myBookingsStatus = useSelector(
    (s) => s.bookings.myBookingsStatus
  );

  /*
   * Stores actual event date information for bookings.
   *
   * Example:
   * {
   *   "bookingId": {
   *      eventDateId: "...",
   *      date: "2026-09-12T00:00:00.000Z"
   *   }
   * }
   */
  const [bookingDates, setBookingDates] = useState({});

  console.log('MY BOOKINGS:', myBookings);

  const savedList = allEvents.filter((e) => savedEvents.includes(e.id));

  useEffect(() => {
    dispatch(fetchMyBookings());
  }, [dispatch]);

  /*
   * Fetch actual eventDates for every booking.
   *
   * /bookings/my currently gives us:
   * booking.eventDateId
   *
   * but event.eventDates is not included in the response.
   *
   * So we fetch the event details and resolve:
   *
   * booking.eventDateId
   *        ↓
   * event.eventDates[]. _id
   *        ↓
   * event.eventDates[].date
   */
  useEffect(() => {
    let cancelled = false;

    const loadBookingDates = async () => {
      if (!myBookings.length) {
        setBookingDates({});
        return;
      }

      const results = await Promise.all(
        myBookings.map(async (booking) => {
          if (!booking._id || !booking.event?._id) {
            return null;
          }

          try {
            const res = await eventsService.getById(booking.event._id);

            const event = res.data?.event || res.data;
            const eventDates = event?.eventDates || [];

            const selectedDate = eventDates.find(
              (dateItem) =>
                String(dateItem._id) ===
                String(booking.eventDateId)
            );

            /*
             * If this is a multi-date event and the selected
             * eventDateId exists, use that date.
             *
             * Otherwise fall back to the normal event date.
             */
            const actualDate =
              selectedDate?.date || booking.event?.date || null;

            return {
              bookingId: booking._id,
              eventDateId: booking.eventDateId,
              date: actualDate,
            };
          } catch (error) {
            console.error(
              'Failed to load booking event dates:',
              error
            );

            return {
              bookingId: booking._id,
              eventDateId: booking.eventDateId,
              date: booking.event?.date || null,
            };
          }
        })
      );

      if (cancelled) return;

      const dateMap = {};

      results.forEach((item) => {
        if (item?.bookingId) {
          dateMap[item.bookingId] = item;
        }
      });

      setBookingDates(dateMap);
    };

    loadBookingDates();

    return () => {
      cancelled = true;
    };
  }, [myBookings]);

  const handleCancelBooking = (bookingId) => {
    if (
      !window.confirm(
        'Are you sure you want to cancel this booking? The refund will be processed according to the refund policy.'
      )
    ) {
      return;
    }

    dispatch(cancelBooking(bookingId));
  };

  const handleOpenReschedule = async (booking) => {
    if (!booking.event?._id) return;

    setRescheduling(true);

    try {
      const res = await eventsService.getById(booking.event._id);

      const event = res.data?.event || res.data;
      const allDates = event?.eventDates || [];

      const otherDates = allDates.filter(
        (dateItem) =>
          String(dateItem._id) !==
          String(booking.eventDateId)
      );

      if (otherDates.length === 0) {
        alert('No other date is available for this event.');
        return;
      }

      setRescheduleModal({
        booking,
        dates: allDates,
      });

      setSelectedNewDateId(null);
    } catch (err) {
      console.error('Failed to load event dates:', err);
      alert('Unable to load available dates.');
    } finally {
      setRescheduling(false);
    }
  };

  const handleConfirmReschedule = () => {
    if (!selectedNewDateId || !rescheduleModal) return;

    dispatch(
      rescheduleBooking({
        bookingId: rescheduleModal.booking._id,
        newEventDateId: selectedNewDateId,
      })
    )
      .unwrap()
      .then(() => {
        setRescheduleModal(null);
        setSelectedNewDateId(null);

        /*
         * Fetch the latest booking from backend.
         * This is important because the booking's
         * eventDateId has changed.
         */
        dispatch(fetchMyBookings());
      })
      .catch((err) => {
        alert(
          typeof err === 'string'
            ? err
            : 'Reschedule failed'
        );
      });
  };

  /*
   * Returns the actual date booked by the user.
   */
  const getBookingDate = (booking) => {
    return (
      bookingDates[booking._id]?.date ||
      booking.event?.date ||
      null
    );
  };

  const formatBookingDate = (booking) => {
    const date = getBookingDate(booking);

    if (!date) return '';

    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatBookingTime = (time) => {
    if (!time) return '';

    /*
     * Already formatted:
     * 6:00 PM
     */
    if (/[AP]M/i.test(time)) {
      return time;
    }

    /*
     * 24-hour format:
     * 18:20
     */
    const match = String(time).match(
      /^(\d{1,2}):(\d{2})$/
    );

    if (!match) return time;

    const hours = Number(match[1]);
    const minutes = match[2];

    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;

    return `${displayHour}:${minutes} ${period}`;
  };

  return (
    <div className="bg-[#f5f5f4] min-h-screen">

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <h1 className="font-black text-2xl text-gray-900">
            My Profile
          </h1>

          <p className="text-sm text-gray-500 mt-0.5">
            Saved events and account settings
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">

            {/* User card */}
            <div className="bg-white border border-gray-200 p-5 text-center">

              <div
                className="w-16 h-16 mx-auto mb-3"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(135deg, #d1d5db 0, #d1d5db 1px, #e5e7eb 1px, #e5e7eb 8px)',
                  backgroundColor: '#e5e7eb',
                }}
              >
                {user?.avatar && (
                  <img
                    src={user.avatar}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <p className="font-black text-gray-900">
                {user?.name || 'Guest User'}
              </p>

              <p className="text-xs text-gray-400 mt-0.5">
                {user?.email || 'Sign in to save events'}
              </p>

              <div className="flex items-center justify-center gap-1 mt-2">
                <MapPin
                  size={11}
                  className="text-brand-red"
                />

                <span className="text-xs text-gray-500">
                  {selectedCity.name}, {selectedCity.state}
                </span>
              </div>
            </div>

            {/* Nav */}
            <div className="bg-white border border-gray-200 divide-y divide-gray-100">

              <a
                href="#my-bookings"
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Ticket size={14} />
                My Bookings ({myBookings.length})
              </a>

              <a
                href="#saved-events"
                className="flex items-center gap-3 px-4 py-3 text-sm text-brand-red font-bold"
              >
                <Heart size={14} />
                Saved events ({savedEvents.length})
              </a>

              <Link
                to={ROUTES.PROFILE_EDIT}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Settings size={14} />
                Edit Profile
              </Link>

              <button
                onClick={() =>
                  setShowNotifPrefs((v) => !v)
                }
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Bell size={14} />
                Notifications
              </button>

            </div>

            {showNotifPrefs && (
              <div className="bg-white border border-gray-200 p-5 mb-6">

                <h3 className="font-bold text-gray-900 mb-4 text-sm">
                  Notification Preferences
                </h3>

                {[
                  {
                    key: 'push',
                    label: 'Push notifications',
                  },
                  {
                    key: 'email',
                    label: 'Email notifications',
                  },
                  {
                    key: 'whatsapp',
                    label: 'WhatsApp notifications',
                  },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-sm text-gray-700">
                      {label}
                    </span>

                    <input
                      type="checkbox"
                      checked={
                        user?.alertPrefs?.[key] ?? true
                      }
                      onChange={(e) => {
                        const newPrefs = {
                          ...user.alertPrefs,
                          [key]: e.target.checked,
                        };

                        dispatch(
                          updateProfile({
                            alertPrefs: newPrefs,
                          })
                        );
                      }}
                      className="w-4 h-4 accent-brand-red"
                    />
                  </label>
                ))}

              </div>
            )}

            <RewardsPanel
              user={user}
              bookingCount={myBookings.length}
            />

            {/* Sign out */}
            <button
              onClick={() => dispatch(logout())}
              className="w-full flex items-center gap-2 text-sm text-gray-500 hover:text-brand-red transition-colors py-2"
            >
              <LogOut size={14} />
              Sign out
            </button>

          </div>

          {/* Main */}
          <div className="lg:col-span-3">

            {/* My Bookings */}
            <div id="my-bookings" className="mb-10">

              <h2 className="font-black text-lg text-gray-900 mb-5">
                My Bookings
              </h2>

              {myBookingsStatus === 'loading' && (
                <div className="bg-white border border-gray-200 py-16 text-center text-sm text-gray-400">
                  Loading...
                </div>
              )}

              {myBookingsStatus === 'succeeded' &&
                myBookings.length === 0 && (
                  <div className="bg-white border border-gray-200 py-16 text-center">

                    <Ticket
                      size={40}
                      className="text-gray-300 mx-auto mb-3"
                    />

                    <p className="font-bold text-gray-500 text-sm">
                      No bookings
                    </p>

                  </div>
                )}

              {myBookings.length > 0 && (
                <div className="bg-white border border-gray-200 divide-y divide-gray-100">

                  {myBookings.map((b) => (
                    <div
                      key={b._id}
                      className="flex items-center justify-between p-4"
                    >

                      <div>

                        <p className="font-bold text-gray-900">
                          {b.event?.title || 'Event'}
                        </p>

                        <p className="text-xs text-gray-500 mt-0.5">

                          {formatBookingDate(b)}

                          {formatBookingTime(
                            b.event?.time
                          ) && (
                            <>
                              {' · '}
                              {formatBookingTime(
                                b.event?.time
                              )}
                            </>
                          )}

                          {' · '}

                          {b.quantity} ticket(s)

                        </p>

                        <p className="text-xs text-gray-400 mt-0.5">

                          {b.event?.venue?.name && (
                            <>
                              {b.event.venue.name}
                              {' · '}
                            </>
                          )}

                          Ticket: {b.ticketCode || '—'}

                        </p>

                        {b.event?.venue?.address && (
                          <p className="text-xs text-gray-400 mt-0.5">

                            <MapPin
                              size={10}
                              className="inline mr-1"
                            />

                            {b.event.venue.address}

                          </p>
                        )}

                      </div>

                      <div className="text-right">

                        <p className="font-black text-gray-900">
                          ₹
                          {b.totalAmount?.toLocaleString(
                            'en-IN'
                          )}
                        </p>

                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-1 mt-1 inline-block ${
                            b.paymentStatus === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : b.paymentStatus === 'failed'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {b.paymentStatus}
                        </span>

                        {b.paymentStatus === 'paid' &&
                          b.status !== 'cancelled' && (

                            <div className="flex gap-2 mt-2 justify-end">

                              {b.eventDateId && (
                                <button
                                  onClick={() =>
                                    handleOpenReschedule(b)
                                  }
                                  disabled={rescheduling}
                                  className="text-[10px] font-bold text-gray-500 border border-gray-300 px-2 py-1 hover:border-gray-500 disabled:opacity-50"
                                >
                                  Reschedule
                                </button>
                              )}

                              <button
                                onClick={() =>
                                  handleCancelBooking(
                                    b._id
                                  )
                                }
                                className="text-[10px] font-bold text-red-500 border border-red-200 px-2 py-1 hover:border-red-400"
                              >
                                Cancel
                              </button>

                            </div>

                          )}

                      </div>

                    </div>
                  ))}

                </div>
              )}

            </div>

            {/* Saved events */}
            <div id="saved-events">

              <div className="flex items-center justify-between mb-5">

                <h2 className="font-black text-lg text-gray-900">
                  Saved Events

                  {savedList.length > 0 && (
                    <span className="font-normal text-gray-400 text-sm ml-2">
                      ({savedList.length})
                    </span>
                  )}

                </h2>

                <Link
                  to={ROUTES.HOME}
                  className="text-sm font-semibold text-brand-red hover:underline"
                >
                  Browse events →
                </Link>

              </div>

              {savedList.length === 0 ? (
                <div className="bg-white border border-gray-200 py-16 text-center">

                  <Heart
                    size={40}
                    className="text-gray-300 mx-auto mb-3"
                  />

                  <p className="font-bold text-gray-500 text-sm">
                    No saved events yet
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    Click the ♥ on any event to save it here
                  </p>

                  <Link
                    to={ROUTES.HOME}
                    className="inline-block mt-4 bg-brand-red hover:bg-brand-red-hover text-white font-bold text-sm px-5 py-2.5 transition-colors"
                  >
                    Explore events
                  </Link>

                </div>
              ) : (

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-200">

                  {savedList.map((event) => {

                    const isFree =
                      !event.price ||
                      event.price?.free ||
                      event.price?.min === 0;

                    return (

                      <div
                        key={event.id}
                        className="bg-white hover:shadow-md transition-shadow duration-200"
                      >

                        <div
                          className="relative h-40 overflow-hidden"
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
                              className="w-full h-full object-cover"
                            />
                          )}

                          <button
                            onClick={() =>
                              dispatch(
                                toggleSaveEvent(event.id)
                              )
                            }
                            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-white/90 hover:bg-white transition-colors"
                          >
                            <Heart
                              size={13}
                              className="fill-brand-red text-brand-red"
                            />
                          </button>

                          <span className="absolute top-2 left-2 bg-black text-white text-[10px] font-bold uppercase px-2 py-1">
                            {event.category?.replace(
                              /-/g,
                              ' '
                            )}
                          </span>

                        </div>

                        <div className="p-4">

                          <p className="text-[11px] font-bold uppercase tracking-widest text-brand-red mb-1">
                            Starts {event.time}
                          </p>

                          <h3 className="font-black text-base text-gray-900 line-clamp-2 mb-2">
                            {event.title}
                          </h3>

                          <p className="text-xs text-gray-500 mb-3">
                            {event.venue?.name}
                          </p>

                          <div className="flex items-center justify-between">

                            <span className="font-black text-lg text-gray-900">
                              {isFree
                                ? 'Free'
                                : formatPrice(
                                    event.price
                                  )}
                            </span>

                            <Link
                              to={buildRoute.eventDetail(
                                event.id
                              )}
                              className="text-xs font-bold text-brand-red hover:underline"
                            >
                              View →
                            </Link>

                          </div>

                        </div>

                      </div>

                    );
                  })}

                </div>

              )}

            </div>

          </div>

        </div>

      </div>

      {/* Reschedule modal */}
      {rescheduleModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">

          <div className="bg-white w-full max-w-sm p-6 border border-gray-200">

            <h3 className="font-black text-base text-gray-900 mb-1">
              Reschedule booking
            </h3>

            <p className="text-xs text-gray-500 mb-4">
              Select new date
            </p>

            <div className="space-y-2 mb-5">

              {rescheduleModal.dates
                .filter(
                  (d) =>
                    String(d._id) !==
                    String(
                      rescheduleModal.booking.eventDateId
                    )
                )
                .map((d) => (

                  <label
                    key={d._id}
                    className={`flex items-center gap-3 border px-4 py-3 cursor-pointer transition-colors ${
                      String(selectedNewDateId) ===
                      String(d._id)
                        ? 'border-brand-red bg-red-50'
                        : 'border-gray-200'
                    }`}
                  >

                    <input
                      type="radio"
                      name="newDate"
                      checked={
                        String(selectedNewDateId) ===
                        String(d._id)
                      }
                      onChange={() =>
                        setSelectedNewDateId(d._id)
                      }
                    />

                    <p className="font-bold text-sm text-gray-900">

                      {new Date(
                        d.date
                      ).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}

                      {d.label
                        ? ` · ${d.label}`
                        : ''}

                    </p>

                  </label>

                ))}

            </div>

            <div className="flex gap-2">

              <button
                onClick={() => {
                  setRescheduleModal(null);
                  setSelectedNewDateId(null);
                }}
                className="flex-1 border border-gray-300 text-gray-600 font-bold py-2.5 text-sm"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmReschedule}
                disabled={!selectedNewDateId}
                className="flex-1 bg-brand-red text-white font-bold py-2.5 text-sm disabled:opacity-40"
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

