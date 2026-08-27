const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const PlanningRequest = require('../models/PlanningRequest');
const RequestMatch = require('../models/RequestMatch');
const Vendor = require('../models/Vendor');

// @route POST /api/v1/requests
const createRequest = asyncHandler(async (req, res) => {
  const { services, occasion, eventDate, flexibleDates, cityId, lat, lng, budgetMin, budgetMax, description } = req.body;

  if (!services || services.length === 0) {
    res.status(400);
    throw new Error('At least one service category is required.');
  }
  if (!eventDate || !cityId || budgetMin === undefined || budgetMax === undefined) {
    res.status(400);
    throw new Error('eventDate, cityId, budgetMin and budgetMax are required.');
  }
  if (budgetMin > budgetMax) {
    res.status(400);
    throw new Error('budgetMin cannot be greater than budgetMax.');
  }

  const reference = 'REQ-' + crypto.randomBytes(4).toString('hex').toUpperCase();

  const request = await PlanningRequest.create({
    reference,
    user: req.user._id,
    services,
    occasion: occasion || '',
    eventDate,
    flexibleDates: !!flexibleDates,
    cityId,
    lat,
    lng,
    budgetMin,
    budgetMax,
    description: description || '',
  });

  const { matchVendorsToRequest } = require('../services/vendorMatching'); // add to top imports

// ... inside createRequest, replace the final part:

  const matchCount = await matchVendorsToRequest(request);
  request.status = matchCount > 0 ? 'matched' : 'pending_matching';
  await request.save();

  res.status(201).json(request);

  res.status(201).json(request);
 
});

// @route GET /api/v1/requests/mine
const getMyRequests = asyncHandler(async (req, res) => {
  const results = await PlanningRequest.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ results });
});

// @route GET /api/v1/requests/:reference
const getRequestByReference = asyncHandler(async (req, res) => {
  const request = await PlanningRequest.findOne({ reference: req.params.reference });
  if (!request) {
    res.status(404);
    throw new Error('Request not found.');
  }
  if (request.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('You can only view your own requests.');
  }
  res.status(200).json(request);
});

// @route GET /api/v1/requests/:reference/matches
const getMatches = asyncHandler(async (req, res) => {
  const request = await PlanningRequest.findOne({ reference: req.params.reference });
  if (!request) {
    res.status(404);
    throw new Error('Request not found.');
  }
  if (request.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('You can only view matches for your own requests.');
  }

  const matches = await RequestMatch.find({ request: request._id })
    .populate('vendor', 'businessName categories ratingAvg ratingCount portfolio priceRange')
    .sort({ score: -1 });

  res.status(200).json({ results: matches });
});

// @route POST /api/v1/requests/:reference/approve
const approveMatch = asyncHandler(async (req, res) => {
  const request = await PlanningRequest.findOne({ reference: req.params.reference });
  if (!request) {
    res.status(404);
    throw new Error('Request not found.');
  }
  if (request.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You can only approve matches on your own requests.');
  }

  const { matchId } = req.body;
  if (!matchId) {
    res.status(400);
    throw new Error('matchId is required.');
  }

  const match = await RequestMatch.findOne({ _id: matchId, request: request._id });
  if (!match) {
    res.status(404);
    throw new Error('Match not found for this request.');
  }

  match.approvedByUser = true; // THE PRIVACY GATE OPENS — this vendor can now see the request
  await match.save();

  res.status(200).json({ success: true, message: 'Vendor approved. They can now see your request.', match });
});

module.exports = { createRequest, getMyRequests, getRequestByReference, getMatches, approveMatch };

