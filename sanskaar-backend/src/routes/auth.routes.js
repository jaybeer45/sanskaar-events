const express = require('express');
const router = express.Router();
const {
  register, login, getMe, sendOtp, verifyOtp, logout, resetPassword, otpLogin
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.post('/otp-login', otpLogin);
router.get('/me', protect, getMe);          // protect = login required, tabhi req.user milega
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/logout', protect, logout);
router.post('/reset-password', resetPassword);

module.exports = router;