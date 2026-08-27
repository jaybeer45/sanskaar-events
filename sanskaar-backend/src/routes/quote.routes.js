const express = require('express');
const router = express.Router();
const { createQuote, getQuotesForRequest, acceptQuote } = require('../controllers/quote.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/', createQuote);
router.get('/for-request/:reference', getQuotesForRequest);
router.post('/:id/accept', acceptQuote);

module.exports = router;