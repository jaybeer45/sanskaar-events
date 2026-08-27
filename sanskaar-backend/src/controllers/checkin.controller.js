const asyncHandler = require('express-async-handler');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const OrganizerStaff = require('../models/OrganizerStaff');

// @route POST /api/v1/events/:eventId/checkin
const checkInTicket = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.eventId);
  if (!event) {
    res.status(404);
    throw new Error('Event not found.');
  }

  const isOrganizerOrAdmin = event.organizer.toString() === req.user._id.toString() || req.user.role === 'admin';

  if (!isOrganizerOrAdmin) {
    const staffAccess = await OrganizerStaff.findOne({
      event: event._id,
      staffUser: req.user._id,
      status: 'active',
    });
    if (!staffAccess) {
      res.status(403);
      throw new Error('You do not have gate access for this event.');
    }
  }

  const { ticketCode } = req.body;
  if (!ticketCode) {
    res.status(400);
    throw new Error('ticketCode is required.');
  }

  const booking = await Booking.findOne({ ticketCode: ticketCode.toUpperCase(), event: event._id });
  if (!booking) {
    res.status(404);
    throw new Error('No booking found with this ticket code for this event.');
  }
  if (booking.paymentStatus !== 'paid') {
    res.status(400);
    throw new Error('This booking has not been paid for yet.');
  }
  if (booking.checkedIn) {
    res.status(400);
    throw new Error(`Already checked in at ${booking.checkedInAt.toLocaleString()}.`);
  }

  booking.checkedIn = true;
  booking.checkedInAt = new Date();
  await booking.save();

  res.status(200).json({ success: true, message: 'Checked in.', booking });
});

module.exports = { checkInTicket };