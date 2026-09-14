const asyncHandler = require('express-async-handler');
const CreatorVideo = require('../models/CreatorVideo');
const Event = require('../models/Event');

// @route POST /api/v1/creator-videos
// @desc  Save a CreatorVideo record. The video file itself must already be
//        uploaded via POST /uploads/event-video — this endpoint just
//        records the URL plus editing metadata (trim/filter/text).
const createCreatorVideo = asyncHandler(async (req, res) => {
  const { eventId, videoUrl, duration, trimStart, trimEnd, filterCss, textOverlays, visibility } = req.body;

  if (!eventId || !videoUrl) {
    res.status(400);
    throw new Error('eventId and videoUrl are required.');
  }

  const event = await Event.findById(eventId);
  if (!event) {
    res.status(404);
    throw new Error('Event not found.');
  }

  const video = await CreatorVideo.create({
    event: eventId,
    creator: req.user._id,
    videoUrl,
    duration: duration || 0,
    trimStart: trimStart || 0,
    trimEnd: trimEnd || duration || 0,
    filterCss: filterCss || 'none',
    textOverlays: Array.isArray(textOverlays) ? textOverlays : [],
    visibility: visibility === 'public' ? 'public' : 'private',
  });

  res.status(201).json(video);
});
// @route GET /api/v1/creator-videos/mine
const getMyCreatorVideos = asyncHandler(async (req, res) => {
  const videos = await CreatorVideo.find({ creator: req.user._id })
    .populate('event', 'title')
    .sort({ createdAt: -1 });
  res.status(200).json({ results: videos });
});

// @route GET /api/v1/creator-videos/event/:eventId
const getCreatorVideosByEvent = asyncHandler(async (req, res) => {
  const videos = await CreatorVideo.find({ event: req.params.eventId, visibility: 'public' })
    .populate('creator', 'name')
    .sort({ createdAt: -1 });
  res.status(200).json({ results: videos });
});

// @route DELETE /api/v1/creator-videos/:id
const deleteCreatorVideo = asyncHandler(async (req, res) => {
  const video = await CreatorVideo.findById(req.params.id);
  if (!video) {
    res.status(404);
    throw new Error('Video not found.');
  }
  if (video.creator.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You can only delete your own videos.');
  }
  await video.deleteOne();
  res.status(200).json({ success: true });
});

module.exports = { createCreatorVideo, getMyCreatorVideos, getCreatorVideosByEvent, deleteCreatorVideo };