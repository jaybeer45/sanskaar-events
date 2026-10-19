import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { disputeService } from '../../services/dispute.service';

const REASON_LABELS = {
  no_show: 'Vendor / customer no-show',
  quality_issue: 'Quality issue',
  payment_issue: 'Payment issue',
  cancellation: 'Cancellation',
  other: 'Other',
};

const STATUS_STYLES = {
  open: 'bg-amber-50 text-amber-800 border-amber-200',
  under_review: 'bg-blue-50 text-blue-800 border-blue-200',
  resolved: 'bg-green-50 text-green-800 border-green-200',
  rejected: 'bg-gray-100 text-gray-600 border-gray-200',
};

const fieldClass =
  'w-full rounded-xl border border-mist bg-moonlight px-3 text-sm text-ink transition-colors focus:border-night focus:bg-white focus:outline-none focus:ring-2 focus:ring-night/20';

// Reusable on both the customer and vendor side, same as BookingChatThread:
// it only needs the bookingId, the backend infers who's asking.
const DisputePanel = ({ bookingId }) => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState('no_show');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    disputeService
      .getForBooking(bookingId)
      .then((res) => setDisputes(res.data.results || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  // Only one open or under_review dispute is allowed per booking (the backend
  // enforces it too); this just decides whether to show the raise form.
  const hasOpenDispute = disputes.some((d) => ['open', 'under_review'].includes(d.status));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      await disputeService.raise(bookingId, { reason, description: description.trim() });
      toast.success('Dispute raised. Our team will review it shortly.');
      setDescription('');
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to raise dispute.');
    }
    setSubmitting(false);
  };

  if (loading) return null;

  return (
    <div className="border-t border-mist pt-3">
      {disputes.length > 0 && (
        <div className="mb-3 space-y-2">
          {disputes.map((d) => (
            <div key={d._id} className="rounded-xl border border-mist bg-moonlight p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-night">{REASON_LABELS[d.reason]}</span>
                <span
                  className={`rounded-pill border px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[d.status]}`}
                >
                  {d.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-sm text-ink/80">{d.description}</p>
              {d.resolution && (
                <div className="mt-2 border-t border-mist pt-2">
                  <p className="text-xs font-semibold text-ink/50">Resolution</p>
                  <p className="text-sm text-ink/80">{d.resolution}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!hasOpenDispute && !showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex h-10 items-center gap-1.5 rounded-pill border border-mist px-4 text-sm font-semibold text-ink/70 transition-colors hover:border-brand-red hover:text-brand-red"
        >
          <AlertTriangle size={15} /> Raise a dispute
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-mist bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="font-heading text-sm font-bold text-night">Raise a dispute</p>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              aria-label="Close form"
              className="-mr-2 flex h-9 w-9 items-center justify-center rounded-full text-night/50 transition-colors hover:bg-night/5"
            >
              <X size={16} />
            </button>
          </div>

          <select
            aria-label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={`${fieldClass} h-11`}
          >
            {Object.entries(REASON_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <textarea
            aria-label="Describe what happened"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happened"
            rows={3}
            className={`${fieldClass} resize-none py-2.5`}
          />

          <button
            type="submit"
            disabled={submitting || !description.trim()}
            className="btn-brand !py-2.5 text-sm disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit dispute'}
          </button>
        </form>
      )}
    </div>
  );
};

export default DisputePanel;