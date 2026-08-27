const asyncHandler = require('express-async-handler');
const Vendor = require('../models/Vendor');
const VendorPayout = require('../models/VendorPayout');
const { PAYMENT_GATEWAY_CHARGE_PERCENT, GST_PERCENT_ON_COMMISSION } = require('../config/platformFinance');

// Called from vendorPayment.controller.js right after balance is verified paid.
const settleBookingPayout = async (booking) => {
  const existing = await VendorPayout.findOne({ booking: booking._id });
  if (existing) return existing;

  const vendor = await Vendor.findById(booking.vendor);
  const gross = booking.totalAmountPaise;

  const commissionPercent = vendor.commissionPercent;
  const commissionPaise = Math.round((gross * commissionPercent) / 100);

  const pgcPercent = PAYMENT_GATEWAY_CHARGE_PERCENT;
  const pgcPaise = Math.round((gross * pgcPercent) / 100);

  const gstPercent = GST_PERCENT_ON_COMMISSION;
  const gstOnCommissionPaise = Math.round((commissionPaise * gstPercent) / 100);

  const netPayoutPaise = gross - commissionPaise - pgcPaise - gstOnCommissionPaise;

  return VendorPayout.create({
    vendor: vendor._id,
    booking: booking._id,
    grossAmountPaise: gross,
    commissionPercent,
    commissionPaise,
    pgcPercent,
    pgcPaise,
    gstOnCommissionPercent: gstPercent,
    gstOnCommissionPaise,
    netPayoutPaise,
  });
};

// @route GET /api/v1/vendors/me/payouts
const getMyPayouts = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) {
    res.status(404);
    throw new Error('No vendor profile found for this account.');
  }

  const payouts = await VendorPayout.find({ vendor: vendor._id })
    .populate({ path: 'booking', select: 'request quote totalAmountPaise' })
    .sort({ createdAt: -1 });

  res.status(200).json({ results: payouts });
});

// @route GET /api/v1/admin/vendor-payouts
const getAllPayouts = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const payouts = await VendorPayout.find(filter)
    .populate({ path: 'vendor', select: 'businessName bankAccountName bankAccountNumber ifsc accountType' })
    .populate({ path: 'booking', select: 'totalAmountPaise' })
    .sort({ createdAt: -1 });

  res.status(200).json({ results: payouts });
});

// @route PATCH /api/v1/admin/vendor-payouts/:id/mark-paid
const markPayoutPaid = asyncHandler(async (req, res) => {
  const { bankRef } = req.body;
  if (!bankRef || !bankRef.trim()) {
    res.status(400);
    throw new Error('bankRef (UTR) is required to mark a payout as paid.');
  }

  const payout = await VendorPayout.findById(req.params.id);
  if (!payout) {
    res.status(404);
    throw new Error('Payout not found.');
  }
  if (payout.status === 'paid') {
    res.status(400);
    throw new Error('This payout is already marked paid.');
  }

  payout.status = 'paid';
  payout.bankRef = bankRef.trim();
  payout.paidAt = new Date();
  payout.paidBy = req.user._id;
  await payout.save();

  res.status(200).json(payout);
});

module.exports = { settleBookingPayout, getMyPayouts, getAllPayouts, markPayoutPaid };