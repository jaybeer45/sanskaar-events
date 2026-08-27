import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { vendorCatalogService } from '../../services/vendorCatalog.service';
import { quoteService } from '../../services/quote.service';
import Spinner from '../../components/ui/Spinner/Spinner';
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
    setSubmittingQuote(true);
    try {
      await quoteService.create({
        matchId,
        lineItems: lineItems
          .filter((li) => li.name && li.amount)
          .map((li) => ({ name: li.name, amountPaise: rupeesToPaise(li.amount) })),
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

  if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><Spinner size="lg" /></div>;

  return (
    <div className="bg-[#f5f5f4] min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-3">
          <Link to={ROUTES.VENDOR_DASHBOARD} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
            <ChevronLeft size={15} /> Back to dashboard
          </Link>
        </div>
        <div className="max-w-3xl mx-auto px-6 pb-5">
          <h1 className="font-black text-2xl text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">Customers who approved you — you can now contact them</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-3">
        {leads.length === 0 && <p className="text-sm text-gray-500">No leads yet. You'll show up here once a customer approves you for their request.</p>}
        {leads.map((lead) => {
          // hasActiveQuote / requestClosed / quoteStatus come from the backend
          // (getMyLeads) — a quote already pending/accepted, or the customer having
          // accepted someone's quote and closed the request, both mean this vendor
          // shouldn't (and per the backend guard, can't) send another quote.
          const quoteLocked = lead.hasActiveQuote || lead.requestClosed;

          return (
            <div key={lead._id} className="bg-white border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-gray-900">{lead.request?.services?.join(', ')} — {lead.request?.occasion || 'event'}</p>
                <span className="text-xs text-gray-400">{new Date(lead.request?.eventDate).toLocaleDateString('en-IN')}</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{lead.request?.description}</p>
              <div className="border-t border-gray-100 pt-3 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">Name</p>
                  <p className="font-semibold text-gray-800">{lead.request?.user?.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">Phone</p>
                  <p className="font-semibold text-gray-800">{lead.request?.user?.phone}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">Email</p>
                  <p className="font-semibold text-gray-800">{lead.request?.user?.email}</p>
                </div>
              </div>

              {quoteFormFor === lead._id ? (
                <div className="border-t border-gray-100 pt-3 mt-3 space-y-2">
                  {lineItems.map((li, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={li.name}
                        onChange={(e) => updateLineItem(i, 'name', e.target.value)}
                        placeholder="Item name (e.g. Full day photography)"
                        className="flex-1 border border-gray-300 px-2 py-1.5 text-xs"
                      />
                      <input
                        value={li.amount}
                        onChange={(e) => updateLineItem(i, 'amount', e.target.value)}
                        type="number"
                        placeholder="₹"
                        className="w-24 border border-gray-300 px-2 py-1.5 text-xs"
                      />
                      <button onClick={() => removeLineItem(i)} className="text-xs text-red-500">✕</button>
                    </div>
                  ))}
                  <button onClick={addLineItem} className="text-xs text-brand-red font-bold">+ Add item</button>

                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <input
                      value={travelCharge}
                      onChange={(e) => setTravelCharge(e.target.value)}
                      type="number"
                      placeholder="Travel charge"
                      className="border border-gray-300 px-2 py-1.5 text-xs"
                    />
                    <input
                      value={advancePercent}
                      onChange={(e) => setAdvancePercent(e.target.value)}
                      type="number"
                      placeholder="Advance %"
                      className="border border-gray-300 px-2 py-1.5 text-xs"
                    />
                    <input
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      type="date"
                      className="border border-gray-300 px-2 py-1.5 text-xs"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      disabled={submittingQuote}
                      onClick={() => handleSendQuote(lead._id)}
                      className="text-xs font-bold bg-brand-red text-white px-3 py-2 disabled:opacity-60"
                    >
                      {submittingQuote ? 'Sending...' : 'Send Quote'}
                    </button>
                    <button onClick={() => setQuoteFormFor(null)} className="text-xs font-bold border border-gray-300 px-3 py-2">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : quoteLocked ? (
                <span className="inline-block text-xs font-bold text-gray-400 border border-gray-200 px-3 py-1.5 mt-3">
                  {lead.requestClosed
                    ? 'Request closed'
                    : lead.quoteStatus === 'accepted'
                    ? 'Quote accepted'
                    : 'Quote sent — awaiting response'}
                </span>
              ) : (
                <button
                  onClick={() => setQuoteFormFor(lead._id)}
                  className="text-xs font-bold text-brand-red border border-brand-red px-3 py-1.5 mt-3"
                >
                  Send Quote
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VendorLeadsPage;
