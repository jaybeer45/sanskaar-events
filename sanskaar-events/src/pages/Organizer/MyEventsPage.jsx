// src/pages/Organizer/MyEventsPage.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventsService } from '../../services/events.service';
import Spinner from '../../components/ui/Spinner/Spinner';
import { buildRoute } from '../../constants/routes';

const statusColors = {
  draft: 'bg-gray-100 text-gray-600',
  pending_approval: 'bg-amber-100 text-amber-700',
  published: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-200 text-gray-500',
  completed: 'bg-blue-100 text-blue-700',
};
const MyEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventsService.getMine()
      .then((res) => setEvents(res.data.results || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><Spinner size="lg" /></div>;
  }

  return (
    <div className="bg-[#f5f5f4] min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <h1 className="font-black text-2xl text-gray-900">My Events</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage staff access and check-in for your events</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-3">
        {events.length === 0 && (
          <p className="text-sm text-gray-500">You haven't created any events yet.</p>
        )}

        {events.map((event) => (
          <div key={event._id} className="bg-white border border-gray-200 p-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 ${statusColors[event.status] || 'bg-gray-100 text-gray-600'}`}>
                  {event.status?.replace('_', ' ')}
                </span>
              </div>
              <p className="font-bold text-gray-900 truncate">{event.title}</p>
              <p className="text-xs text-gray-500">{new Date(event.date).toLocaleDateString('en-IN')} · {event.venue?.name || 'No venue'}</p>
              {event.status === 'rejected' && event.rejectionReason && (
                <>
                  <p className="text-xs text-red-500 mt-1">Reason: {event.rejectionReason}</p>
                  <Link
                    to={buildRoute.eventEdit(event._id)}
                    className="inline-block text-xs font-bold text-white bg-brand-red px-3 py-1.5 mt-2"
                  >
                    Edit & Resubmit
                  </Link>
                </>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Link
                to={buildRoute.eventStaff(event._id)}
                className="text-xs font-bold text-brand-red border border-brand-red px-3 py-2"
              >
                Manage Staff
              </Link>
              <Link
                to={buildRoute.eventCheckin(event._id)}
                className="text-xs font-bold bg-brand-red text-white px-3 py-2"
              >
                Check-in
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyEventsPage;