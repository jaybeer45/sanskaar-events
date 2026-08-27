const asyncHandler = require('express-async-handler');
const Vendor = require('../models/Vendor');
const RequestMatch = require('../models/RequestMatch');
const Quote = require('../models/Quote');

// @route GET /api/v1/vendors/me/leads
const getMyLeads = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) {
    res.status(404);
    throw new Error('No vendor profile found for this account.');
  }

  // THE PRIVACY GATE — approvedByUser: true is a hard requirement in the query itself,
  // not a UI-level filter. A vendor can never fetch unapproved matches, no matter what
  // client code sends.
  const leads = await RequestMatch.find({ vendor: vendor._id, approvedByUser: true })
    .populate({
      path: 'request',
      populate: { path: 'user', select: 'name phone email' },
    })
    .sort({ createdAt: -1 });

  // A match doesn't stop being "approved" once a quote exists for it, so the
  // query above still returns it — that's correct, the vendor should still see
  // the lead. What was missing is telling the frontend a quote already went out,
  // so the "Send Quote" button can be hidden/disabled instead of firing again.
  const matchIds = leads.map((m) => m._id);
  const quotes = await Quote.find({ match: { $in: matchIds } })
    .sort({ createdAt: -1 })
    .select('match status totalAmountPaise validUntil');

  // Keep only the latest quote per match (a vendor could in theory have re-quoted
  // after an expiry/rejection).
  const latestQuoteByMatch = {};
  for (const q of quotes) {
    const key = q.match.toString();
    if (!latestQuoteByMatch[key]) latestQuoteByMatch[key] = q;
  }

  const results = leads.map((m) => {
    const quote = latestQuoteByMatch[m._id.toString()] || null;
    return {
      ...m.toObject(),
      quoteStatus: quote ? quote.status : null, // null | 'pending' | 'accepted' | 'rejected' | 'expired'
      hasActiveQuote: !!quote && ['pending', 'accepted'].includes(quote.status),
      requestClosed: m.request?.status === 'closed',
    };
  });

  res.status(200).json({ results });
});

module.exports = { getMyLeads };