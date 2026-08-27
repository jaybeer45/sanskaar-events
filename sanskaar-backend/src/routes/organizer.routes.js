const express = require('express');
const router = express.Router();
const { registerOrganizer, getMyOrganizer, submitKyc, sendContactOtp, verifyContactOtp } = require('../controllers/organizer.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/', registerOrganizer);
router.get('/me', getMyOrganizer);
router.post('/:id/kyc', submitKyc);
router.post('/:id/contact-otp/send', sendContactOtp);
router.post('/:id/contact-otp/verify', verifyContactOtp);

module.exports = router;