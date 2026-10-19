// src/components/admin/CouponManager.jsx
import { useEffect, useState } from 'react';
import { Ticket, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/admin.service';
import Spinner from '../ui/Spinner/Spinner';
import Input from '../ui/Input/Input';
import { Select } from '../ui/Input/Fields';
import StatusBadge from '../ui/StatusBadge/StatusBadge';

const EMPTY_FORM = {
    code: '',
    valueRupees: '',
    maxUses: '',
    expiresAt: '',
    targetType: 'public', // 'public' | 'role' | 'email'
    targetRole: 'user',
    userEmail: '',
};

const TARGET_OPTIONS = [
    { key: 'public', label: 'Everyone' },
    { key: 'role', label: 'By role' },
    { key: 'email', label: 'Specific email' },
];

const CouponManager = () => {
    const [coupons, setCoupons] = useState([]);
    const [couponsLoading, setCouponsLoading] = useState(true);
    const [couponForm, setCouponForm] = useState(EMPTY_FORM);
    const [creatingCoupon, setCreatingCoupon] = useState(false);

    const loadCoupons = () => {
        setCouponsLoading(true);
        adminService.getManualCoupons().then(setCoupons).finally(() => setCouponsLoading(false));
    };

    useEffect(() => {
        loadCoupons();
    }, []);

    const update = (field, transform = (v) => v) => (e) =>
        setCouponForm((f) => ({ ...f, [field]: transform(e.target.value) }));

    const handleCreateCoupon = async (e) => {
        e.preventDefault();
        const { code, valueRupees, maxUses, expiresAt, targetType, targetRole, userEmail } = couponForm;

        if (!code.trim() || !valueRupees || Number(valueRupees) <= 0) {
            toast.error('Enter a code and a valid value.');
            return;
        }

        const payload = {
            code: code.trim().toUpperCase(),
            valuePaise: Math.round(Number(valueRupees) * 100),
            maxUses: maxUses ? Number(maxUses) : undefined,
            expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        };
        if (targetType === 'role') payload.targetRole = targetRole;
        if (targetType === 'email') payload.userEmail = userEmail.trim();

        setCreatingCoupon(true);
        try {
            await adminService.createManualCoupon(payload);
            toast.success('Coupon created!');
            setCouponForm(EMPTY_FORM);
            loadCoupons();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not create the coupon.');
        } finally {
            setCreatingCoupon(false);
        }
    };

    return (
        <section>
            <h2 className="mb-3 flex items-center gap-2 font-heading text-xl font-bold text-night">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-marigold-soft text-night">
                    <Ticket size={16} />
                </span>
                Coupon management
            </h2>

            {/* Create form */}
            <form onSubmit={handleCreateCoupon} className="card mb-6 space-y-5 p-5 sm:p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Input
                        label="Code"
                        placeholder="DIWALI50"
                        className="font-mono"
                        value={couponForm.code}
                        onChange={update('code', (v) => v.toUpperCase())}
                    />
                    <Input
                        label="Value (₹)"
                        type="number"
                        min="1"
                        placeholder="50"
                        value={couponForm.valueRupees}
                        onChange={update('valueRupees')}
                    />
                    <Input
                        label="Expiry (optional)"
                        type="date"
                        value={couponForm.expiresAt}
                        onChange={update('expiresAt')}
                    />
                </div>

                <div>
                    <p className="mb-1.5 text-sm font-medium text-ink">Who can use this?</p>
                    <div role="group" aria-label="Who can use this coupon" className="flex flex-wrap gap-2">
                        {TARGET_OPTIONS.map((opt) => {
                            const active = couponForm.targetType === opt.key;
                            return (
                                <button
                                    key={opt.key}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => setCouponForm((f) => ({ ...f, targetType: opt.key }))}
                                    className={`h-10 rounded-pill px-4 text-sm font-medium transition-colors ${active ? 'bg-night text-white' : 'border border-mist bg-white text-ink/80 hover:border-night/40'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {couponForm.targetType === 'role' && (
                    <Select label="Role" value={couponForm.targetRole} onChange={update('targetRole')}>
                        <option value="user">User</option>
                        <option value="organizer">Organizer</option>
                        <option value="vendor">Vendor</option>
                    </Select>
                )}
                {couponForm.targetType === 'email' && (
                    <Input
                        label="User email"
                        type="email"
                        placeholder="user@example.com"
                        value={couponForm.userEmail}
                        onChange={update('userEmail')}
                    />
                )}
                {couponForm.targetType === 'public' && (
                    <Input
                        label="Max uses (optional)"
                        type="number"
                        min="1"
                        placeholder="100"
                        value={couponForm.maxUses}
                        onChange={update('maxUses')}
                    />
                )}

                <button
                    type="submit"
                    disabled={creatingCoupon}
                    className="btn-brand inline-flex items-center gap-1.5 text-sm disabled:opacity-60"
                >
                    <Plus size={15} /> {creatingCoupon ? 'Creating...' : 'Create coupon'}
                </button>
            </form>

            {/* List */}
            {couponsLoading ? (
                <div className="flex justify-center py-10"><Spinner size="lg" /></div>
            ) : coupons.length === 0 ? (
                    <div className="card px-5 py-10 text-center text-sm text-ink/60">No manual coupons yet.</div>
            ) : (
                        <ul className="grid max-h-[460px] grid-cols-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
                            {coupons.map((c) => {
                                const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
                        const isExhausted = c.maxUses && c.usedCount >= c.maxUses;
                        const status = isExpired
                            ? { label: 'Expired', tone: 'danger' }
                            : isExhausted
                                ? { label: 'Exhausted', tone: 'neutral' }
                                : { label: 'Active', tone: 'success' };

                        return (
                            <li key={c.id} className="rounded-2xl border-2 border-dashed border-night/25 bg-white p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <span className="font-mono text-base font-bold text-night">{c.code}</span>
                                    <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                                </div>
                                <p className="mt-1 font-heading text-2xl font-extrabold text-night">
                                    ₹{(c.valuePaise / 100).toLocaleString('en-IN')}
                                </p>
                                <p className="mt-2 text-sm leading-snug text-ink/60">
                                    {c.owner ? 'Specific user' : c.targetRole ? `Only ${c.targetRole}` : 'Public'}
                                    {', '}
                                    {c.maxUses ? `${c.usedCount}/${c.maxUses} used` : `${c.usedCount || 0} used`}
                                    {c.expiresAt && (
                                        <>
                                            <br />
                                            Expires {new Date(c.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </>
                                    )}
                                </p>
                            </li>
                        );
                    })}
                        </ul>
            )}
        </section>
    );
};

export default CouponManager;