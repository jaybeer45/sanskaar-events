const mongoose = require('mongoose');

// One row per comment. Unlike VideoLike, there's NO unique index here —
// a user can post as many comments as they want on the same video.
const videoCommentSchema = new mongoose.Schema(
  {
    video: { type: mongoose.Schema.Types.ObjectId, ref: 'CreatorVideo', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 300 },
  },
  { timestamps: true }
);

// Speeds up "get all comments for this video, newest first" — the exact
// query the list endpoint runs every time.
videoCommentSchema.index({ video: 1, createdAt: -1 });

module.exports = mongoose.model('VideoComment', videoCommentSchema);