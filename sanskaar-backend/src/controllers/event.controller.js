const asyncHandler = require('express-async-handler');
const Event = require('../models/Event');
const Organizer = require('../models/Organizer');

// @route GET /api/v1/events
const getEvents = asyncHandler(async (req, res) => {
  const { category, search, isLive, tonight } = req.query;
  const filter = { status: 'published' };

  if (category && category !== 'all') filter.category = category;
  if (search) filter.title = { $regex: search, $options: 'i' };

  if (isLive === 'true') {
    const now = new Date();
    filter.date = { $lte: now };
  }

  if (tonight === 'true') {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    filter.date = { $gte: startOfDay, $lte: endOfDay };
  }

  const results = await Event.find(filter).sort({ date: 1 });
  res.status(200).json({ results, total: results.length });
});

// @route GET /api/v1/events/:id
const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate('organizer', 'name avatar');
  if (!event) {
    res.status(404);
    throw new Error('Event nahi mila.');
  }
  res.status(200).json(event);
});

// @route GET /api/v1/events/mine
const getMyEvents = asyncHandler(async (req, res) => {
  const results = await Event.find({ organizer: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ results, total: results.length });
});

// @route GET /api/v1/events/tonight
const getTonightEvents = asyncHandler(async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const results = await Event.find({
    status: 'published',
    date: { $gte: startOfDay, $lte: endOfDay },
  }).sort({ time: 1 });

  res.status(200).json({ results });
});

// @route POST /api/v1/events

const createEvent = asyncHandler(async (req, res) => {
  // Admins can create events directly without an organizer profile.
  if (req.user.role !== 'admin') {
    const organizer = await Organizer.findOne({ owner: req.user._id });

    if (!organizer) {
      res.status(403);
      throw new Error('You must register as an organizer before creating events.');
    }
    if (organizer.kycStatus !== 'verified') {
      res.status(403);
      throw new Error('Your organizer KYC must be verified before you can publish events. Current status: ' + organizer.kycStatus);
    }
  }

  const event = await Event.create({
    ...req.body,
    organizer: req.user._id,
    status: 'pending_approval',   // admin will still approve the actual listing content
  });
  res.status(201).json(event);
});

// @route PUT /api/v1/events/:id
const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error('Event nahi mila.');
  }

  if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Sirf event ka organizer ya admin hi update kar sakta hai.');
  }

  Object.assign(event, req.body);
  await event.save();
  res.status(200).json(event);
});

// @route DELETE /api/v1/events/:id
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error('Event nahi mila.');
  }

  if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Sirf event ka organizer ya admin hi delete kar sakta hai.');
  }

  await event.deleteOne();
  res.status(200).json({ success: true });
});

module.exports = {getEvents, getEventById, getTonightEvents, createEvent, updateEvent, deleteEvent, getMyEvents};