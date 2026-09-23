const mongoose = require('mongoose');

// One row per comment OR reply. A reply is just a comment with
// parentComment set — top-level comments have parentComment: null.
const videoCommentSchema = new mongoose.Schema(
  {
    video: { type: mongoose.Schema.Types.ObjectId, ref: 'CreatorVideo', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 300 },
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'VideoComment', default: null },
    repliesCount: { type: Number, default: 0 }, // only meaningful on top-level comments
  },
  { timestamps: true }
);

// Speeds up "get top-level comments for this video" and "get replies for this comment"
videoCommentSchema.index({ video: 1, parentComment: 1, createdAt: -1 });

module.exports = mongoose.model('VideoComment', videoCommentSchema);