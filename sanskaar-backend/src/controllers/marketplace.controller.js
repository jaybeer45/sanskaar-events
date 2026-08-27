const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const PlanningRequest = require('../models/PlanningRequest');
const RequestMatch = require('../models/RequestMatch');
const { matchVendorsToRequest } = require('../services/vendorMatching');

// @route POST /api/v1/marketplace/lead
const submitLeadRequest = asyncHandler(async (req, res) => {
  const { serviceType, budget, eventDate, requirements, name, guests } = req.body;

  if (!serviceType || !eventDate || !budget) {
    res.status(400);
    throw new Error('serviceType, eventDate and budget are required.');
  }

  // Frontend sends a range-string like "20000-50000" or an open-ended "500000+"
  const budgetNums = String(budget).match(/\d+/g) || ['0'];
  const budgetMin = parseInt(budgetNums[0], 10);
  const budgetMax = budgetNums[1] ? parseInt(budgetNums[1], 10) : budgetMin * 3;

  const reference = 'REQ-' + crypto.randomBytes(4).toString('hex').toUpperCase();

  const request = await PlanningRequest.create({
    reference,
    user: req.user._id,
    services: [serviceType], // VENDOR_TYPES ids already match Vendor.categories values directly
    eventDate,
    cityId: req.user.city || 'Unknown',
    budgetMin,
    budgetMax,
    description: requirements?.trim()
      ? requirements.trim()
      : `${name || 'Customer'} is looking for ${serviceType} services${guests ? ` for ~${guests} guests` : ''}.`,
  });

  const matchCount = await matchVendorsToRequest(request);
  request.status = matchCount > 0 ? 'matched' : 'pending_matching';
  await request.save();

  const matches = await RequestMatch.find({ request: request._id })
    .populate('vendor', 'businessName portfolio ratingAvg ratingCount priceRange')
    .sort({ score: -1 });

  res.status(201).json({
    success: true,
    reference: request.reference,
    message: matchCount > 0
      ? 'Aapka request matching vendors ko bhej diya gaya hai!'
      : 'Request submit ho gaya — abhi koi match nahi mila, jald update denge.',
    matchedVendors: matches.map((m) => ({
      _id: m.vendor._id,
      matchId: m._id,
      name: m.vendor.businessName,
      tagline: m.reason,
      logo: m.vendor.portfolio?.[0] || '',
      approved: m.approvedByUser,
    })),
  });
});

module.exports = { submitLeadRequest };