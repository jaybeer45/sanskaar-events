// src/components/admin/VendorBookingsOverview.jsx
import { useEffect, useState } from 'react';
import { CircleDollarSign } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import Spinner from '../ui/Spinner/Spinner';
import { formatPaise } from '../../utils/formatPrice';

const getPaymentBadge = (booking) => {
    if (booking.advancePaid && booking.balancePaid) {
        return { label: 'Fully Paid', className: 'bg-green-100 text-green-700' };
    }
    if (booking.advancePaid && !booking.balancePaid) {
        return { label: 'Advance Paid — Balance Pending', className: 'bg-amber-100 text-amber-700' };
    }
    return { label: 'Not Paid Yet', className: 'bg-gray-100 text-gray-500' };
};

const VendorBookingsOverview = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminService.getAllVendorBookings().then(setBookings).finally(() => setLoading(false));
    }, []);

    return (
        <section>
            <h2 className="font-black text-lg text-gray-900 mb-4 flex items-center gap-2">
                <CircleDollarSign size={18} className="text-brand-red" /> Vendor Bookings — Payment Overview
            </h2>

            {loading ? (
                <div className="flex justify-center py-10"><Spinner size="lg" /></div>
            ) : bookings.length === 0 ? (
                <p className="text-sm text-gray-500 bg-white border border-gray-200 p-5">No vendor bookings yet.</p>
            ) : (
                <div className="bg-white border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-[#f5f5f4]">
                                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">Vendor</th>
                                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 hidden md:table-cell">Customer</th>
                                <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">Advance</th>
                                <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">Balance</th>
                                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {bookings.map((b) => {
                                const badge = getPaymentBadge(b);
                                return (
                                    <tr key={b.id} className="hover:bg-[#f5f5f4] transition-colors">
                                        <td className="px-5 py-4 font-bold text-gray-900">{b.vendor?.businessName || '—'}</td>
                                        <td className="px-5 py-4 text-gray-500 hidden md:table-cell">
                                            {b.user?.name} <span className="text-gray-400">· {b.user?.email}</span>
                                        </td>
                                        <td className="px-5 py-4 text-right text-gray-700">
                                            {formatPaise(b.advanceAmountPaise)}
                                            {b.advancePaid && <span className="text-green-600 text-xs ml-1">✓</span>}
                                        </td>
                                        <td className="px-5 py-4 text-right text-gray-700">
                                            {formatPaise(b.balanceAmountPaise)}
                                            {b.balancePaid && <span className="text-green-600 text-xs ml-1">✓</span>}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`text-[10px] font-bold uppercase px-2 py-1 ${badge.className}`}>
                                                {badge.label}
                                            </span>
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