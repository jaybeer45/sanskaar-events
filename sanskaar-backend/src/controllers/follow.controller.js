const asyncHandler = require('express-async-handler');
const Follow = require('../models/Follow');
const User = require('../models/User');

// @route POST /api/v1/users/:id/follow
// @desc  Private — toggle follow/unfollow on another user (a creator).
const toggleFollow = asyncHandler(async (req, res) => {
  const targetId = req.params.id;

  if (targetId === req.user._id.toString()) {
    res.status(400);
    throw new Error("You can't follow yourself.");
  }

  const targetUser = await User.findById(targetId);
  if (!targetUser) {
    res.status(404);
    throw new Error('User not found.');
  }

  const existing = await Follow.findOne({ follower: req.user._id, following: targetId });

  let following;
  if (existing) {
    await existing.deleteOne();
    targetUser.followersCount = Math.max(0, targetUser.followersCount - 1);
    req.user.followingCount = Math.max(0, req.user.followingCount - 1);
    following = false;
  } else {
    try {
      await Follow.create({ follower: req.user._id, following: targetId });
    } catch (err) {
      if (err.code !== 11000) throw err; // duplicate from a parallel click — already followed, fine
    }
    targetUser.followersCount += 1;
    req.user.followingCount += 1;
    following = true;
  }

  await targetUser.save();
  await req.user.save();

  res.status(200).json({ following, followersCount: targetUser.followersCount });
});

module.exports = { toggleFollow };