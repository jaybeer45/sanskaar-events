const asyncHandler = require('express-async-handler');
const Event = require('../models/Event');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const Organizer = require('../models/Organizer');
const Coupon = require('../models/Coupon');

// @route GET /api/v1/admin/stats
const getStats = asyncHandler(async (req, res) => {
  const [pendingEvents, activeVendors, totalUsers] = await Promise.all([
    Event.countDocuments({ status: 'pending_approval' }),
    Vendor.countDocuments({ isActive: true }),
    User.countDocuments(),
  ]);

  res.status(200).json({ pendingEvents, activeVendors, totalUsers });
});

// @route GET /api/v1/admin/events/pending
const getPendingEvents = asyncHandler(async (req, res) => {
  const results = await Event.find({ status: 'pending_approval' }).populate('organizer', 'name email');
  res.status(200).json({ results });
});

// @route PATCH /api/v1/admin/events/:id/approve
const approveEvent = asyncHandler(async (req, res) => {
  const event = await Event.findByIdAndUpdate(req.params.id, { status: 'published' }, { new: true });
  if (!event) {
    res.status(404);
    throw new Error('Event nahi mila.');
  }
  res.status(200).json({ success: true, id: event._id, status: event.status });
});

// @route PATCH /api/v1/admin/events/:id/reject
const rejectEvent = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason || reason.trim().length < 5) {
    res.status(400);
    throw new Error('A valid reason (min 5 characters) is required to reject an event.');
  }

  const event = await Event.findByIdAndUpdate(
    req.params.id,
    { status: 'rejected', rejectionReason: reason.trim() },
    { new: true }
  );
  if (!event) {
    res.status(404);
    throw new Error('Event nahi mila.');
  }
  res.status(200).json({ success: true, id: event._id, status: event.status });
});

// @route GET /api/v1/admin/vendors/pending
const getPendingVendors = asyncHandler(async (req, res) => {
  const results = await Vendor.find({ isApproved: false }).populate('user', 'name email');
  res.status(200).json({ results });
});

// @route PATCH /api/v1/admin/vendors/:id/verify
const verifyVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
  if (!vendor) {
    res.status(404);
    throw new Error('Vendor nahi mila.');
  }

  // $addToSet — adds 'vendor' only if not already present, so this stays
  // safe to run more than once and never duplicates the role.
  await User.findByIdAndUpdate(vendor.user, { $addToSet: { roles: 'vendor' } });

  res.status(200).json({ success: true, id: vendor._id, verified: true });
});



// @route GET /api/v1/admin/organizers/pending
const getPendingOrganizers = asyncHandler(async (req, res) => {
  const results = await Organizer.find({ kycStatus: 'submitted' }).populate('owner', 'name email');
  res.status(200).json({ results: results.map((o) => o.toSafeObject()) });
});


// @route PATCH /api/v1/admin/organizers/:id/verify
const verifyOrganizer = asyncHandler(async (req, res) => {
  const organizer = await Organizer.findById(req.params.id);
  if (!organizer) {
    res.status(404);
    throw new Error('Organizer not found.');
  }
  if (organizer.kycStatus !== 'submitted') {
    res.status(400);
    throw new Error('Only organizers with "submitted" status can be verified.');
  }

  organizer.kycStatus = 'verified';
  organizer.kycRejectionReason = '';

  await organizer.save();

  await User.findByIdAndUpdate(
    organizer.owner,
    { $addToSet: { roles: 'organizer' } }
  );



  res.status(200).json({ success: true, id: organizer._id, kycStatus: organizer.kycStatus });
});

// @route PATCH /api/v1/admin/organizers/:id/reject
const rejectOrganizer = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason || reason.trim().length < 5) {
    res.status(400);
    throw new Error('A valid reason is required to reject an organizer.');
  }

  const organizer = await Organizer.findById(req.params.id);
  if (!organizer) {
    res.status(404);
    throw new Error('Organizer not found.');
  }
  if (organizer.kycStatus !== 'submitted') {
    res.status(400);
    throw new Error('Only organizers with "submitted" status can be rejected.');
  }

  organizer.kycStatus = 'rejected';
  organizer.kycRejectionReason = reason.trim();
  await organizer.save();

  res.status(200).json({ success: true, id: organizer._id, kycStatus: organizer.kycStatus });
});

// @route POST /api/v1/admin/coupons
// Creates a public, admin-issued coupon — any user can redeem it (up to maxUses).
const VALID_TARGET_ROLES = ['user', 'organizer', 'vendor'];

const createManualCoupon = asyncHandler(async (req, res) => {
  const { code, valuePaise, maxUses, expiresAt, userEmail, targetRole } = req.body;

  if (!code || !valuePaise || valuePaise <= 0) {
    res.status(400);
    throw new Error('Code aur valid valuePaise required hain.');
  }

  if (targetRole && !VALID_TARGET_ROLES.includes(targetRole)) {
    res.status(400);
    throw new Error(`targetRole in me se ek hona chahiye: ${VALID_TARGET_ROLES.join(', ')}`);
  }

  const existing = await Coupon.findOne({ code: code.trim().toUpperCase() });
  if (existing) {
    res.status(400);
    throw new Error('Is code ka coupon pehle se maujood hai.');
  }

  // Priority: specific user (userEmail) > role restriction (targetRole) > fully public
  let owner = null;
  if (userEmail) {
    const targetUser = await User.findOne({ email: userEmail.trim().toLowerCase() });
    if (!targetUser) {
      res.status(404);
      throw new Error('Is email se koi user nahi mila.');
    }
    owner = targetUser._id;
  }

  const coupon = await Coupon.create({
    code: code.trim().toUpperCase(),
    owner,
    targetRole: owner ? null : (targetRole || null), // agar specific owner hai, role restriction irrelevant hai
    type: 'admin_manual',
    valuePaise,
    maxUses: maxUses && maxUses > 0 ? maxUses : 1,
    expiresAt: expiresAt || null,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, coupon });
});

// @route GET /api/v1/admin/coupons
// Lists all admin-created (manual/public) coupons, for the admin dashboard.
const getManualCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({ type: 'admin_manual' }).sort({ createdAt: -1 });
  res.status(200).json({ results: coupons });
});

module.exports = {
  getStats, getPendingEvents, approveEvent, rejectEvent, getPendingVendors, verifyVendor,
  getPendingOrganizers, verifyOrganizer, rejectOrganizer, createManualCoupon, getManualCoupons,
};