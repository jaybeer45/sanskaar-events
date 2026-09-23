const asyncHandler = require('express-async-handler');
const VideoComment = require('../models/VideoComment');
const CreatorVideo = require('../models/CreatorVideo');

// @route POST /api/v1/creator-videos/:id/comments
// @desc  Private — post a new comment OR reply on a video.
//        Pass parentCommentId in the body to make this a reply.
const addComment = asyncHandler(async (req, res) => {
  const videoId = req.params.id;
  const { text, parentCommentId } = req.body;

  if (!text || !text.trim()) {
    res.status(400);
    throw new Error('Comment text is required.');
  }

  const video = await CreatorVideo.findById(videoId);
  if (!video) {
    res.status(404);
    throw new Error('Video not found.');
  }

  let parentComment = null;
  if (parentCommentId) {
    parentComment = await VideoComment.findById(parentCommentId);
    if (!parentComment) {
      res.status(404);
      throw new Error('Comment you are replying to was not found.');
    }
  }

  const comment = await VideoComment.create({
    video: videoId,
    user: req.user._id,
    text: text.trim(),
    parentComment: parentComment ? parentComment._id : null,
  });

  video.commentsCount += 1;
  await video.save();

  if (parentComment) {
    parentComment.repliesCount += 1;
    await parentComment.save();
  }

  await comment.populate('user', 'name avatar');

  res.status(201).json({ comment, commentsCount: video.commentsCount });
});

// @route GET /api/v1/creator-videos/:id/comments
// @desc  Public — list TOP-LEVEL comments only (replies are fetched
//        separately, on demand, via getReplies below)
const getComments = asyncHandler(async (req, res) => {
  const videoId = req.params.id;

  const comments = await VideoComment.find({ video: videoId, parentComment: null })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 });

  res.status(200).json({ comments });
});

// @route GET /api/v1/creator-videos/comments/:commentId/replies
// @desc  Public — list replies to one specific comment, oldest first
//        (reads like a natural conversation thread top-to-bottom)
const getReplies = asyncHandler(async (req, res) => {
  const replies = await VideoComment.find({ parentComment: req.params.commentId })
    .populate('user', 'name avatar')
    .sort({ createdAt: 1 });

  res.status(200).json({ replies });
});

// @route DELETE /api/v1/creator-videos/comments/:commentId
// @desc  Private — author/video-owner/admin only. Deleting a top-level
//        comment also deletes all of its replies (cascade).
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

  // if deleting a top-level comment, cascade-delete its replies too
  const replies = await VideoComment.find({ parentComment: comment._id });
  const idsToDelete = [comment._id, ...replies.map((r) => r._id)];
  await VideoComment.deleteMany({ _id: { $in: idsToDelete } });

  if (video) {
    video.commentsCount = Math.max(0, video.commentsCount - idsToDelete.length);
    await video.save();
  }

  // if the deleted comment was ITSELF a reply, decrement its parent's count
  if (comment.parentComment) {
    await VideoComment.findByIdAndUpdate(comment.parentComment, { $inc: { repliesCount: -1 } });
  }

  res.status(200).json({ success: true, commentsCount: video ? video.commentsCount : 0 });
});

module.exports = { addComment, getComments, getReplies, deleteComment };