const asyncHandler = require('express-async-handler');
const Venue = require('../models/Venue');

// @route GET /api/v1/venues/mine
const getMyVenues = asyncHandler(async (req, res) => {
  const results = await Venue.find({ organizer: req.user._id }).sort({ name: 1 });
  res.status(200).json({ results, total: results.length });
});

// @route POST /api/v1/venues
const createVenue = asyncHandler(async (req, res) => {
  const { name, address, lat, lng } = req.body;
  if (!name || !address) {
    res.status(400);
    throw new Error('name and address are required.');
  }

  const venue = await Venue.create({
    organizer: req.user._id,
    name,
    address,
    lat,
    lng,
  });

  res.status(201).json(venue);
});

// @route DELETE /api/v1/venues/:id
const deleteVenue = asyncHandler(async (req, res) => {
  const venue = await Venue.findById(req.params.id);
  if (!venue) {
    res.status(404);
    throw new Error('Venue not found.');
  }
  if (venue.organizer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You can only delete your own saved venues.');
  }

  await venue.deleteOne();
  res.status(200).json({ success: true, message: 'Venue deleted.' });
});

module.exports = { getMyVenues, createVenue, deleteVenue };