// src/components/admin/CouponManager.jsx
import { useEffect, useState } from 'react';
import { Ticket, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/admin.service';
import Spinner from '../ui/Spinner/Spinner';

const CouponManager = () => {
    const [coupons, setCoupons] = useState([]);
    const [couponsLoading, setCouponsLoading] = useState(true);
    const [couponForm, setCouponForm] = useState({
        code: '',
        valueRupees: '',
        maxUses: '',
        expiresAt: '',
        targetType: 'public', // 'public' | 'role' | 'email'
        targetRole: 'user',
        userEmail: '',
    });
    const [creatingCoupon, setCreatingCoupon] = useState(false);

    const loadCoupons = () => {
        setCouponsLoading(true);
        adminService.getManualCoupons().then(setCoupons).finally(() => setCouponsLoading(false));
    };

    useEffect(() => {
        loadCoupons();
    }, []);

    const handleCreateCoupon = async (e) => {
        e.preventDefault();
        const { code, valueRupees, maxUses, expiresAt, targetType, targetRole, userEmail } = couponForm;

        if (!code.trim() || !valueRupees || Number(valueRupees) <= 0) {
            toast.error('Code aur valid value zaroori hai');
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
            setCouponForm({ code: '', valueRupees: '', maxUses: '', expiresAt: '', targetType: 'public', targetRole: 'user', userEmail: '' });
            loadCoupons();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Coupon create nahi ho paya');
        } finally {
            setCreatingCoupon(false);
        }
    };

    return (
        <section>
            <h2 className="font-black text-lg text-gray-900 mb-4 flex items-center gap-2">
                <Ticket size={18} className="text-brand-red" /> Coupon Management
            </h2>

            {/* Create form */}
            <form onSubmit={handleCreateCoupon} className="bg-white border border-gray-200 p-5 mb-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Code</label>
                        <input
                            value={couponForm.code}
                            onChange={(e) => setCouponForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                            placeholder="DIWALI50"
                            className="w-full border border-gray-300 px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-brand-red"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Value (₹)</label>
                        <input
                            type="number"
                            min="1"
                            value={couponForm.valueRupees}
                            onChange={(e) => setCouponForm((f) => ({ ...f, valueRupees: e.target.value }))}
                            placeholder="50"
                            className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Expiry (optional)</label>
                        <input
                            type="date"
                            value={couponForm.expiresAt}
                            onChange={(e) => setCouponForm((f) => ({ ...f, expiresAt: e.target.value }))}
                            className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red"
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Who can use this?</label>
                    <div className="flex gap-2">
                        {[
                            { key: 'public', label: 'Everyone' },
                            { key: 'role', label: 'By Role' },
                            { key: 'email', label: 'Specific Email' },
                        ].map((opt) => (
                            <button
                                key={opt.key}
                                type="button"
                                onClick={() => setCouponForm((f) => ({ ...f, targetType: opt.key }))}
                                className={`px-4 py-2 text-xs font-bold border transition-colors ${couponForm.targetType === opt.key
                                    ? 'bg-black text-white border-black'
                                    : 'border-gray-300 text-gray-600 hover:border-gray-500'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    {couponForm.targetType === 'role' && (
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Role</label>
                            <select
                                value={couponForm.targetRole}
                                onChange={(e) => setCouponForm((f) => ({ ...f, targetRole: e.target.value }))}
                                className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red"
                            >
                                <option value="user">User</option>
                                <option value="organizer">Organizer</option>
                                <option value="vendor">Vendor</option>
                            </select>
                        </div>
                    )}
                    {couponForm.targetType === 'email' && (
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">User Email</label>
                            <input
                                type="email"
                                value={couponForm.userEmail}
                                onChange={(e) => setCouponForm((f) => ({ ...f, userEmail: e.target.value }))}
                                placeholder="user@example.com"
                                className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red"
                            />
                        </div>
                    )}
                    {couponForm.targetType === 'public' && (
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Max Uses (optional)</label>
                            <input
                                type="number"
                                min="1"
                                value={couponForm.maxUses}
                                onChange={(e) => setCouponForm((f) => ({ ...f, maxUses: e.target.value }))}
                                placeholder="100"
                                className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red"
                            />
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={creatingCoupon}
                    className="inline-flex items-center gap-1.5 bg-brand-red hover:bg-brand-red-hover text-white font-bold text-sm px-5 py-2.5 disabled:opacity-60 transition-colors"
                >
                    <Plus size={14} /> {creatingCoupon ? 'Creating...' : 'Create Coupon'}
                </button>
            </form>


            {/* List */}
            {couponsLoading ? (
                <div className="flex justify-center py-10"><Spinner size="lg" /></div>
            ) : coupons.length === 0 ? (
                <p className="text-sm text-gray-500 bg-white border border-gray-200 p-5">No manual coupons yet.</p>
            ) : (
                <div className="max-h-[420px] overflow-y-auto pr-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {coupons.map((c) => {
                            const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
                            const isExhausted = c.usedCount >= c.maxUses;
                            return (
                                <div key={c.id} className="bg-white border border-gray-200 p-3.5">
                                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                        <span className="font-mono font-bold text-sm text-gray-900">{c.code}</span>
                                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-gray-100 text-gray-600">
                                            ₹{(c.valuePaise / 100).toLocaleString('en-IN')}
                                        </span>
                                        {isExpired && <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-red-100 text-red-600">Expired</span>}
                                        {!isExpired && isExhausted && <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-gray-200 text-gray-500">Exhausted</span>}
                                        {!isExpired && !isExhausted && <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-green-100 text-green-700">Active</span>}
                                    </div>
                                    <p className="text-xs text-gray-500 leading-snug">
                                        {c.owner ? 'Specific user' : c.targetRole ? `Only ${c.targetRole}` : 'Public'}
                                        {' · '}{c.usedCount}/{c.maxUses} used
                                        {c.expiresAt && <><br />expires {new Date(c.expiresAt).toLocaleDateString('en-IN')}</>}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    );
};

export default CouponManager;