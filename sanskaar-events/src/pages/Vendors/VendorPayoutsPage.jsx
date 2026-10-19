import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner/Spinner';
import Input from '../../components/ui/Input/Input';
import { Select } from '../../components/ui/Input/Fields';
import StatusBadge from '../../components/ui/StatusBadge/StatusBadge';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { ROUTES } from '../../constants/routes';
import { formatPaise } from '../../utils/formatPrice';
import { vendorPayoutService } from '../../services/vendorPayout.service';

const STATUS_TONE = {
  pending: 'warning',
  processing: 'info',
  paid: 'success',
  failed: 'danger',
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

  const updateBank = (field, transform = (v) => v) => (e) =>
    setBankForm((prev) => ({ ...prev, [field]: transform(e.target.value) }));

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

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;
  }

  const totalNet = payouts.reduce((sum, p) => sum + p.netPayoutPaise, 0);
  const totalPaid = payouts.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.netPayoutPaise, 0);
  const totalPending = totalNet - totalPaid;

  return (
    <DashboardShell
      backTo={ROUTES.VENDOR_DASHBOARD}
      backLabel="Back to dashboard"
      title="Payouts"
      subtitle="Settlement statements for your completed bookings."
    >
      <div className="space-y-6">
        {/* Bank details */}
        <section className="card p-5">
          {!showBankForm ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-ink/80">
                <span className="font-semibold text-night">Payout bank account.</span> Add your bank details to receive payouts.
              </p>
              <button type="button" onClick={() => setShowBankForm(true)} className="btn-outline shrink-0 !py-2 text-sm">
                Add or update
              </button>
            </div>
          ) : (
              <form onSubmit={handleSaveBankDetails} className="space-y-4">
                <p className="font-heading font-bold text-night">Bank details for payouts</p>
                <Input label="Account holder name" required value={bankForm.bankAccountName} onChange={updateBank('bankAccountName')} />
                <Input label="Account number" required inputMode="numeric" value={bankForm.bankAccountNumber} onChange={updateBank('bankAccountNumber')} />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input label="IFSC" required value={bankForm.ifsc} onChange={updateBank('ifsc', (v) => v.toUpperCase())} />
                  <Select label="Account type" value={bankForm.accountType} onChange={updateBank('accountType')}>
                  <option value="savings">Savings</option>
                  <option value="current">Current</option>
                  </Select>
              </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={savingBank} className="btn-brand text-sm disabled:opacity-60">
                  {savingBank ? 'Saving...' : 'Save'}
                </button>
                  <button type="button" onClick={() => setShowBankForm(false)} className="btn-outline text-sm">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-5">
            <p className="text-sm text-ink/60">Received</p>
            <p className="font-heading text-2xl font-extrabold text-green-700">{formatPaise(totalPaid)}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-ink/60">Pending</p>
            <p className="font-heading text-2xl font-extrabold text-amber-700">{formatPaise(totalPending)}</p>
          </div>
        </div>

        {payouts.length === 0 ? (
          <div className="card px-6 py-12 text-center">
            <p className="font-heading text-lg font-semibold text-night">No payouts yet</p>
            <p className="mt-1 text-sm text-ink/60">
              A settlement appears here once a customer has paid both the advance and the balance on a booking.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {payouts.map((p) => (
              <li key={p._id} className="ticket">
                <div className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-ink/60">
                      {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <StatusBadge tone={STATUS_TONE[p.status] || 'neutral'}>{p.status}</StatusBadge>
                  </div>

                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between gap-4 text-night">
                      <dt>Gross booking value</dt>
                      <dd className="font-semibold">{formatPaise(p.grossAmountPaise)}</dd>
                    </div>
                    <div className="flex justify-between gap-4 text-ink/60">
                      <dt>Platform commission ({p.commissionPercent}%)</dt>
                      <dd>− {formatPaise(p.commissionPaise)}</dd>
                    </div>
                    <div className="flex justify-between gap-4 text-ink/60">
                      <dt>Payment gateway charge ({p.pgcPercent}%)</dt>
                      <dd>− {formatPaise(p.pgcPaise)}</dd>
                    </div>
                    <div className="flex justify-between gap-4 text-ink/60">
                      <dt>GST on commission ({p.gstOnCommissionPercent}%)</dt>
                      <dd>− {formatPaise(p.gstOnCommissionPaise)}</dd>
                    </div>
                  </dl>
                </div>

                <div className="ticket-perf" />

                <div className="flex flex-wrap items-center justify-between gap-2 p-5">
                  <div>
                    <p className="text-xs text-ink/60">Net payout</p>
                    <p className="font-heading text-2xl font-extrabold text-night">{formatPaise(p.netPayoutPaise)}</p>
                  </div>
                  {p.status === 'paid' && p.bankRef && (
                    <p className="text-sm text-ink/60">UTR <span className="font-mono">{p.bankRef}</span></p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
};

export default VendorPayoutsPage;