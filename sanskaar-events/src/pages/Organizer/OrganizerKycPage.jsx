// src/pages/Organizer/OrganizerKycPage.jsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CircleCheck, Clock, XCircle, Upload, Check, Loader2 } from 'lucide-react';
import { submitKyc, fetchMyOrganizer, resetKycStatus } from '../../features/organizer/slices/organizerSlice';
import { uploadService } from '../../services/upload.service';
import { ROUTES } from '../../constants/routes';
import Spinner from '../../components/ui/Spinner/Spinner';
import { sendContactOtp, verifyContactOtp } from '../../features/organizer/slices/organizerSlice';
import OTP from '../../components/ui/OTP/OTP';

const NON_INDIVIDUAL_TYPES = ['proprietorship', 'partnership', 'pvt_ltd', 'llp', 'trust_ngo', 'government'];

const OrganizerKycPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { profile, fetchStatus, kycStatus, error } = useSelector((s) => s.organizer);
 const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const [docUploading, setDocUploading] = useState({ idDocUrl: false, businessDocUrl: false });
  const [docUploaded, setDocUploaded] = useState({ idDocUrl: false, businessDocUrl: false });
  const [otpField, setOtpField] = useState(null); // 'phone' | 'email' 
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState({ phone: false, email: false });
  const [otpError, setOtpError] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);

  const handleSendOtp = async (field) => {
    setOtpError('');
    setOtpBusy(true);
    try {
      await dispatch(sendContactOtp({ organizerId: profile._id, field })).unwrap();
      setOtpSent((s) => ({ ...s, [field]: true }));
      setOtpField(field);
      setOtpCode('');
    } catch (err) {
      setOtpError(err);
    }
    setOtpBusy(false);
  };

  const handleVerifyOtp = async () => {
    setOtpError('');
    setOtpBusy(true);
    try {
      await dispatch(verifyContactOtp({ organizerId: profile._id, field: otpField, code: otpCode })).unwrap();
      setOtpField(null);
      setOtpCode('');
    } catch (err) {
      setOtpError(err);
    }
    setOtpBusy(false);
  };

const handleDocUpload = async (e, field) => {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 10 * 1024 * 1024) {
    console.error('File size must be less than 10MB');
    e.target.value = '';
    return;
  }

  setDocUploading((s) => ({ ...s, [field]: true }));
  setDocUploaded((s) => ({ ...s, [field]: false }));

  try {
    const res = await uploadService.uploadKycDocument(file);
    setValue(field, res.data.url, { shouldValidate: true });
    setDocUploaded((s) => ({ ...s, [field]: true }));
  } catch (err) {
    console.error(
      'Document upload failed:',
      err.response?.data?.message || err.message
    );
  }

  setDocUploading((s) => ({ ...s, [field]: false }));
};

  useEffect(() => { dispatch(fetchMyOrganizer()); }, [dispatch]);
  useEffect(() => () => dispatch(resetKycStatus()), [dispatch]);

  // Agar organizer register hi nahi hai, to pehle register page pe bhejo
  useEffect(() => {
    if (fetchStatus === 'succeeded' && !profile) navigate(ROUTES.ORGANIZER_REGISTER, { replace: true });
  }, [fetchStatus, profile, navigate]);

  const onSubmit = (data) => {
    dispatch(submitKyc({
      organizerId: profile._id,
      data: {
        ...data,
        address: {
          line1: data.line1,
          line2: data.line2,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
        },
      },
    }));
  };

  if (fetchStatus === 'loading' || !profile) {
    return <div className="flex items-center justify-center min-h-screen"><Spinner size="lg" /></div>;
  }

  const isNonIndividual = NON_INDIVIDUAL_TYPES.includes(profile.organizerType);

  // Already verified — koi form nahi, seedha status dikhao
  if (profile.kycStatus === 'verified') {
    return (
      <div className="bg-[#f5f5f4] min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <CircleCheck size={64} className="text-green-600 mx-auto mb-4" />
          <h2 className="font-black text-2xl text-gray-900 mb-2">KYC Verified!</h2>
          <p className="text-gray-500 mb-6">You can now publish events.</p>
          <Link to={ROUTES.ORGANIZER_SUBMIT} className="inline-block bg-brand-red hover:bg-brand-red-hover text-white font-bold px-6 py-3 text-sm transition-colors">
            List an Event →
          </Link>
        </div>
      </div>
    );
  }

  // Submitted, admin review pending
  if (profile.kycStatus === 'submitted' && kycStatus !== 'succeeded') {
    return (
      <div className="bg-[#f5f5f4] min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <Clock size={64} className="text-amber-500 mx-auto mb-4" />
          <h2 className="font-black text-2xl text-gray-900 mb-2"> Under Review </h2>
          <p className="text-gray-500">Your KYC has been submitted and is being verified by our team. This usually takes 24–48 hours</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f5f5f4] min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-5">
          <h1 className="font-black text-2xl text-gray-900">KYC & Bank Details</h1>
          <p className="text-sm text-gray-500 mt-0.5">Step 2 of 2 — Events can only be published after verification.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {profile.kycStatus === 'rejected' && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-5 flex items-start gap-2">
            <XCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">KYC was rejected</p>
              <p>{profile.kycRejectionReason || 'Dobara sahi details bhar ke submit karo.'}</p>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-black text-gray-900">Verify contact details</h3>

            {[
              { field: 'phone', label: 'Contact phone', value: profile.contactPhone, verified: profile.contactPhoneVerified },
              { field: 'email', label: 'Contact email', value: profile.contactEmail, verified: profile.contactEmailVerified },
            ].map(({ field, label, value, verified }) => (
              <div key={field} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p>
                  <p className="text-sm text-gray-800">{value}</p>
                </div>
                {verified ? (
                  <span className="flex items-center gap-1 text-green-600 text-xs font-bold"><Check size={14} /> Verified</span>
                ) : (
                  <button
                    type="button"
                    disabled={otpBusy}
                    onClick={() => handleSendOtp(field)}
                    className="text-xs font-bold text-brand-red border border-brand-red px-3 py-1.5 disabled:opacity-60"
                  >
                    {otpSent[field] ? 'Resend OTP' : 'Send OTP'}
                  </button>
                )}
              </div>
            ))}

            {otpField && (
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <p className="text-xs text-gray-500">Enter the code sent to your {otpField}</p>
                <OTP value={otpCode} onChange={setOtpCode} error={otpError} disabled={otpBusy} />
                <button
                  type="button"
                  disabled={otpBusy || otpCode.length !== 6}
                  onClick={handleVerifyOtp}
                  className="bg-brand-red hover:bg-brand-red-hover text-white text-xs font-bold px-4 py-2 disabled:opacity-60"
                >
                  Verify
                </button>
              </div>
            )}
          </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-200 p-6 space-y-5">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>}

          <h2 className="font-black text-base text-gray-900">Legal identity</h2>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Legal entity name * (PAN ke saath match hona chahiye)</label>
            <input {...register('legalName', { required: true })} className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">PAN *</label>
              <input
                {...register('pan', { required: true, pattern: /^[A-Z]{5}[0-9]{4}[A-Z]$/ })}
                placeholder="ABCDE1234F"
                style={{ textTransform: 'uppercase' }}
                className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red"
              />
              {errors.pan && <p className="text-brand-red text-xs mt-1">PAN format is wrong </p>}
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">
                GSTIN {isNonIndividual && '*'}
              </label>
              <input
                {...register('gstin', { required: isNonIndividual })}
                style={{ textTransform: 'uppercase' }}
                className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red"
              />
            </div>
          </div>
<div>
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Identity document *</label>
            <input type="hidden" {...register('idDocUrl', { required: true })} />
            <label
              htmlFor="id-doc-input"
              className="border border-dashed border-gray-300 flex items-center gap-3 px-4 py-3 cursor-pointer hover:border-brand-red transition-colors"
            >
              {docUploading.idDocUrl ? (
                <Loader2 size={18} className="text-gray-400 animate-spin" />
              ) : docUploaded.idDocUrl ? (
                <Check size={18} className="text-green-600" />
              ) : (
                <Upload size={18} className="text-gray-400" />
              )}
              <span className="text-sm text-gray-600">
                {docUploading.idDocUrl ? 'Uploading...' : docUploaded.idDocUrl ? 'Uploaded — click to change' : 'Upload Aadhaar / Passport / Voter ID / Licence (PDF/JPG/PNG, max 10MB)'}
              </span>
              <input
                id="id-doc-input"
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                onChange={(e) => handleDocUpload(e, 'idDocUrl')}
                className="hidden"
              />
            </label>
            {errors.idDocUrl && <p className="text-brand-red text-xs mt-1">Identity document is required</p>}
          </div>

          {isNonIndividual && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Business proof *</label>
              <input type="hidden" {...register('businessDocUrl', { required: isNonIndividual })} />
              <label
                htmlFor="business-doc-input"
                className="border border-dashed border-gray-300 flex items-center gap-3 px-4 py-3 cursor-pointer hover:border-brand-red transition-colors"
              >
                {docUploading.businessDocUrl? (
                  <Loader2 size={18} className="text-gray-400 animate-spin" />
                ) : docUploaded.businessDocUrl? (
                  <Check size={18} className="text-green-600" />
                ) : (
                  <Upload size={18} className="text-gray-400" />
                )}
                <span className="text-sm text-gray-600">
                  {docUploading.businessDocUrl? 'Uploading...' : docUploaded.businessDocUrl? 'Uploaded — click to change' : 'Upload incorporation cert / GST cert / shop licence (PDF/JPG/PNG, max 10MB)'}
                </span>
                <input
                  id="business-doc-input"
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(e) => handleDocUpload(e, 'businessDocUrl')}
                  className="hidden"
                />
              </label>
              {errors.businessDocUrl && <p className="text-brand-red text-xs mt-1">Business proof is required</p>}
            </div>
          )}

          <h2 className="font-black text-base text-gray-900 pt-2">Registered address</h2>

          <div className="grid grid-cols-2 gap-4">
            <input {...register('line1', { required: true })} placeholder="Address line 1 *" className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
            <input {...register('line2')} placeholder="Address line 2" className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
            <input {...register('city', { required: true })} placeholder="City *" className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
            <input {...register('state', { required: true })} placeholder="State *" className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
          </div>
          <div>
            <input
              {...register('pincode', { required: true, pattern: /^[1-9][0-9]{5}$/ })}
              placeholder="Pincode *"
              className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red"
            />
            {errors.pincode && <p className="text-brand-red text-xs mt-1">Pincode galat hai</p>}
          </div>

          <h2 className="font-black text-base text-gray-900 pt-2">Bank details</h2>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Account holder name *</label>
            <input {...register('bankAccountName', { required: true })} className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Account number *</label>
              <input {...register('bankAccountNumber', { required: true, minLength: 9, maxLength: 18 })} className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Confirm account number *</label>
              <input {...register('bankAccountNumberConfirm', { required: true })} className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">IFSC *</label>
              <input
                {...register('ifsc', { required: true, pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/ })}
                style={{ textTransform: 'uppercase' }}
                className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red"
              />
              {errors.ifsc && <p className="text-brand-red text-xs mt-1">IFSC format galat hai</p>}
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Account type *</label>
              <select {...register('accountType', { required: true })} className="w-full border border-gray-300 px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-red">
                <option value="">Select</option>
                <option value="savings">Savings</option>
                <option value="current">Current</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Payout frequency *</label>
            <select {...register('payoutFrequency', { required: true })} className="w-full border border-gray-300 px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-red">
              <option value="per_event_t2">Per event (T+2)</option>
              <option value="weekly">Weekly consolidated</option>
            </select>
          </div>

          <button
            type="submit"
           disabled={kycStatus === 'loading' || !profile.contactPhoneVerified || !profile.contactEmailVerified}
            className="w-full flex items-center justify-center gap-2 bg-brand-red hover:bg-brand-red-hover text-white font-black py-3.5 text-sm transition-colors disabled:opacity-60"
          >
            {kycStatus === 'loading' ? <Spinner size="sm" /> : 'Submit KYC →'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrganizerKycPage;