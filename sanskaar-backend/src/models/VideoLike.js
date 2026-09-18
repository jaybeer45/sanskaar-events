const mongoose = require('mongoose');

// One row per (video, user) like. The unique compound index is what
// actually prevents double-liking — enforced at the DB level.
const videoLikeSchema = new mongoose.Schema(
  {
    video: { type: mongoose.Schema.Types.ObjectId, ref: 'CreatorVideo', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

videoLikeSchema.index({ video: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('VideoLike', videoLikeSchema);