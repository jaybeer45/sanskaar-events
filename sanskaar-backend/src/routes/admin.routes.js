const express = require("express");
const router = express.Router();
const {
  getStats,
  getPendingEvents,
  getEventsHistory,
  approveEvent,
  rejectEvent,
  getPendingVendors,
  getVendorsHistory,
  verifyVendor,
  getPendingOrganizers,
  getOrganizersHistory,
  verifyOrganizer,
  rejectOrganizer,
  createManualCoupon,
  getManualCoupons,
  getAllVendorBookings,
} = require("../controllers/admin.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const {
  getAllPayouts,
  markPayoutPaid,
} = require("../controllers/vendorPayout.controller");
const {
  getAllDisputes,
  resolveDispute,
} = require("../controllers/dispute.controller");

router.use(protect, authorize("admin"));

router.get("/stats", getStats);
router.get("/events/pending", getPendingEvents);
router.patch("/events/:id/approve", approveEvent);
router.patch("/events/:id/reject", rejectEvent);
router.get("/disputes", getAllDisputes);
router.patch("/disputes/:id/resolve", resolveDispute);
router.get("/vendors/pending", getPendingVendors);
router.patch("/vendors/:id/verify", verifyVendor);
router.get("/organizers/pending", getPendingOrganizers);
router.patch("/organizers/:id/verify", verifyOrganizer);
router.patch("/organizers/:id/reject", rejectOrganizer);
router.get("/vendor-payouts", getAllPayouts);
router.patch("/vendor-payouts/:id/mark-paid", markPayoutPaid);
router.post("/coupons", createManualCoupon);
router.get("/coupons", getManualCoupons);
router.get("/vendor-bookings", getAllVendorBookings);
router.get("/events/history", getEventsHistory);
router.get("/vendors/history", getVendorsHistory);
router.get("/organizers/history", getOrganizersHistory);

module.exports = router;
