// src/pages/Booking/ConfirmBookingPage.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Minus, Plus, ChevronLeft } from 'lucide-react';
import { useEventDetail } from '../../features/events/hooks/useEventDetail';
import { createBooking, resetBookingStatus } from '../../features/bookings/slices/bookingsSlice';
import { formatPrice } from '../../utils/formatPrice';
import { ROUTES, buildRoute } from '../../constants/routes';
import Input from '../../components/ui/Input/Input';
import Spinner from '../../components/ui/Spinner/Spinner';
import toast from 'react-hot-toast';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { eventsService } from '../../services/events.service';

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
  const location = useLocation();
  const variantId = location.state?.variantId || null;
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    if (!variantId || !eventId) return;
    eventsService.getVariants(eventId).then((res) => {
      const found = (res.data.results || []).find((v) => v._id === variantId);
      setSelectedVariant(found || null);
    });
  }, [variantId, eventId]);

  // Pre-fill from profile — PRD spec: "Pre-filled from profile · required"
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
    navigate(ROUTES.LOGIN, { state: { from: { pathname: buildRoute.confirmBooking(eventId) } } });
    return null;
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
  const total = amount + gst;

  const handleQuantityChange = (delta) => {
    const next = Math.max(1, Math.min(maxQty, quantity + delta));
    setQuantity(next);
    setAttendeeNames((prev) => {
      const copy = [...prev];
      while (copy.length < next) copy.push('');
      return copy.slice(0, next);
    });
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
      toast.error('Contact details complete karo pehle');
      return;
    }
    if (quantity > remaining) {
      toast.error('Itni seats available nahi hain');
      return;
    }

    try {
      const booking = await dispatch(
       createBooking({
          eventId: event.id,
          variantId: selectedVariant?._id || null,
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
        navigate(buildRoute.payment(booking._id), { state: { booking } });
      }
    } catch (err) {
      toast.error(err || 'Booking fail ho gayi, dobara try karo');
    }
  };

  return (
    <div className="bg-[#f5f5f4] min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-3">
          <Link
            to={buildRoute.eventDetail(event.id)}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={15} /> Back to event
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="font-black text-2xl md:text-3xl text-gray-900 mb-1">Confirm your booking</h1>
        <p className="text-sm text-gray-500 mb-8">{event.title}</p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact details */}
            <div className="bg-white border border-gray-200 p-6">
              <h2 className="font-black text-base text-gray-900 mb-4">Contact details</h2>
              <div className="space-y-4">
                <Input label="Full name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
                  <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <p className="text-xs text-gray-400">Ticket isi email pe deliver hoga.</p>
              </div>
            </div>

            {/* Quantity + attendees */}
            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-base text-gray-900">Tickets</h2>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="w-9 h-9 border border-gray-300 flex items-center justify-center hover:border-brand-red disabled:opacity-40 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-bold text-lg w-6 text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= maxQty}
                    className="w-9 h-9 border border-gray-300 flex items-center justify-center hover:border-brand-red disabled:opacity-40 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-4">{remaining} seats remaining · max {maxQty} per order</p>

              {quantity > 1 && (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mt-3">Attendee names</p>
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
            </div>

            {/* Promo code */}
            {!isFree && (
              <div className="bg-white border border-gray-200 p-6">
                <h2 className="font-black text-base text-gray-900 mb-4">Promo code</h2>
                <Input
                  placeholder="Have a code? Enter it here"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                />
                <p className="text-xs text-gray-400 mt-1.5">Applied at checkout — discount confirm hone ke baad total update hoga.</p>
              </div>
            )}
          </div>

          {/* Right — order summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="font-black text-base text-gray-900 mb-4">Order summary</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                   <span>{isFree ? 'Price' : `${selectedVariant ? selectedVariant.name : formatPrice(event.price)} × ${quantity}`}</span>
                    <span>{isFree ? 'Free' : `₹${amount.toLocaleString('en-IN')}`}</span>
                  </div>
                  {!isFree && (
                    <div className="flex justify-between text-gray-600">
                      <span>GST (18%)</span>
                      <span>₹{gst.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 border-b border-gray-200 flex justify-between items-baseline">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-black text-2xl text-gray-900">
                  {isFree ? 'Free' : `₹${total.toLocaleString('en-IN')}`}
                </span>
              </div>
              <div className="p-6">
              {bookingError && (
  <p className="text-sm text-red-600 mb-3">
    {typeof bookingError === 'string' ? bookingError : bookingError?.message || 'Kuch galat ho gaya, dobara try karo'}
  </p>
)}
                <button
                  type="submit"
                  disabled={bookingStatus === 'loading'}
                  className="w-full bg-brand-red hover:bg-brand-red-hover text-white font-bold py-3.5 text-sm transition-colors disabled:opacity-60"
                >
                  {bookingStatus === 'loading' ? 'Please wait...' : isFree ? 'Confirm booking' : 'Continue to payment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfirmBookingPage;
