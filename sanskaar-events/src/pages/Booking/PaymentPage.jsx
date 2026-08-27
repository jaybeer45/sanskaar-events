// src/pages/Booking/PaymentPage.jsx

import { useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronLeft, CircleCheck, ShieldCheck } from 'lucide-react';
import { createRazorpayOrder, verifyRazorpayPayment } from '../../features/bookings/slices/bookingsSlice';
import { ROUTES } from '../../constants/routes';
import toast from 'react-hot-toast';

// Loads the Razorpay checkout script once and caches the promise so
// repeated clicks on "Pay" don't re-inject the <script> tag.
let razorpayScriptPromise = null;
const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve(true);
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => {
      razorpayScriptPromise = null; // allow retry on next click
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
  const paymentStatus = useSelector((s) => s.bookings.paymentStatus);
  const lastBooking = useSelector((s) => s.bookings.lastBooking);

  const [paid, setPaid] = useState(false);
  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false);

  // Booking navigate se state mein nahi aayi (e.g. page refresh) — bina
  // context ke payment nahi dikha sakte, wapas events pe bhej do.
  if (!booking) {
    navigate(ROUTES.HOME);
    return null;
  }

  const handlePay = useCallback(async () => {
    setIsOpeningCheckout(true);
    try {
      // 1. Backend se Razorpay order banwao (amount server-side decide hota
      //    hai — client kabhi apna amount bhejke manipulate nahi kar sakta).
      const order = await dispatch(createRazorpayOrder(bookingId)).unwrap();

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Payment gateway load nahi ho paya. Internet check karke dobara try karo.');
        setIsOpeningCheckout(false);
        return;
      }

      const keyId = order.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!keyId) {
        toast.error('Razorpay key configure nahi hai (VITE_RAZORPAY_KEY_ID missing).');
        setIsOpeningCheckout(false);
        return;
      }

      const options = {
        key: keyId,
        amount: order.amount || Math.round((booking.totalAmount ?? 0) * 100), // paise
        currency: order.currency || 'INR',
        order_id: order.orderId,
        name: 'Sanskaar',
        description: booking.eventTitle || 'Event booking',
        prefill: {
          name: booking.fullName,
          email: booking.email,
          contact: booking.phone,
        },
        theme: { color: '#dc2626' },
        handler: async (razorpayResponse) => {
          // 2. Payment ke baad Razorpay jo response deta hai (payment_id,
          //    order_id, signature) — usko backend pe bhejo verify karwane ke liye.
          //    Signature verify hone tak booking ko "paid" mat maano.
          try {
            await dispatch(verifyRazorpayPayment({ bookingId, razorpayResponse })).unwrap();
            setPaid(true);
            toast.success('Payment successful!');
          } catch (err) {
            toast.error(typeof err === 'string' ? err : err?.message || 'Payment verify nahi ho paya, support se contact karo');
          }
        },
        modal: {
          ondismiss: () => setIsOpeningCheckout(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        toast.error(response?.error?.description || 'Payment fail ho gaya, dobara try karo');
        setIsOpeningCheckout(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Order create nahi ho paya, dobara try karo');
    } finally {
      setIsOpeningCheckout(false);
    }
  }, [dispatch, bookingId, booking]);

  if (paid) {
    return (
      <div className="bg-[#f5f5f4] min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <CircleCheck size={64} className="text-brand-red mx-auto mb-4" />
          <h2 className="font-black text-2xl text-gray-900 mb-2">Payment successful!</h2>
          <p className="text-gray-500 mb-1">Ticket code</p>
          <p className="font-black text-xl text-gray-900 mb-6 tracking-wider">{lastBooking?.ticketCode || booking.ticketCode}</p>
          <Link
            to={ROUTES.PROFILE}
            className="inline-block bg-brand-red hover:bg-brand-red-hover text-white font-bold px-6 py-3 text-sm transition-colors"
          >
            View my bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f5f5f4] min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={15} /> Back
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="font-black text-2xl text-gray-900 mb-1">Complete payment</h1>
        <p className="text-sm text-gray-500 mb-6">
          Amount to pay: <span className="font-bold text-gray-900">₹{(booking.totalAmount ?? 0).toLocaleString('en-IN')}</span>
        </p>

        <div className="bg-white border border-gray-200 p-6 space-y-5">
          <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 p-4">
            <ShieldCheck size={20} className="text-brand-red shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 leading-relaxed">
              Payment Razorpay ke secure checkout se hoga — UPI, cards, netbanking aur
              wallets sab yahin se select kar paoge. Card/bank details is site pe kabhi save nahi hote.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePay}
            disabled={isOpeningCheckout || paymentStatus === 'loading'}
            className="w-full bg-brand-red hover:bg-brand-red-hover text-white font-bold py-3.5 text-sm transition-colors disabled:opacity-40"
          >
            {isOpeningCheckout || paymentStatus === 'loading'
              ? 'Opening secure checkout...'
              : `Pay ₹${(booking.totalAmount ?? 0).toLocaleString('en-IN')}`}
          </button>
          <p className="text-center text-xs text-gray-400">
            {import.meta.env.VITE_RAZORPAY_KEY_ID?.startsWith('rzp_live_')
              ? 'Secure payment powered by Razorpay'
              : 'Test mode — Razorpay test key active, no real charge will happen'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;