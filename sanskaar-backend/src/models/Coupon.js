const mongoose = require('mongoose');

// A coupon is a redeemable credit. Two shapes:
// 1. Auto-generated, per-user (owner set, maxUses=1) — booking_reward, referral_bonus, loyalty
// 2. Admin-created, public/shareable (owner=null, maxUses configurable) — admin_manual
const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = public, usable by any user
    targetRole: { type: String, enum: ['user', 'organizer', 'vendor', null], default: null }, // null = no role restriction
    type: {
      type: String,
      enum: ['booking_reward', 'referral_bonus', 'loyalty', 'admin_manual'],
      required: true,
    },
    valuePaise: { type: Number, required: true },
    status: { type: String, enum: ['active', 'used', 'expired'], default: 'active' },
    sourceBooking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    usedOnBooking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null }, // most recent redemption
    expiresAt: { type: Date, default: null },
    maxUses: { type: Number, default: 1 }, // total redemptions allowed across all users
    usedCount: { type: Number, default: 0 },
    redeemedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // prevents the same user reusing a public coupon
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // admin who created it (admin_manual only)
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);