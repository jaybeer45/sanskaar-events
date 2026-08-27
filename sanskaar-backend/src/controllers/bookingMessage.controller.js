const asyncHandler = require('express-async-handler');
const VendorBooking = require('../models/VendorBooking');
const Vendor = require('../models/Vendor');
const BookingMessage = require('../models/BookingMessage');

// Shared by every endpoint below: loads the booking and works out whether
// the requesting user is the customer or the vendor on it — or neither, in
// which case this thread isn't theirs to read or write to.
const resolveParticipant = async (req) => {
  const booking = await VendorBooking.findById(req.params.id);
  if (!booking) {
    const err = new Error('Booking not found.');
    err.statusCode = 404;
    throw err;
  }

  if (booking.user.toString() === req.user._id.toString()) {
    return { booking, role: 'customer' };
  }

  const vendor = await Vendor.findOne({ user: req.user._id });
  if (vendor && booking.vendor.toString() === vendor._id.toString()) {
    return { booking, role: 'vendor' };
  }

  const err = new Error('You are not part of this booking.');
  err.statusCode = 403;
  throw err;
};

// @route GET /api/v1/vendor-bookings/:id/messages
const getMessages = asyncHandler(async (req, res) => {
  const { booking, role } = await resolveParticipant(req).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  const messages = await BookingMessage.find({ booking: booking._id })
    .sort({ createdAt: 1 })
    .populate({ path: 'sender', select: 'fullName' });

  // Mark the other party's messages as read now that this participant has
  // opened the thread — cheap read-receipt without a separate endpoint.
  await BookingMessage.updateMany(
    { booking: booking._id, senderRole: { $ne: role }, readAt: null },
    { $set: { readAt: new Date() } }
  );

  res.status(200).json({ results: messages, yourRole: role });
});

// @route POST /api/v1/vendor-bookings/:id/messages
const sendMessage = asyncHandler(async (req, res) => {
  const { text, attachmentUrl } = req.body;
  if ((!text || !text.trim()) && !attachmentUrl) {
    res.status(400);
    throw new Error('Message text or an attachment is required.');
  }

  const { booking, role } = await resolveParticipant(req).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  const message = await BookingMessage.create({
    booking: booking._id,
    sender: req.user._id,
    senderRole: role,
    text: text ? text.trim() : '',
    attachmentUrl: attachmentUrl || '',
  });

  res.status(201).json(message);
});

module.exports = { getMessages, sendMessage, resolveParticipant };