const asyncHandler = require('express-async-handler');
const Event = require('../models/Event');
const User = require('../models/User');
const OrganizerStaff = require('../models/OrganizerStaff');

const checkEventOwnership = async (eventId, user) => {
  const event = await Event.findById(eventId);
  if (!event) {
    const err = new Error('Event not found.');
    err.statusCode = 404;
    throw err;
  }
  if (event.organizer.toString() !== user._id.toString() && user.role !== 'admin') {
    const err = new Error('Only the event organizer or an admin can manage staff.');
    err.statusCode = 403;
    throw err;
  }
  return event;
};

// @route POST /api/v1/events/:eventId/staff
const inviteStaff = asyncHandler(async (req, res) => {
  await checkEventOwnership(req.params.eventId, req.user).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error('email is required.');
  }

  const staffUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (!staffUser) {
    res.status(404);
    throw new Error('No account found with this email. The person must sign up on the platform first.');
  }

  const existing = await OrganizerStaff.findOne({ event: req.params.eventId, staffUser: staffUser._id });
  if (existing) {
    existing.status = 'active';
    await existing.save();
    return res.status(200).json(existing);
  }

  const staffAccess = await OrganizerStaff.create({
    event: req.params.eventId,
    organizer: req.user._id,
    staffUser: staffUser._id,
  });

  res.status(201).json(staffAccess);
});

// @route GET /api/v1/events/:eventId/staff
const listStaff = asyncHandler(async (req, res) => {
  await checkEventOwnership(req.params.eventId, req.user).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  const results = await OrganizerStaff.find({ event: req.params.eventId })
    .populate('staffUser', 'name email phone');
  res.status(200).json({ results });
});

// @route DELETE /api/v1/events/:eventId/staff/:staffId
const revokeStaff = asyncHandler(async (req, res) => {
  await checkEventOwnership(req.params.eventId, req.user).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  const staffAccess = await OrganizerStaff.findOne({ _id: req.params.staffId, event: req.params.eventId });
  if (!staffAccess) {
    res.status(404);
    throw new Error('Staff access record not found.');
  }

  staffAccess.status = 'revoked';
  await staffAccess.save();
  res.status(200).json({ success: true, message: 'Staff access revoked.' });
});

module.exports = { inviteStaff, listStaff, revokeStaff };