// src/controllers/liveStream.controller.js
const asyncHandler = require('express-async-handler');
const LiveStream = require('../models/LiveStream');

// @route POST /api/v1/live
// @desc  Private — start a new live stream for an event
const startLiveStream = asyncHandler(async (req, res) => {
  const { eventId, title, filterCss } = req.body;
  if (!eventId) {
    res.status(400);
    throw new Error('eventId is required.');
  }

  // ek user ek time pe ek hi live rakh sake — pehle koi purani "live" chhoot gayi
  // ho to usse khud hi "ended" kar do (jaise agar browser crash ho gaya tha)
  await LiveStream.updateMany({ host: req.user._id, status: 'live' }, { status: 'ended', endedAt: new Date() });

  const stream = await LiveStream.create({
    event: eventId,
    host: req.user._id,
    title: title?.trim() || '',
    filterCss: filterCss || 'none',
  });

  await stream.populate('host', 'name avatar');
  res.status(201).json({ stream });
});

// @route PATCH /api/v1/live/:id/end
// @desc  Private — host only. Ends the stream and saves final stats.
const endLiveStream = asyncHandler(async (req, res) => {
  const { peakViewers, heartsCount } = req.body;

  const stream = await LiveStream.findById(req.params.id);
  if (!stream) {
    res.status(404);
    throw new Error('Live stream not found.');
  }
  if (stream.host.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the host can end this stream.');
  }

  stream.status = 'ended';
  stream.endedAt = new Date();
  stream.peakViewers = peakViewers || 0;
  stream.heartsCount = heartsCount || 0;
  await stream.save();

  res.status(200).json({ stream });
});

// @route GET /api/v1/live/event/:eventId
// @desc  Public — is there an active live stream for this event right now?
//        Used to show the "Live now" strip on the event page.
const getActiveLiveForEvent = asyncHandler(async (req, res) => {
  const stream = await LiveStream.findOne({ event: req.params.eventId, status: 'live' }).populate('host', 'name avatar');
  res.status(200).json({ stream: stream || null });
});

module.exports = { startLiveStream, endLiveStream, getActiveLiveForEvent };