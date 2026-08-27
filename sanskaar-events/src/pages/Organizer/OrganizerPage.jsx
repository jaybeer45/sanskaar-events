// src/pages/Organizer/OrganizerPage.jsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CircleCheck, Upload, Info, Lock, X, Loader2 } from 'lucide-react';
import { submitEvent, resetSubmitStatus } from '../../features/events/slices/eventsSlice';
import { fetchMyOrganizer } from '../../features/organizer/slices/organizerSlice';
import { EVENT_CATEGORIES } from '../../constants/categories';
import { ROUTES } from '../../constants/routes';
import Spinner from '../../components/ui/Spinner/Spinner';
import { uploadService } from '../../services/upload.service';
import { eventsService } from '../../services/events.service';
import { venuesService } from '../../services/venues.service';

const OrganizerPage = () => {
  const dispatch = useDispatch();
  const submitStatus = useSelector((s) => s.events.submitStatus);
  const { user } = useSelector((s) => s.auth);
  const { profile: organizerProfile, fetchStatus } = useSelector((s) => s.organizer);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [ticketVariants, setTicketVariants] = useState([]);
  const [savedVenues, setSavedVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [saveThisVenue, setSaveThisVenue] = useState(false);

  useEffect(() => {
    venuesService.getMine().then((res) => setSavedVenues(res.data.results || []));
  }, []);

  const addVariantRow = () => {
    setTicketVariants((prev) => [...prev, { name: '', price: '', capacity: '' }]);
  };

  const updateVariantRow = (index, field, value) => {
    setTicketVariants((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeVariantRow = (index) => {
    setTicketVariants((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    return () => dispatch(resetSubmitStatus());
  }, []);

  const handleVenueSelect = (venueId) => {
    setSelectedVenueId(venueId);
    const venue = savedVenues.find((v) => v._id === venueId);
    if (venue) {
      setValue('venueName', venue.name);
      setValue('venueAddress', venue.address);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);

    setUploadError('');

    // Maximum 5 images total
    const remainingSlots = 5 - selectedFiles.length;

    if (remainingSlots <= 0) {
      setUploadError('You can upload a maximum of 5 images.');
      e.target.value = '';
      return;
    }

    const selected = files.slice(0, remainingSlots);

    // Check file size and type
    const validFiles = [];

    for (const file of selected) {
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp'
      ];

      if (!allowedTypes.includes(file.type)) {
        setUploadError(
          `${file.name} is not a valid image. Only JPG, PNG and WebP are allowed.`
        );
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        setUploadError(
          `${file.name} is larger than 5MB. Please select a smaller image.`
        );
        continue;
      }

      validFiles.push(file);
    }

    setSelectedFiles((prev) => [...prev, ...validFiles].slice(0, 5));

    e.target.value = '';
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    setUploadError('');
    let images = [];

    if (selectedFiles.length > 0) {
      setUploading(true);

      try {
        const res = await uploadService.uploadEventImages(selectedFiles);
        images = res.data.urls;
      } catch (err) {
        setUploadError(
          err.response?.data?.message || 'Image upload failed.'
        );
        setUploading(false);
        return;
      }

      setUploading(false);
    }

    // Transform the flat form fields into the nested shape the backend expects
    const eventPayload = {
      title: data.title,
      category: data.category,
      description: data.description,
      date: data.date,
      time: data.time,
      venue: {
        name: data.venueName,
        address: data.venueAddress,
      },
      price: {
        free: !!data.isFree,
        min: Number(data.priceMin) || 0,
        max: Number(data.priceMax) || 0,
      },
      inventory: {
        total: Number(data.capacity) || 0,
        remaining: Number(data.capacity) || 0,
      },
      bookingUrl: data.bookingUrl || '',
      organizerName: data.organizerName || '',
      organizerPhone: data.organizerPhone || '',
      organizerEmail: data.organizerEmail || '',
      images,
    };

    try {
      const createdEvent = await dispatch(submitEvent(eventPayload)).unwrap();

      if (saveThisVenue && !selectedVenueId) {
        venuesService.create({
          name: data.venueName,
          address: data.venueAddress,
        }).then((res) => {
          setSavedVenues((prev) => [...prev, res.data]);
        }).catch((err) => console.error('Venue save failed:', err.response?.data || err.message));
      }

      // Ticket variants are optional — create them after the event exists.
      // Empty rows (no name typed) are skipped rather than blocking submission.
      const validVariants = ticketVariants.filter((v) => v.name && v.price && v.capacity);
      if (validVariants.length > 0) {
        await Promise.all(
          validVariants.map((v) =>
            eventsService.createVariant(createdEvent._id, {
              name: v.name,
              price: Number(v.price),
              capacity: Number(v.capacity),
            })
          )
        );
      }
    } catch (err) {
      setUploadError(err?.response?.data?.message || err?.message || 'Failed to create event or ticket variants.');
    }
  };

  const isAdmin = user?.role === 'admin';
  const isVerifiedOrganizer = organizerProfile?.kycStatus === 'verified';
  const canSubmitEvents = isAdmin || isVerifiedOrganizer;

  if (fetchStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!canSubmitEvents) {
    return (
      <div className="bg-[#f5f5f4] min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <Lock size={56} className="text-gray-300 mx-auto mb-4" />

          <h2 className="font-black text-2xl text-gray-900 mb-2">
            Organizer verification is required.
          </h2>

          <p className="text-gray-500 mb-6">
            {!organizerProfile
              ? 'You need to register as an organizer before submitting an event.'
              : `Your KYC status is "${organizerProfile.kycStatus}". Your KYC must be verified before you can submit an event.`}
          </p>

          <Link
            to={
              !organizerProfile
                ? ROUTES.ORGANIZER_REGISTER
                : ROUTES.ORGANIZER_KYC
            }
            className="inline-block bg-brand-red hover:bg-brand-red-hover text-white font-bold px-6 py-3 text-sm transition-colors"
          >
            {!organizerProfile
              ? 'Register as Organizer →'
              : 'Check KYC Status →'}
          </Link>
        </div>
      </div>
    );
  }

  if (submitStatus === 'succeeded') {
    return (
      <div className="bg-[#f5f5f4] min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <CircleCheck
            size={64}
            className="text-brand-red mx-auto mb-4"
          />

          <h2 className="font-black text-2xl text-gray-900 mb-2">
            Event Submitted!
          </h2>

          <p className="text-gray-500 mb-6">
            Your event is now in the review queue. Our team will approve it
            within 24 hours and it'll appear in the feed.
          </p>

          <button
            onClick={() => {
              dispatch(resetSubmitStatus());
              reset();
              setSelectedFiles([]);
              setUploadError('');
            }}
            className="bg-brand-red hover:bg-brand-red-hover text-white font-bold px-6 py-3 text-sm transition-colors"
          >
            Submit another event
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f5f5f4] min-h-screen">

      {/* Page header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <h1 className="font-black text-2xl text-gray-900">
            List an Event
          </h1>

          <p className="text-sm text-gray-500 mt-0.5">
            Submit your event for review — it'll go live within 24 hours
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Form */}
          <div className="lg:col-span-2">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
            >

              {/* Basic info */}
              <div className="bg-white border border-gray-200 p-6">
                <h2 className="font-black text-base text-gray-900 mb-5"> Event Details </h2>

                <div className="space-y-4">

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">
                      Event Title *
                    </label>

                    <input
                      {...register('title', {
                        required: 'Title is required'
                      })}
                      placeholder="e.g. Sufi Night at Rajmahal Rooftop"
                      className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors"
                    />

                    {errors.title && (
                      <p className="text-brand-red text-xs mt-1">
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">
                      Category *
                    </label>

                    <select
                      {...register('category', { required: true })}
                      className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors bg-white"
                    >
                      <option value="">Select category</option>

                      {EVENT_CATEGORIES
                        .filter((c) => c.id !== 'all')
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.label}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">
                      Description *
                    </label>

                    <textarea
                      {...register('description', {
                        required: 'Description is required',
                        minLength: 50
                      })}
                      rows={4}
                      placeholder="Describe your event — what, who, why it's special..."
                      className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors resize-none"
                    />

                    {errors.description && (
                      <p className="text-brand-red text-xs mt-1">
                        Minimum 50 characters
                      </p>
                    )}
                  </div>

                </div>
              </div>

              {/* Date, time, venue */}
              <div className="bg-white border border-gray-200 p-6">
                <h2 className="font-black text-base text-gray-900 mb-5">
                  When & Where
                </h2>

                <div className="space-y-4">

                  <div className="grid grid-cols-2 gap-4">

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">
                        Date *
                      </label>

                      <input
                        {...register('date', { required: true })}
                        type="date"
                        className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">
                        Start time *
                      </label>

                      <input
                        {...register('time', { required: true })}
                        type="time"
                        className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors"
                      />
                    </div>

                  </div>

                  {savedVenues.length > 0 && (
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">
                        Use a saved venue
                      </label>
                      <select
                        value={selectedVenueId}
                        onChange={(e) => handleVenueSelect(e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors bg-white"
                      >
                        <option value="">— Type a new venue below —</option>
                        {savedVenues.map((v) => (
                          <option key={v._id} value={v._id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">
                      Venue name *
                    </label>

                    <input
                      {...register('venueName', { required: true })}
                      placeholder="e.g. Rajmahal Rooftop"
                      className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">
                      Address *
                    </label>

                    <input
                      {...register('venueAddress', { required: true })}
                      placeholder="Full address, Bareilly"
                      className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors"
                    />
                  </div>

                  {!selectedVenueId && (
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="save-venue"
                        checked={saveThisVenue}
                        onChange={(e) => setSaveThisVenue(e.target.checked)}
                        className="w-4 h-4 accent-brand-red"
                      />
                      <label htmlFor="save-venue" className="text-sm font-medium text-gray-700">
                        Save this venue for future events
                      </label>
                    </div>
                  )}

                </div>
              </div>

              {/* Tickets & price */}
              <div className="bg-white border border-gray-200 p-6">
                <h2 className="font-black text-base text-gray-900 mb-5">
                  Tickets & Price
                </h2>

                <div className="space-y-4">

                  <div className="flex items-center gap-3">
                    <input
                      {...register('isFree')}
                      type="checkbox"
                      id="free-event"
                      className="w-4 h-4 accent-brand-red"
                    />

                    <label
                      htmlFor="free-event"
                      className="text-sm font-medium text-gray-700"
                    >
                      This is a free event
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">
                        Price from (₹)
                      </label>

                      <input
                        {...register('priceMin')}
                        type="number"
                        placeholder="0"
                        className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">
                        Price to (₹)
                      </label>

                      <input
                        {...register('priceMax')}
                        type="number"
                        placeholder="999"
                        className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors"
                      />
                    </div>

                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">
                      Capacity
                    </label>

                    <input
                      {...register('capacity')}
                      type="number"
                      placeholder="200"
                      className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">
                      Booking URL
                    </label>

                    <input
                      {...register('bookingUrl')}
                      placeholder="https://..."
                      className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors"
                    />
                  </div>

                </div>
              </div>

              {/* Ticket variants (optional) */}
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-black text-base text-gray-900">Ticket Types (optional)</h2>
                  <button
                    type="button"
                    onClick={addVariantRow}
                    className="text-xs font-bold text-brand-red border border-brand-red px-3 py-1.5"
                  >
                    + Add ticket type
                  </button>
                </div>
                <p className="text-xs text-gray-400 mb-4">
                  Leave empty to use the single price above. Add rows here for multiple ticket tiers (e.g. Silver, Gold, VIP).
                </p>

                {ticketVariants.map((v, i) => (
                  <div key={i} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-3 mb-3 items-end">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Name</label>
                      <input
                        value={v.name}
                        onChange={(e) => updateVariantRow(i, 'name', e.target.value)}
                        placeholder="e.g. Silver"
                        className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Price (₹)</label>
                      <input
                        type="number"
                        value={v.price}
                        onChange={(e) => updateVariantRow(i, 'price', e.target.value)}
                        placeholder="500"
                        className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Capacity</label>
                      <input
                        type="number"
                        value={v.capacity}
                        onChange={(e) => updateVariantRow(i, 'capacity', e.target.value)}
                        placeholder="100"
                        className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariantRow(i)}
                      className="h-[42px] px-3 border border-gray-300 text-gray-500 hover:border-red-400 hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Organizer */}
              <div className="bg-white border border-gray-200 p-6">
                <h2 className="font-black text-base text-gray-900 mb-5">
                  Organizer Info
                </h2>

                <div className="space-y-4">

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">
                      Organizer / Company name *
                    </label>

                    <input
                      {...register('organizerName', { required: true })}
                      placeholder="Your name or company"
                      className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">
                      Contact phone *
                    </label>

                    <input
                      {...register('organizerPhone', { required: true })}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">
                      Contact email
                    </label>

                    <input
                      {...register('organizerEmail')}
                      type="email"
                      placeholder="you@example.com"
                      className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors"
                    />
                  </div>

                </div>
              </div>

              {/* Photo upload */}
              <div className="bg-white border border-gray-200 p-6">
                <h2 className="font-black text-base text-gray-900 mb-5">
                  Event Images
                </h2>

                {uploadError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-4">
                    {uploadError}
                  </div>
                )}

                <label
                  htmlFor="event-image-input"
                  className="border-2 border-dashed border-gray-300 flex flex-col items-center justify-center py-12 cursor-pointer hover:border-brand-red transition-colors"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(135deg, #f9fafb 0px, #f9fafb 2px, #f3f4f6 2px, #f3f4f6 12px)'
                  }}
                >
                  <Upload size={28} className="text-gray-400 mb-2" />

                  <p className="text-sm font-semibold text-gray-600">
                    Click to upload images
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    JPG, PNG, WebP up to 5MB each · 5 images max
                  </p>

                  <input
                    id="event-image-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleFileSelect}
                    disabled={selectedFiles.length >= 5}
                    className="hidden"
                  />
                </label>

                {selectedFiles.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mt-4">

                    {selectedFiles.map((file, i) => (
                      <div
                        key={i}
                        className="relative aspect-square"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt=""
                          className="w-full h-full object-cover"
                        />

                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="absolute -top-1.5 -right-1.5 bg-black text-white rounded-full w-5 h-5 flex items-center justify-center"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}

                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitStatus === 'loading' || uploading}
                className="w-full flex items-center justify-center gap-2 bg-brand-red hover:bg-brand-red-hover text-white font-black py-4 text-base transition-colors disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Uploading images...
                  </>
                ) : submitStatus === 'loading' ? (
                  <Spinner size="sm" />
                ) : (
                  'Submit for Review →'
                )}
              </button>

            </form>
          </div>

          {/* Sidebar — guidelines */}
          <div className="lg:col-span-1 space-y-4">

            <div className="bg-white border border-gray-200 p-5 sticky top-20">

              <div className="flex items-center gap-2 mb-4">
                <Info size={15} className="text-brand-red" />

                <h3 className="font-black text-sm text-gray-900">
                  Submission Guidelines
                </h3>
              </div>

              <ul className="space-y-3 text-xs text-gray-600">

                {[
                  'Events must be in or near Bareilly',
                  'Approval takes 24-48 hours on weekdays',
                  'Include a clear event image for better visibility',
                  'Free events get 2× more clicks',
                  'Add a working booking URL for paid events',
                  'Events with complete info are prioritised',
                ].map((tip, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2"
                  >
                    <span className="w-4 h-4 shrink-0 bg-brand-red text-white text-[9px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>

                    {tip}
                  </li>
                ))}

              </ul>

              <div className="mt-5 pt-5 border-t border-gray-100">

                <p className="text-xs font-bold text-gray-900 mb-1">
                  Need help?
                </p>

                <p className="text-xs text-gray-500">
                  WhatsApp us at{' '}
                  <span className="font-semibold text-brand-red">
                    +91 98765 43210
                  </span>
                </p>

              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default OrganizerPage;
