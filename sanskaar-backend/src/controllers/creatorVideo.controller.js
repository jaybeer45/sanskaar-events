const asyncHandler = require('express-async-handler');
const CreatorVideo = require('../models/CreatorVideo');
const Event = require('../models/Event');
const VideoLike = require('../models/VideoLike');
const Follow = require('../models/Follow');

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
// @route GET /api/v1/creator-videos/event/:eventId?page=1&limit=10
const getCreatorVideosByEvent = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 30); // 30 se zyada ek baar mein nahi denge
  const skip = (page - 1) * limit;

  const filter = { event: req.params.eventId, visibility: 'public' };

  const totalCount = await CreatorVideo.countDocuments(filter);

  const videos = await CreatorVideo.find(filter)
    .populate('creator', 'name followersCount')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  let likedSet = new Set();
  let followingSet = new Set();
  if (req.user) {
    const likes = await VideoLike.find({
      video: { $in: videos.map((v) => v._id) },
      user: req.user._id,
    }).select('video');
    likedSet = new Set(likes.map((l) => l.video.toString()));

    const creatorIds = [...new Set(videos.map((v) => v.creator?._id?.toString()).filter(Boolean))];
    const follows = await Follow.find({
      follower: req.user._id,
      following: { $in: creatorIds },
    }).select('following');
    followingSet = new Set(follows.map((f) => f.following.toString()));
  }

  const results = videos.map((v) => ({
    ...v.toObject(),
    isLiked: likedSet.has(v._id.toString()),
    isFollowingCreator: followingSet.has(v.creator?._id?.toString()),
  }));

  res.status(200).json({
    results,
    page,
    hasMore: skip + videos.length < totalCount,
  });
});

// @route POST /api/v1/creator-videos/:id/share
// @desc  Public — bump the share counter. No auth needed, no "who shared"
//        tracking, unlike likes/comments — this is a simple counter only.
const incrementShare = asyncHandler(async (req, res) => {
  const video = await CreatorVideo.findById(req.params.id);
  if (!video) {
    res.status(404);
    throw new Error('Video not found.');
  }
 
  video.sharesCount += 1;
  await video.save();
 
  res.status(200).json({ sharesCount: video.sharesCount });
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


// @route GET /api/v1/creator-videos/leaderboard/:eventId
// @desc  Public — top creators for this event, ranked by total views
//        across all their public videos on it. Reward tier is derived
//        from totalViews, not stored anywhere.
const getCreatorLeaderboard = asyncHandler(async (req, res) => {
  const mongoose = require('mongoose');
  const eventId = new mongoose.Types.ObjectId(req.params.eventId);

  const leaderboard = await CreatorVideo.aggregate([
    { $match: { event: eventId, visibility: 'public' } },
    {
      $group: {
        _id: '$creator',
        totalViews: { $sum: '$viewsCount' },
        totalLikes: { $sum: '$likesCount' },
        videoCount: { $sum: 1 },
      },
    },
    { $sort: { totalViews: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'creator',
      },
    },
    { $unwind: '$creator' },
    {
      $project: {
        _id: 0,
        creatorId: '$_id',
        name: '$creator.name',
        avatar: '$creator.avatar',
        totalViews: 1,
        totalLikes: 1,
        videoCount: 1,
      },
    },
  ]);

  const withTier = leaderboard.map((c) => ({
    ...c,
    tier: c.totalViews >= 1000 ? 'Gold' : c.totalViews >= 500 ? 'Silver' : c.totalViews >= 100 ? 'Bronze' : null,
  }));

  res.status(200).json({ leaderboard: withTier });
});


// @route POST /api/v1/creator-videos/:id/view
// @desc Increment video view counter
const incrementView = asyncHandler(async (req, res) => {
  const video = await CreatorVideo.findByIdAndUpdate(
    req.params.id,
    { $inc: { viewsCount: 1 } },
    { new: true }
  );

  if (!video) {
    res.status(404);
    throw new Error('Video not found.');
  }

  res.status(200).json({
    viewsCount: video.viewsCount
  });
});





module.exports = { createCreatorVideo, getMyCreatorVideos, getCreatorVideosByEvent, incrementShare ,incrementView ,getCreatorLeaderboard ,   deleteCreatorVideo  };

