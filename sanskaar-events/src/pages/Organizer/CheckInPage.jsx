// src/pages/Organizer/CheckInPage.jsx
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, XCircle } from 'lucide-react';
import { eventStaffService } from '../../services/eventStaff.service';
import { ROUTES } from '../../constants/routes';

const CheckInPage = () => {
  const { eventId } = useParams();
  const [ticketCode, setTicketCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState([]); // recent check-in attempts, newest first

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ticketCode.trim()) return;
    setBusy(true);
    try {
      const res = await eventStaffService.checkIn(eventId, ticketCode.trim());
      setLog((prev) => [
        { code: ticketCode.trim(), ok: true, message: `Checked in — ${res.data.booking.fullName}` },
        ...prev,
      ]);
    } catch (err) {
      setLog((prev) => [
        { code: ticketCode.trim(), ok: false, message: err.response?.data?.message || 'Check-in failed.' },
        ...prev,
      ]);
    }
    setTicketCode('');
    setBusy(false);
  };

  return (
    <div className="bg-[#f5f5f4] min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-3">
          <Link to={ROUTES.MY_EVENTS} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ChevronLeft size={15} /> Back to my events
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <h1 className="font-black text-2xl text-gray-900">Gate Check-in</h1>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-6 flex gap-3">
          <input
            autoFocus
            value={ticketCode}
            onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
            placeholder="Enter ticket code"
            className="flex-1 border border-gray-300 px-3 py-3 text-sm font-mono tracking-wider focus:outline-none focus:border-brand-red transition-colors"
          />
          <button
            type="submit"
            disabled={busy}
            className="bg-brand-red hover:bg-brand-red-hover text-white font-bold px-6 py-3 text-sm transition-colors disabled:opacity-60"
          >
            {busy ? '...' : 'Check In'}
          </button>
        </form>

        <div className="space-y-2">
          {log.map((entry, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 border px-4 py-3 ${entry.ok ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
            >
              {entry.ok ? <CheckCircle2 size={16} className="text-green-600 shrink-0" /> : <XCircle size={16} className="text-red-500 shrink-0" />}
              <div>
                <p className="text-xs font-mono font-bold text-gray-700">{entry.code}</p>
                <p className={`text-sm ${entry.ok ? 'text-green-700' : 'text-red-600'}`}>{entry.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CheckInPage;