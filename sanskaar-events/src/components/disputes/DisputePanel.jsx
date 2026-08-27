import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { disputeService } from '../../services/dispute.service';
import Spinner from '../ui/Spinner/Spinner';

const REASON_LABELS = {
  no_show: 'Vendor / customer no-show',
  quality_issue: 'Quality issue',
  payment_issue: 'Payment issue',
  cancellation: 'Cancellation',
  other: 'Other',
};

const STATUS_STYLES = {
  open: 'bg-amber-50 text-amber-700 border-amber-200',
  under_review: 'bg-blue-50 text-blue-700 border-blue-200',
  resolved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-gray-100 text-gray-500 border-gray-200',
};

// Reusable on both the customer and vendor side, same as BookingChatThread —
// only needs the bookingId, the backend infers who's asking.
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

  // Only one open/under_review dispute is allowed per booking (enforced by
  // the backend too) — this just decides whether to show the raise-form.
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
    <div className="border-t border-gray-100 pt-3 mt-3">
      {disputes.length > 0 && (
        <div className="space-y-2 mb-2">
          {disputes.map((d) => (
            <div key={d._id} className="bg-[#f9f9f8] border border-gray-200 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-700">{REASON_LABELS[d.reason]}</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 border ${STATUS_STYLES[d.status]}`}>
                  {d.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-gray-600">{d.description}</p>
              {d.resolution && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-[10px] font-bold uppercase text-gray-400">Resolution</p>
                  <p className="text-xs text-gray-600">{d.resolution}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!hasOpenDispute && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-600 border border-gray-300 px-3 py-1.5 hover:border-red-400 hover:text-red-600"
        >
          <AlertTriangle size={14} /> Raise a dispute
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-700">Raise a dispute</p>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700">
              <X size={16} />
            </button>
          </div>

          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border border-gray-300 px-2 py-1.5 text-xs"
          >
            {Object.entries(REASON_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happened..."
            rows={3}
            className="w-full border border-gray-300 px-2 py-1.5 text-xs resize-none"
          />

          <button
            type="submit"
            disabled={submitting || !description.trim()}
            className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white px-3 py-2 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit dispute'}
          </button>
        </form>
      )}
    </div>
  );
};

export default DisputePanel;