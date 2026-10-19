import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { vendorCatalogService } from '../../services/vendorCatalog.service';
import { ROUTES } from '../../constants/routes';
import Input from '../../components/ui/Input/Input';
import { Textarea } from '../../components/ui/Input/Fields';
import DashboardShell from '../../components/dashboard/DashboardShell';

const CATEGORY_OPTIONS = ['photographer', 'caterer', 'decorator', 'dj', 'makeup-artist', 'venue', 'anchor'];

// 'makeup-artist' -> 'Makeup artist'
const prettify = (slug) => {
  const text = slug.replace(/-/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const VendorRegisterPage = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const selectedCategories = watch('categories', []);
  const descriptionLength = (watch('description') || '').length;

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
    <DashboardShell title="Register as a vendor" subtitle="List your services on the marketplace.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="card space-y-5 p-6 sm:p-8">
        <Input
          label="Business name"
          required
          placeholder="e.g. Sharma Studios"
          error={errors.businessName?.message}
          {...register('businessName', { required: 'Please enter your business name' })}
        />

        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">
            Categories <span className="text-brand-red">*</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((cat) => {
              const active = selectedCategories?.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleCategory(cat)}
                  className={`h-10 rounded-pill px-4 text-sm font-medium transition-colors ${active ? 'bg-night text-white' : 'border border-mist bg-white text-ink/80 hover:border-night/40'
                    }`}
                >
                  {prettify(cat)}
                </button>
              );
            })}
          </div>
        </div>

        <Textarea
          label="About your business"
          required
          rows={4}
          placeholder="Describe your business, experience and style"
          helperText={`${descriptionLength} of 50 characters minimum`}
          error={errors.description?.message}
          {...register('description', {
            required: 'Please describe your business',
            minLength: { value: 50, message: 'Please write at least 50 characters' },
          })}
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input label="Years of experience" type="number" min="0" placeholder="5" {...register('yearsExperience')} />
          <Input label="Service radius (km)" type="number" min="1" placeholder="30" {...register('serviceRadiusKm')} />
        </div>

        <Input
          label="Base city"
          required
          placeholder="e.g. Bareilly"
          error={errors.cityId?.message}
          {...register('cityId', { required: 'Please enter your base city' })}
        />
        <Input
          label="Address"
          required
          placeholder="Full address"
          error={errors.address?.message}
          {...register('address', { required: 'Please enter your address' })}
        />
        <Input
          label="Pincode"
          required
          placeholder="243001"
          error={errors.pincode?.message}
          {...register('pincode', { required: 'Please enter your pincode' })}
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            label="Phone"
            type="tel"
            required
            placeholder="98765xxxxx"
            error={errors.phone?.message}
            {...register('phone', { required: 'Please enter your phone number' })}
          />
          <Input label="WhatsApp (optional)" type="tel" placeholder="Same as phone if blank" {...register('whatsapp')} />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input label="Price from (₹)" type="number" min="0" placeholder="10000" {...register('priceMin')} />
          <Input label="Price to (₹)" type="number" min="0" placeholder="50000" {...register('priceMax')} />
        </div>

        <div>
          <label htmlFor="vendor-terms" className="flex cursor-pointer items-start gap-2.5 text-sm text-ink/80">
            <input
              id="vendor-terms"
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 accent-night"
              {...register('acceptedVendorTerms', { required: 'You must accept the vendor agreement' })}
            />
            I accept the Vendor Agreement
          </label>
          {errors.acceptedVendorTerms && (
            <p role="alert" className="mt-1.5 text-sm text-red-600">{errors.acceptedVendorTerms.message}</p>
          )}
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn-brand w-full py-3.5 text-base disabled:opacity-60">
          {submitting ? 'Submitting...' : 'Register as vendor'}
        </button>
      </form>
    </DashboardShell>
  );
};

export default VendorRegisterPage;