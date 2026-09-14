// src/pages/Organizer/OrganizerPage.jsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CircleCheck, Lock, Loader2 } from 'lucide-react';
import { submitEvent, resetSubmitStatus } from '../../features/events/slices/eventsSlice';
import { fetchMyOrganizer } from '../../features/organizer/slices/organizerSlice';
import { EVENT_CATEGORIES } from '../../constants/categories';
import { ROUTES } from '../../constants/routes';
import Spinner from '../../components/ui/Spinner/Spinner';
import { uploadService } from '../../services/upload.service';
import { eventsService } from '../../services/events.service';
import { venuesService } from '../../services/venues.service';
import GuidelinesSidebar from '../../components/organizer/GuidelinesSidebar';
import EventDatesInput from '../../components/organizer/EventDatesInput';
import TicketVariantsInput from '../../components/organizer/TicketVariantsInput';
import EventMediaUploader from '../../components/organizer/EventMediaUploader';
import ArtistsInput from '../../components/organizer/ArtistsInput';

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
  const [artists, setArtists] = useState([]);
  const [savedVenues, setSavedVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [saveThisVenue, setSaveThisVenue] = useState(false);
  const [eventDates, setEventDates] = useState([]);
  const { eventId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!eventId;

  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [existingImages, setExistingImages] = useState([]); // URLs already on the event
  const [editSubmitStatus, setEditSubmitStatus] = useState('idle'); // separate from create's redux submitStatus
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);
  const [existingVideoUrl, setExistingVideoUrl] = useState('');

  useEffect(() => {
    if (!isEditMode) return;

    eventsService.getById(eventId).then((res) => {
      const event = res.data;

      setValue('title', event.title);
      setValue('category', event.category);
      setValue('description', event.description);
      setValue('date', new Date(event.date).toISOString().slice(0, 10));
      setValue('time', event.time);
      setValue('venueName', event.venue?.name || '');
      setValue('venueAddress', event.venue?.address || '');
      setValue('isFree', !!event.price?.free);
      setValue('priceMin', event.price?.min ?? '');
      setValue('priceMax', event.price?.max ?? '');
      setValue('capacity', event.inventory?.total ?? '');
      setValue('bookingUrl', event.bookingUrl || '');
      setValue('organizerName', event.organizerName || '');
      setValue('organizerPhone', event.organizerPhone || '');
      setValue('organizerEmail', event.organizerEmail || '');

      setEventDates(
        (event.eventDates || []).map((d) => ({
          date: new Date(d.date).toISOString().slice(0, 10),
          label: d.label || '',
          capacity: d.capacity || '',
        }))
      );
      setArtists(event.artists || []);

      setExistingImages(event.images || []);
      setExistingVideoUrl(event.promotionalVideo?.url || '');
      setInitialLoading(false);
    }).catch(() => {
      setUploadError('Failed to load event for editing.');
      setInitialLoading(false);
    });
  }, [eventId]);

  useEffect(() => {
    venuesService.getMine().then((res) => setSavedVenues(res.data.results || []));
  }, []);

  useEffect(() => {
    if (!organizerProfile) {
      dispatch(fetchMyOrganizer());
    }
  }, []);

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

  const onSubmit = async (data) => {
    setUploadError('');
    let images = [];
    let promotionalVideo = existingVideoUrl
      ? { url: existingVideoUrl, mimeType: 'video/mp4' }
      : null;

    if (selectedFiles.length > 0 || selectedVideoFile) {
      setUploading(true);

      if (selectedFiles.length > 0) {
        try {
          const res = await uploadService.uploadEventImages(selectedFiles);
          images = res.data.urls;
        } catch (err) {
          setUploadError(err.response?.data?.message || 'Image upload failed.');
          setUploading(false);
          return;
        }
      }

      if (selectedVideoFile) {
        try {
          const res = await uploadService.uploadEventVideo(selectedVideoFile);
          promotionalVideo = { url: res.data.url, mimeType: 'video/mp4' };
        } catch (err) {
          setUploadError(err.response?.data?.message || 'Video upload failed.');
          setUploading(false);
          return;
        }
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
      artists: artists.filter((a) => a.name.trim()),
      eventDates: eventDates
        .filter((d) => d.date) // date empty row skip
        .map((d) => ({
          date: d.date,
          label: d.label || '',
          capacity: Number(d.capacity) || 0,
        })),
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
      images: isEditMode ? [...existingImages, ...images] : images,
      promotionalVideo,
    };

    // ── EDIT MODE: update existing event, resubmit for review ──
    if (isEditMode) {
      setEditSubmitStatus('loading');
      try {
        await eventsService.update(eventId, eventPayload);
        setEditSubmitStatus('succeeded');
      } catch (err) {
        setEditSubmitStatus('failed');
        setUploadError(err?.response?.data?.message || err?.message || 'Failed to update event.');
      }
      return;
    }

    // ── CREATE MODE ──
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

  const isAdmin = user?.roles?.includes('admin');
  const isVerifiedOrganizer = organizerProfile?.kycStatus === 'verified';
  const canSubmitEvents = isAdmin || isVerifiedOrganizer;

  if (fetchStatus === 'loading' || initialLoading) {
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

  if (submitStatus === 'succeeded' || editSubmitStatus === 'succeeded') {
    return (
      <div className="bg-[#f5f5f4] min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <CircleCheck
            size={64}
            className="text-brand-red mx-auto mb-4"
          />

          <h2 className="font-black text-2xl text-gray-900 mb-2">
            {isEditMode ? 'Event Resubmitted!' : 'Event Submitted!'}
          </h2>

          <p className="text-gray-500 mb-6">
            {isEditMode
              ? 'Your changes have been sent back for review. Our team will approve it within 24 hours.'
              : "Your event is now in the review queue. Our team will approve it within 24 hours and it'll appear in the feed."}
          </p>

          <button
            onClick={() => {
              if (isEditMode) {
                navigate(ROUTES.MY_EVENTS);
              } else {
                dispatch(resetSubmitStatus());
                reset();
                setSelectedFiles([]);
                setUploadError('');
              }
            }}
            className="bg-brand-red hover:bg-brand-red-hover text-white font-bold px-6 py-3 text-sm transition-colors"
          >
            {isEditMode ? 'Back to My Events' : 'Submit another event'}
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
            {isEditMode ? 'Edit Event' : 'List an Event'}
          </h1>

          <p className="text-sm text-gray-500 mt-0.5">
            {isEditMode
              ? 'Update and resubmit your event for review'
              : "Submit your event for review — it'll go live within 24 hours"}
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

                    {/* Multiple dates (optional) — for multi-day/recurring events */}
                    <EventDatesInput dates={eventDates} onChange={setEventDates} />

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
              <TicketVariantsInput variants={ticketVariants} onChange={setTicketVariants} />
              <ArtistsInput artists={artists} onChange={setArtists} />
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

              {/* Event media — images + promotional video */}
              {uploadError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
                  {uploadError}
                </div>
              )}
              <EventMediaUploader
                existingImages={existingImages}
                onExistingImagesChange={setExistingImages}
                selectedFiles={selectedFiles}
                onFilesChange={setSelectedFiles}
                existingVideoUrl={existingVideoUrl}
                onExistingVideoChange={setExistingVideoUrl}
                selectedVideoFile={selectedVideoFile}
                onVideoFileChange={setSelectedVideoFile}
              />

              <button
                type="submit"
                disabled={submitStatus === 'loading' || editSubmitStatus === 'loading' || uploading}
                className="w-full flex items-center justify-center gap-2 bg-brand-red hover:bg-brand-red-hover text-white font-black py-4 text-base transition-colors disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Uploading media...
                  </>
                ) : (submitStatus === 'loading' || editSubmitStatus === 'loading') ? (
                  <Spinner size="sm" />
                ) : (
                  isEditMode ? 'Resubmit for Review →' : 'Submit for Review →'
                )}
              </button>

            </form>
          </div>

          {/* Sidebar — guidelines */}
          <GuidelinesSidebar />

        </div>
      </div>
    </div>
  );
};

export default OrganizerPage;