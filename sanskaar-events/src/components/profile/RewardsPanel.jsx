
import { Wallet, Gift, Share2, Award, Copy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { rewardsService } from '../../services/rewards.service';


const RewardsPanel = ({ user, bookingCount = 0 }) => {
  const [copied, setCopied] = useState(false);
  const [coupons, setCoupons] = useState([]);

  const walletBalancePaise = user?.walletBalancePaise ?? 0;

  useEffect(() => {
    if (!user) return;
    rewardsService.getMyCoupons()
      .then((res) => setCoupons(res.data.results || []))
      .catch(() => setCoupons([]));
  }, [user]);
  const LOYALTY_THRESHOLD = 3;
  const loyaltyUnlocked = bookingCount >= LOYALTY_THRESHOLD;

  const referralLink = user
    ? `${window.location.origin}/signup?ref=${user._id}`
    : '';

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Wallet */}
      <div className="bg-white border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-1">
          <Wallet size={16} className="text-brand-red" />
          <p className="text-xs font-bold uppercase text-gray-500">Wallet Balance</p>
        </div>
        <p className="font-black text-2xl text-gray-900">
          ₹{(walletBalancePaise / 100).toLocaleString('en-IN')}
        </p>
        <p className="text-xs text-gray-400 mt-1">Apply at checkout on your next booking</p>
      </div>

      {/* Loyalty progress */}
      <div className="bg-white border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Award size={16} className="text-brand-red" />
          <p className="text-xs font-bold uppercase text-gray-500">Loyalty</p>
        </div>
        {loyaltyUnlocked ? (
          <p className="text-sm font-bold text-green-600">🎉 Loyalty discount unlocked!</p>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-2">
              {bookingCount}/{LOYALTY_THRESHOLD} bookings — {LOYALTY_THRESHOLD - bookingCount} more to unlock a discount
            </p>
            <div className="w-full bg-gray-100 h-1.5">
              <div
                className="bg-brand-red h-1.5 transition-all"
                style={{ width: `${Math.min((bookingCount / LOYALTY_THRESHOLD) * 100, 100)}%` }}
              />
            </div>
          </>
        )}
      </div>

      {/* Referral */}
      <div className="bg-white border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Share2 size={16} className="text-brand-red" />
          <p className="text-xs font-bold uppercase text-gray-500">Invite & Earn</p>
        </div>
        <p className="text-xs text-gray-500 mb-3">Share your link — earn a cash coupon when they book</p>
        <div className="flex gap-2">
          <input
            readOnly
            value={referralLink}
            className="flex-1 border border-gray-300 px-2 py-1.5 text-xs text-gray-500 bg-gray-50 truncate"
          />
          <button
            onClick={handleCopyReferral}
            className="shrink-0 border border-gray-300 px-2.5 hover:border-gray-500 transition-colors"
          >
            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-gray-500" />}
          </button>
        </div>
      </div>

      {/* Coupons */}
      <div className="bg-white border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Gift size={16} className="text-brand-red" />
          <p className="text-xs font-bold uppercase text-gray-500">My Coupons</p>
        </div>
        {coupons.length === 0 ? (
          <p className="text-xs text-gray-400">No coupons yet — you'll get one after your next booking.</p>
        ) : (
          <div className="space-y-2">
            {coupons.map((c) => (
              <div
                key={c._id}
                className={`border border-dashed px-3 py-2 flex items-center justify-between ${c.status === 'used' ? 'border-gray-200 opacity-50' : 'border-gray-300'
                  }`}
              >
                <span className="font-mono text-xs font-bold text-gray-700">{c.code}</span>
                <span className="text-xs text-gray-500">
                  ₹{(c.valuePaise / 100).toLocaleString('en-IN')}
                  {c.status === 'used' ? ' · used' : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardsPanel;