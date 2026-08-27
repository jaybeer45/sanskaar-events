const asyncHandler = require('express-async-handler');
const Dispute = require('../models/Dispute');
const { resolveParticipant } = require('./bookingMessage.controller');

// @route POST /api/v1/vendor-bookings/:id/disputes
const raiseDispute = asyncHandler(async (req, res) => {
  const { reason, description, attachments } = req.body;
  if (!reason || !description || !description.trim()) {
    res.status(400);
    throw new Error('reason and description are required.');
  }

  const { booking, role } = await resolveParticipant(req).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  const existingOpen = await Dispute.findOne({ booking: booking._id, status: { $in: ['open', 'under_review'] } });
  if (existingOpen) {
    res.status(400);
    throw new Error('There is already an open dispute on this booking.');
  }

  const dispute = await Dispute.create({
    booking: booking._id,
    raisedBy: req.user._id,
    raisedByRole: role,
    reason,
    description: description.trim(),
    attachments: attachments || [],
  });

  res.status(201).json(dispute);
});

// @route GET /api/v1/vendor-bookings/:id/disputes
const getBookingDisputes = asyncHandler(async (req, res) => {
  const { booking } = await resolveParticipant(req).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  const disputes = await Dispute.find({ booking: booking._id }).sort({ createdAt: -1 });
  res.status(200).json({ results: disputes });
});

// @route GET /api/v1/admin/disputes
const getAllDisputes = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const disputes = await Dispute.find(filter)
    .populate({ path: 'raisedBy', select: 'fullName email phone' })
    .populate({ path: 'booking', select: 'vendor user totalAmountPaise' })
    .sort({ createdAt: -1 });

  res.status(200).json({ results: disputes });
});

// @route PATCH /api/v1/admin/disputes/:id/resolve
const resolveDispute = asyncHandler(async (req, res) => {
  const { decision, resolution } = req.body;
  if (!['resolved', 'rejected'].includes(decision)) {
    res.status(400);
    throw new Error("decision must be 'resolved' or 'rejected'.");
  }
  if (!resolution || !resolution.trim()) {
    res.status(400);
    throw new Error('resolution note is required — this is shown to both parties.');
  }

  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) {
    res.status(404);
    throw new Error('Dispute not found.');
  }
  if (['resolved', 'rejected'].includes(dispute.status)) {
    res.status(400);
    throw new Error('This dispute has already been closed.');
  }

  dispute.status = decision;
  dispute.resolution = resolution.trim();
  dispute.resolvedBy = req.user._id;
  dispute.resolvedAt = new Date();
  await dispute.save();

  res.status(200).json(dispute);
});

module.exports = { raiseDispute, getBookingDisputes, getAllDisputes, resolveDispute };