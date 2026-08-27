// src/pages/VendorProfile/VendorProfilePage.jsx
// Matches reference: white bg, back nav, cover image, logo+name+verified, services,
// star rating, photo strip, price range + contact sidebar, quote form, reviews
import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Phone, MessageCircle, Globe, ChevronLeft, Send, Star, MapPin } from 'lucide-react';
import { fetchVendorById, submitQuote, clearVendorDetail, resetQuoteStatus } from '../../features/vendors/slices/vendorsSlice';
import Spinner from '../../components/ui/Spinner/Spinner';
import { formatPriceRange } from '../../utils/formatPrice';
import { ROUTES } from '../../constants/routes';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const VendorProfilePage = () => {
  const { vendorId } = useParams();
  const dispatch     = useDispatch();
  const vendor       = useSelector((s) => s.vendors.detail);
  const status       = useSelector((s) => s.vendors.detailStatus);
  const quoteStatus  = useSelector((s) => s.vendors.quoteStatus);
  const [showQuote, setShowQuote] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    dispatch(fetchVendorById(vendorId));
    return () => { dispatch(clearVendorDetail()); dispatch(resetQuoteStatus()); };
  }, [vendorId, dispatch]);

  useEffect(() => {
    if (quoteStatus === 'succeeded') {
      toast.success('Quote request sent! Vendor will contact you within 24 hours.');
      setShowQuote(false); reset();
    }
  }, [quoteStatus]);

  const onQuoteSubmit = (data) => dispatch(submitQuote({ vendorId, data }));

  if (status === 'loading') return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!vendor) return null;

  return (
    <div className="bg-[#f5f5f4] min-h-screen">
      {/* Back nav */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <Link to={ROUTES.VENDORS} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ChevronLeft size={15} /> All Vendors
          </Link>
        </div>
      </div>

      {/* Cover */}
      <div
        className="relative h-56 overflow-hidden"
        style={{
          backgroundImage: vendor.coverImage
            ? undefined
            : 'repeating-linear-gradient(135deg, #d1d5db 0px, #d1d5db 1px, #e5e7eb 1px, #e5e7eb 10px)',
          backgroundColor: '#e5e7eb',
        }}
      >
        {vendor.coverImage && <img src={vendor.coverImage} alt={vendor.name} className="w-full h-full object-cover" />}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT — main profile */}
          <div className="lg:col-span-2 space-y-6">
            {/* Identity block */}
            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div
                  className="w-20 h-20 shrink-0"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(135deg, #d1d5db 0px, #d1d5db 1px, #e5e7eb 1px, #e5e7eb 8px)',
                    backgroundColor: '#e5e7eb',
                  }}
                >
                  {vendor.logo && <img src={vendor.logo} alt={vendor.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h1 className="font-black text-2xl text-gray-900">{vendor.name}</h1>
                    {vendor.verified && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-brand-red border border-brand-red px-1.5 py-0.5">
                        ◎ VERIFIED
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{vendor.services?.join(' · ')}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Star size={13} className="fill-amber-400 text-amber-400" />
                    <span className="font-bold">{vendor.rating}</span>
                    <span className="text-gray-400">{vendor.reviewCount} reviews</span>
                    {vendor.location?.city && (
                      <span className="flex items-center gap-1 text-gray-400"><MapPin size={12} />{vendor.location.city}</span>
                    )}
                  </div>
                </div>
              </div>
              {vendor.tagline && <p className="text-gray-600 text-sm mt-4 leading-relaxed">{vendor.tagline}</p>}
              {vendor.bio && <p className="text-gray-500 text-sm mt-2 leading-relaxed">{vendor.bio}</p>}
            </div>

            {/* Photo grid */}
            {vendor.photos?.length > 0 && (
              <div className="bg-white border border-gray-200 p-6">
                <h2 className="font-black text-base text-gray-900 mb-4">Portfolio</h2>
                <div className="grid grid-cols-3 gap-1">
                  {vendor.photos.map((photo, i) => (
                    <div
                      key={i}
                      className="aspect-square overflow-hidden"
                      style={{
                        backgroundImage: photo
                          ? undefined
                          : 'repeating-linear-gradient(135deg, #d1d5db 0px, #d1d5db 1px, #e5e7eb 1px, #e5e7eb 8px)',
                        backgroundColor: '#e5e7eb',
                      }}
                    >
                      {photo && <img src={photo} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Services */}
            {vendor.services?.length > 0 && (
              <div className="bg-white border border-gray-200 p-6">
                <h2 className="font-black text-base text-gray-900 mb-4">Services</h2>
                <div className="flex flex-wrap gap-2">
                  {vendor.services.map((s) => (
                    <span key={s} className="border border-gray-300 text-gray-700 text-xs px-3 py-1.5">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {vendor.reviews?.length > 0 && (
              <div className="bg-white border border-gray-200 p-6">
                <h2 className="font-black text-base text-gray-900 mb-4">
                  Reviews <span className="font-normal text-gray-400 text-sm">({vendor.reviewCount})</span>
                </h2>
                <div className="space-y-5">
                 {vendor.reviews.map((rev) => (
                      <div key={rev.id || rev._id} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-8 h-8 shrink-0"
                          style={{ backgroundImage: 'repeating-linear-gradient(135deg, #d1d5db 0px, #d1d5db 1px, #e5e7eb 1px, #e5e7eb 6px)', backgroundColor: '#e5e7eb' }}
                        >
                          {rev.avatar && <img src={rev.avatar} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{rev.author}</p>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={11} className={i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                            ))}
                          </div>
                        </div>
                        <span className="ml-auto text-xs text-gray-400">{rev.date}</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{rev.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — contact / quote sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Price + CTA */}
            <div className="bg-white border border-gray-200">
              <div className="p-5 border-b border-gray-200">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Price range</p>
                <p className="font-black text-2xl text-gray-900">
                  {formatPriceRange(vendor.priceRange?.min, vendor.priceRange?.max, vendor.priceRange?.currency)}
                </p>
                <p className="text-xs text-gray-400 mt-1">{vendor.priceRange?.unit}</p>
              </div>
              <div className="p-5">
                <button
                  onClick={() => setShowQuote(!showQuote)}
                  className="w-full bg-brand-red hover:bg-brand-red-hover text-white font-bold py-3 text-sm transition-colors mb-3"
                >
                  {showQuote ? 'Hide form' : 'Get a quote →'}
                </button>
                {vendor.contact?.whatsapp && (
                  <a
                    href={`https://wa.me/${vendor.contact.whatsapp.replace(/\D/g, '')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 font-semibold py-2.5 text-sm hover:border-gray-500 transition-colors"
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                )}
              </div>
            </div>

            {/* Quote form */}
            {showQuote && (
              <div className="bg-white border border-gray-200 p-5">
                <h3 className="font-black text-sm text-gray-900 mb-4">Request a quote</h3>
                <form onSubmit={handleSubmit(onQuoteSubmit)} className="space-y-3">
                  <input
                    {...register('name', { required: true })}
                    placeholder="Your name"
                    className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors"
                  />
                  <input
                    {...register('phone', { required: true })}
                    placeholder="Phone number"
                    className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors"
                  />
                  <input
                    {...register('eventDate')}
                    placeholder="Event date"
                    type="date"
                    className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors"
                  />
                  <textarea
                    {...register('message')}
                    placeholder="Tell them about your event..."
                    rows={3}
                    className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors resize-none"
                  />
                  <button
                    type="submit"
                    disabled={quoteStatus === 'loading'}
                    className="w-full flex items-center justify-center gap-2 bg-brand-red hover:bg-brand-red-hover text-white font-bold py-2.5 text-sm transition-colors disabled:opacity-60"
                  >
                    <Send size={13} />
                    {quoteStatus === 'loading' ? 'Sending...' : 'Send request'}
                  </button>
                </form>
              </div>
            )}

            {/* Contact info */}
            <div className="bg-white border border-gray-200 p-5">
              <h3 className="font-black text-sm text-gray-900 mb-4">Contact</h3>
              <div className="space-y-2.5 text-sm">
                {vendor.contact?.phone && (
                  <a href={`tel:${vendor.contact.phone}`} className="flex items-center gap-2 text-gray-700 hover:text-brand-red transition-colors">
                    <Phone size={14} className="text-gray-400" /> {vendor.contact.phone}
                  </a>
                )}
                {vendor.social?.website && (
                  <a href={vendor.social.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-700 hover:text-brand-red transition-colors">
                    <Globe size={14} className="text-gray-400" /> Website
                  </a>
                )}
                {vendor.social?.instagram && (
                  <span className="flex items-center gap-2 text-gray-500">
                    <span className="w-3.5 h-3.5 text-gray-400 font-bold text-xs">IG</span>
                    {vendor.social.instagram}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorProfilePage;
