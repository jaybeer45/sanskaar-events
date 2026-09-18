const mongoose = require('mongoose');

// One row per (follower -> following) relationship. Same unique-pair
// pattern as VideoLike — a user can only follow another user once.
const followSchema = new mongoose.Schema(
  {
    follower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    following: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

followSchema.index({ follower: 1, following: 1 }, { unique: true });

module.exports = mongoose.model('Follow', followSchema);