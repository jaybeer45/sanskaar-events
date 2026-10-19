// src/pages/Booking/ConfirmBookingPage.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Minus, Plus, ChevronLeft } from 'lucide-react';
import { useEventDetail } from '../../features/events/hooks/useEventDetail';
import { createBooking, resetBookingStatus } from '../../features/bookings/slices/bookingsSlice';
import { formatPrice } from '../../utils/formatPrice';
import { getEventDateParts, formatEventTime } from '../../utils/eventDate';
import { ROUTES, buildRoute } from '../../constants/routes';
import Input from '../../components/ui/Input/Input';
import Spinner from '../../components/ui/Spinner/Spinner';
import toast from 'react-hot-toast';
import { useParams, useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { eventsService } from '../../services/events.service';
import { rewardsService } from '../../services/rewards.service';

const ConfirmBookingPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { event, status: eventStatus } = useEventDetail(eventId);
  const user = useSelector((s) => s.auth.user);
  const bookingStatus = useSelector((s) => s.bookings.status);
  const bookingError = useSelector((s) => s.bookings.error);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [attendeeNames, setAttendeeNames] = useState(['']);
  const [promoCode, setPromoCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { valuePaise, type } | null
  const [couponError, setCouponError] = useState('');
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const location = useLocation();
  const variantId = location.state?.variantId || null;
  const eventDateId = location.state?.eventDateId || null;
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    if (!variantId || !eventId) return;
    eventsService.getVariants(eventId).then((res) => {
      const found = (res.data.results || []).find((v) => v._id === variantId);
      setSelectedVariant(found || null);
    });
  }, [variantId, eventId]);

  // Pre-fill from the profile
  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    return () => dispatch(resetBookingStatus());
  }, [dispatch]);

  if (!user) {
    return (
      <Navigate
        to={ROUTES.LOGIN}
        replace
        state={{ from: { pathname: buildRoute.confirmBooking(eventId) } }}
      />
    );
  }

  if (eventStatus === 'loading' || !event) {
    return <div className="flex justify-center items-center min-h-[60vh]"><Spinner size="lg" /></div>;
  }

  const remaining = selectedVariant
    ? selectedVariant.capacity - selectedVariant.soldCount
    : event.inventory?.remaining ?? 99;
  const maxQty = Math.min(remaining, 10);

  const isFree = !selectedVariant && (!event.price || event.price?.free);
  const unitPrice = selectedVariant ? selectedVariant.price : (isFree ? 0 : event.price.min);
  const amount = unitPrice * quantity;
  const gst = Math.round(amount * 0.18);
  const discountRupees = appliedCoupon ? appliedCoupon.valuePaise / 100 : 0;
  const total = Math.max(0, amount + gst - discountRupees);

  // For multi-date events show the date the user picked, not the first one
  const chosenDate = event.eventDates?.find((d) => d._id === eventDateId)?.date || event.date;
  const dateParts = getEventDateParts(chosenDate);
  const dateLabel = [
    dateParts && `${dateParts.weekday}, ${dateParts.day} ${dateParts.month}`,
    formatEventTime(event.time),
  ]
    .filter(Boolean)
    .join(' at ');

  const handleQuantityChange = (delta) => {
    const next = Math.max(1, Math.min(maxQty, quantity + delta));
    setQuantity(next);
    setAttendeeNames((prev) => {
      const copy = [...prev];
      while (copy.length < next) copy.push('');
      return copy.slice(0, next);
    });
  };

  const handleApplyCoupon = async () => {
    if (!promoCode.trim()) return;
    setCheckingCoupon(true);
    setCouponError('');
    try {
      const res = await rewardsService.validateCoupon(promoCode.trim());
      setAppliedCoupon(res.data.coupon); // unwrap the { success, coupon } shape
      toast.success('Coupon applied!');
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err.response?.data?.message || 'This coupon code is invalid or has expired.');
    } finally {
      setCheckingCoupon(false);
    }
  };

  const handleAttendeeNameChange = (index, value) => {
    setAttendeeNames((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !phone || !email) {
      toast.error('Please complete your contact details.');
      return;
    }
    if (quantity > remaining) {
      toast.error('Not enough seats available.');
      return;
    }
    if (event.eventDates?.length > 0 && !eventDateId) {
      toast.error('Please select a date.');
      return;
    }

    try {
      const booking = await dispatch(
        createBooking({
          eventId: event.id,
          variantId: selectedVariant?._id || null,
          eventDateId,
          fullName,
          phone,
          email,
          quantity,
          attendees: attendeeNames.filter(Boolean).map((name) => ({ name })),
          promoCode: promoCode || null,
          amount,
        })
      ).unwrap();

      if (isFree) {
        toast.success(`Booked! Ticket code: ${booking.ticketCode}`);
        navigate(buildRoute.eventDetail(event.id));
      } else {
        navigate(buildRoute.payment(booking._id), {
          state: { booking, eventId, eventTitle: event.title },
        });
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Booking failed. Please try again.');
    }
  };

  return (
    <div className="bg-surface min-h-screen">
      <div className="bg-white border-b border-mist">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
          <Link
            to={buildRoute.eventDetail(event.id)}
            className="inline-flex items-center gap-1 text-sm text-ink/60 hover:text-night transition-colors"
          >
            <ChevronLeft size={16} /> Back to event
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-heading font-extrabold text-3xl text-night">Confirm your booking</h1>
        <p className="text-ink/60 mt-1 mb-8">{event.title}</p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: form */}
          <div className="lg:col-span-2 space-y-6">
            <section className="card p-6">
              <h2 className="font-heading font-bold text-lg text-night mb-4">Contact details</h2>
              <div className="space-y-4">
                <Input label="Full name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
                  <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <p className="text-sm text-ink/60">Your ticket will be emailed to this address.</p>
              </div>
            </section>

            <section className="card p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-heading font-bold text-lg text-night">Tickets</h2>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label="Decrease tickets"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="w-11 h-11 rounded-full border border-mist flex items-center justify-center hover:border-night disabled:opacity-40 disabled:hover:border-mist transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span aria-live="polite" className="font-heading font-bold text-xl w-8 text-center text-night">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase tickets"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= maxQty}
                    className="w-11 h-11 rounded-full border border-mist flex items-center justify-center hover:border-night disabled:opacity-40 disabled:hover:border-mist transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-ink/60">
                {remaining} seats left, up to {maxQty} per order.
              </p>

              {quantity > 1 && (
                <div className="space-y-3 mt-5 pt-5 border-t border-mist">
                  <p className="text-sm font-semibold text-ink">Attendee names</p>
                  {attendeeNames.map((name, i) => (
                    <Input
                      key={i}
                      label={`Attendee ${i + 1}`}
                      value={name}
                      onChange={(e) => handleAttendeeNameChange(i, e.target.value)}
                      placeholder={i === 0 ? fullName || 'Name' : 'Name'}
                    />
                  ))}
                </div>
              )}
            </section>

            {!isFree && (
              <section className="card p-6">
                <h2 className="font-heading font-bold text-lg text-night mb-4">Promo code</h2>
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input
                      aria-label="Promo code"
                      placeholder="Have a code? Enter it here"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase());
                        setAppliedCoupon(null);
                        setCouponError('');
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={!promoCode.trim() || checkingCoupon || !!appliedCoupon}
                    className="btn-outline h-12 !py-0 text-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-ink"
                  >
                    {checkingCoupon ? 'Checking' : appliedCoupon ? 'Applied' : 'Apply'}
                  </button>
                </div>
                {couponError && <p className="text-sm text-red-600 mt-2">{couponError}</p>}
                {appliedCoupon && (
                  <p className="text-sm text-green-700 mt-2">
                    Coupon applied, ₹{(appliedCoupon.valuePaise / 100).toLocaleString('en-IN')} off.
                  </p>
                )}
              </section>
            )}
          </div>

          {/* Right: order summary as a ticket */}
          <aside className="lg:col-span-1">
            <div className="ticket sticky top-24">
              <div className="surface-night bg-night text-white p-6">
                <p className="text-sm text-white/60">Your event</p>
                <h2 className="mt-1 font-heading font-bold text-xl leading-snug">{event.title}</h2>
                {dateLabel && <p className="mt-2 text-sm text-white/70">{dateLabel}</p>}
              </div>

              <div className="ticket-perf" />

              <div className="p-6 space-y-2 text-sm">
                <div className="flex justify-between gap-4 text-ink/80">
                  <span>
                    {isFree
                      ? 'Price'
                      : `${selectedVariant ? selectedVariant.name : formatPrice(event.price)} × ${quantity}`}
                  </span>
                  <span>{isFree ? 'Free' : `₹${amount.toLocaleString('en-IN')}`}</span>
                </div>
                {!isFree && (
                  <div className="flex justify-between text-ink/80">
                    <span>GST (18%)</span>
                    <span>₹{gst.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {appliedCoupon && (
                  <div className="flex justify-between text-green-700">
                    <span>Coupon discount</span>
                    <span>− ₹{(appliedCoupon.valuePaise / 100).toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              <div className="px-6 py-5 border-t border-mist flex justify-between items-baseline">
                <span className="font-semibold text-night">Total</span>
                <span className="font-heading font-extrabold text-3xl text-night">
                  {isFree ? 'Free' : `₹${total.toLocaleString('en-IN')}`}
                </span>
              </div>

              <div className="px-6 pb-6">
                {bookingError && (
                  <p role="alert" className="text-sm text-red-600 mb-3">
                    {typeof bookingError === 'string'
                      ? bookingError
                      : bookingError?.message || 'Something went wrong. Please try again.'}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={bookingStatus === 'loading'}
                  className="btn-brand w-full py-3.5 text-base disabled:opacity-60"
                >
                  {bookingStatus === 'loading'
                    ? 'Please wait...'
                    : isFree
                      ? 'Confirm booking'
                      : 'Continue to payment'}
                </button>
                {!isFree && (
                  <p className="mt-3 text-center text-xs text-ink/50">You pay securely on the next step.</p>
                )}
              </div>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
};

export default ConfirmBookingPage;