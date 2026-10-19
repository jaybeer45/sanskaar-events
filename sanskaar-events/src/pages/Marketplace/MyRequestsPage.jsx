// src/pages/Marketplace/MyRequestsPage.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { planningRequestService } from '../../services/planningRequest.service';
import { buildRoute, ROUTES } from '../../constants/routes';
import { getEventDateParts } from '../../utils/eventDate';

const STATUS = {
  pending_matching: { label: 'Finding vendors', style: 'bg-amber-100 text-amber-800' },
  matched: { label: 'Matched', style: 'bg-green-100 text-green-800' },
  closed: { label: 'Closed', style: 'bg-gray-200 text-gray-700' },
};

const pretty = (text) => text.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());

const MyRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    planningRequestService
      .getMine()
      .then((res) => setRequests(res.data.results || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="border-b border-mist bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <h1 className="font-heading text-3xl font-extrabold text-night">My requests</h1>
            <p className="mt-1 text-ink/60">Vendor planning requests you have posted.</p>
          </div>
          <Link to={ROUTES.MARKETPLACE} className="btn-brand shrink-0 text-sm">
            New request
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {loading && (
          <div className="space-y-4">
            <div className="skeleton h-28" />
            <div className="skeleton h-28" />
          </div>
        )}

        {!loading && requests.length === 0 && (
          <div className="card px-6 py-12 text-center">
            <p className="font-heading text-lg font-semibold text-night">No requests yet</p>
            <p className="mt-1 text-sm text-ink/60">Tell us what you need and vendors will send you quotes.</p>
            <Link to={ROUTES.MARKETPLACE} className="btn-brand mt-5 inline-block">Plan an event</Link>
          </div>
        )}

        <ul className="space-y-4">
          {requests.map((r) => {
            const date = getEventDateParts(r.eventDate);
            const status = STATUS[r.status] || { label: pretty(r.status.replace(/_/g, ' ')), style: 'bg-gray-200 text-gray-700' };
            return (
              <li key={r._id}>
                <Link to={buildRoute.requestMatches(r.reference)} className="ticket flex rounded-ticket transition-colors hover:border-night">
                  <div className="min-w-0 flex-1 p-5">
                    <p className="font-heading text-lg font-bold leading-snug text-night">
                      {r.services.map(pretty).join(', ')}
                    </p>
                    <p className="mt-0.5 text-sm text-ink/60">{r.occasion ? pretty(r.occasion) : 'Event'}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <span className={`rounded-pill px-2.5 py-1 text-xs font-semibold ${status.style}`}>{status.label}</span>
                      <span className="font-mono text-xs text-ink/60">{r.reference}</span>
                    </div>
                  </div>

                  <div className="relative flex w-24 shrink-0 flex-col items-center justify-center border-l-2 border-dashed border-mist p-3 text-center">
                    <span aria-hidden="true" className="absolute -left-[11px] -top-[11px] h-5 w-5 rounded-full border border-mist bg-surface" />
                    <span aria-hidden="true" className="absolute -bottom-[11px] -left-[11px] h-5 w-5 rounded-full border border-mist bg-surface" />
                    {date ? (
                      <>
                        <p className="text-xs font-medium text-ink/60">{date.weekday}</p>
                        <p className="font-heading text-3xl font-extrabold leading-none text-night">{date.day}</p>
                        <p className="text-sm text-ink/70">{date.month}</p>
                      </>
                    ) : (
                      <p className="text-xs text-ink/60">No date</p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default MyRequestsPage;