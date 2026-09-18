const asyncHandler = require('express-async-handler');
const VideoLike = require('../models/VideoLike');
const CreatorVideo = require('../models/CreatorVideo');

// @route POST /api/v1/creator-videos/:id/like
// @desc  Private — toggle like/unlike on a video. Returns the new state + count.
const toggleLike = asyncHandler(async (req, res) => {
  const videoId = req.params.id;

  const video = await CreatorVideo.findById(videoId);
  if (!video) {
    res.status(404);
    throw new Error('Video not found.');
  }

  const existing = await VideoLike.findOne({ video: videoId, user: req.user._id });

  let liked;
  if (existing) {
    await existing.deleteOne();
    video.likesCount = Math.max(0, video.likesCount - 1);
    liked = false;
  } else {
    try {
      await VideoLike.create({ video: videoId, user: req.user._id });
    } catch (err) {
      // Duplicate-key means a parallel request already liked it — treat as already-liked, not an error
      if (err.code !== 11000) throw err;
    }
    video.likesCount += 1;
    liked = true;
  }

  await video.save();

  res.status(200).json({ liked, likesCount: video.likesCount });
});

module.exports = { toggleLike };