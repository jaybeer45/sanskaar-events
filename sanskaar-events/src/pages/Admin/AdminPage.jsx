// src/pages/Admin/AdminPage.jsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, CalendarDays, UserCheck, Store, Wallet, Ticket } from 'lucide-react';
import { fetchPendingEvents, approveEvent, rejectEvent } from '../../features/events/slices/eventsSlice';
import { selectPending, selectPendingStatus } from '../../features/events/selectors/eventsSelectors';
import { buildRoute } from '../../constants/routes';
import { adminService } from '../../services/admin.service';
import Spinner from '../../components/ui/Spinner/Spinner';
import Input from '../../components/ui/Input/Input';
import { Textarea } from '../../components/ui/Input/Fields';
import StatusBadge from '../../components/ui/StatusBadge/StatusBadge';
import toast from 'react-hot-toast';
import { formatPaise } from '../../utils/formatPrice';
import CouponManager from '../../components/admin/CouponManager';
import VendorBookingsOverview from '../../components/admin/VendorBookingsOverview';

const TABS = [
  { key: 'events', label: 'Events', icon: CalendarDays },
  { key: 'organizers', label: 'Organizers', icon: UserCheck },
  { key: 'vendors', label: 'Vendors', icon: Store },
  { key: 'payouts', label: 'Payouts', icon: Wallet },
  { key: 'coupons', label: 'Coupons', icon: Ticket },
];

const approveBtn =
  'h-10 rounded-pill bg-green-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60';
const rejectBtn =
  'h-10 rounded-pill px-4 text-sm font-semibold text-brand-red transition-colors hover:bg-red-50 disabled:opacity-60';

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const Panel = ({ title, count, children }) => (
  <section>
    <h2 className="mb-3 flex items-center gap-2 font-heading text-xl font-bold text-night">
      {title}
      {count !== undefined && (
        <span className="rounded-pill bg-night/5 px-2.5 py-0.5 text-sm font-semibold text-night/70">{count}</span>
      )}
    </h2>
    {children}
  </section>
);

const Loading = () => (
  <div className="flex justify-center py-10"><Spinner size="lg" /></div>
);

const Empty = ({ children }) => (
  <div className="card px-5 py-10 text-center text-sm text-ink/60">{children}</div>
);

const AdminPage = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const events = useSelector(selectPending);
  const eventsStatus = useSelector(selectPendingStatus);

  const [organizers, setOrganizers] = useState([]);
  const [organizersLoading, setOrganizersLoading] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [eventsHistory, setEventsHistory] = useState([]);
  const [eventsHistoryLoading, setEventsHistoryLoading] = useState(true);
  const [organizersHistory, setOrganizersHistory] = useState([]);
  const [organizersHistoryLoading, setOrganizersHistoryLoading] = useState(true);
  const [vendorsHistory, setVendorsHistory] = useState([]);
  const [vendorsHistoryLoading, setVendorsHistoryLoading] = useState(true);
  const [payouts, setPayouts] = useState([]);
  const [payoutsLoading, setPayoutsLoading] = useState(true);
  const [markingId, setMarkingId] = useState(null);
  const [bankRefInput, setBankRefInput] = useState({});
  const [rejectingEventId, setRejectingEventId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // The open tab lives in the URL (?tab=payouts), so a refresh keeps it
  const requestedTab = searchParams.get('tab');
  const tab = TABS.some((t) => t.key === requestedTab) ? requestedTab : 'events';
  const setTab = (key) => setSearchParams({ tab: key }, { replace: true });

  const counts = {
    events: events.length,
    organizers: organizers.length,
    vendors: vendors.length,
    payouts: payouts.length,
  };

  const loadOrganizers = () => {
    setOrganizersLoading(true);
    adminService.getPendingOrganizers().then(setOrganizers).finally(() => setOrganizersLoading(false));
  };
  const loadVendors = () => {
    setVendorsLoading(true);
    adminService.getPendingVendors().then(setVendors).finally(() => setVendorsLoading(false));
  };
  const loadPayouts = () => {
    setPayoutsLoading(true);
    adminService.getVendorPayouts('pending').then(setPayouts).finally(() => setPayoutsLoading(false));
  };
  const loadEventsHistory = () => {
    setEventsHistoryLoading(true);
    adminService.getEventsHistory().then(setEventsHistory).finally(() => setEventsHistoryLoading(false));
  };
  const loadOrganizersHistory = () => {
    setOrganizersHistoryLoading(true);
    adminService.getOrganizersHistory().then(setOrganizersHistory).finally(() => setOrganizersHistoryLoading(false));
  };
  const loadVendorsHistory = () => {
    setVendorsHistoryLoading(true);
    adminService.getVendorsHistory().then(setVendorsHistory).finally(() => setVendorsHistoryLoading(false));
  };

  useEffect(() => {
    dispatch(fetchPendingEvents());
    loadOrganizers();
    loadVendors();
    loadPayouts();
    loadEventsHistory();
    loadOrganizersHistory();
    loadVendorsHistory();
  }, [dispatch]);

  // Escape closes the reject dialog
  useEffect(() => {
    if (!rejectingEventId) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setRejectingEventId(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [rejectingEventId]);

  const handleApproveEvent = (id) => {
    dispatch(approveEvent(id))
      .unwrap()
      .then(() => {
        toast.success('Event approved');
        loadEventsHistory();
      })
      .catch((err) => toast.error(typeof err === 'string' ? err : 'Could not approve the event.'));
  };

  const handleOpenRejectEvent = (id) => {
    setRejectingEventId(id);
    setRejectReason('');
  };

  const handleConfirmRejectEvent = () => {
    if (rejectReason.trim().length < 5) {
      toast.error('Please give a reason of at least 5 characters.');
      return;
    }
    dispatch(rejectEvent({ id: rejectingEventId, reason: rejectReason.trim() }))
      .unwrap()
      .then(() => {
        toast.success('Event rejected');
        setRejectingEventId(null);
        loadEventsHistory();
      })
      .catch((err) => toast.error(typeof err === 'string' ? err : 'Could not reject the event.'));
  };

  const handleVerifyOrganizer = async (id) => {
    try {
      await adminService.verifyOrganizer(id);
      toast.success('Organizer verified');
      loadOrganizers();
      loadOrganizersHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to verify organizer');
    }
  };

  const handleRejectOrganizer = async (id) => {
    if (!window.confirm('Reject this organizer?')) return;
    try {
      await adminService.rejectOrganizer(id);
      toast.success('Organizer rejected');
      loadOrganizers();
      loadOrganizersHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject organizer');
    }
  };

  const handleVerifyVendor = async (id) => {
    try {
      await adminService.verifyVendor(id);
      toast.success('Vendor verified');
      loadVendors();
      loadVendorsHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to verify vendor');
    }
  };

  const handleMarkPaid = async (id) => {
    const bankRef = (bankRefInput[id] || '').trim();
    if (!bankRef) {
      toast.error('Enter a UTR / bank reference before marking paid.');
      return;
    }
    setMarkingId(id);
    try {
      await adminService.markPayoutPaid(id, bankRef);
      toast.success('Payout marked as paid');
      loadPayouts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark payout paid');
    }
    setMarkingId(null);
  };

  return (
    <div>
      {/* Header with tabs */}
      <div className="border-b border-mist bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="py-5">
            <h1 className="font-heading text-3xl font-extrabold text-night">Admin panel</h1>
            <p className="mt-1 text-ink/60">Review and approve pending items.</p>
          </div>

          <div role="tablist" aria-label="Admin sections" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
            {TABS.map(({ key, label, icon: Icon }) => {
              const active = tab === key;
              const count = counts[key];
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  id={`tab-${key}`}
                  aria-selected={active}
                  aria-controls="admin-panel"
                  onClick={() => setTab(key)}
                  className={`inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-pill px-4 text-sm font-medium transition-colors ${active ? 'bg-night text-white' : 'border border-mist bg-white text-ink/80 hover:border-night/40'
                    }`}
                >
                  <Icon size={16} />
                  {label}
                  {count > 0 && (
                    <span className="rounded-pill bg-marigold px-2 py-0.5 text-xs font-bold text-night">{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div id="admin-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* Events */}
        {tab === 'events' && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <Panel title="Pending events" count={events.length}>
              {eventsStatus === 'loading' ? (
                <Loading />
              ) : events.length === 0 ? (
                <Empty>No events in the queue.</Empty>
              ) : (
                    <ul className="card divide-y divide-mist/70">
                  {events.map((event) => (
                    <li key={event.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-night">{event.title}</p>
                        <p className="text-sm text-ink/60">
                          {event.organizer?.name}
                          {event.date ? `, ${formatDate(event.date)}` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Link
                          to={buildRoute.eventDetail(event.id)}
                          aria-label={`Preview ${event.title}`}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-mist transition-colors hover:border-night"
                        >
                          <Eye size={16} className="text-night/60" />
                        </Link>
                        <button type="button" onClick={() => handleApproveEvent(event.id)} className={approveBtn}>
                          Approve
                        </button>
                        <button type="button" onClick={() => handleOpenRejectEvent(event.id)} className={rejectBtn}>
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}
                    </ul>
              )}
            </Panel>

            <Panel title="Event history">
              {eventsHistoryLoading ? (
                <Loading />
              ) : eventsHistory.length === 0 ? (
                <Empty>No decided events yet.</Empty>
              ) : (
                    <ul className="card max-h-[480px] divide-y divide-mist/70 overflow-y-auto">
                  {eventsHistory.map((event) => (
                    <li key={event.id} className="flex items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-night">{event.title}</p>
                        <p className="text-sm text-ink/60">{event.organizer?.name}</p>
                      </div>
                      <StatusBadge
                        tone={event.status === 'published' ? 'success' : event.status === 'rejected' ? 'danger' : 'neutral'}
                      >
                        {event.status}
                      </StatusBadge>
                    </li>
                  ))}
                    </ul>
              )}
            </Panel>
          </div>
        )}

        {/* Organizers */}
        {tab === 'organizers' && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <Panel title="Pending organizer KYC" count={organizers.length}>
              {organizersLoading ? (
                <Loading />
              ) : organizers.length === 0 ? (
                <Empty>No pending organizers.</Empty>
              ) : (
                    <ul className="card divide-y divide-mist/70">
                  {organizers.map((org) => (
                    <li key={org.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-night">{org.displayName}</p>
                        <p className="text-sm text-ink/60">
                          {org.organizerType}, {org.cityId}, KYC {org.kycStatus}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button type="button" onClick={() => handleVerifyOrganizer(org.id)} className={approveBtn}>
                          Verify
                        </button>
                        <button type="button" onClick={() => handleRejectOrganizer(org.id)} className={rejectBtn}>
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}
                    </ul>
              )}
            </Panel>

            <Panel title="Organizer history">
              {organizersHistoryLoading ? (
                <Loading />
              ) : organizersHistory.length === 0 ? (
                <Empty>No decided organizers yet.</Empty>
              ) : (
                    <ul className="card max-h-[480px] divide-y divide-mist/70 overflow-y-auto">
                  {organizersHistory.map((org) => (
                    <li key={org.id} className="flex items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-night">{org.displayName}</p>
                        <p className="text-sm text-ink/60">
                          {org.organizerType}, {org.cityId}
                        </p>
                      </div>
                      <StatusBadge tone={org.kycStatus === 'verified' ? 'success' : 'danger'}>{org.kycStatus}</StatusBadge>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        )}

        {/* Vendors */}
        {tab === 'vendors' && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <Panel title="Pending vendor verification" count={vendors.length}>
              {vendorsLoading ? (
                <Loading />
              ) : vendors.length === 0 ? (
                <Empty>No pending vendors.</Empty>
              ) : (
                    <ul className="card divide-y divide-mist/70">
                  {vendors.map((v) => (
                    <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-night">{v.businessName}</p>
                        <p className="text-sm text-ink/60">
                          {v.categories?.join(', ')}, {v.cityId}
                        </p>
                      </div>
                      <button type="button" onClick={() => handleVerifyVendor(v.id)} className={approveBtn}>
                        Verify
                      </button>
                    </li>
                  ))}
                    </ul>
              )}
            </Panel>

            <Panel title="Vendor history">
              {vendorsHistoryLoading ? (
                <Loading />
              ) : vendorsHistory.length === 0 ? (
                <Empty>No approved vendors yet.</Empty>
              ) : (
                    <ul className="card max-h-[480px] divide-y divide-mist/70 overflow-y-auto">
                  {vendorsHistory.map((v) => (
                    <li key={v.id} className="flex items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-night">{v.businessName}</p>
                        <p className="text-sm text-ink/60">
                          {v.categories?.join(', ')}, {v.cityId}
                        </p>
                      </div>
                      <StatusBadge tone="success">approved</StatusBadge>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        )}

        {/* Payouts */}
        {tab === 'payouts' && (
          <div className="space-y-10">
            <Panel title="Pending vendor payouts" count={payouts.length}>
              {payoutsLoading ? (
                <Loading />
              ) : payouts.length === 0 ? (
                <Empty>No pending payouts.</Empty>
              ) : (
                    <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      {payouts.map((p) => (
                    <li key={p.id} className="card p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-heading text-lg font-bold text-night">{p.vendor?.businessName}</p>
                          <p className="text-sm text-ink/60">
                            Booking #{p.booking?._id?.slice(-6)}, gross {formatPaise(p.grossAmountPaise)}, commission{' '}
                            {p.commissionPercent}%
                          </p>
                        </div>
                        <p className="shrink-0 font-heading text-2xl font-extrabold text-night">
                          {formatPaise(p.netPayoutPaise)}
                        </p>
                      </div>

                      <div className="mt-3 rounded-xl bg-moonlight p-3 text-sm">
                        {p.vendor?.bankAccountNumber ? (
                          <p className="text-ink/80">
                            {p.vendor.bankAccountName}, <span className="font-mono">{p.vendor.bankAccountNumber}</span>,{' '}
                            {p.vendor.ifsc}
                          </p>
                        ) : (
                          <p className="font-medium text-amber-800">This vendor has not added bank details yet.</p>
                        )}
                      </div>

                      <div className="mt-4 flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <Input
                            aria-label="UTR or bank reference"
                            placeholder="UTR / bank reference"
                            value={bankRefInput[p.id] || ''}
                            onChange={(e) => setBankRefInput((prev) => ({ ...prev, [p.id]: e.target.value }))}
                          />
                        </div>
                        <button
                          type="button"
                          disabled={markingId === p.id}
                          onClick={() => handleMarkPaid(p.id)}
                          className="h-12 shrink-0 whitespace-nowrap rounded-pill bg-green-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
                        >
                          {markingId === p.id ? 'Marking...' : 'Mark paid'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <VendorBookingsOverview />
          </div>
        )}

        {/* Coupons */}
        {tab === 'coupons' && <CouponManager />}
      </div>

      {/* Reject event dialog */}
      {rejectingEventId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-night-deep/70 px-4"
          onClick={() => setRejectingEventId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-title"
            className="w-full max-w-sm rounded-2xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="reject-title" className="font-heading text-xl font-bold text-night">Reject event</h3>
            <p className="mb-4 mt-1 text-sm text-ink/60">The organizer will see this reason, so keep it clear.</p>
            <Textarea
              aria-label="Reason for rejection"
              autoFocus
              rows={4}
              placeholder="e.g. Venue address is incomplete, please add the full address"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setRejectingEventId(null)} className="btn-outline flex-1 !py-2.5 text-sm">
                Cancel
              </button>
              <button type="button" onClick={handleConfirmRejectEvent} className="btn-brand flex-1 !py-2.5 text-sm">
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;