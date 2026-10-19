// src/components/admin/VendorBookingsOverview.jsx
import { useEffect, useState } from 'react';
import { CircleDollarSign, Check } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import Spinner from '../ui/Spinner/Spinner';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import { formatPaise } from '../../utils/formatPrice';

const getPaymentBadge = (booking) => {
    if (booking.advancePaid && booking.balancePaid) {
        return { label: 'Fully paid', tone: 'success' };
    }
    if (booking.advancePaid && !booking.balancePaid) {
        return { label: 'Advance paid, balance pending', tone: 'warning' };
    }
    return { label: 'Not paid yet', tone: 'neutral' };
};

const PaidAmount = ({ amountPaise, paid }) => (
    <span className="inline-flex items-center justify-end gap-1">
        {formatPaise(amountPaise)}
        {paid && <Check size={14} className="text-green-700" aria-label="Paid" />}
    </span>
);

const VendorBookingsOverview = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminService.getAllVendorBookings().then(setBookings).finally(() => setLoading(false));
    }, []);

    return (
        <section>
            <h2 className="mb-3 flex items-center gap-2 font-heading text-xl font-bold text-night">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-marigold-soft text-night">
                    <CircleDollarSign size={16} />
                </span>
                Vendor bookings, payment overview
            </h2>

            {loading ? (
                <div className="flex justify-center py-10"><Spinner size="lg" /></div>
            ) : bookings.length === 0 ? (
                    <div className="card px-5 py-10 text-center text-sm text-ink/60">No vendor bookings yet.</div>
            ) : (
                        <div className="card overflow-x-auto">
                            <table className="w-full min-w-[640px] text-sm">
                        <thead>
                                    <tr className="border-b border-mist bg-moonlight text-left text-xs text-ink/60">
                                        <th scope="col" className="px-5 py-3 font-semibold">Vendor</th>
                                        <th scope="col" className="hidden px-5 py-3 font-semibold md:table-cell">Customer</th>
                                        <th scope="col" className="px-5 py-3 text-right font-semibold">Advance</th>
                                        <th scope="col" className="px-5 py-3 text-right font-semibold">Balance</th>
                                        <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                            </tr>
                        </thead>
                                <tbody className="divide-y divide-mist/70">
                            {bookings.map((b) => {
                                const badge = getPaymentBadge(b);
                                return (
                                    <tr key={b.id} className="transition-colors hover:bg-moonlight">
                                        <td className="px-5 py-4 font-semibold text-night">{b.vendor?.businessName || 'N/A'}</td>
                                        <td className="hidden px-5 py-4 text-ink/70 md:table-cell">
                                            {b.user?.name}
                                            {b.user?.email && <span className="block text-xs text-ink/50">{b.user.email}</span>}
                                        </td>
                                        <td className="px-5 py-4 text-right text-night">
                                            <PaidAmount amountPaise={b.advanceAmountPaise} paid={b.advancePaid} />
                                        </td>
                                        <td className="px-5 py-4 text-right text-night">
                                            <PaidAmount amountPaise={b.balanceAmountPaise} paid={b.balancePaid} />
                                        </td>
                                        <td className="px-5 py-4">
                                            <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
};

export default VendorBookingsOverview;