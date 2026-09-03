// src/pages/Marketplace/MarketplacePage.jsx
// Matches reference: split layout — black "Plan Your Event" left panel + form right panel
// Service grid selector → lead form → success with matched vendors
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CircleCheck, ArrowRight } from 'lucide-react';
import { submitLeadRequest, setSelectedService, resetLeadResult, approveVendor } from '../../features/marketplace/slices/marketplaceSlice';
import { MARKETPLACE_SERVICES } from '../../constants/categories';
import { buildRoute } from '../../constants/routes';
import Spinner from '../../components/ui/Spinner/Spinner';

const VENDOR_TYPES = [
  { id: 'photographer', label: 'Photographer', icon: '📷' },
  { id: 'dj',           label: 'DJ / Music',   icon: '🎧' },
  { id: 'decorator',    label: 'Decorator',     icon: '🎀' },
  { id: 'caterer',      label: 'Caterer',       icon: '🍽️' },
  { id: 'anchor',       label: 'Anchor / MC',   icon: '🎤' },
  { id: 'planner',      label: 'Event Planner', icon: '📋' },
  { id: 'makeup',       label: 'Makeup Artist', icon: '💄' },
  { id: 'venue',        label: 'Venue',         icon: '🏛️' },
];

const MarketplacePage = () => {
  const dispatch        = useDispatch();
  const navigate        = useNavigate();
  const selectedService = useSelector((s) => s.marketplace.selectedService);
  const leadResult      = useSelector((s) => s.marketplace.leadResult);
  const status          = useSelector((s) => s.marketplace.status);
  const { register, handleSubmit } = useForm();

  // Guests can fill in the form freely, but submitting requires an account —
  // same "browse freely, gate at the action" pattern as event booking.
  const isLoggedIn = useSelector((s) => Boolean(s.auth.token && s.auth.user));

  useEffect(() => {
    // If we got bounced to login mid-submission, the filled form data is
    // waiting in sessionStorage — resume automatically instead of making
    // the person type everything again.
    const pending = sessionStorage.getItem('pendingMarketplaceRequest');
    if (pending && isLoggedIn) {
      const parsed = JSON.parse(pending);
      sessionStorage.removeItem('pendingMarketplaceRequest');
      dispatch(setSelectedService(parsed.serviceType));
      dispatch(submitLeadRequest(parsed));
    }
    return () => dispatch(resetLeadResult());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (data) => {
    const payload = { ...data, serviceType: selectedService };
    if (!isLoggedIn) {
      sessionStorage.setItem('pendingMarketplaceRequest', JSON.stringify(payload));
      navigate('/login', { state: { from: { pathname: '/marketplace' } } });
      return;
    }
    dispatch(submitLeadRequest(payload));
  };

  // Success state
  if (leadResult) {
    return (
      <div className="bg-[#f5f5f4] min-h-screen flex items-center justify-center py-16">
        <div className="max-w-lg mx-auto text-center px-6">
          <CircleCheck size={64} className="text-brand-red mx-auto mb-4" />
          <h2 className="font-black text-3xl text-gray-900 mb-2">Request Sent!</h2>
          <p className="text-gray-500 mb-8">{leadResult.message || 'Vendors have received your request and will reach out soon.'}</p>
          {leadResult.matchedVendors?.length > 0 && (
            <div className="text-left space-y-3">
              <h3 className="font-black text-lg text-gray-900 mb-3">Matched vendors</h3>
                           {leadResult.matchedVendors.map((v) => (
                <div key={v._id} className="bg-white border border-gray-200 p-4 flex items-center gap-4">
                  <div className="w-12 h-12 shrink-0" style={{ backgroundImage: 'repeating-linear-gradient(135deg, #d1d5db 0, #d1d5db 1px, #e5e7eb 1px, #e5e7eb 8px)', backgroundColor: '#e5e7eb' }}>
                    {v.logo && <img src={v.logo} alt={v.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm">{v.name}</p>
                    <p className="text-xs text-gray-400">{v.tagline}</p>
                  </div>
                  {v.approved ? (
                    <span className="text-xs font-bold text-green-600">✓ Approved</span>
                  ) : (
                    <button
                      onClick={() => dispatch(approveVendor({ reference: leadResult.reference, matchId: v.matchId }))}
                      className="text-xs font-bold text-brand-red border border-brand-red px-3 py-1.5 hover:bg-brand-red hover:text-white transition-colors"
                    >
                      Approve
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f5f5f4] min-h-screen">
      {/* Top black / white split hero — matches reference marketplace panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[320px]">
        {/* Black left */}
        <div className="bg-[#201e1d] text-white px-10 py-12 flex flex-col justify-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-red mb-3">Vendor Marketplace</p>
          <h1 className="font-black text-4xl md:text-5xl leading-tight mb-4">
            Plan Your<br />
            <span className="text-white">Event,</span><br />
            <span className="text-brand-red">Your Budget.</span>
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Tell us what you need and we'll instantly match you with verified vendors in Bareilly — photographers, DJs, anchors, decorators, caterers and more.
          </p>
          <div className="flex gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-4 h-px bg-brand-red inline-block" />Free matching</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-px bg-brand-red inline-block" />No middleman</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-px bg-brand-red inline-block" />Verified vendors</span>
          </div>
        </div>

        {/* Gray right — stats */}
        <div className="bg-[#2f2d2c] text-white px-10 py-12 flex flex-col justify-center">
          <div className="grid grid-cols-2 gap-6">
            {[
              { num: '200+', label: 'Verified vendors' },
              { num: '2,400+', label: 'Events serviced' },
              { num: '₹0', label: 'Platform fee' },
              { num: '24h', label: 'Response time' },
            ].map(({ num, label }) => (
              <div key={label}>
                <p className="font-black text-3xl text-white">{num}</p>
                <p className="text-xs text-gray-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {!selectedService ? (
          <div>
            <div className="text-center mb-10">
              <h2 className="font-black text-2xl text-gray-900 mb-2">What do you need?</h2>
              <p className="text-gray-500 text-sm">Select a vendor type to get started</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-200">
              {VENDOR_TYPES.map((vt) => (
                <button
                  key={vt.id}
                  onClick={() => dispatch(setSelectedService(vt.id))}
                  className="bg-white hover:bg-[#f5f5f4] text-center py-8 px-4 transition-colors group"
                >
                  <div className="text-4xl mb-3">{vt.icon}</div>
                  <p className="font-bold text-gray-900 text-sm group-hover:text-brand-red transition-colors">{vt.label}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-xl mx-auto">
            <button onClick={() => dispatch(setSelectedService(null))} className="text-sm text-gray-500 hover:text-brand-red mb-6 flex items-center gap-1 transition-colors">
              ← Change type
            </button>
            <div className="bg-white border border-gray-200 p-8">
              <h2 className="font-black text-xl text-gray-900 mb-1">
                {VENDOR_TYPES.find(v => v.id === selectedService)?.icon}{' '}
                {VENDOR_TYPES.find(v => v.id === selectedService)?.label}
              </h2>
              <p className="text-sm text-gray-500 mb-6">Fill in your requirements and we'll match you instantly</p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Your name *</label>
                    <input {...register('name', { required: true })} placeholder="Full name" className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Phone / WhatsApp *</label>
                    <input {...register('phone', { required: true })} placeholder="+91 XXXXX XXXXX" className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Event date *</label>
                    <input {...register('eventDate', { required: true })} type="date" className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">No. of guests</label>
                    <input {...register('guests')} type="number" placeholder="50" className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Budget range (₹) *</label>
                  <select {...register('budget', { required: true })} className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors bg-white">
                    <option value="">Select budget</option>
                    <option value="5000-20000">₹5,000 – ₹20,000</option>
                    <option value="20000-50000">₹20,000 – ₹50,000</option>
                    <option value="50000-150000">₹50,000 – ₹1,50,000</option>
                    <option value="150000-500000">₹1,50,000 – ₹5,00,000</option>
                    <option value="500000+">₹5,00,000+</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Special requirements</label>
                  <textarea {...register('requirements')} rows={3} placeholder="Theme, special requests, dietary needs..." className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors resize-none" />
                </div>
                <button type="submit" disabled={status === 'loading'} className="w-full flex items-center justify-center gap-2 bg-brand-red hover:bg-brand-red-hover text-white font-bold py-3.5 text-sm transition-colors disabled:opacity-60">
                  {status === 'loading' ? <Spinner size="sm" /> : <><ArrowRight size={16} /> Find Matching Vendors</>}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplacePage;