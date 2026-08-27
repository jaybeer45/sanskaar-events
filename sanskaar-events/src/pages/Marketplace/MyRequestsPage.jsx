import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { planningRequestService } from '../../services/planningRequest.service';
import Spinner from '../../components/ui/Spinner/Spinner';
import { buildRoute, ROUTES } from '../../constants/routes';

const statusColors = {
  pending_matching: 'bg-amber-100 text-amber-700',
  matched: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
};

const MyRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    planningRequestService.getMine()
      .then((res) => setRequests(res.data.results || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><Spinner size="lg" /></div>;

  return (
    <div className="bg-[#f5f5f4] min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="font-black text-2xl text-gray-900">My Requests</h1>
            <p className="text-sm text-gray-500 mt-0.5">Vendor planning requests you've posted</p>
          </div>
          <Link to={ROUTES.MARKETPLACE} className="bg-brand-red hover:bg-brand-red-hover text-white font-bold px-4 py-2.5 text-sm">
            + New Request
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-3">
        {requests.length === 0 && <p className="text-sm text-gray-500">No requests yet.</p>}
        {requests.map((r) => (
          <Link
            key={r._id}
            to={buildRoute.requestMatches(r.reference)}
            className=" flex bg-white border border-gray-200 p-4  items-center justify-between hover:border-brand-red transition-colors "
          >
            <div>
              <p className="font-bold text-gray-900 text-sm">{r.services.join(', ')} — {r.occasion || 'event'}</p>
              <p className="text-xs text-gray-500">{r.reference} · {new Date(r.eventDate).toLocaleDateString('en-IN')}</p>
            </div>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${statusColors[r.status] || 'bg-gray-100 text-gray-500'}`}>
              {r.status.replace('_', ' ')}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MyRequestsPage;