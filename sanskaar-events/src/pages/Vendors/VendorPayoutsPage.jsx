import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import Spinner from '../../components/ui/Spinner/Spinner';
import { ROUTES } from '../../constants/routes';
import { formatPaise } from '../../utils/formatPrice';
import { vendorPayoutService } from '../../services/vendorPayout.service';
import toast from 'react-hot-toast'

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  paid: 'bg-green-50 text-green-700 border-green-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
};

const VendorPayoutsPage = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
    const [showBankForm, setShowBankForm] = useState(false);
  const [bankForm, setBankForm] = useState({ bankAccountName: '', bankAccountNumber: '', ifsc: '', accountType: 'savings' });
  const [savingBank, setSavingBank] = useState(false);

  useEffect(() => {
    vendorPayoutService
      .getMyPayouts()
      .then((res) => setPayouts(res.data.results || []))
      .finally(() => setLoading(false));
  }, []);

    const handleSaveBankDetails = async (e) => {
    e.preventDefault();
    setSavingBank(true);
    try {
      await vendorPayoutService.updateBankDetails(bankForm);
      toast.success('Bank details saved.');
      setShowBankForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save bank details.');
    }
    setSavingBank(false);
  };

  if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><Spinner size="lg" /></div>;

  const totalNet = payouts.reduce((sum, p) => sum + p.netPayoutPaise, 0);
  const totalPaid = payouts.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.netPayoutPaise, 0);
  const totalPending = totalNet - totalPaid;

  return (
    <div className="bg-[#f5f5f4] min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-3">
          <Link to={ROUTES.VENDOR_DASHBOARD} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
            <ChevronLeft size={15} /> Back to dashboard
          </Link>
        </div>
        <div className="max-w-3xl mx-auto px-6 pb-5">
          <h1 className="font-black text-2xl text-gray-900">Payouts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Settlement statements for your completed bookings</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">

                {/* Bank details */}
        <div className="bg-white border border-gray-200 p-4 mb-6">
          {!showBankForm ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Payout bank account: <span className="font-bold text-gray-900">Add your bank details</span> to receive payouts.
              </p>
              <button
                onClick={() => setShowBankForm(true)}
                className="text-xs font-bold text-brand-red border border-brand-red px-3 py-1.5 shrink-0"
              >
                Add / Update
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveBankDetails} className="space-y-2">
              <p className="text-xs font-bold text-gray-700 mb-1">Bank details for payouts</p>
              <input
                value={bankForm.bankAccountName}
                onChange={(e) => setBankForm((prev) => ({ ...prev, bankAccountName: e.target.value }))}
                placeholder="Account holder name"
                className="w-full border border-gray-300 px-3 py-2 text-sm"
                required
              />
              <input
                value={bankForm.bankAccountNumber}
                onChange={(e) => setBankForm((prev) => ({ ...prev, bankAccountNumber: e.target.value }))}
                placeholder="Account number"
                className="w-full border border-gray-300 px-3 py-2 text-sm"
                required
              />
              <div className="flex gap-2">
                <input
                  value={bankForm.ifsc}
                  onChange={(e) => setBankForm((prev) => ({ ...prev, ifsc: e.target.value.toUpperCase() }))}
                  placeholder="IFSC"
                  className="flex-1 border border-gray-300 px-3 py-2 text-sm"
                  required
                />
                <select
                  value={bankForm.accountType}
                  onChange={(e) => setBankForm((prev) => ({ ...prev, accountType: e.target.value }))}
                  className="border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="savings">Savings</option>
                  <option value="current">Current</option>
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={savingBank}
                  className="text-xs font-bold bg-brand-red hover:bg-brand-red-hover text-white px-3 py-2 disabled:opacity-60"
                >
                  {savingBank ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBankForm(false)}
                  className="text-xs font-bold border border-gray-300 px-3 py-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>


        {/* Summary strip */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white border border-gray-200 p-4">
            <p className="text-[10px] font-bold uppercase text-gray-400">Received</p>
            <p className="text-xl font-black text-green-600">{formatPaise(totalPaid)}</p>
          </div>
          <div className="bg-white border border-gray-200 p-4">
            <p className="text-[10px] font-bold uppercase text-gray-400">Pending</p>
            <p className="text-xl font-black text-amber-600">{formatPaise(totalPending)}</p>
          </div>
        </div>

        {payouts.length === 0 && (
          <p className="text-sm text-gray-500">
            No payouts yet. A settlement appears here once a customer has paid both the advance and the balance on a booking.
          </p>
        )}

        <div className="space-y-3">
          {payouts.map((p) => (
            <div key={p._id} className="bg-white border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString('en-IN')}</p>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 border ${STATUS_STYLES[p.status]}`}>
                  {p.status}
                </span>
              </div>

              <div className="space-y-1 text-sm text-gray-600 border-b border-gray-100 pb-3 mb-3">
                <div className="flex justify-between">
                  <span>Gross booking value</span>
                  <span>{formatPaise(p.grossAmountPaise)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Platform commission ({p.commissionPercent}%)</span>
                  <span>− {formatPaise(p.commissionPaise)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Payment gateway charge ({p.pgcPercent}%)</span>
                  <span>− {formatPaise(p.pgcPaise)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>GST on commission ({p.gstOnCommissionPercent}%)</span>
                  <span>− {formatPaise(p.gstOnCommissionPaise)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="font-black text-gray-900">Net payout: {formatPaise(p.netPayoutPaise)}</p>
                {p.status === 'paid' && p.bankRef && (
                  <p className="text-xs text-gray-400">UTR: {p.bankRef}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VendorPayoutsPage;
