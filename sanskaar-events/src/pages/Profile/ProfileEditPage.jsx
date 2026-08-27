// src/pages/Profile/ProfileEditPage.jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { updateProfile } from '../../features/auth/slices/authSlice';
import { CITIES, setCity } from '../../features/location/locationSlice';
import { ROUTES } from '../../constants/routes';
import Input from '../../components/ui/Input/Input';

const ProfileEditPage = () => {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      fullName: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      city: user?.city || CITIES[0].name,
      bio: user?.bio || '',
    },
  });

  const onSubmit = async (data) => {
    setSaveError('');
    setSaved(false);
    try {
      await dispatch(
        updateProfile({
          name: data.fullName,
          email: data.email,
          phone: data.phone,
          city: data.city,
          bio: data.bio,
        })
      ).unwrap();

      // locationSlice ko bhi sync karo taaki Navbar/Profile sab jagah city match kare
      const matchedCity = CITIES.find((c) => c.name === data.city);
      if (matchedCity) dispatch(setCity(matchedCity));

      setSaved(true);
    } catch (err) {
      setSaveError(typeof err === 'string' ? err : err?.message || 'Could not save changes. Please try again.');
    }
  };

  return (
    <div className="bg-[#f5f5f4] min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-5">
          <Link to={ROUTES.PROFILE} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-2">
            <ArrowLeft size={14} /> Back to profile
          </Link>
          <h1 className="font-black text-2xl text-gray-900">Edit Profile</h1>
          <p className="text-sm text-gray-500 mt-0.5">Update your personal information</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white border border-gray-200 p-6 sm:p-8">
          {saveError && (
            <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
              {saveError}
            </div>
          )}
          {saved && (
            <div role="status" className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-600">
              Profile updated successfully.
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <Input
              label="Full Name"
              type="text"
              required
              error={errors.fullName?.message}
              {...register('fullName', {
                required: 'Full name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
                maxLength: { value: 50, message: 'Name must be under 50 characters' },
              })}
            />

            <Input
              label="Email"
              type="email"
              required
              helperText="Changing your email will require re-verification"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
              })}
            />

            <Input
              label="Phone"
              type="tel"
              required
              helperText="Changing your phone number will require OTP re-verification"
              error={errors.phone?.message}
              {...register('phone', {
                required: 'Phone number is required',
                pattern: { value: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit number' },
              })}
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">City</label>
              <select
                className="h-12 w-full rounded-lg border border-gray-200 bg-gray-100 px-4 text-[15px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-brand-red transition-colors"
                {...register('city')}
              >
                {CITIES.map((city) => (
                  <option key={city.name} value={city.name}>{city.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Bio (optional)</label>
              <textarea
                rows={3}
                placeholder="Tell us a little about yourself"
                className="w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-[15px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-brand-red transition-colors resize-none"
                {...register('bio', { maxLength: { value: 200, message: 'Max 200 characters' } })}
              />
              {errors.bio && <p role="alert" className="mt-1.5 text-sm text-red-600">{errors.bio.message}</p>}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-brand-red hover:bg-brand-red-hover text-white font-bold text-sm px-6 py-2.5 transition-colors disabled:opacity-70"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => navigate(ROUTES.PROFILE)}
                className="text-sm font-semibold text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditPage;