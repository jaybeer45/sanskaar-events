// src/pages/Marketplace/MarketplacePage.jsx
// Pick a vendor type, fill in the requirements, then see matched vendors.
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Check, ChevronLeft } from 'lucide-react';
import { submitLeadRequest, setSelectedService, resetLeadResult, approveVendor } from '../../features/marketplace/slices/marketplaceSlice';
import { ROUTES } from '../../constants/routes';
import Input from '../../components/ui/Input/Input';

const VENDOR_TYPES = [
  { id: 'photographer', label: 'Photographer', icon: '📷' },
  { id: 'dj', label: 'DJ / Music', icon: '🎧' },
  { id: 'decorator', label: 'Decorator', icon: '🎀' },
  { id: 'caterer', label: 'Caterer', icon: '🍽️' },
  { id: 'anchor', label: 'Anchor / MC', icon: '🎤' },
  { id: 'planner', label: 'Event planner', icon: '📋' },
  { id: 'makeup', label: 'Makeup artist', icon: '💄' },
  { id: 'venue', label: 'Venue', icon: '🏛️' },
];

const STEPS = [
  { title: 'Tell us what you need', text: 'Pick a vendor type, your date and your budget.' },
  { title: 'Get matched', text: 'We match you with vendors that fit and let you approve the ones you like.' },
  { title: 'Compare quotes', text: 'Approved vendors send quotes. Accept one to confirm your booking.' },
];

const fieldClass =
  'w-full rounded-xl border border-mist bg-moonlight px-4 text-[15px] text-ink placeholder-gray-400 transition-colors focus:bg-white focus:border-night focus:outline-none focus:ring-2 focus:ring-night/20';

const MarketplacePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const selectedService = useSelector((s) => s.marketplace.selectedService);
  const leadResult = useSelector((s) => s.marketplace.leadResult);
  const status = useSelector((s) => s.marketplace.status);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // Guests can fill in the form freely, but submitting requires an account:
  // the same "browse freely, gate at the action" pattern as event booking.
  const isLoggedIn = useSelector((s) => Boolean(s.auth.token && s.auth.user));

  useEffect(() => {
    // If we got bounced to login mid-submission, the filled form data is
    // waiting in sessionStorage. Resume automatically instead of making
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

  const handlePlanAnother = () => {
    dispatch(resetLeadResult());
    dispatch(setSelectedService(null));
  };

  const selectedType = VENDOR_TYPES.find((v) => v.id === selectedService);
  const todayInput = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

  // Success: the request reference as a ticket, then the matched vendors
  if (leadResult) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-marigold">
            <Check size={28} className="text-night" />
          </span>
          <h1 className="mt-4 font-heading text-3xl font-extrabold text-night">Request sent</h1>
          <p className="mt-1 text-ink/60">
            {leadResult.message || 'Vendors have received your request and will reach out soon.'}
          </p>
        </div>

        {leadResult.reference && (
          <div className="ticket mt-8">
            <div className="p-5 text-center">
              <p className="text-sm text-ink/60">Request reference</p>
              <p className="mt-1 break-all font-heading text-2xl font-extrabold tracking-[0.08em] text-night">
                {leadResult.reference}
              </p>
            </div>
          </div>
        )}

        {leadResult.matchedVendors?.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 font-heading text-xl font-bold text-night">Matched vendors</h2>
            <ul className="space-y-3">
              {leadResult.matchedVendors.map((v) => (
                <li key={v._id} className="card flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-night font-heading font-bold text-marigold">
                    {v.logo ? <img src={v.logo} alt={v.name} className="h-full w-full object-cover" /> : v.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-night">{v.name}</p>
                    {v.tagline && <p className="truncate text-sm text-ink/60">{v.tagline}</p>}
                  </div>
                  {v.approved ? (
                    <span className="shrink-0 text-sm font-semibold text-green-700">Approved</span>
                  ) : (
                    <button
                        type="button"
                      onClick={() => dispatch(approveVendor({ reference: leadResult.reference, matchId: v.matchId }))}
                        className="h-10 shrink-0 rounded-pill border border-night/30 px-4 text-sm font-semibold text-night transition-colors hover:bg-night/5"
                    >
                      Approve
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to={ROUTES.MY_REQUESTS} className="btn-brand">View my requests</Link>
          <button type="button" onClick={handlePlanAnother} className="btn-outline">Plan another</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <section className="surface-night bg-night text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 md:py-16">
          <div>
            <h1 className="font-heading text-4xl font-extrabold leading-[1.05] sm:text-5xl">
              Plan your event, within your budget.
            </h1>
            <p className="mt-4 max-w-md text-white/70 md:text-lg">
              Tell us what you need and we'll match you with vendors in your city: photographers, DJs, anchors, decorators, caterers and more.
            </p>
          </div>

          <ol className="space-y-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-4 rounded-ticket bg-white/10 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-marigold font-heading font-extrabold text-night">
                  {i + 1}
                </span>
                <div>
                  <p className="font-heading font-bold">{step.title}</p>
                  <p className="mt-0.5 text-sm text-white/70">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {!selectedService ? (
          <div>
            <div className="mb-8 text-center">
              <h2 className="font-heading text-3xl font-extrabold text-night">What do you need?</h2>
              <p className="mt-1 text-ink/60">Select a vendor type to get started.</p>
            </div>
            <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
              {VENDOR_TYPES.map((vt) => (
                <button
                  key={vt.id}
                  type="button"
                  onClick={() => dispatch(setSelectedService(vt.id))}
                  className="card flex flex-col items-center px-4 py-7 text-center transition-colors hover:border-night"
                >
                  <span aria-hidden="true" className="mb-3 text-4xl">{vt.icon}</span>
                  <span className="font-heading font-bold text-night">{vt.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
            <div className="mx-auto max-w-xl">
              <button
                type="button"
                onClick={() => dispatch(setSelectedService(null))}
                className="mb-5 inline-flex items-center gap-1 text-sm text-ink/60 transition-colors hover:text-night"
              >
                <ChevronLeft size={16} /> Change type
            </button>

              <div className="card p-6 sm:p-8">
                <h2 className="font-heading text-2xl font-extrabold text-night">
                  <span aria-hidden="true">{selectedType?.icon}</span> {selectedType?.label}
              </h2>
                <p className="mb-6 mt-1 text-ink/60">Fill in your requirements and we'll match you right away.</p>

                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
                    <Input
                      label="Your name"
                      required
                      placeholder="Full name"
                      error={errors.name && 'Please enter your name'}
                      {...register('name', { required: true })}
                    />
                    <Input
                      label="Phone or WhatsApp"
                      type="tel"
                      required
                      placeholder="98765xxxxx"
                      error={errors.phone && 'Please enter your phone number'}
                      {...register('phone', { required: true })}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
                    <Input
                      label="Event date"
                      type="date"
                      required
                      min={todayInput}
                      error={errors.eventDate && 'Please pick your event date'}
                      {...register('eventDate', { required: true })}
                    />
                    <Input label="Number of guests" type="number" min="1" placeholder="50" {...register('guests')} />
                </div>

                <div>
                    <label htmlFor="mp-budget" className="mb-1.5 block text-sm font-medium text-ink">
                      Budget range <span className="text-brand-red">*</span>
                    </label>
                    <select
                      id="mp-budget"
                      aria-invalid={errors.budget ? 'true' : 'false'}
                      className={`${fieldClass} h-12 ${errors.budget ? 'border-red-400' : ''}`}
                      {...register('budget', { required: true })}
                    >
                    <option value="">Select budget</option>
                      <option value="5000-20000">₹5,000 to ₹20,000</option>
                      <option value="20000-50000">₹20,000 to ₹50,000</option>
                      <option value="50000-150000">₹50,000 to ₹1,50,000</option>
                      <option value="150000-500000">₹1,50,000 to ₹5,00,000</option>
                      <option value="500000+">₹5,00,000 and above</option>
                  </select>
                    {errors.budget && <p role="alert" className="mt-1.5 text-sm text-red-600">Please select a budget</p>}
                </div>

                <div>
                    <label htmlFor="mp-requirements" className="mb-1.5 block text-sm font-medium text-ink">
                      Special requirements
                    </label>
                    <textarea
                      id="mp-requirements"
                      rows={3}
                      placeholder="Theme, special requests, dietary needs"
                      className={`${fieldClass} resize-none py-3`}
                      {...register('requirements')}
                    />
                </div>

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="btn-brand w-full py-3.5 text-base disabled:opacity-60"
                  >
                    {status === 'loading' ? 'Finding vendors...' : 'Find matching vendors'}
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