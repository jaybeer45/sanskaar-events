const asyncHandler = require('express-async-handler');
const VideoComment = require('../models/VideoComment');
const CreatorVideo = require('../models/CreatorVideo');

// @route POST /api/v1/creator-videos/:id/comments
// @desc  Private — post a new comment on a video
const addComment = asyncHandler(async (req, res) => {
  const videoId = req.params.id;
  const { text } = req.body;

  if (!text || !text.trim()) {
    res.status(400);
    throw new Error('Comment text is required.');
  }

  const video = await CreatorVideo.findById(videoId);
  if (!video) {
    res.status(404);
    throw new Error('Video not found.');
  }

  const comment = await VideoComment.create({
    video: videoId,
    user: req.user._id,
    text: text.trim(),
  });

  video.commentsCount += 1;
  await video.save();

  // populate the author's name/avatar so the frontend can render it immediately
  // without a second round trip
  await comment.populate('user', 'name avatar');

  res.status(201).json({ comment, commentsCount: video.commentsCount });
});

// @route GET /api/v1/creator-videos/:id/comments
// @desc  Public — list comments for a video, newest first
const getComments = asyncHandler(async (req, res) => {
  const videoId = req.params.id;

  const comments = await VideoComment.find({ video: videoId })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 });

  res.status(200).json({ comments });
});

// @route DELETE /api/v1/creator-videos/comments/:commentId
// @desc  Private — only the comment's own author, the video's creator, or an admin can delete
const deleteComment = asyncHandler(async (req, res) => {
  const comment = await VideoComment.findById(req.params.commentId);
  if (!comment) {
    res.status(404);
    throw new Error('Comment not found.');
  }

  const video = await CreatorVideo.findById(comment.video);

  const isCommentAuthor = comment.user.toString() === req.user._id.toString();
  const isVideoOwner = video && video.creator.toString() === req.user._id.toString();
  const isAdmin = req.user.roles.includes('admin');

  if (!isCommentAuthor && !isVideoOwner && !isAdmin) {
    res.status(403);
    throw new Error('You are not authorized to delete this comment.');
  }

  await comment.deleteOne();

  if (video) {
    video.commentsCount = Math.max(0, video.commentsCount - 1);
    await video.save();
  }

  res.status(200).json({ success: true, commentsCount: video ? video.commentsCount : 0 });
});

module.exports = { addComment, getComments, deleteComment };