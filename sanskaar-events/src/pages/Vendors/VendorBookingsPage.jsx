import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { vendorCatalogService } from '../../services/vendorCatalog.service';
import Spinner from '../../components/ui/Spinner/Spinner';
import StatusBadge from '../../components/ui/StatusBadge/StatusBadge';
import BookingChatThread from '../../components/chat/BookingChatThread';
import DisputePanel from '../../components/disputes/DisputePanel';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { ROUTES } from '../../constants/routes';
import { formatPaise } from '../../utils/formatPrice';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_TONE = {
  confirmed: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'neutral',
};

const NEXT_ACTIONS = {
  confirmed: [
    { to: 'in_progress', label: 'Start job' },
    { to: 'cancelled', label: 'Cancel' },
  ],
  in_progress: [
    { to: 'completed', label: 'Mark completed' },
    { to: 'cancelled', label: 'Cancel' },
  ],
  completed: [],
  cancelled: [],
};

const Stat = ({ label, children }) => (
  <div className="min-w-0">
    <p className="text-xs text-ink/60">{label}</p>
    <div className="font-semibold text-night">{children}</div>
  </div>
);

const VendorBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  const load = () => {
    setLoading(true);
    vendorCatalogService
      .getMyBookings(tab === 'all' ? undefined : tab)
      .then((res) => setBookings(res.data.results || []))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load bookings.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tab]);

  const handleStatusChange = async (bookingId, status) => {
    if (status === 'cancelled' && !window.confirm('Cancel this booking?')) return;

    setUpdatingId(bookingId);
    try {
      await vendorCatalogService.updateBookingStatus(bookingId, status);
      toast.success('Booking updated!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update booking.');
    }
    setUpdatingId(null);
  };

  const tabs = (
    <div role="group" aria-label="Filter bookings" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          aria-pressed={tab === t.key}
          onClick={() => setTab(t.key)}
          className={`h-10 shrink-0 whitespace-nowrap rounded-pill px-4 text-sm font-medium transition-colors ${tab === t.key ? 'bg-night text-white' : 'border border-mist bg-white text-ink/80 hover:border-night/40'
            }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );

  return (
    <DashboardShell
      backTo={ROUTES.VENDOR_DASHBOARD}
      backLabel="Back to dashboard"
      title="Jobs and bookings"
      subtitle="Confirmed bookings from accepted quotes."
      tabs={tabs}
    >
      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center"><Spinner size="lg" /></div>
      ) : bookings.length === 0 ? (
          <div className="card px-6 py-12 text-center">
            <p className="font-heading text-lg font-semibold text-night">No bookings here yet</p>
            <p className="mt-1 text-sm text-ink/60">They'll show up once a customer accepts one of your quotes.</p>
          </div>
        ) : (
            <ul className="space-y-4">
              {bookings.map((b) => (
                <li key={b._id} className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-heading text-lg font-bold capitalize text-night">
                        {b.request?.services?.join(', ')}
                        {b.request?.occasion ? `, ${b.request.occasion}` : ''}
                  </p>
                  <p className="text-sm text-ink/60">
                    {b.request?.eventDate
                      ? new Date(b.request.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : ''}
                    {b.request?.reference ? `, ref ${b.request.reference}` : ''}
                  </p>
                </div>
                <StatusBadge tone={STATUS_TONE[b.status] || 'neutral'}>{b.status.replace(/_/g, ' ')}</StatusBadge>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 border-t border-mist pt-4 text-sm sm:grid-cols-3">
                <Stat label="Customer">{b.user?.name || 'N/A'}</Stat>
                <Stat label="Phone">
                  {b.user?.phone ? (
                    <a href={`tel:${b.user.phone}`} className="underline underline-offset-4 hover:text-brand-red">{b.user.phone}</a>
                  ) : 'N/A'}
                </Stat>
                <Stat label="Email">
                  {b.user?.email ? (
                    <a href={`mailto:${b.user.email}`} className="block truncate underline underline-offset-4 hover:text-brand-red">{b.user.email}</a>
                  ) : 'N/A'}
                </Stat>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 border-t border-mist pt-4 text-sm sm:grid-cols-3">
                <Stat label="Total">
                  <span className="font-heading text-lg font-extrabold">{formatPaise(b.totalAmountPaise)}</span>
                </Stat>
                <Stat label="Advance">
                  <span className="mr-2">{formatPaise(b.advanceAmountPaise)}</span>
                  <StatusBadge tone={b.advancePaid ? 'success' : 'warning'}>{b.advancePaid ? 'Paid' : 'Pending'}</StatusBadge>
                </Stat>
                <Stat label="Balance">
                  <span className="mr-2">{formatPaise(b.balanceAmountPaise)}</span>
                  <StatusBadge tone={b.balancePaid ? 'success' : 'warning'}>{b.balancePaid ? 'Paid' : 'Pending'}</StatusBadge>
                </Stat>
              </div>

              {NEXT_ACTIONS[b.status]?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-mist pt-4">
                  {NEXT_ACTIONS[b.status].map((action) => (
                    <button
                      key={action.to}
                      type="button"
                      disabled={updatingId === b._id}
                      onClick={() => handleStatusChange(b._id, action.to)}
                      className={
                        action.to === 'cancelled'
                          ? 'h-10 rounded-pill px-4 text-sm font-semibold text-brand-red transition-colors hover:bg-red-50 disabled:opacity-60'
                          : 'btn-brand !py-2 text-sm disabled:opacity-60'
                      }
                    >
                      {updatingId === b._id ? 'Updating...' : action.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-4 space-y-3 border-t border-mist pt-4">
                <BookingChatThread bookingId={b._id} />
                <DisputePanel bookingId={b._id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
};

export default VendorBookingsPage;