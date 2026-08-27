// src/pages/Organizer/EventStaffPage.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, UserPlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { eventStaffService } from '../../services/eventStaff.service';
import Spinner from '../../components/ui/Spinner/Spinner';
import { ROUTES } from '../../constants/routes';

const EventStaffPage = () => {
  const { eventId } = useParams();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');

  const loadStaff = () => {
    eventStaffService.list(eventId)
      .then((res) => setStaff(res.data.results || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStaff();
  }, [eventId]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setError('');
    setInviting(true);
    try {
      await eventStaffService.invite(eventId, email);
      toast.success('Staff invited!');
      setEmail('');
      loadStaff();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to invite staff.');
    }
    setInviting(false);
  };

  const handleRevoke = async (staffId) => {
    try {
      await eventStaffService.revoke(eventId, staffId);
      toast.success('Access revoked.');
      loadStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revoke access.');
    }
  };

  return (
    <div className="bg-[#f5f5f4] min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-3">
          <Link to={ROUTES.MY_EVENTS} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ChevronLeft size={15} /> Back to my events
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <h1 className="font-black text-2xl text-gray-900">Gate Staff Access</h1>

        <div className="bg-white border border-gray-200 p-6">
          <h2 className="font-black text-base text-gray-900 mb-4">Invite staff by email</h2>
          <form onSubmit={handleInvite} className="flex gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@example.com"
              className="flex-1 border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red transition-colors"
            />
            <button
              type="submit"
              disabled={inviting}
              className="flex items-center gap-2 bg-brand-red hover:bg-brand-red-hover text-white font-bold px-4 py-2.5 text-sm transition-colors disabled:opacity-60"
            >
              <UserPlus size={15} /> {inviting ? 'Inviting...' : 'Invite'}
            </button>
          </form>
          {error && <p className="text-brand-red text-xs mt-2">{error}</p>}
          <p className="text-xs text-gray-400 mt-2">The person must already have an account on the platform.</p>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <h2 className="font-black text-base text-gray-900 mb-4">Current staff</h2>
          {loading ? (
            <Spinner size="sm" />
          ) : staff.length === 0 ? (
            <p className="text-sm text-gray-500">No staff invited yet.</p>
          ) : (
            <div className="space-y-2">
              {staff.map((s) => (
                <div key={s._id} className="flex items-center justify-between border border-gray-100 px-4 py-3">
                  <div>
                    <p className="font-bold text-sm text-gray-900">{s.staffUser?.name}</p>
                    <p className="text-xs text-gray-500">{s.staffUser?.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.status}
                    </span>
                    {s.status === 'active' && (
                      <button
                        onClick={() => handleRevoke(s._id)}
                        className="w-7 h-7 border border-gray-300 flex items-center justify-center hover:border-red-400 hover:text-red-500 transition-colors"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventStaffPage;