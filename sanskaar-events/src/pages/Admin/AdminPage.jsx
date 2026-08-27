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

const AdminPage = () => {
  const dispatch = useDispatch();
  const events = useSelector(selectPending);
  const eventsStatus = useSelector(selectPendingStatus);

  const [organizers, setOrganizers] = useState([]);
  const [organizersLoading, setOrganizersLoading] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [payouts, setPayouts] = useState([]);
  const [payoutsLoading, setPayoutsLoading] = useState(true);
  const [markingId, setMarkingId] = useState(null);
  const [bankRefInput, setBankRefInput] = useState({});

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

  useEffect(() => {
    dispatch(fetchPendingEvents());
    loadOrganizers();
    loadVendors();
    loadPayouts();
  }, [dispatch]);

  const handleApproveEvent = (id) => { dispatch(approveEvent(id)); toast.success('Event approved'); };
  const handleRejectEvent = (id) => { dispatch(rejectEvent(id)); toast.error('Event rejected'); };

  const handleVerifyOrganizer = async (id) => {
    try {
      await adminService.verifyOrganizer(id);
      toast.success('Organizer verified');
      loadOrganizers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to verify organizer');
    }
  };
  const handleRejectOrganizer = async (id) => {
    try {
      await adminService.rejectOrganizer(id);
      toast.error('Organizer rejected');
      loadOrganizers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject organizer');
    }
  };

  const handleVerifyVendor = async (id) => {
    try {
      await adminService.verifyVendor(id);
      toast.success('Vendor verified');
      loadVendors();
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
          <h2 className="font-black text-lg text-gray-900 mb-4">Pending Events</h2>
          {eventsStatus === 'loading' ? (
            <div className="flex justify-center py-10"><Spinner size="lg" /></div>
          ) : (
            <div className="bg-white border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-[#f5f5f4]">
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">Event</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 hidden md:table-cell">Organizer</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 hidden lg:table-cell">Category</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 hidden lg:table-cell">Date</th>
                    <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {events.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-16 text-gray-400"><Clock size={32} className="mx-auto mb-2 text-gray-300" />No events in queue</td></tr>
                  )}
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-[#f5f5f4] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 shrink-0" style={{ backgroundImage: 'repeating-linear-gradient(135deg, #d1d5db 0, #d1d5db 1px, #e5e7eb 1px, #e5e7eb 6px)', backgroundColor: '#e5e7eb' }}>
                            {event.images?.[0] && <img src={event.images[0]} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <p className="font-bold text-gray-900 line-clamp-1">{event.title}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-500 hidden md:table-cell">{event.organizer?.name}</td>
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <span className="text-[10px] font-bold uppercase tracking-wide bg-black text-white px-2 py-1">{event.category?.replace(/-/g, ' ')}</span>
                      </td>
                      <td className="px-5 py-4 text-gray-500 hidden lg:table-cell">{new Date(event.date).toLocaleDateString('en-IN')} · {event.time}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={buildRoute.eventDetail(event.id)} className="w-7 h-7 flex items-center justify-center border border-gray-300 hover:border-gray-500 transition-colors" title="Preview">
                            <Eye size={13} className="text-gray-500" />
                          </Link>
                          <button onClick={() => handleApproveEvent(event.id)} className="w-7 h-7 flex items-center justify-center bg-green-500 hover:bg-green-600 transition-colors" title="Approve">
                            <CheckCircle size={13} className="text-white" />
                          </button>
                          <button onClick={() => handleRejectEvent(event.id)} className="w-7 h-7 flex items-center justify-center bg-brand-red hover:bg-brand-red-hover transition-colors" title="Reject">
                            <XCircle size={13} className="text-white" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Organizers ── */}
        <section>
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
        </section>

        {/* ── Vendors ── */}
        <section>
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

      </div>
    </div>
  );
};

export default AdminPage;