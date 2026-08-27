const asyncHandler = require('express-async-handler');
const Vendor = require('../models/Vendor');
const VendorBooking = require('../models/VendorBooking');

// Valid forward transitions a vendor can make from the dashboard.
// (Payments flipping advancePaid/balancePaid happen separately, via the
// payment integration — not part of this status machine.)
const ALLOWED_TRANSITIONS = {
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

// @route GET /api/v1/vendors/me/bookings
// @query status=confirmed|in_progress|completed|cancelled (optional)
const getMyVendorBookings = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) {
    res.status(404);
    throw new Error('No vendor profile found for this account.');
  }

  const filter = { vendor: vendor._id };
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const bookings = await VendorBooking.find(filter)
    .populate({
      path: 'request',
      select: 'reference services occasion eventDate cityId description',
    })
    .populate('user', 'name phone email')
    .populate('quote', 'lineItems travelCharge advancePercent')
    .sort({ createdAt: -1 });

  res.status(200).json({ results: bookings, total: bookings.length });
});

// @route PATCH /api/v1/vendors/me/bookings/:id/status
const updateVendorBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status) {
    res.status(400);
    throw new Error('status is required.');
  }

  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) {
    res.status(404);
    throw new Error('No vendor profile found for this account.');
  }

  const booking = await VendorBooking.findById(req.params.id);
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found.');
  }

  if (booking.vendor.toString() !== vendor._id.toString()) {
    res.status(403);
    throw new Error('You can only update your own bookings.');
  }

  const allowedNext = ALLOWED_TRANSITIONS[booking.status] || [];
  if (!allowedNext.includes(status)) {
    res.status(400);
    throw new Error(`Cannot move a "${booking.status}" booking to "${status}".`);
  }

  booking.status = status;
  await booking.save();

  res.status(200).json(booking);
});

// @route GET /api/v1/vendor-bookings/by-quote/:quoteId
// Lets the customer who accepted a quote find the VendorBooking it created —
// acceptQuote's response already returns this, but once that moment has
// passed (page refresh, testing, etc.) there was no way to look it back up.
const getBookingByQuote = asyncHandler(async (req, res) => {
  const booking = await VendorBooking.findOne({ quote: req.params.quoteId });
  if (!booking) {
    res.status(404);
    throw new Error('No booking found for this quote.');
  }

  if (booking.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You can only view your own bookings.');
  }

  res.status(200).json(booking);
});

module.exports = { getMyVendorBookings, updateVendorBookingStatus, getBookingByQuote };