// src/pages/Marketplace/RequestMatchesPage.jsx
import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Star, CircleCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { planningRequestService } from '../../services/planningRequest.service';
import { quoteService } from '../../services/quote.service';
import { vendorPaymentService } from '../../services/vendorPayment.service';
import BookingChatThread from '../../components/chat/BookingChatThread';
import Spinner from '../../components/ui/Spinner/Spinner';
import { ROUTES } from '../../constants/routes';
import { formatPaise } from '../../utils/formatPrice';
import DisputePanel from '../../components/disputes/DisputePanel';

// Same loader as PaymentPage.jsx, cached so repeated "Pay" clicks across
// advance/balance don't inject the <script> tag again.
let razorpayScriptPromise = null;
const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve(true);
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => {
      razorpayScriptPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });
  return razorpayScriptPromise;
};

const smallBrandButton =
  'h-10 rounded-pill bg-brand-red px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-red-hover disabled:opacity-40 disabled:hover:bg-brand-red';

// Shown under an accepted quote: lets the customer pay the advance and then
// (once the advance is paid) the balance, via the vendor-bookings payment API.
const VendorBookingPaymentCard = ({ quoteId }) => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payingLeg, setPayingLeg] = useState(null); // 'advance' | 'balance' | null

  const loadBooking = useCallback(() => {
    vendorPaymentService
      .getByQuote(quoteId)
      .then((res) => setBooking(res.data))
      .catch(() => setBooking(null))
      .finally(() => setLoading(false));
  }, [quoteId]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  const pay = async (leg) => {
    setPayingLeg(leg);
    try {
      const orderRes = await (leg === 'advance'
        ? vendorPaymentService.createAdvanceOrder(booking._id)
        : vendorPaymentService.createBalanceOrder(booking._id));
      const order = orderRes.data;

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Could not load the payment gateway. Check your internet connection and try again.');
        setPayingLeg(null);
        return;
      }

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: 'Sanskaar',
        description: leg === 'advance' ? 'Advance payment' : 'Balance payment',
        theme: { color: '#ec3013' },
        handler: async (razorpayResponse) => {
          try {
            const verifyRes = await (leg === 'advance'
              ? vendorPaymentService.verifyAdvancePayment(booking._id, razorpayResponse)
              : vendorPaymentService.verifyBalancePayment(booking._id, razorpayResponse));
            setBooking(verifyRes.data);
            toast.success(leg === 'advance' ? 'Advance paid!' : 'Balance paid. Your booking is fully settled!');
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment could not be verified. Please contact support.');
          }
          setPayingLeg(null);
        },
        modal: { ondismiss: () => setPayingLeg(null) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        toast.error(response?.error?.description || 'Payment failed. Please try again.');
        setPayingLeg(null);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create the order. Please try again.');
      setPayingLeg(null);
    }
  };

  if (loading) return null;
  if (!booking) return null; // quote accepted but booking lookup failed: fail quietly, don't block the rest of the page

  return (
    <div className="space-y-3 border-t border-mist px-5 py-4">
      <p className="font-heading text-sm font-bold text-night">Payment</p>

      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-ink/80">Advance ({formatPaise(booking.advanceAmountPaise)})</span>
        {booking.advancePaid ? (
          <span className="text-sm font-semibold text-green-700">Paid</span>
        ) : (
            <button type="button" disabled={payingLeg === 'advance'} onClick={() => pay('advance')} className={smallBrandButton}>
              {payingLeg === 'advance' ? 'Please wait' : `Pay ₹${(booking.advanceAmountPaise / 100).toLocaleString('en-IN')}`}
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-ink/80">Balance ({formatPaise(booking.balanceAmountPaise)})</span>
        {booking.balancePaid ? (
          <span className="text-sm font-semibold text-green-700">Paid</span>
        ) : (
          <button
              type="button"
            disabled={!booking.advancePaid || payingLeg === 'balance'}
            onClick={() => pay('balance')}
              className={smallBrandButton}
            title={!booking.advancePaid ? 'Pay the advance first' : undefined}
          >
              {payingLeg === 'balance' ? 'Please wait' : `Pay ₹${(booking.balanceAmountPaise / 100).toLocaleString('en-IN')}`}
          </button>
        )}
      </div>

      <BookingChatThread bookingId={booking._id} />
      <DisputePanel bookingId={booking._id} />
    </div>
  );
};

const RequestMatchesPage = () => {
  const { reference } = useParams();
  const [matches, setMatches] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);

  const loadMatches = () => {
    planningRequestService.getMatches(reference).then((res) => setMatches(res.data.results || []));
  };
  const loadQuotes = () => {
    quoteService.getForRequest(reference).then((res) => setQuotes(res.data.results || []));
  };

  useEffect(() => {
    Promise.all([
      planningRequestService.getMatches(reference).then((res) => setMatches(res.data.results || [])),
      quoteService.getForRequest(reference).then((res) => setQuotes(res.data.results || [])),
    ]).finally(() => setLoading(false));
  }, [reference]);

  const handleApprove = async (matchId) => {
    setApprovingId(matchId);
    try {
      await planningRequestService.approveMatch(reference, matchId);
      toast.success('Vendor approved! They can now see your request and contact you.');
      loadMatches();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not approve this vendor.');
    }
    setApprovingId(null);
  };

  const handleAcceptQuote = async (quoteId) => {
    setAcceptingId(quoteId);
    try {
      await quoteService.accept(quoteId);
      toast.success('Quote accepted! Booking confirmed.');
      loadQuotes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not accept this quote.');
    }
    setAcceptingId(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="border-b border-mist bg-white">
        <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6">
          <Link to={ROUTES.MY_REQUESTS} className="inline-flex items-center gap-1 text-sm text-ink/60 transition-colors hover:text-night">
            <ChevronLeft size={16} /> Back to my requests
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-10 px-4 py-8 sm:px-6">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-night">Your matches</h1>
          <p className="mt-1 text-ink/60">
            Request <span className="font-mono text-sm text-night">{reference}</span>. Approve a vendor to let them contact you.
          </p>
        </div>

        {/* Matches */}
        <section>
          {matches.length === 0 && (
            <div className="card px-6 py-10 text-center">
              <p className="font-heading text-lg font-semibold text-night">No matches yet</p>
              <p className="mt-1 text-sm text-ink/60">Check back soon, or try widening your budget.</p>
            </div>
          )}

          <ul className="space-y-3">
            {matches.map((m) => (
              <li key={m._id} className="card flex items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <p className="truncate font-heading text-lg font-bold text-night">{m.vendor?.businessName}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink/70">
                    <span className="flex items-center gap-1">
                      <Star size={13} className="fill-marigold text-marigold" />
                      {m.vendor?.ratingAvg?.toFixed(1) || 'New'} ({m.vendor?.ratingCount || 0} reviews)
                    </span>
                    {m.vendor?.priceRange?.min !== undefined && (
                      <span>From ₹{m.vendor.priceRange.min.toLocaleString('en-IN')}</span>
                    )}
                  </p>
                  {m.reason && <p className="mt-1 text-sm text-ink/60">{m.reason}</p>}
                </div>

                {m.approvedByUser ? (
                  <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-green-700">
                    <CircleCheck size={16} /> Approved
                  </span>
                ) : (
                  <button
                      type="button"
                      disabled={approvingId === m._id}
                      onClick={() => handleApprove(m._id)}
                      className={`${smallBrandButton} shrink-0`}
                    >
                    {approvingId === m._id ? 'Please wait' : 'Approve'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Quotes */}
        {quotes.length > 0 && (
          <section>
            <h2 className="mb-4 font-heading text-2xl font-bold text-night">Quotes received</h2>
            <ul className="space-y-5">
              {quotes.map((q) => (
                <li key={q._id} className="ticket">
                  <div className="p-5">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="font-heading text-lg font-bold text-night">{q.vendor?.businessName}</p>
                      <span className="text-sm text-ink/60">
                        Valid until {new Date(q.validUntil).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-sm text-ink/80">
                      {q.lineItems.map((li) => (
                        <div key={li._id} className="flex justify-between gap-4">
                          <span>{li.name}</span>
                          <span>{formatPaise(li.amountPaise)}</span>
                        </div>
                      ))}
                      {q.travelChargePaise > 0 && (
                        <div className="flex justify-between gap-4 text-ink/60">
                          <span>Travel charge</span>
                          <span>{formatPaise(q.travelChargePaise)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ticket-perf" />

                  <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                    <p className="font-heading text-2xl font-extrabold text-night">
                      <span className="mr-2 text-sm font-medium text-ink/60">Total</span>
                      {formatPaise(q.totalAmountPaise)}
                    </p>
                    {q.status === 'pending' ? (
                      <button
                        type="button"
                        disabled={acceptingId === q._id}
                        onClick={() => handleAcceptQuote(q._id)}
                        className={smallBrandButton}
                      >
                        {acceptingId === q._id ? 'Please wait' : 'Accept quote'}
                      </button>
                    ) : (
                      <span className="rounded-pill bg-green-100 px-3 py-1 text-sm font-semibold capitalize text-green-800">
                        {q.status}
                      </span>
                    )}
                  </div>

                  {/* Payment only makes sense once this quote turned into a booking */}
                  {q.status === 'accepted' && <VendorBookingPaymentCard quoteId={q._id} />}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};

export default RequestMatchesPage;