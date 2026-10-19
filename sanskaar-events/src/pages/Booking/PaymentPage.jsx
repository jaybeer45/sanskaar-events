// src/pages/Booking/PaymentPage.jsx
import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronLeft, Check, ShieldCheck } from 'lucide-react';
import { createRazorpayOrder, verifyRazorpayPayment } from '../../features/bookings/slices/bookingsSlice';
import { ROUTES } from '../../constants/routes';
import toast from 'react-hot-toast';
import { eventsService } from '../../services/events.service';
import EventCard from '../Home/components/EventCard';

// Loads the Razorpay checkout script once and caches the promise so
// repeated clicks on "Pay" don't inject the <script> tag again.
let razorpayScriptPromise = null;
const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve(true);
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => {
      razorpayScriptPromise = null; // allow a retry on the next click
      resolve(false);
    };
    document.body.appendChild(script);
  });
  return razorpayScriptPromise;
};

const PaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const booking = location.state?.booking;
  const eventTitle = location.state?.eventTitle || booking?.eventTitle;
  const eventIdForSuggestions = location.state?.eventId;
  const paymentStatus = useSelector((s) => s.bookings.paymentStatus);
  const lastBooking = useSelector((s) => s.bookings.lastBooking);

  const [paid, setPaid] = useState(false);
  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false);
  const [nearbyEvents, setNearbyEvents] = useState([]);

  // Only fetch suggestions after the payment went through
  useEffect(() => {
    if (!paid || !eventIdForSuggestions) return;
    eventsService
      .getUpcomingNearby(eventIdForSuggestions)
      .then((res) => setNearbyEvents(res.data.results || []))
      .catch(() => { });
  }, [paid, eventIdForSuggestions]);

  const handlePay = useCallback(async () => {
    setIsOpeningCheckout(true);
    try {
      // 1. Ask the backend to create the Razorpay order. The amount is decided
      //    server-side, so the client can never tamper with it.
      const order = await dispatch(createRazorpayOrder(bookingId)).unwrap();

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Could not load the payment gateway. Check your internet connection and try again.');
        setIsOpeningCheckout(false);
        return;
      }

      const keyId = order.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!keyId) {
        toast.error('Razorpay key is not configured (VITE_RAZORPAY_KEY_ID is missing).');
        setIsOpeningCheckout(false);
        return;
      }

      const options = {
        key: keyId,
        amount: order.amount || Math.round((booking.totalAmount ?? 0) * 100), // paise
        currency: order.currency || 'INR',
        order_id: order.orderId,
        name: 'Sanskaar',
        description: eventTitle || 'Event booking',
        prefill: {
          name: booking.fullName,
          email: booking.email,
          contact: booking.phone,
        },
        theme: { color: '#ec3013' },
        handler: async (razorpayResponse) => {
          // 2. Razorpay returns payment_id, order_id and a signature. Send them to the
          //    backend to verify; the booking is not "paid" until the signature checks out.
          try {
            await dispatch(verifyRazorpayPayment({ bookingId, razorpayResponse })).unwrap();
            setPaid(true);
            toast.success('Payment successful!');
          } catch (err) {
            toast.error(
              typeof err === 'string' ? err : err?.message || 'Payment could not be verified. Please contact support.'
            );
          }
        },
        modal: {
          ondismiss: () => setIsOpeningCheckout(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        toast.error(response?.error?.description || 'Payment failed. Please try again.');
        setIsOpeningCheckout(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Could not create the order. Please try again.');
    } finally {
      setIsOpeningCheckout(false);
    }
  }, [dispatch, bookingId, booking, eventTitle]);

  // The booking arrives through navigation state, so a page refresh loses it.
  // Without it there is nothing to pay for, so send the user home.
  if (!booking) return <Navigate to={ROUTES.HOME} replace />;

  const totalAmount = booking.totalAmount ?? 0;

  if (paid) {
    const ticketCode = lastBooking?.ticketCode || booking.ticketCode;

    return (
      <div className="bg-surface min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 md:py-14">
          <div className="text-center">
            <span className="mx-auto w-14 h-14 rounded-full bg-marigold flex items-center justify-center">
              <Check size={28} className="text-night" />
            </span>
            <h1 className="mt-4 font-heading font-extrabold text-3xl md:text-4xl text-night">You're going!</h1>
            <p className="mt-1 text-ink/60">Your payment went through. Show this ticket at the entry.</p>
          </div>

          <div className="ticket mt-8 max-w-md mx-auto">
            <div className="surface-night bg-night text-white p-6">
              <p className="text-sm text-white/60">Booking confirmed</p>
              <h2 className="mt-1 font-heading font-bold text-2xl leading-snug">{eventTitle || 'Your event'}</h2>
            </div>

            <div className="ticket-perf" />

            <div className="p-6 text-center">
              <p className="text-sm text-ink/60">Ticket code</p>
              <p className="mt-1 font-heading font-extrabold text-3xl tracking-[0.12em] text-night break-all">
                {ticketCode}
              </p>
              <div className="mt-5 pt-5 border-t border-mist grid grid-cols-2 gap-4 text-sm text-left">
                <div>
                  <p className="text-ink/60">Tickets</p>
                  <p className="font-semibold text-night">{booking.quantity ?? 1}</p>
                </div>
                <div className="text-right">
                  <p className="text-ink/60">Amount paid</p>
                  <p className="font-semibold text-night">₹{totalAmount.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link to={ROUTES.PROFILE} className="btn-brand inline-block">
              View my bookings
            </Link>
          </div>

          {nearbyEvents.length > 0 && (
            <div className="mt-14">
              <h2 className="font-heading font-bold text-xl text-night mb-4">Upcoming events near you</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {nearbyEvents.map((ev) => (
                  <EventCard key={ev.id} event={ev} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const isBusy = isOpeningCheckout || paymentStatus === 'loading';

  return (
    <div className="bg-surface min-h-screen">
      <div className="bg-white border-b border-mist">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm text-ink/60 hover:text-night transition-colors"
          >
            <ChevronLeft size={16} /> Back
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-heading font-extrabold text-3xl text-night">Complete payment</h1>
        <p className="mt-1 text-ink/60">Almost there. Pay securely to confirm your tickets.</p>

        <div className="ticket mt-6">
          <div className="p-6">
            <p className="text-sm text-ink/60">Booking for</p>
            <p className="mt-1 font-heading font-bold text-xl text-night leading-snug">{eventTitle || 'Event booking'}</p>
            <p className="mt-1 text-sm text-ink/60">
              {booking.quantity ?? 1} {(booking.quantity ?? 1) === 1 ? 'ticket' : 'tickets'}
            </p>
          </div>
          <div className="ticket-perf" />
          <div className="p-6 flex items-baseline justify-between">
            <span className="font-semibold text-night">Amount to pay</span>
            <span className="font-heading font-extrabold text-3xl text-night">₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-white border border-mist p-4">
          <ShieldCheck size={20} className="text-night shrink-0 mt-0.5" />
          <p className="text-sm text-ink/70 leading-relaxed">
            Payments are handled by Razorpay's secure checkout. Pay with UPI, cards, netbanking or wallets.
            Your card and bank details are never stored on this site.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePay}
          disabled={isBusy}
          className="btn-brand w-full mt-6 py-4 text-base disabled:opacity-40"
        >
          {isBusy ? 'Opening secure checkout...' : `Pay ₹${totalAmount.toLocaleString('en-IN')}`}
        </button>
        <p className="mt-3 text-center text-xs text-ink/50">
          {import.meta.env.VITE_RAZORPAY_KEY_ID?.startsWith('rzp_live_')
            ? 'Secure payment powered by Razorpay'
            : 'Test mode: a Razorpay test key is active, so no real money is charged.'}
        </p>
      </div>
    </div>
  );
};

export default PaymentPage;