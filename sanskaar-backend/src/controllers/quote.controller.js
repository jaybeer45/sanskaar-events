const asyncHandler = require('express-async-handler');
const RequestMatch = require('../models/RequestMatch');
const Vendor = require('../models/Vendor');
const Quote = require('../models/Quote');
const VendorBooking = require('../models/VendorBooking');

// @route POST /api/v1/quotes
const createQuote = asyncHandler(async (req, res) => {
  const { matchId, lineItems, travelChargePaise, advancePercent, validUntil } = req.body;

  const match = await RequestMatch.findById(matchId);
  if (!match || !match.approvedByUser) {
    res.status(403);
    throw new Error('You can only quote on requests the customer has approved you for.');
  }

  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor || vendor._id.toString() !== match.vendor.toString()) {
    res.status(403);
    throw new Error('This lead does not belong to your vendor profile.');
  }

  // Block sending a second quote while one is still pending or already accepted
  // for this match — this is the backend-side twin of the getMyLeads fix; without
  // it a vendor could hit POST /quotes again even after the frontend button is hidden.
  const existingActiveQuote = await Quote.findOne({
    match: match._id,
    status: { $in: ['pending', 'accepted'] },
  });
  if (existingActiveQuote) {
    res.status(400);
    throw new Error(`A quote is already ${existingActiveQuote.status} for this lead.`);
  }

  if (!lineItems || lineItems.length === 0) {
    res.status(400);
    throw new Error('At least one line item is required.');
  }

  const quote = await Quote.create({
    match: match._id,
    request: match.request,
    vendor: vendor._id,
    lineItems,
    travelChargePaise: travelChargePaise || 0,
    advancePercent: advancePercent ?? 50,
    validUntil,
  });

  res.status(201).json(quote);
});

// @route GET /api/v1/quotes/for-request/:reference
const getQuotesForRequest = asyncHandler(async (req, res) => {
  const PlanningRequest = require('../models/PlanningRequest');
  const request = await PlanningRequest.findOne({ reference: req.params.reference });
  if (!request) {
    res.status(404);
    throw new Error('Request not found.');
  }
  if (request.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You can only view quotes on your own requests.');
  }

  const quotes = await Quote.find({ request: request._id, status: { $ne: 'rejected' } })
    .populate('vendor', 'businessName ratingAvg ratingCount portfolio');

  res.status(200).json({ results: quotes });
});

// @route POST /api/v1/quotes/:id/accept
const acceptQuote = asyncHandler(async (req, res) => {
  const PlanningRequest = require('../models/PlanningRequest');
  const quote = await Quote.findById(req.params.id).populate('request');
  if (!quote) {
    res.status(404);
    throw new Error('Quote not found.');
  }
  if (quote.request.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You can only accept quotes on your own requests.');
  }
  if (quote.status !== 'pending') {
    res.status(400);
    throw new Error(`Quote is already ${quote.status}.`);
  }
  if (new Date(quote.validUntil) < new Date()) {
    quote.status = 'expired';
    await quote.save();
    res.status(400);
    throw new Error('This quote has expired.');
  }

  const totalAmountPaise = quote.lineItems.reduce((sum, i) => sum + i.amountPaise, 0) + quote.travelChargePaise;
  const advanceAmountPaise = Math.round((totalAmountPaise * quote.advancePercent) / 100);
  const balanceAmountPaise = totalAmountPaise - advanceAmountPaise;

  const booking = await VendorBooking.create({
    quote: quote._id,
    request: quote.request._id,
    vendor: quote.vendor,
    user: req.user._id,
    totalAmountPaise,
    advanceAmountPaise,
    balanceAmountPaise,
  });

  quote.status = 'accepted';
  await quote.save();
  await PlanningRequest.findByIdAndUpdate(quote.request._id, { status: 'closed' });

  res.status(201).json(booking);
});

module.exports = { createQuote, getQuotesForRequest, acceptQuote };