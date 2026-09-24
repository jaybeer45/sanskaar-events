// src/pages/Organizer/OrganizerKycPage.jsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CheckCircle2, Clock, Loader2, Upload } from 'lucide-react';
import { fetchMyOrganizer, submitKyc, sendContactOtp, verifyContactOtp, resetKycStatus, } from '../../features/organizer/slices/organizerSlice';
import { uploadService } from '../../services/upload.service';
import { ROUTES } from '../../constants/routes';
import Spinner from '../../components/ui/Spinner/Spinner';

const NON_INDIVIDUAL_TYPES = ['proprietorship', 'partnership', 'pvt_ltd', 'llp', 'trust_ngo', 'government'];

// A small reusable file-upload button — uploads a KYC document and sets the
// returned reference URL on the given react-hook-form field.
const DocUploadField = ({ label, required, value, onUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const res = await uploadService.uploadKycDocument(file);
      onUploaded(res.data.url);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed.');
    }
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">
        {label} {required && '*'}
      </label>
      <label className="flex items-center gap-2 border border-dashed border-gray-300 px-3 py-2.5 text-sm cursor-pointer hover:border-brand-red transition-colors">
        {uploading ? (
          <Loader2 size={15} className="animate-spin text-gray-400" />
        ) : value ? (
          <CheckCircle2 size={15} className="text-green-600" />
        ) : (
          <Upload size={15} className="text-gray-400" />
        )}
        <span className={value ? 'text-green-700 font-semibold' : 'text-gray-500'}>
          {value ? 'Uploaded — click to replace' : 'Click to upload (PDF/JPG/PNG, max 10MB)'}
        </span>
        <input
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          onChange={handleChange}
          className="hidden"
        />
      </label>
      {error && <p className="text-brand-red text-xs mt-1">{error}</p>}
    </div>
  );
};

// One contact field (phone or email) with its OTP-verification row.
const ContactVerifyRow = ({ label, value, verified, otpSent, otpValue, onOtpChange, onSendOtp, onVerify, sending, verifying }) => (
  <div className="flex items-center justify-between border border-gray-200 px-4 py-3">
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>

    {verified ? (
      <span className="flex items-center gap-1.5 text-green-600 text-xs font-bold">
        <CheckCircle2 size={15} /> Verified
      </span>
    ) : otpSent ? (
      <div className="flex items-center gap-2">
        <input
          value={otpValue}
          onChange={(e) => onOtpChange(e.target.value)}
          placeholder="6-digit OTP"
          maxLength={6}
          className="w-28 border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-brand-red"
        />
        <button
          type="button"
          onClick={onVerify}
          disabled={verifying || otpValue.length !== 6}
          className="text-xs font-bold bg-brand-red text-white px-3 py-2 disabled:opacity-60"
        >
          {verifying ? '...' : 'Verify'}
        </button>
      </div>
    ) : (
      <button
        type="button"
        onClick={onSendOtp}
        disabled={sending}
        className="text-xs font-bold text-brand-red border border-brand-red px-3 py-2 disabled:opacity-60"
      >
        {sending ? 'Sending...' : 'Send OTP'}
      </button>
    )}
  </div>
);

const OrganizerKycPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { profile, fetchStatus, kycStatus, error } = useSelector((s) => s.organizer);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();

  // Two independent OTP flows — one for phone, one for email.
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState('');   // 'phone' | 'email' | ''
  const [verifyingOtp, setVerifyingOtp] = useState(''); // 'phone' | 'email' | ''

  const idDocUrl = watch('idDocUrl');
  const businessDocUrl = watch('businessDocUrl');
  const chequeUrl = watch('chequeUrl');
  const bankAccountNumber = watch('bankAccountNumber');
  const bankAccountNumberConfirm = watch('bankAccountNumberConfirm');

  useEffect(() => { dispatch(fetchMyOrganizer()); }, [dispatch]);
  useEffect(() => () => dispatch(resetKycStatus()), [dispatch]);

  // Not registered yet — send them to register first.
  useEffect(() => {
    if (fetchStatus === 'succeeded' && !profile) navigate(ROUTES.ORGANIZER_REGISTER, { replace: true });
  }, [fetchStatus, profile, navigate]);

  const handleSendOtp = async (field) => {
    setSendingOtp(field);
    try {
      await dispatch(sendContactOtp({ organizerId: profile._id, field })).unwrap();
      if (field === 'phone') setPhoneOtpSent(true);
      else setEmailOtpSent(true);
    } catch (err) {
      // error is already reflected in redux state via the rejected case
    }
    setSendingOtp('');
  };

  const handleVerifyOtp = async (field) => {
    setVerifyingOtp(field);
    try {
      const code = field === 'phone' ? phoneOtp : emailOtp;
      await dispatch(verifyContactOtp({ organizerId: profile._id, field, code })).unwrap();
    } catch (err) {
      // error is already reflected in redux state via the rejected case
    }
    setVerifyingOtp('');
  };

  const onSubmit = (data) => {
    dispatch(submitKyc({
      organizerId: profile._id,
      data: {
        legalName: data.legalName,
        pan: data.pan?.toUpperCase(),
        gstin: data.gstin ? data.gstin.toUpperCase() : undefined,
        address: {
          line1: data.line1,
          line2: data.line2 || '',
          city: data.city,
          state: data.state,
          pincode: data.pincode,
        },
        idDocUrl: data.idDocUrl,
        businessDocUrl: data.businessDocUrl || undefined,
        bankAccountName: data.bankAccountName,
        bankAccountNumber: data.bankAccountNumber,
        bankAccountNumberConfirm: data.bankAccountNumberConfirm,
        ifsc: data.ifsc?.toUpperCase(),
        accountType: data.accountType,
        chequeUrl: data.chequeUrl || undefined,
        payoutFrequency: data.payoutFrequency || 'per_event_t2',
      },
    }));
  };

  if (fetchStatus === 'loading' || !profile) {
    return <div className="flex items-center justify-center min-h-screen"><Spinner size="lg" /></div>;
  }

  const isNonIndividual = NON_INDIVIDUAL_TYPES.includes(profile.organizerType);
  const bothContactsVerified = profile.contactPhoneVerified && profile.contactEmailVerified;

  // KYC already verified — nothing left to do here.
  if (profile.kycStatus === 'verified') {
    return (
      <div className="bg-[#f5f5f4] min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <CheckCircle2 size={56} className="text-green-600 mx-auto mb-4" />
          <h2 className="font-black text-2xl text-gray-900 mb-2">KYC Verified</h2>
          <p className="text-gray-500 mb-6">Your KYC has been verified. You can now submit events.</p>
          <Link to={ROUTES.ORGANIZER_SUBMIT} className="inline-block bg-brand-red hover:bg-brand-red-hover text-white font-bold px-6 py-3 text-sm transition-colors">
            Submit an Event →
          </Link>
        </div>
      </div>
    );
  }

  // KYC already submitted and pending review — don't show the form again.
  if (profile.kycStatus === 'submitted' || kycStatus === 'succeeded') {
    return (
      <div className="bg-[#f5f5f4] min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <Clock size={56} className="text-amber-500 mx-auto mb-4" />
          <h2 className="font-black text-2xl text-gray-900 mb-2">KYC Under Review</h2>
          <p className="text-gray-500">Your KYC details have been submitted. Our team will review them within 24-48 hours.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f5f5f4] min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-5">
          <h1 className="font-black text-2xl text-gray-900">KYC & Bank Details</h1>
          <p className="text-sm text-gray-500 mt-0.5">Step 2 of 2 — you can submit events only after this is verified</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {profile.kycStatus === 'rejected' && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
            <p className="font-bold">Your KYC was rejected:</p>
            <p>{profile.kycRejectionReason || 'No reason was given.'}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>
        )}

        {/* Step A — contact verification. Both must be verified before KYC can be submitted. */}
        <div className="bg-white border border-gray-200 p-6">
          <h2 className="font-black text-base text-gray-900 mb-4">Contact Verification</h2>
          <div className="space-y-3">
            <ContactVerifyRow
              label="Phone"
              value={profile.contactPhone}
              verified={profile.contactPhoneVerified}
              otpSent={phoneOtpSent}
              otpValue={phoneOtp}
              onOtpChange={setPhoneOtp}
              onSendOtp={() => handleSendOtp('phone')}
              onVerify={() => handleVerifyOtp('phone')}
              sending={sendingOtp === 'phone'}
              verifying={verifyingOtp === 'phone'}
            />
            <ContactVerifyRow
              label="Email"
              value={profile.contactEmail}
              verified={profile.contactEmailVerified}
              otpSent={emailOtpSent}
              otpValue={emailOtp}
              onOtpChange={setEmailOtp}
              onSendOtp={() => handleSendOtp('email')}
              onVerify={() => handleVerifyOtp('email')}
              sending={sendingOtp === 'email'}
              verifying={verifyingOtp === 'email'}
            />
          </div>
        </div>

        {/* Step B — the KYC form. Locked/disabled until both contacts are verified. */}
        <form onSubmit={handleSubmit(onSubmit)} className={`bg-white border border-gray-200 p-6 space-y-5 ${!bothContactsVerified ? 'opacity-50 pointer-events-none select-none' : ''}`}>
          <h2 className="font-black text-base text-gray-900">Legal & Bank Details</h2>
          {!bothContactsVerified && (
            <p className="text-xs text-amber-600 font-semibold -mt-3">Verify both phone and email above first.</p>
          )}

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Legal entity name *</label>
            <input
              {...register('legalName', { required: true, minLength: 2, maxLength: 120 })}
              placeholder="Must match your PAN record exactly"
              className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red"
            />
            {errors.legalName && <p className="text-brand-red text-xs mt-1">Legal name is required</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">PAN *</label>
              <input
                {...register('pan', { required: true, pattern: /^[A-Za-z]{5}[0-9]{4}[A-Za-z]$/ })}
                placeholder="ABCDE1234F"
                maxLength={10}
                className="w-full border border-gray-300 px-3 py-2.5 text-sm uppercase focus:outline-none focus:border-brand-red"
              />
              {errors.pan && <p className="text-brand-red text-xs mt-1">Invalid PAN format</p>}
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">
                GSTIN {isNonIndividual && '*'}
              </label>
              <input
                {...register('gstin', { required: isNonIndividual })}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
                className="w-full border border-gray-300 px-3 py-2.5 text-sm uppercase focus:outline-none focus:border-brand-red"
              />
              {errors.gstin && <p className="text-brand-red text-xs mt-1">GSTIN is required for this organizer type</p>}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Address line 1 *</label>
            <input {...register('line1', { required: true })} className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Address line 2</label>
            <input {...register('line2')} className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">City *</label>
              <input {...register('city', { required: true })} className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">State *</label>
              <input {...register('state', { required: true })} className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Pincode *</label>
              <input
                {...register('pincode', { required: true, pattern: /^[1-9][0-9]{5}$/ })}
                maxLength={6}
                className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red"
              />
              {errors.pincode && <p className="text-brand-red text-xs mt-1">Invalid pincode</p>}
            </div>
          </div>

          <DocUploadField
            label="Identity document (Aadhaar / Passport / Voter ID / Licence)"
            required
            value={idDocUrl}
            onUploaded={(url) => setValue('idDocUrl', url, { shouldValidate: true })}
          />
          <input type="hidden" {...register('idDocUrl', { required: true })} />
          {errors.idDocUrl && <p className="text-brand-red text-xs -mt-3">Identity document upload is required</p>}

          {isNonIndividual && (
            <>
              <DocUploadField
                label="Business proof (incorporation certificate / GST certificate / shop licence)"
                required
                value={businessDocUrl}
                onUploaded={(url) => setValue('businessDocUrl', url, { shouldValidate: true })}
              />
              <input type="hidden" {...register('businessDocUrl', { required: isNonIndividual })} />
              {errors.businessDocUrl && <p className="text-brand-red text-xs -mt-3">Business proof is required for this organizer type</p>}
            </>
          )}

          <div className="border-t border-gray-100 pt-5">
            <h3 className="font-black text-sm text-gray-900 mb-4">Bank Account</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Account holder name *</label>
                <input {...register('bankAccountName', { required: true })} className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Account number *</label>
                  <input
                    {...register('bankAccountNumber', { required: true, pattern: /^[0-9]{9,18}$/ })}
                    className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red"
                  />
                  {errors.bankAccountNumber && <p className="text-brand-red text-xs mt-1">Must be 9-18 digits</p>}
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Confirm account number *</label>
                  <input
                    {...register('bankAccountNumberConfirm', {
                      required: true,
                      validate: (v) => v === bankAccountNumber || 'Account numbers do not match',
                    })}
                    className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red"
                  />
                  {errors.bankAccountNumberConfirm && <p className="text-brand-red text-xs mt-1">{errors.bankAccountNumberConfirm.message || 'Required'}</p>}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">IFSC *</label>
                <input
                  {...register('ifsc', { required: true, pattern: /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/ })}
                  maxLength={11}
                  className="w-full border border-gray-300 px-3 py-2.5 text-sm uppercase focus:outline-none focus:border-brand-red"
                />
                {errors.ifsc && <p className="text-brand-red text-xs mt-1">Invalid IFSC format</p>}
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Account type *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-sm">
                    <input type="radio" value="savings" {...register('accountType', { required: true })} className="accent-brand-red" /> Savings
                  </label>
                  <label className="flex items-center gap-1.5 text-sm">
                    <input type="radio" value="current" {...register('accountType', { required: true })} className="accent-brand-red" /> Current
                  </label>
                </div>
                {errors.accountType && <p className="text-brand-red text-xs mt-1">Select an account type</p>}
              </div>

              <DocUploadField
                label="Cancelled cheque (optional — speeds up verification)"
                value={chequeUrl}
                onUploaded={(url) => setValue('chequeUrl', url)}
              />
              <input type="hidden" {...register('chequeUrl')} />

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Payout frequency *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-sm">
                    <input type="radio" value="per_event_t2" defaultChecked {...register('payoutFrequency')} className="accent-brand-red" /> Per event (T+2)
                  </label>
                  <label className="flex items-center gap-1.5 text-sm">
                    <input type="radio" value="weekly" {...register('payoutFrequency')} className="accent-brand-red" /> Weekly consolidated
                  </label>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!bothContactsVerified || kycStatus === 'loading'}
            className="w-full flex items-center justify-center gap-2 bg-brand-red hover:bg-brand-red-hover text-white font-black py-3.5 text-sm transition-colors disabled:opacity-60"
          >
            {kycStatus === 'loading' ? <Spinner size="sm" /> : 'Submit KYC for Review →'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrganizerKycPage;