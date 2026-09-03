const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, getBookingById, createRazorpayOrder,
     verifyRazorpayPayment , cancelBooking , rescheduleBooking  } = require('../controllers/booking.controller');
const { protect } = require('../middleware/auth.middleware');


router.get('/my', protect, getMyBookings);
router.post('/', protect, createBooking);
router.get('/:id', protect, getBookingById);
router.post('/:id/cancel', protect, cancelBooking);
router.post('/:id/reschedule', protect, rescheduleBooking);
router.post('/:id/create-order', protect, createRazorpayOrder);
router.post('/:id/verify-payment', protect, verifyRazorpayPayment);



module.exports = router;