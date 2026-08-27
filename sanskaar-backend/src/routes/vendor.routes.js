const express = require('express');
const router = express.Router();
const { getVendors, getVendorById, getMyVendor, registerVendor, requestQuote, submitReview , updateBankDetails } = require('../controllers/vendor.controller');
const { getMyVendorBookings, updateVendorBookingStatus } = require('../controllers/vendorBooking.controller');
const { getServices, createService, updateService, deleteService } = require('../controllers/vendorService.controller');
const { getPackages, createPackage, updatePackage, deletePackage } = require('../controllers/vendorPackage.controller');
const { getAddons, createAddon, updateAddon, deleteAddon } = require('../controllers/vendorAddon.controller');
const { protect } = require('../middleware/auth.middleware');
const { getMyLeads } = require('../controllers/vendorLeads.controller');
const { getMyPayouts } = require('../controllers/vendorPayout.controller');

router.get('/me', protect, getMyVendor);              
router.post('/', protect, registerVendor);             
router.get('/me/leads', protect, getMyLeads);
router.get('/me/bookings', protect, getMyVendorBookings); 
router.get('/me/payouts', protect, getMyPayouts);  
router.patch('/me/bank-details', protect , updateBankDetails)        
router.patch('/me/bookings/:id/status', protect, updateVendorBookingStatus); 
router.get('/', getVendors);
router.get('/:id', getVendorById);
router.post('/:id/quote', protect, requestQuote);
router.post('/:id/reviews', protect, submitReview);

// Vendor services (Phase A — vendor hierarchy)
router.get('/:id/services', getServices);
router.post('/:id/services', protect, createService);
router.put('/:vendorId/services/:serviceId', protect, updateService);
router.delete('/:vendorId/services/:serviceId', protect, deleteService);

// Vendor pakages 
router.get('/:vendorId/services/:serviceId/packages', getPackages);
router.post('/:vendorId/services/:serviceId/packages', protect, createPackage);
router.put('/:vendorId/services/:serviceId/packages/:packageId', protect, updatePackage);
router.delete('/:vendorId/services/:serviceId/packages/:packageId', protect, deletePackage);

// Vendor add-ons
router.get('/:vendorId/packages/:packageId/addons', getAddons);
router.post('/:vendorId/packages/:packageId/addons', protect, createAddon);
router.put('/:vendorId/packages/:packageId/addons/:addonId', protect, updateAddon);
router.delete('/:vendorId/packages/:packageId/addons/:addonId', protect, deleteAddon);


module.exports = router;