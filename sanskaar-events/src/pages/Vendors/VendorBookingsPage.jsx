import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { vendorCatalogService } from '../../services/vendorCatalog.service';
import Spinner from '../../components/ui/Spinner/Spinner';
import BookingChatThread from '../../components/chat/BookingChatThread';
import { ROUTES } from '../../constants/routes';
import { formatPaise } from '../../utils/formatPrice';
import DisputePanel from '../../components/disputes/DisputePanel';


const TABS = [
  { key: 'all', label: 'All' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_STYLES = {
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
};

const NEXT_ACTIONS = {
  confirmed: [
    { to: 'in_progress', label: 'Start Job' },
    { to: 'cancelled', label: 'Cancel' },
  ],
  in_progress: [
    { to: 'completed', label: 'Mark Completed' },
    { to: 'cancelled', label: 'Cancel' },
  ],
  completed: [],
  cancelled: [],
};

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

  return (
    <div className="bg-[#f5f5f4] min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-3">
          <Link to={ROUTES.VENDOR_DASHBOARD} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
            <ChevronLeft size={15} /> Back to dashboard
          </Link>
        </div>
        <div className="max-w-3xl mx-auto px-6 pb-5">
          <h1 className="font-black text-2xl text-gray-900">Jobs & Bookings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Confirmed bookings from accepted quotes</p>
        </div>
        <div className="max-w-3xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-2 text-xs font-bold whitespace-nowrap border-b-2 ${
                tab === t.key ? 'border-brand-red text-brand-red' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-3">
        {loading ? (
          <div className="flex justify-center items-center min-h-[30vh]"><Spinner size="lg" /></div>
        ) : bookings.length === 0 ? (
          <p className="text-sm text-gray-500">No bookings here yet. They'll show up once a customer accepts one of your quotes.</p>
        ) : (
          bookings.map((b) => (
            <div key={b._id} className="bg-white border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-gray-900">
                    {b.request?.services?.join(', ')} — {b.request?.occasion || 'event'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {b.request?.eventDate ? new Date(b.request.eventDate).toLocaleDateString('en-IN') : ''}
                    {b.request?.reference ? ` · Ref: ${b.request.reference}` : ''}
                  </p>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 border ${STATUS_STYLES[b.status] || ''}`}>
                  {b.status.replace('_', ' ')}
                </span>
              </div>

              <div className="border-t border-gray-100 pt-3 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">Customer</p>
                  <p className="font-semibold text-gray-800">{b.user?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">Phone</p>
                  <p className="font-semibold text-gray-800">{b.user?.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">Email</p>
                  <p className="font-semibold text-gray-800">{b.user?.email || '—'}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 mt-3 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">Total</p>
                  <p className="font-bold text-gray-900">{formatPaise(b.totalAmountPaise)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">Advance</p>
                  <p className={`font-semibold ${b.advancePaid ? 'text-green-600' : 'text-amber-600'}`}>
                    {formatPaise(b.advanceAmountPaise)} {b.advancePaid ? '· Paid' : '· Pending'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">Balance</p>
                  <p className={`font-semibold ${b.balancePaid ? 'text-green-600' : 'text-amber-600'}`}>
                    {formatPaise(b.balanceAmountPaise)} {b.balancePaid ? '· Paid' : '· Pending'}
                  </p>
                </div>
              </div>

              {NEXT_ACTIONS[b.status]?.length > 0 && (
                <div className="border-t border-gray-100 pt-3 mt-3 flex gap-2">
                  {NEXT_ACTIONS[b.status].map((action) => (
                    <button
                      key={action.to}
                      disabled={updatingId === b._id}
                      onClick={() => handleStatusChange(b._id, action.to)}
                      className={`text-xs font-bold px-3 py-2 border disabled:opacity-60 ${
                        action.to === 'cancelled'
                          ? 'border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-500'
                          : 'border-brand-red text-brand-red hover:bg-brand-red hover:text-white'
                      }`}
                    >
                      {updatingId === b._id ? 'Updating...' : action.label}
                    </button>
                  ))}
                </div>
              )}

              <BookingChatThread bookingId={b._id} />
               <DisputePanel bookingId={b._id} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VendorBookingsPage;
