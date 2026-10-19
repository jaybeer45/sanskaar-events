// src/components/profile/RewardsPanel.jsx
import { Wallet, Gift, Share2, Award, Copy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { rewardsService } from '../../services/rewards.service';

const LOYALTY_THRESHOLD = 3;

const PanelCard = ({ icon: Icon, title, children }) => (
  <section className="card p-5">
    <div className="mb-3 flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-marigold-soft text-night">
        <Icon size={16} />
      </span>
      <h3 className="font-heading text-base font-bold text-night">{title}</h3>
    </div>
    {children}
  </section>
);

const RewardsPanel = ({ user, bookingCount = 0 }) => {
  const [copied, setCopied] = useState(false);
  const [coupons, setCoupons] = useState([]);

  const walletBalancePaise = user?.walletBalancePaise ?? 0;
  const loyaltyUnlocked = bookingCount >= LOYALTY_THRESHOLD;
  const referralLink = user ? `${window.location.origin}/signup?ref=${user._id}` : '';

  useEffect(() => {
    if (!user) return;
    rewardsService
      .getMyCoupons()
      .then((res) => setCoupons(res.data.results || []))
      .catch(() => setCoupons([]));
  }, [user]);

  const handleCopyReferral = () => {
    navigator.clipboard?.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <PanelCard icon={Wallet} title="Wallet balance">
        <p className="font-heading text-3xl font-extrabold text-night">
          ₹{(walletBalancePaise / 100).toLocaleString('en-IN')}
        </p>
        <p className="mt-1 text-sm text-ink/60">Apply it at checkout on your next booking.</p>
      </PanelCard>

      <PanelCard icon={Award} title="Loyalty">
        {loyaltyUnlocked ? (
          <p className="text-sm font-semibold text-green-700">Loyalty discount unlocked</p>
        ) : (
          <>
              <p className="mb-2 text-sm text-ink/80">
                {bookingCount} of {LOYALTY_THRESHOLD} bookings. {LOYALTY_THRESHOLD - bookingCount} more to unlock a discount.
            </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-mist/70">
              <div
                  className="h-full rounded-full bg-marigold transition-all"
                style={{ width: `${Math.min((bookingCount / LOYALTY_THRESHOLD) * 100, 100)}%` }}
              />
            </div>
          </>
        )}
      </PanelCard>

      <PanelCard icon={Share2} title="Invite and earn">
        <p className="mb-3 text-sm text-ink/60">Share your link and earn a cash coupon when they book.</p>
        <div className="flex gap-2">
          <input
            readOnly
            aria-label="Your referral link"
            value={referralLink}
            className="h-11 min-w-0 flex-1 truncate rounded-xl border border-mist bg-moonlight px-3 text-sm text-ink/70"
          />
          <button
            type="button"
            onClick={handleCopyReferral}
            aria-label={copied ? 'Link copied' : 'Copy referral link'}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-mist transition-colors hover:border-night"
          >
            {copied ? <Check size={16} className="text-green-700" /> : <Copy size={16} className="text-night/60" />}
          </button>
        </div>
      </PanelCard>

      <PanelCard icon={Gift} title="My coupons">
        {coupons.length === 0 ? (
          <p className="text-sm text-ink/60">No coupons yet. You'll get one after your next booking.</p>
        ) : (
            <ul className="space-y-2">
            {coupons.map((c) => (
              <li
                key={c._id}
                className={`flex items-center justify-between rounded-xl border-2 border-dashed px-3 py-2.5 ${c.status === 'used' ? 'border-mist opacity-50' : 'border-night/30'
                  }`}
              >
                <span className="font-mono text-sm font-bold text-night">{c.code}</span>
                <span className="text-sm text-ink/70">
                  ₹{(c.valuePaise / 100).toLocaleString('en-IN')}
                  {c.status === 'used' ? ' (used)' : ''}
                </span>
              </li>
            ))}
            </ul>
        )}
      </PanelCard>
    </div>
  );
};

export default RewardsPanel;