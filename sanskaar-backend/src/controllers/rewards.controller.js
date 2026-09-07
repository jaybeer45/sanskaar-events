const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const Booking = require('../models/Booking')
const WalletTransaction = require('../models/WalletTransaction');

// Credits or debits a user's wallet and writes the matching ledger entry in
// one place — nothing else in the codebase should touch
// User.walletBalancePaise directly.
const adjustWallet = async (userId, amountPaise, type, reason, relatedBooking = null) => {
  const delta = type === 'credit' ? amountPaise : -amountPaise;
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { walletBalancePaise: delta } },
    { new: true }
  );
  await WalletTransaction.create({
    user: userId,
    type,
    amountPaise,
    reason,
    relatedBooking,
    balanceAfterPaise: user.walletBalancePaise,
  });
  return user.walletBalancePaise;
};

// @route GET /api/v1/users/me/wallet
const getMyWallet = asyncHandler(async (req, res) => {
  const transactions = await WalletTransaction.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.status(200).json({ balancePaise: req.user.walletBalancePaise, transactions });
});

// Placeholder values — confirm exact amounts with mentor before going live
// (PDF Section 8, open decisions #2 and #3)
const BOOKING_COUPON_VALUE_PAISE = 5000; // ₹50 per booking
const REFERRAL_BONUS_PAISE = 10000; // ₹100 to the referrer

const generateCouponCode = (prefix) =>
  `${prefix}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

// Called once a booking's paymentStatus becomes 'paid'. Awards the
// per-booking coupon, and — only on the user's very first paid booking —
// credits their referrer's wallet. Call this exactly once per booking,
// from the single place that flips it to 'paid' (createBooking's free
// path, or verifyRazorpayPayment) — it is not itself idempotent.
const LOYALTY_THRESHOLD = 3;
const LOYALTY_COUPON_VALUE_PAISE = 15000; // ₹150 

const awardBookingRewards = async (booking) => {
  await Coupon.create({
    code: generateCouponCode('BOOK'),
    owner: booking.user,
    type: 'booking_reward',
    valuePaise: BOOKING_COUPON_VALUE_PAISE,
    sourceBooking: booking._id,
  });

  // 2. Referral bonus — only on the referred user's first paid booking
  const user = await User.findById(booking.user);
  if (user?.referredBy && !user.referralRewardGiven) {
    const hasEarlierPaidBooking = await Booking.exists({
      user: user._id,
      paymentStatus: 'paid',
      _id: { $ne: booking._id },
    });
    if (!hasEarlierPaidBooking) {
      await adjustWallet(user.referredBy, REFERRAL_BONUS_PAISE, 'credit', 'referral_bonus', booking._id);
      user.referralRewardGiven = true;
      await user.save();
    }
  }

   const user2 = await User.findById(booking.user); // referral block already may have fetched `user` — reuse that variable if in scope
  if (user2 && !user2.loyaltyCouponIssued) {
    const paidBookingCount = await Booking.countDocuments({
      user: user2._id,
      paymentStatus: 'paid',
    });
    if (paidBookingCount >= LOYALTY_THRESHOLD) {
      await Coupon.create({
        code: generateCouponCode('LOYAL'),
        owner: user2._id,
        type: 'loyalty',
        valuePaise: LOYALTY_COUPON_VALUE_PAISE,
        sourceBooking: booking._id,
      });
      user2.loyaltyCouponIssued = true;
      await user2.save();
    }
  }
  
};

// @route GET /api/v1/users/me/coupons
const getMyCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({ owner: req.user._id })
    .sort({ createdAt: -1 });
  res.status(200).json({ results: coupons });
});


// Shared checker — used by both validateMyCoupon (preview) and createBooking
// (actual redemption). Throws a plain Error with a user-facing message;
// callers must catch and translate to the right HTTP status.
const checkCouponEligibility = async (code, user) => {
  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
  if (!coupon) throw new Error('Invalid coupon code.');

  // Owner-specific coupon (auto-generated, or admin-assigned via email)
  if (coupon.owner && String(coupon.owner) !== String(user._id)) {
    throw new Error('This coupon is not valid for your account.');
  }

  // Role-restricted coupon
  if (coupon.targetRole && !user.roles.includes(coupon.targetRole)) {
    throw new Error(`This coupon is only valid for ${coupon.targetRole} accounts.`);
  }

  // Already redeemed by this user
  if (coupon.redeemedBy.some((id) => String(id) === String(user._id))) {
    throw new Error('You have already used this coupon.');
  }

  // Usage limit exhausted
  if (coupon.usedCount >= coupon.maxUses) {
    throw new Error('This coupon has reached its usage limit.');
  }

  // Expired
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new Error('This coupon has expired.');
  }

  if (coupon.status === 'used') {
    throw new Error('This coupon is no longer active.');
  }

  return coupon;
};

const validateMyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) {
    res.status(400);
    throw new Error('Coupon code is required.');
  }

  let coupon;
  try {
    coupon = await checkCouponEligibility(code, req.user);
  } catch (err) {
    res.status(400);
    throw err;
  }

  res.status(200).json({
    success: true,
    coupon: {
      _id: coupon._id,
      code: coupon.code,
      type: coupon.type,
      valuePaise: coupon.valuePaise,
      expiresAt: coupon.expiresAt,
    },
  });
});

module.exports = { adjustWallet, getMyWallet , awardBookingRewards , getMyCoupons , validateMyCoupon , checkCouponEligibility};
