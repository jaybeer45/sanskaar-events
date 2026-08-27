import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Star, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { planningRequestService } from '../../services/planningRequest.service';
import { quoteService } from '../../services/quote.service';
import { vendorPaymentService } from '../../services/vendorPayment.service';
import BookingChatThread from '../../components/chat/BookingChatThread';
import Spinner from '../../components/ui/Spinner/Spinner';
import { ROUTES } from '../../constants/routes';
import { formatPaise } from '../../utils/formatPrice';
import DisputePanel from '../../components/disputes/DisputePanel';

// Same loader as PaymentPage.jsx — cached so repeated "Pay" clicks across
// advance/balance don't re-inject the <script> tag each time.
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

// Card shown under an accepted quote — lets the customer pay the advance,
// then (once advance is paid) the balance, via the vendor-bookings payment API.
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
        toast.error('Payment gateway load nahi ho paya. Internet check karke dobara try karo.');
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
        theme: { color: '#dc2626' },
        handler: async (razorpayResponse) => {
          try {
            const verifyRes = await (leg === 'advance'
              ? vendorPaymentService.verifyAdvancePayment(booking._id, razorpayResponse)
              : vendorPaymentService.verifyBalancePayment(booking._id, razorpayResponse));
            setBooking(verifyRes.data);
            toast.success(leg === 'advance' ? 'Advance paid!' : 'Balance paid — booking fully settled!');
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verify nahi ho paya, support se contact karo');
          }
          setPayingLeg(null);
        },
        modal: { ondismiss: () => setPayingLeg(null) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        toast.error(response?.error?.description || 'Payment fail ho gaya, dobara try karo');
        setPayingLeg(null);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order create nahi ho paya, dobara try karo');
      setPayingLeg(null);
    }
  };

  if (loading) return null;
  if (!booking) return null; // quote accepted but booking lookup failed — fail quiet, don't block the rest of the page

  return (
    <div className="border-t border-gray-100 pt-3 mt-1 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Advance ({formatPaise(booking.advanceAmountPaise)})</span>
        {booking.advancePaid ? (
          <span className="text-xs font-bold text-green-600 uppercase">Paid</span>
        ) : (
          <button
            disabled={payingLeg === 'advance'}
            onClick={() => pay('advance')}
            className="text-xs font-bold bg-brand-red hover:bg-brand-red-hover text-white px-3 py-1.5 disabled:opacity-60"
          >
            {payingLeg === 'advance' ? '...' : `Pay ₹${(booking.advanceAmountPaise / 100).toLocaleString('en-IN')}`}
          </button>
        )}
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Balance ({formatPaise(booking.balanceAmountPaise)})</span>
        {booking.balancePaid ? (
          <span className="text-xs font-bold text-green-600 uppercase">Paid</span>
        ) : (
          <button
            disabled={!booking.advancePaid || payingLeg === 'balance'}
            onClick={() => pay('balance')}
            className="text-xs font-bold bg-brand-red hover:bg-brand-red-hover text-white px-3 py-1.5 disabled:opacity-40"
            title={!booking.advancePaid ? 'Pay the advance first' : undefined}
          >
            {payingLeg === 'balance' ? '...' : `Pay ₹${(booking.balanceAmountPaise / 100).toLocaleString('en-IN')}`}
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
      toast.error(err.response?.data?.message || 'Failed to approve.');
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
      toast.error(err.response?.data?.message || 'Failed to accept quote.');
    }
    setAcceptingId(null);
  };

  if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><Spinner size="lg" /></div>;

  return (
    <div className="bg-[#f5f5f4] min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-3">
          <Link to={ROUTES.MY_REQUESTS} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
            <ChevronLeft size={15} /> Back to my requests
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="font-black text-2xl text-gray-900">Your Matches</h1>
          <p className="text-sm text-gray-500 mt-0.5">Request {reference} · Approve a vendor to let them contact you</p>
        </div>

        {/* Matches */}
        <div className="space-y-3">
          {matches.length === 0 && <p className="text-sm text-gray-500">No matches yet. Check back soon, or try widening your budget.</p>}
          {matches.map((m) => (
            <div key={m._id} className="bg-white border border-gray-200 p-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-bold text-gray-900">{m.vendor?.businessName}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <Star size={12} className="fill-amber-400 text-amber-400" /> {m.vendor?.ratingAvg?.toFixed(1) || '—'} ({m.vendor?.ratingCount || 0} reviews)
                  {' · '}₹{m.vendor?.priceRange?.min?.toLocaleString('en-IN')}+
                </p>
                <p className="text-xs text-gray-400 mt-1">{m.reason}</p>
              </div>
              {m.approvedByUser ? (
                <span className="flex items-center gap-1 text-green-600 text-xs font-bold shrink-0"><CheckCircle2 size={14} /> Approved</span>
              ) : (
                <button
                  disabled={approvingId === m._id}
                  onClick={() => handleApprove(m._id)}
                  className="text-xs font-bold bg-brand-red hover:bg-brand-red-hover text-white px-4 py-2 shrink-0 disabled:opacity-60"
                >
                  {approvingId === m._id ? '...' : 'Approve'}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Quotes */}
        {quotes.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-black text-lg text-gray-900">Quotes Received</h2>
            {quotes.map((q) => (
              <div key={q._id} className="bg-white border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-gray-900">{q.vendor?.businessName}</p>
                  <span className="text-xs text-gray-400">Valid until {new Date(q.validUntil).toLocaleDateString('en-IN')}</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1 mb-3">
                  {q.lineItems.map((li) => (
                    <div key={li._id} className="flex justify-between">
                      <span>{li.name}</span>
                      <span>{formatPaise(li.amountPaise)}</span>
                    </div>
                  ))}
                  {q.travelChargePaise > 0 && (
                    <div className="flex justify-between text-gray-400">
                      <span>Travel charge</span>
                      <span>{formatPaise(q.travelChargePaise)}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <p className="font-black text-gray-900">Total: {formatPaise(q.totalAmountPaise)}</p>
                  {q.status === 'pending' ? (
                    <button
                      disabled={acceptingId === q._id}
                      onClick={() => handleAcceptQuote(q._id)}
                      className="text-xs font-bold bg-brand-red hover:bg-brand-red-hover text-white px-4 py-2 disabled:opacity-60"
                    >
                      {acceptingId === q._id ? '...' : 'Accept Quote'}
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-green-600 uppercase">{q.status}</span>
                  )}
                </div>

                {/* Payment card only makes sense once this quote turned into a booking */}
                {q.status === 'accepted' && <VendorBookingPaymentCard quoteId={q._id} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestMatchesPage;