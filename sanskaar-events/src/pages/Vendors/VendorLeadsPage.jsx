import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { vendorCatalogService } from '../../services/vendorCatalog.service';
import { quoteService } from '../../services/quote.service';
import Spinner from '../../components/ui/Spinner/Spinner';
import Input from '../../components/ui/Input/Input';
import StatusBadge from '../../components/ui/StatusBadge/StatusBadge';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { ROUTES } from '../../constants/routes';
import { rupeesToPaise } from '../../utils/formatPrice';

const VendorLeadsPage = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const [quoteFormFor, setQuoteFormFor] = useState(null);
  const [lineItems, setLineItems] = useState([{ name: '', amount: '' }]);
  const [travelCharge, setTravelCharge] = useState('');
  const [advancePercent, setAdvancePercent] = useState(50);
  const [validUntil, setValidUntil] = useState('');
  const [submittingQuote, setSubmittingQuote] = useState(false);

  useEffect(() => {
    vendorCatalogService.getMyLeads()
      .then((res) => setLeads(res.data.results || []))
      .finally(() => setLoading(false));
  }, []);

  const addLineItem = () => setLineItems((prev) => [...prev, { name: '', amount: '' }]);
  const updateLineItem = (i, field, value) => {
    setLineItems((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [field]: value };
      return copy;
    });
  };
  const removeLineItem = (i) => setLineItems((prev) => prev.filter((_, idx) => idx !== i));

  const handleSendQuote = async (matchId) => {
    const validItems = lineItems.filter((li) => li.name && li.amount);
    if (validItems.length === 0) {
      toast.error('Add at least one item with an amount.');
      return;
    }
    if (!validUntil) {
      toast.error('Choose how long this quote is valid.');
      return;
    }

    setSubmittingQuote(true);
    try {
      await quoteService.create({
        matchId,
        lineItems: validItems.map((li) => ({ name: li.name, amountPaise: rupeesToPaise(li.amount) })),
        travelChargePaise: rupeesToPaise(travelCharge || 0),
        advancePercent: Number(advancePercent) || 50,
        validUntil,
      });
      toast.success('Quote sent!');
      setQuoteFormFor(null);
      setLineItems([{ name: '', amount: '' }]);
      setTravelCharge('');
      setValidUntil('');
      // Reflect the new quote locally instead of waiting for a refetch, so the
      // button flips to the "already quoted" state immediately.
      setLeads((prev) =>
        prev.map((l) => (l._id === matchId ? { ...l, quoteStatus: 'pending', hasActiveQuote: true } : l))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send quote.');
    }
    setSubmittingQuote(false);
  };

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <DashboardShell
      backTo={ROUTES.VENDOR_DASHBOARD}
      backLabel="Back to dashboard"
      title="Leads"
      subtitle="Customers who approved you. You can contact them now."
    >
      {leads.length === 0 ? (
        <div className="card px-6 py-12 text-center">
          <p className="font-heading text-lg font-semibold text-night">No leads yet</p>
          <p className="mt-1 text-sm text-ink/60">
            You'll show up here once a customer approves you for their request.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {leads.map((lead) => {
            // hasActiveQuote, requestClosed and quoteStatus come from the backend
            // (getMyLeads). A pending or accepted quote, or the customer having
            // accepted someone's quote and closed the request, both mean this
            // vendor can't send another quote.
            const quoteLocked = lead.hasActiveQuote || lead.requestClosed;
            const user = lead.request?.user;

            return (
              <li key={lead._id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-heading text-lg font-bold capitalize text-night">
                    {lead.request?.services?.join(', ')}
                    {lead.request?.occasion ? `, ${lead.request.occasion}` : ''}
                  </p>
                  <span className="shrink-0 text-sm text-ink/60">
                    {lead.request?.eventDate
                      ? new Date(lead.request.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : ''}
                  </span>
                </div>
                {lead.request?.description && <p className="mt-2 text-ink/80">{lead.request.description}</p>}

                <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-mist pt-4 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs text-ink/60">Name</dt>
                    <dd className="font-semibold text-night">{user?.name || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink/60">Phone</dt>
                    <dd className="font-semibold text-night">
                      {user?.phone ? (
                        <a href={`tel:${user.phone}`} className="underline underline-offset-4 hover:text-brand-red">{user.phone}</a>
                      ) : 'N/A'}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs text-ink/60">Email</dt>
                    <dd className="truncate font-semibold text-night">
                      {user?.email ? (
                        <a href={`mailto:${user.email}`} className="underline underline-offset-4 hover:text-brand-red">{user.email}</a>
                      ) : 'N/A'}
                    </dd>
                  </div>
                </dl>

                {quoteFormFor === lead._id ? (
                  <div className="mt-4 space-y-4 border-t border-mist pt-4">
                    <p className="font-heading font-bold text-night">Your quote</p>

                    <div className="space-y-3">
                      {lineItems.map((li, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <Input
                              aria-label={`Item ${i + 1} name`}
                              placeholder="Item name, e.g. Full day photography"
                              value={li.name}
                              onChange={(e) => updateLineItem(i, 'name', e.target.value)}
                            />
                          </div>
                          <div className="w-28 shrink-0">
                            <Input
                              aria-label={`Item ${i + 1} amount in rupees`}
                              type="number"
                              min="0"
                              placeholder="₹"
                              value={li.amount}
                              onChange={(e) => updateLineItem(i, 'amount', e.target.value)}
                            />
                          </div>
                          {lineItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLineItem(i)}
                              aria-label={`Remove item ${i + 1}`}
                              className="flex h-12 w-10 shrink-0 items-center justify-center text-ink/50 transition-colors hover:text-red-600"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={addLineItem}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-night underline underline-offset-4 hover:text-brand-red"
                    >
                      <Plus size={14} /> Add item
                    </button>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <Input label="Travel charge (₹)" type="number" min="0" value={travelCharge} onChange={(e) => setTravelCharge(e.target.value)} />
                      <Input label="Advance (%)" type="number" min="0" max="100" value={advancePercent} onChange={(e) => setAdvancePercent(e.target.value)} />
                      <Input label="Valid until" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={submittingQuote}
                        onClick={() => handleSendQuote(lead._id)}
                        className="btn-brand text-sm disabled:opacity-60"
                      >
                        {submittingQuote ? 'Sending...' : 'Send quote'}
                      </button>
                      <button type="button" onClick={() => setQuoteFormFor(null)} className="btn-outline text-sm">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : quoteLocked ? (
                    <div className="mt-4">
                      <StatusBadge tone={lead.quoteStatus === 'accepted' ? 'success' : 'neutral'}>
                        {lead.requestClosed
                          ? 'Request closed'
                          : lead.quoteStatus === 'accepted'
                            ? 'Quote accepted'
                            : 'Quote sent, awaiting response'}
                      </StatusBadge>
                    </div>
                  ) : (
                    <button
                        type="button"
                        onClick={() => setQuoteFormFor(lead._id)}
                        className="btn-brand mt-4 !py-2.5 text-sm"
                      >
                    Send quote
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </DashboardShell>
  );
};

export default VendorLeadsPage;