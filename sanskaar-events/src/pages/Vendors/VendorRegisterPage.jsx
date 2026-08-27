import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { vendorCatalogService } from '../../services/vendorCatalog.service';
import { ROUTES } from '../../constants/routes';

const CATEGORY_OPTIONS = ['photographer', 'caterer', 'decorator', 'dj', 'makeup-artist', 'venue', 'anchor'];

const VendorRegisterPage = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const selectedCategories = watch('categories', []);

  const toggleCategory = (cat) => {
    const current = selectedCategories || [];
    const next = current.includes(cat) ? current.filter((c) => c !== cat) : [...current, cat];
    setValue('categories', next);
  };

  const onSubmit = async (data) => {
    setError('');
    if (!data.categories || data.categories.length === 0) {
      setError('Select at least one category.');
      return;
    }
    if (!data.acceptedVendorTerms) {
      setError('You must accept the vendor agreement.');
      return;
    }

    setSubmitting(true);
    try {
      await vendorCatalogService.register({
        businessName: data.businessName,
        categories: data.categories,
        description: data.description,
        cityId: data.cityId,
        address: data.address,
        pincode: data.pincode,
        serviceRadiusKm: Number(data.serviceRadiusKm) || 30,
        yearsExperience: Number(data.yearsExperience) || 0,
        phone: data.phone,
        whatsapp: data.whatsapp || data.phone,
        priceRange: { min: Number(data.priceMin) || 0, max: Number(data.priceMax) || 0 },
        acceptedVendorTerms: true,
      });
      toast.success('Vendor profile created! Awaiting admin verification.');
      navigate(ROUTES.VENDOR_DASHBOARD);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register as vendor.');
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-[#f5f5f4] min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-5">
          <h1 className="font-black text-2xl text-gray-900">Register as a Vendor</h1>
          <p className="text-sm text-gray-500 mt-0.5">List your services on the marketplace</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-200 p-6 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Business name *</label>
            <input {...register('businessName', { required: true })} placeholder="e.g. Sharma Studios" className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Categories *</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`text-xs font-bold px-3 py-1.5 border ${selectedCategories?.includes(cat) ? 'bg-brand-red text-white border-brand-red' : 'border-gray-300 text-gray-600'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">About *</label>
            <textarea {...register('description', { required: true, minLength: 50 })} rows={4} placeholder="Describe your business, experience, style..." className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red resize-none" />
            {errors.description && <p className="text-brand-red text-xs mt-1">Minimum 50 characters</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Years of experience</label>
              <input {...register('yearsExperience')} type="number" placeholder="5" className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Service radius (km)</label>
              <input {...register('serviceRadiusKm')} type="number" placeholder="30" className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Base city *</label>
            <input {...register('cityId', { required: true })} placeholder="e.g. Bareilly" className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Address *</label>
            <input {...register('address', { required: true })} placeholder="Full address" className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Pincode *</label>
            <input {...register('pincode', { required: true })} placeholder="243001" className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Phone *</label>
              <input {...register('phone', { required: true })} placeholder="+91 XXXXX XXXXX" className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">WhatsApp</label>
              <input {...register('whatsapp')} placeholder="Same as phone if blank" className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Price from (₹)</label>
              <input {...register('priceMin')} type="number" placeholder="10000" className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Price to (₹)</label>
              <input {...register('priceMax')} type="number" placeholder="50000" className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input {...register('acceptedVendorTerms', { required: true })} type="checkbox" id="vendor-terms" className="w-4 h-4 accent-brand-red" />
            <label htmlFor="vendor-terms" className="text-sm text-gray-700">I accept the Vendor Agreement</label>
          </div>

          {error && <p className="text-brand-red text-sm">{error}</p>}

          <button type="submit" disabled={submitting} className="w-full bg-brand-red hover:bg-brand-red-hover text-white font-black py-3.5 text-sm transition-colors disabled:opacity-60">
            {submitting ? 'Submitting...' : 'Register as Vendor →'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VendorRegisterPage;