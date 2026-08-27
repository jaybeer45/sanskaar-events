const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const updateProfile = asyncHandler(async (req, res) => {
  if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('You can only update your profile ');
  }

  const allowedFields = ['name', 'bio', 'avatar', 'city', 'interests', 'alertPrefs'];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    res.status(404);
    throw new Error('User not found .');
  }

  res.status(200).json(user.toSafeObject());
});

const saveEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.body;
  if (!eventId) {
    res.status(400);
    throw new Error('eventId is required..');
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { savedEvents: eventId } },
    { new: true }
  );

  if (!user) {
    res.status(404);
    throw new Error('User not found .');
  }

  res.status(200).json({ success: true, savedEvents: user.savedEvents });
});

const unsaveEvent = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $pull: { savedEvents: req.params.eventId } },
    { new: true }
  );

  if (!user) {
    res.status(404);
    throw new Error('User not found .');
  }

  res.status(200).json({ success: true, savedEvents: user.savedEvents });
});

const recordConsent = asyncHandler(async (req, res) => {
  if (req.user._id.toString() !== req.params.id) {
    res.status(403);
    throw new Error('Yur can only consent your record .');
  }

  const { type, version, accepted } = req.body;
  if (!type || !version || typeof accepted !== 'boolean') {
    res.status(400);
    throw new Error('type, version, and accepted (boolean) are all required.');
  }
  if (!['terms', 'privacy', 'marketing'].includes(type)) {
    res.status(400);
    throw new Error('Invalid consent type.');
  }

  const entry = { type, version, accepted, ip: req.ip, acceptedAt: new Date() };

  // append-only — $push se purani history kabhi delete/overwrite nahi hoti
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $push: { consents: entry } },
    { new: true }
  );

  if (!user) {
    res.status(404);
    throw new Error('User not found .');
  }

  res.status(200).json({ success: true, consents: user.consents });
});

const getConsents = asyncHandler(async (req, res) => {
  if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('You can only consent yout history ');
  }

  const user = await User.findById(req.params.id).select('consents');
  if (!user) {
    res.status(404);
    throw new Error('User not found .');
  }

  res.status(200).json({ consents: user.consents });
});

module.exports = { updateProfile, saveEvent, unsaveEvent, recordConsent, getConsents };