// src/pages/Organizer/OrganizerRegisterPage.jsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { registerOrganizer, fetchMyOrganizer, resetRegisterStatus } from '../../features/organizer/slices/organizerSlice';
import { ROUTES } from '../../constants/routes';
import Spinner from '../../components/ui/Spinner/Spinner';

const ORGANIZER_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'proprietorship', label: 'Proprietorship' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'pvt_ltd', label: 'Private Limited' },
  { value: 'llp', label: 'LLP' },
  { value: 'trust_ngo', label: 'Trust / NGO' },
  { value: 'government', label: 'Government' },
];

const CATEGORY_OPTIONS = ['music', 'comedy', 'theatre', 'food', 'sports', 'workshop', 'nightlife'];

const OrganizerRegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { profile, fetchStatus, registerStatus, error } = useSelector((s) => s.organizer);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const selectedCategories = watch('categoryIds') || [];

  useEffect(() => { dispatch(fetchMyOrganizer()); }, [dispatch]);
  useEffect(() => () => dispatch(resetRegisterStatus()), [dispatch]);

  // Agar already registered hai, to seedha KYC page bhej do
  useEffect(() => {
    if (fetchStatus === 'succeeded' && profile) navigate(ROUTES.ORGANIZER_KYC, { replace: true });
  }, [fetchStatus, profile, navigate]);

  const onSubmit = (data) => {
    dispatch(registerOrganizer({
      ...data,
      categoryIds: data.categoryIds || [],
      acceptedOrganizerTerms: true,
    })).then((res) => {
      if (res.meta.requestStatus === 'fulfilled') navigate(ROUTES.ORGANIZER_KYC);
    });
  };

  if (fetchStatus === 'loading') {
    return <div className="flex items-center justify-center min-h-screen"><Spinner size="lg" /></div>;
  }

  return (
    <div className="bg-[#f5f5f4] min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-5">
          <h1 className="font-black text-2xl text-gray-900">Become an Organizer</h1>
          <p className="text-sm text-gray-500 mt-0.5">Step 1 of 2 — Business details</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-200 p-6 space-y-5">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>
          )}

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Business / Brand name *</label>
            <input
              {...register('displayName', { required: 'Zaroori hai', minLength: 2, maxLength: 80 })}
              placeholder="e.g. Sharma Events"
              className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red"
            />
            {errors.displayName && <p className="text-brand-red text-xs mt-1">{errors.displayName.message}</p>}
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Organizer type *</label>
            <select {...register('organizerType', { required: true })} className="w-full border border-gray-300 px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-red">
              <option value="">Select type</option>
              {ORGANIZER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            {errors.organizerType && <p className="text-brand-red text-xs mt-1">Type chunna zaroori hai</p>}
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Primary city *</label>
            <input
              {...register('cityId', { required: true })}
              placeholder="e.g. delhi"
              className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Primary categories * (1–5)</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <label key={cat} className="flex items-center gap-1.5 border border-gray-300 px-3 py-1.5 text-xs cursor-pointer has-[:checked]:bg-brand-red has-[:checked]:text-white has-[:checked]:border-brand-red">
                  <input type="checkbox" value={cat} {...register('categoryIds', { required: true })} className="hidden" />
                  {cat}
                </label>
              ))}
            </div>
            {errors.categoryIds && <p className="text-brand-red text-xs mt-1">Kam se kam 1 category chuno</p>}
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Contact person *</label>
            <input {...register('contactName', { required: true })} className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Contact phone *</label>
              <input {...register('contactPhone', { required: true })} placeholder="+91..." className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Contact email *</label>
              <input {...register('contactEmail', { required: true })} type="email" className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">About</label>
            <textarea {...register('about')} rows={3} maxLength={1000} className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red resize-none" />
          </div>

          <div className="flex items-start gap-2 pt-2">
            <input {...register('acceptedOrganizerTerms', { required: true })} type="checkbox" id="terms" className="w-4 h-4 mt-0.5 accent-brand-red" />
            <label htmlFor="terms" className="text-xs text-gray-600">
              Main <Link to="/terms" className="text-brand-red underline">Organizer Agreement</Link> 
            </label>
          </div>
          {errors.acceptedOrganizerTerms && <p className="text-brand-red text-xs">Agreement must have  accept</p>}

          <button
            type="submit"
            disabled={registerStatus === 'loading'}
            className="w-full flex items-center justify-center gap-2 bg-brand-red hover:bg-brand-red-hover text-white font-black py-3.5 text-sm transition-colors disabled:opacity-60"
          >
            {registerStatus === 'loading' ? <Spinner size="sm" /> : 'Continue to KYC →'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrganizerRegisterPage;