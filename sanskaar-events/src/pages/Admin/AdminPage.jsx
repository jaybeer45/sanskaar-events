// src/pages/Admin/AdminPage.jsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { fetchPendingEvents, approveEvent, rejectEvent } from '../../features/events/slices/eventsSlice';
import { selectPending, selectPendingStatus } from '../../features/events/selectors/eventsSelectors';
import { Link } from 'react-router-dom';
import { buildRoute } from '../../constants/routes';
import { adminService } from '../../services/admin.service';
import Spinner from '../../components/ui/Spinner/Spinner';
import toast from 'react-hot-toast';
import { formatPaise } from '../../utils/formatPrice';
import CouponManager from '../../components/admin/CouponManager';
import VendorBookingsOverview from '../../components/admin/VendorBookingsOverview';

const AdminPage = () => {
  const dispatch = useDispatch();
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

  const handleApproveEvent = (id) => {
    dispatch(approveEvent(id));
    toast.success('Event approved');
    setTimeout(loadEventsHistory, 500);
  };
  const handleOpenRejectEvent = (id) => {
    setRejectingEventId(id);
    setRejectReason('');
  };

  const handleConfirmRejectEvent = () => {
    if (rejectReason.trim().length < 5) {
      toast.error('Reason atleast should be 5 words');
      return;
    }
    dispatch(rejectEvent({ id: rejectingEventId, reason: rejectReason.trim() }))
      .unwrap()
      .then(() => {
        toast.error('Event rejected');
        setRejectingEventId(null);
        loadEventsHistory();
      })
      .catch((err) => toast.error(typeof err === 'string' ? err : 'Reject faild '));
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
    try {
      await adminService.rejectOrganizer(id);
      toast.error('Organizer rejected');
      loadOrganizers();
      loadOrganizersHistory()
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
    <div className="bg-[#f5f5f4] min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <h1 className="font-black text-2xl text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review and approve pending items</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-px bg-gray-200">
          {[
            { label: 'Pending events', count: events.length, color: 'text-amber-600' },
            { label: 'Pending organizers', count: organizers.length, color: 'text-blue-600' },
            { label: 'Pending vendors', count: vendors.length, color: 'text-purple-600' },
            { label: 'Pending payouts', count: payouts.length, color: 'text-red-600' },
          ].map(({ label, count, color }) => (
            <div key={label} className="bg-white px-6 py-5">
              <p className={`font-black text-3xl ${color}`}>{count}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Events ── */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending */}
            <div>
              <h2 className="font-black text-lg text-gray-900 mb-4">Pending Events</h2>
              {eventsStatus === 'loading' ? (
                <div className="flex justify-center py-10"><Spinner size="lg" /></div>
              ) : (
                <div className="bg-white border border-gray-200 divide-y divide-gray-100">
                  {events.length === 0 && (
                    <div className="text-center py-16 text-gray-400">
                      <Clock size={32} className="mx-auto mb-2 text-gray-300" />No events in queue
                    </div>
                  )}
                  {events.map((event) => (
                    <div key={event.id} className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">{event.title}</p>
                        <p className="text-xs text-gray-500">{event.organizer?.name} · {new Date(event.date).toLocaleDateString('en-IN')}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link to={buildRoute.eventDetail(event.id)} className="w-7 h-7 flex items-center justify-center border border-gray-300 hover:border-gray-500" title="Preview">
                          <Eye size={13} className="text-gray-500" />
                        </Link>
                        <button onClick={() => handleApproveEvent(event.id)} className="w-7 h-7 flex items-center justify-center bg-green-500 hover:bg-green-600" title="Approve">
                          <CheckCircle size={13} className="text-white" />
                        </button>
                        <button onClick={() => handleOpenRejectEvent(event.id)} className="w-7 h-7 flex items-center justify-center bg-brand-red hover:bg-brand-red-hover" title="Reject">
                          <XCircle size={13} className="text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* History */}
            <div>
              <h2 className="font-black text-lg text-gray-900 mb-4">Event History</h2>
              {eventsHistoryLoading ? (
                <div className="flex justify-center py-10"><Spinner size="lg" /></div>
              ) : (
                <div className="bg-white border border-gray-200 divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                  {eventsHistory.length === 0 && <p className="text-sm text-gray-500 p-5">No decided events yet.</p>}
                  {eventsHistory.map((event) => (
                    <div key={event.id} className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">{event.title}</p>
                        <p className="text-xs text-gray-500">{event.organizer?.name}</p>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-1 shrink-0 ${event.status === 'published' ? 'bg-green-100 text-green-700' :
                          event.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-gray-200 text-gray-500'
                          }`}
                      >
                        {event.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Organizers ── */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="font-black text-lg text-gray-900 mb-4">Pending Organizer KYC</h2>
              {organizersLoading ? (
                <div className="flex justify-center py-10"><Spinner size="lg" /></div>
              ) : (
                <div className="space-y-2">
                  {organizers.length === 0 && <p className="text-sm text-gray-500">No pending organizers.</p>}
                  {organizers.map((org) => (
                    <div key={org.id} className="bg-white border border-gray-200 p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{org.displayName}</p>
                        <p className="text-xs text-gray-500">{org.organizerType} · {org.cityId} · KYC: {org.kycStatus}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleVerifyOrganizer(org.id)} className="text-xs font-bold bg-green-500 hover:bg-green-600 text-white px-3 py-2">Verify</button>
                        <button onClick={() => handleRejectOrganizer(org.id)} className="text-xs font-bold bg-brand-red hover:bg-brand-red-hover text-white px-3 py-2">Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="font-black text-lg text-gray-900 mb-4">Organizer History</h2>
              {organizersHistoryLoading ? (
                <div className="flex justify-center py-10"><Spinner size="lg" /></div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {organizersHistory.length === 0 && <p className="text-sm text-gray-500">No decided organizers yet.</p>}
                  {organizersHistory.map((org) => (
                    <div key={org.id} className="bg-white border border-gray-200 p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{org.displayName}</p>
                        <p className="text-xs text-gray-500">{org.organizerType} · {org.cityId}</p>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-1 ${org.kycStatus === 'verified' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}
                      >
                        {org.kycStatus}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Vendors ── */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="font-black text-lg text-gray-900 mb-4">Pending Vendor Verification</h2>
              {vendorsLoading ? (
                <div className="flex justify-center py-10"><Spinner size="lg" /></div>
              ) : (
                <div className="space-y-2">
                  {vendors.length === 0 && <p className="text-sm text-gray-500">No pending vendors.</p>}
                  {vendors.map((v) => (
                    <div key={v.id} className="bg-white border border-gray-200 p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{v.businessName}</p>
                        <p className="text-xs text-gray-500">{v.categories?.join(', ')} · {v.cityId}</p>
                      </div>
                      <button onClick={() => handleVerifyVendor(v.id)} className="text-xs font-bold bg-green-500 hover:bg-green-600 text-white px-3 py-2">Verify</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="font-black text-lg text-gray-900 mb-4">Vendor History</h2>
              {vendorsHistoryLoading ? (
                <div className="flex justify-center py-10"><Spinner size="lg" /></div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {vendorsHistory.length === 0 && <p className="text-sm text-gray-500">No approved vendors yet.</p>}
                  {vendorsHistory.map((v) => (
                    <div key={v.id} className="bg-white border border-gray-200 p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{v.businessName}</p>
                        <p className="text-xs text-gray-500">{v.categories?.join(', ')} · {v.cityId}</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-1 bg-green-100 text-green-700">approved</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Vendor Payouts ── */}
        <section>
          <h2 className="font-black text-lg text-gray-900 mb-4">Pending Vendor Payouts</h2>
          {payoutsLoading ? (
            <div className="flex justify-center py-10"><Spinner size="lg" /></div>
          ) : (
            <div className="space-y-2">
              {payouts.length === 0 && <p className="text-sm text-gray-500">No pending payouts.</p>}
              {payouts.map((p) => (
                <div key={p.id} className="bg-white border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-gray-900 text-sm">{p.vendor?.businessName}</p>
                    <p className="font-black text-gray-900">{formatPaise(p.netPayoutPaise)}</p>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Gross {formatPaise(p.grossAmountPaise)} · Commission {p.commissionPercent}% · Booking {p.booking?._id?.slice(-6)}
                  </p>
                  {p.vendor?.bankAccountNumber ? (
                    <p className="text-xs text-gray-400 mb-3">
                      {p.vendor.bankAccountName} · {p.vendor.bankAccountNumber} · {p.vendor.ifsc}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600 mb-3">Vendor has not added bank details yet.</p>
                  )}
                  <div className="flex gap-2">
                    <input
                      value={bankRefInput[p.id] || ''}
                      onChange={(e) => setBankRefInput((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder="UTR / bank reference"
                      className="flex-1 border border-gray-300 px-3 py-2 text-xs"
                    />
                    <button
                      disabled={markingId === p.id}
                      onClick={() => handleMarkPaid(p.id)}
                      className="text-xs font-bold bg-green-500 hover:bg-green-600 text-white px-3 py-2 disabled:opacity-60 whitespace-nowrap"
                    >
                      {markingId === p.id ? 'Marking...' : 'Mark Paid'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        <VendorBookingsOverview />

        <CouponManager />
        {rejectingEventId && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white w-full max-w-sm p-6 border border-gray-200">
              <h3 className="font-black text-base text-gray-900 mb-1">Reject event</h3>
              <p className="text-xs text-gray-500 mb-4">Organizer ko yeh reason dikhega — clear likhna.</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Venue address incomplete, please add full address"
                rows={4}
                className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setRejectingEventId(null)}
                  className="flex-1 border border-gray-300 text-gray-600 font-bold py-2.5 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRejectEvent}
                  className="flex-1 bg-brand-red hover:bg-brand-red-hover text-white font-bold py-2.5 text-sm"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;