const express = require('express');
const router = express.Router();
const {
  createAdvanceOrder, verifyAdvancePayment,createBalanceOrder, verifyBalancePayment,} = require('../controllers/vendorPayment.controller');
const { getBookingByQuote } = require('../controllers/vendorBooking.controller');
const { getMessages, sendMessage } = require('../controllers/bookingMessage.controller');
const { raiseDispute, getBookingDisputes } = require('../controllers/dispute.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/by-quote/:quoteId', protect, getBookingByQuote);

router.post('/:id/advance/order', protect, createAdvanceOrder);
router.post('/:id/advance/verify', protect, verifyAdvancePayment);
router.post('/:id/balance/order', protect, createBalanceOrder);
router.post('/:id/balance/verify', protect, verifyBalancePayment);

router.get('/:id/messages', protect, getMessages);
router.post('/:id/messages', protect, sendMessage);

router.get('/:id/disputes', protect, getBookingDisputes);
router.post('/:id/disputes', protect, raiseDispute);

module.exports = router;