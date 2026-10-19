// src/pages/VendorProfile/VendorProfilePage.jsx
import { useParams, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Phone, MessageCircle, Globe, ChevronLeft, Send, Star, MapPin, BadgeCheck } from 'lucide-react';
import { fetchVendorById, submitQuote, clearVendorDetail, resetQuoteStatus } from '../../features/vendors/slices/vendorsSlice';
import Spinner from '../../components/ui/Spinner/Spinner';
import EmptyState from '../../components/ui/EmptyState/EmptyState';
import Input from '../../components/ui/Input/Input';
import { formatPriceRange } from '../../utils/formatPrice';
import { ROUTES } from '../../constants/routes';

const fieldClass =
  'w-full rounded-xl border border-mist bg-moonlight px-4 py-3 text-[15px] text-ink placeholder-gray-400 transition-colors focus:bg-white focus:border-night focus:outline-none focus:ring-2 focus:ring-night/20';

const VendorProfilePage = () => {
  const { vendorId } = useParams();
  const dispatch = useDispatch();
  const vendor = useSelector((s) => s.vendors.detail);
  const status = useSelector((s) => s.vendors.detailStatus);
  const quoteStatus = useSelector((s) => s.vendors.quoteStatus);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    dispatch(fetchVendorById(vendorId));
    return () => {
      dispatch(clearVendorDetail());
      dispatch(resetQuoteStatus());
    };
  }, [vendorId, dispatch]);

  useEffect(() => {
    if (quoteStatus === 'succeeded') {
      toast.success('Quote request sent! The vendor will contact you within 24 hours.');
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteStatus]);

  const onQuoteSubmit = (data) => dispatch(submitQuote({ vendorId, data }));

  const scrollToQuote = () =>
    document.getElementById('quote-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (status === 'loading' || (!vendor && status !== 'failed')) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }
  if (!vendor) {
    return (
      <EmptyState
        icon="❌"
        title="Vendor not found"
        message="This vendor may have been removed."
        action={<Link to={ROUTES.VENDORS} className="btn-brand inline-block">See all vendors</Link>}
      />
    );
  }

  const hasPrice = Number.isFinite(vendor.priceRange?.min) && Number.isFinite(vendor.priceRange?.max);
  const priceLabel = hasPrice
    ? formatPriceRange(vendor.priceRange.min, vendor.priceRange.max, vendor.priceRange.currency)
    : 'Ask for a quote';
  const todayInput = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

  return (
    <div>
      {/* Back bar */}
      <div className="border-b border-mist bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <Link to={ROUTES.VENDORS} className="inline-flex items-center gap-1 text-sm text-ink/60 transition-colors hover:text-night">
            <ChevronLeft size={16} /> All vendors
          </Link>
        </div>
      </div>

      {/* Cover */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-night via-night-soft to-night sm:h-64">
        {vendor.coverImage && <img src={vendor.coverImage} alt="" className="h-full w-full object-cover" />}
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-28 sm:px-6 lg:pb-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

          {/* Main profile */}
          <div className="relative -mt-12 space-y-6 lg:col-span-2">
            <section className="card p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-night font-heading text-2xl font-extrabold text-marigold shadow-card">
                  {vendor.logo ? (
                    <img src={vendor.logo} alt={vendor.name} className="h-full w-full object-cover" />
                  ) : (
                    vendor.name?.[0]?.toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-heading text-2xl font-extrabold text-night sm:text-3xl">{vendor.name}</h1>
                    {vendor.verified && (
                      <span className="inline-flex items-center gap-1 rounded-pill bg-night/5 px-2.5 py-1 text-xs font-semibold text-night">
                        <BadgeCheck size={13} /> Verified
                      </span>
                    )}
                  </div>
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink/70">
                    {vendor.reviewCount > 0 ? (
                      <span className="flex items-center gap-1.5">
                        <Star size={14} className="fill-marigold text-marigold" />
                        <span className="font-semibold text-night">{vendor.rating}</span>
                        ({vendor.reviewCount} {vendor.reviewCount === 1 ? 'review' : 'reviews'})
                      </span>
                    ) : (
                      <span>New on Sanskaar</span>
                    )}
                    {vendor.location?.city && (
                      <span className="flex items-center gap-1"><MapPin size={13} /> {vendor.location.city}</span>
                    )}
                  </p>
                </div>
              </div>

              {vendor.services?.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {vendor.services.map((s) => (
                    <span key={s} className="rounded-pill bg-night/5 px-3 py-1.5 text-sm text-night">{s}</span>
                  ))}
                </div>
              )}

              {vendor.tagline && <p className="mt-5 font-heading text-lg font-semibold leading-snug text-night">{vendor.tagline}</p>}
              {vendor.bio && <p className="mt-2 leading-relaxed text-ink/70">{vendor.bio}</p>}
            </section>

            {vendor.photos?.length > 0 && (
              <section className="card p-6">
                <h2 className="mb-4 font-heading text-xl font-bold text-night">Portfolio</h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {vendor.photos.map((photo, i) => (
                    <div key={i} className="aspect-square overflow-hidden rounded-xl bg-night/5">
                      {photo && (
                        <img src={photo} alt={`Portfolio ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {vendor.reviews?.length > 0 && (
              <section className="card p-6">
                <h2 className="mb-4 font-heading text-xl font-bold text-night">
                  Reviews <span className="text-base font-normal text-ink/50">({vendor.reviewCount})</span>
                </h2>
                <div className="space-y-5">
                  {vendor.reviews.map((rev) => (
                    <div key={rev.id || rev._id} className="border-b border-mist/70 pb-5 last:border-0 last:pb-0">
                      <div className="mb-2 flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-night text-sm font-bold text-marigold">
                          {rev.avatar ? (
                            <img src={rev.avatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            rev.author?.[0]?.toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-night">{rev.author}</p>
                          <div className="flex gap-0.5" aria-label={`${rev.rating} out of 5 stars`}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={12} className={i < rev.rating ? 'fill-marigold text-marigold' : 'text-mist'} />
                            ))}
                          </div>
                        </div>
                        <span className="ml-auto text-xs text-ink/50">{rev.date}</span>
                      </div>
                      <p className="leading-relaxed text-ink/80">{rev.text}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Quote ticket + contact */}
          <aside className="relative lg:-mt-12 lg:col-span-1">
            <div className="space-y-4 lg:sticky lg:top-24">
              <div className="ticket">
                <div className="p-5">
                  <p className="text-sm text-ink/60">Price range</p>
                  <p className="font-heading text-2xl font-extrabold text-night">{priceLabel}</p>
                  {vendor.priceRange?.unit && <p className="mt-0.5 text-sm text-ink/60">{vendor.priceRange.unit}</p>}
                </div>

                <div className="ticket-perf" />

                <form id="quote-form" onSubmit={handleSubmit(onQuoteSubmit)} noValidate className="scroll-mt-24 space-y-4 p-5">
                  <h2 className="font-heading text-lg font-bold text-night">Request a quote</h2>

                  <Input
                    label="Your name"
                    required
                    placeholder="Full name"
                    error={errors.name && 'Please enter your name'}
                    {...register('name', { required: true })}
                  />
                  <Input
                    label="Phone number"
                    type="tel"
                    required
                    placeholder="98765xxxxx"
                    error={errors.phone && 'Please enter your phone number'}
                    {...register('phone', { required: true })}
                  />
                  <Input label="Event date" type="date" min={todayInput} {...register('eventDate')} />

                  <div>
                    <label htmlFor="quote-message" className="mb-1.5 block text-sm font-medium text-ink">Message</label>
                    <textarea
                      id="quote-message"
                      rows={3}
                      placeholder="Tell them about your event"
                      className={`${fieldClass} resize-none`}
                      {...register('message')}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={quoteStatus === 'loading'}
                    className="btn-brand flex w-full items-center justify-center gap-2 py-3.5 text-base disabled:opacity-60"
                  >
                    <Send size={16} />
                    {quoteStatus === 'loading' ? 'Sending...' : 'Send request'}
                  </button>
                </form>

                {vendor.contact?.whatsapp && (
                  <div className="px-5 pb-5">
                    <a
                      href={`https://wa.me/${vendor.contact.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline flex w-full items-center justify-center gap-2 text-sm"
                    >
                      <MessageCircle size={16} /> Chat on WhatsApp
                    </a>
                  </div>
                )}
              </div>

              {(vendor.contact?.phone || vendor.social?.website || vendor.social?.instagram) && (
                <div className="card p-5">
                  <h3 className="mb-3 font-heading text-base font-bold text-night">Contact</h3>
                  <div className="space-y-3 text-sm">
                    {vendor.contact?.phone && (
                      <a href={`tel:${vendor.contact.phone}`} className="flex items-center gap-2.5 text-ink/80 transition-colors hover:text-night">
                        <Phone size={15} className="text-night/50" /> {vendor.contact.phone}
                      </a>
                    )}
                    {vendor.social?.website && (
                      <a
                        href={vendor.social.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 text-ink/80 transition-colors hover:text-night"
                      >
                        <Globe size={15} className="text-night/50" /> Website
                      </a>
                    )}
                    {vendor.social?.instagram && (
                      <p className="flex items-center gap-2.5 text-ink/80">
                        <span className="w-[15px] text-center text-xs font-bold text-night/50">IG</span>
                        {vendor.social.instagram}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile bar, sits just above the bottom tab bar */}
      <div
        className="fixed inset-x-0 z-30 flex items-center justify-between gap-4 border-t border-mist bg-white px-4 py-3 lg:hidden"
        style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom))' }}
      >
        <div className="min-w-0">
          <p className="text-xs text-ink/60">Price range</p>
          <p className="truncate font-heading text-base font-extrabold text-night">{priceLabel}</p>
        </div>
        <button type="button" onClick={scrollToQuote} className="btn-brand shrink-0 px-6">
          Get a quote
        </button>
      </div>
    </div>
  );
};

export default VendorProfilePage;