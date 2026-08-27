const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const VendorBooking = require('../models/VendorBooking');
const { settleBookingPayout } = require('./vendorPayout.controller');

// Shared loader — every payment endpoint below needs the same booking +
// ownership check, so it's factored out instead of repeated four times.
const getOwnedBooking = async (req) => {
  const booking = await VendorBooking.findById(req.params.id);
  if (!booking) {
    const err = new Error('Vendor booking not found.');
    err.statusCode = 404;
    throw err;
  }
  if (booking.user.toString() !== req.user._id.toString()) {
    const err = new Error('You can only pay for your own bookings.');
    err.statusCode = 403;
    throw err;
  }
  return booking;
};

// @route POST /api/v1/vendor-bookings/:id/advance/order
const createAdvanceOrder = asyncHandler(async (req, res) => {
  const booking = await getOwnedBooking(req).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  if (booking.advancePaid) {
    res.status(400);
    throw new Error('Advance has already been paid for this booking.');
  }

  const order = await razorpay.orders.create({
    amount: booking.advanceAmountPaise, // already in paise, unlike Booking.totalAmount which is rupees
    currency: 'INR',
    receipt: `vb-adv-${booking._id}`,
  });

  booking.advanceRazorpayOrderId = order.id;
  await booking.save();

  res.status(200).json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
});

// @route POST /api/v1/vendor-bookings/:id/advance/verify
// const verifyAdvancePayment = asyncHandler(async (req, res) => {
//   const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
//   if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//     res.status(400);
//     throw new Error('razorpay_order_id, razorpay_payment_id and razorpay_signature are required.');
//   }

//   const booking = await getOwnedBooking(req).catch((err) => {
//     res.status(err.statusCode || 500);
//     throw err;
//   });

//   if (booking.advanceRazorpayOrderId !== razorpay_order_id) {
//     res.status(400);
//     throw new Error('Order id does not match this booking.');
//   }

//   const expectedSignature = crypto
//     .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
//     .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//     .digest('hex');

//   if (expectedSignature !== razorpay_signature) {
//     res.status(400);
//     throw new Error('Payment verification failed — signature mismatch.');
//   }

//     booking.balancePaid = true;
//   booking.balanceRazorpayPaymentId = razorpay_payment_id;
//   await booking.save();

//   await settleBookingPayout(booking);

//   res.status(200).json(booking);
// });

// @route POST /api/v1/vendor-bookings/:id/advance/verify
const verifyAdvancePayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400);
    throw new Error(
      'razorpay_order_id, razorpay_payment_id and razorpay_signature are required.'
    );
  }

  const booking = await getOwnedBooking(req).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  if (booking.advanceRazorpayOrderId !== razorpay_order_id) {
    res.status(400);
    throw new Error('Order id does not match this booking.');
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    res.status(400);
    throw new Error('Payment verification failed — signature mismatch.');
  }

  // ✅ Mark ADVANCE as paid
  booking.advancePaid = true;
  booking.advanceRazorpayPaymentId = razorpay_payment_id;

  await booking.save();

  await settleBookingPayout(booking);

  res.status(200).json(booking);
});

// @route POST /api/v1/vendor-bookings/:id/balance/order
const createBalanceOrder = asyncHandler(async (req, res) => {
  const booking = await getOwnedBooking(req).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  if (!booking.advancePaid) {
    res.status(400);
    throw new Error('Pay the advance before paying the balance.');
  }
  if (booking.balancePaid) {
    res.status(400);
    throw new Error('Balance has already been paid for this booking.');
  }
  if (booking.balanceAmountPaise <= 0) {
    res.status(400);
    throw new Error('There is no balance due on this booking.');
  }

  const order = await razorpay.orders.create({
    amount: booking.balanceAmountPaise,
    currency: 'INR',
    receipt: `vb-bal-${booking._id}`,
  });

  booking.balanceRazorpayOrderId = order.id;
  await booking.save();

  res.status(200).json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
});

// @route POST /api/v1/vendor-bookings/:id/balance/verify
const verifyBalancePayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400);
    throw new Error('razorpay_order_id, razorpay_payment_id and razorpay_signature are required.');
  }

  const booking = await getOwnedBooking(req).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  if (booking.balanceRazorpayOrderId !== razorpay_order_id) {
    res.status(400);
    throw new Error('Order id does not match this booking.');
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    res.status(400);
    throw new Error('Payment verification failed — signature mismatch.');
  }

  booking.balancePaid = true;
  booking.balanceRazorpayPaymentId = razorpay_payment_id;
  await booking.save();

  res.status(200).json(booking);
});

module.exports = { createAdvanceOrder, verifyAdvancePayment, createBalanceOrder, verifyBalancePayment };