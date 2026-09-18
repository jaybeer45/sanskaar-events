
// src/controllers/auth.controller.js

const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const User = require('../models/User');
const Otp = require('../models/Otp');
const generateToken = require('../utils/generateToken');
const { sendOtpMessage } = require('../services/otpDelivery.service');

const register = asyncHandler(async (req, res) => {
  const {name, email, phone, password, acceptedTerms, termsVersion, acceptedPrivacy, privacyVersion, referredBy,
  } = req.body;

  // Required fields
  if (!name || !email || !phone || !password) {
    res.status(400);
    throw new Error(
      'Name, email, phone, and password are required.'
    );
  }

  // Terms & Privacy
  if (!acceptedTerms || !acceptedPrivacy) {
    res.status(400);
    throw new Error(
      'You must accept the Terms and Privacy Policy.'
    );
  }

  // Check existing account
  const existing = await User.findOne({
    $or: [
      { email },
      { phone },
    ],
  });

  if (existing) {
    res.status(400);
    throw new Error(
      'An account with this email or phone already exists.'
    );
  }

  // Consent records
  const consents = [
    {
      type: 'terms',
      version: termsVersion || 'v1',
      accepted: true,
      ip: req.ip,
    },
    {
      type: 'privacy',
      version: privacyVersion || 'v1',
      accepted: true,
      ip: req.ip,
    },
  ];

  // Referral validation
  let referrer = null;

  if (referredBy) {
    if (!mongoose.Types.ObjectId.isValid(referredBy)) {
      res.status(400);
      throw new Error('Invalid referral code.');
    }

    referrer = await User.findById(referredBy).select('_id');

    if (!referrer) {
      res.status(400);
      throw new Error('Referral user not found.');
    }
  }

  // Create user
  const user = await User.create({
    name,
    email,
    phone,
    password,
    consents,
    referredBy: referrer ? referrer._id : null,
  });

  // Generate token
  const token = generateToken(user._id);

  // Response
  res.status(201).json({
    user: user.toSafeObject(),
    token,
  });
});


  //  POST /api/v1/auth/login


const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Required fields
  if (!email || !password) {
    res.status(400);
    throw new Error(
      'Email/phone and password are required.'
    );
  }

  // Find user by email OR phone
  const user = await User.findOne({
    $or: [
      { email },
      { phone: email },
    ],
  }).select('+password');

  // User not found
  if (!user) {
    res.status(401);
    throw new Error(
      'Email or phone number is incorrect.'
    );
  }

  // Password verification
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    res.status(401);
    throw new Error(
      'Password is incorrect.'
    );
  }

  // Account status
  if (!user.isActive) {
    res.status(403);
    throw new Error(
      'Your account has been deactivated.'
    );
  }

  // Generate token
  const token = generateToken(user._id);

  // Success response
  res.status(200).json({
    user: user.toSafeObject(),
    token,
  });
});


/* =========================================================
   OTP LOGIN
   POST /api/v1/auth/otp-login
========================================================= */

const otpLogin = asyncHandler(async (req, res) => {
  const identifier = req.body.identifier?.trim();
  const code = req.body.code?.trim();

  // Required fields
  if (!identifier || !code) {
    res.status(400);
    throw new Error(
      'Email/phone and OTP code are required.'
    );
  }

  // Find OTP
  const entry = await Otp.findOne({
    identifier,
    code,
  }).sort({
    createdAt: -1,
  });

  // OTP not found
  if (!entry) {
    res.status(400);
    throw new Error(
      'Invalid or expired OTP.'
    );
  }

  // OTP expired
  if (entry.expiresAt < new Date()) {
    await Otp.deleteOne({
      _id: entry._id,
    });

    res.status(400);
    throw new Error(
      'OTP has expired.'
    );
  }

  // Find user
  const user = await User.findOne({
    $or: [
      { email: identifier },
      { phone: identifier },
    ],
  });

  // User not found
  if (!user) {
    res.status(404);
    throw new Error(
      'No account was found with this email or phone number. Please sign up first.'
    );
  }

  // Account inactive
  if (!user.isActive) {
    res.status(403);
    throw new Error(
      'Your account has been deactivated.'
    );
  }

  // OTP successfully used
  await Otp.deleteOne({
    _id: entry._id,
  });

  // Generate token
  const token = generateToken(user._id);

  // Success response
  res.status(200).json({
    user: user.toSafeObject(),
    token,
  });
});


/* =========================================================
   GET CURRENT USER
   GET /api/v1/auth/me
========================================================= */

const getMe = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error(
      'Authentication required.'
    );
  }

  res.status(200).json(
    req.user.toSafeObject()
  );
});


/* =========================================================
   SEND OTP
   POST /api/v1/auth/send-otp
========================================================= */

const sendOtp = asyncHandler(async (req, res) => {
  const identifier = req.body.identifier?.trim();
  const { purpose } = req.body;

  // Required identifier
  if (!identifier) {
    res.status(400);
    throw new Error(
      'Email or phone number is required.'
    );
  }

  // Generate secure OTP
  const code = crypto
    .randomInt(100000, 1000000)
    .toString();

  // OTP expires in 5 minutes
  const expiresAt = new Date(
    Date.now() + 5 * 60 * 1000
  );

  // Remove previous OTPs for same identifier
  await Otp.deleteMany({
    identifier,
  });

  // Store OTP
  await Otp.create({
    identifier,
    code,
    purpose: purpose || 'signup',
    expiresAt,
  });

  // Send OTP
  const result = await sendOtpMessage(
    identifier,
    code
  );

  res.status(200).json({
    success: true,
    message: result.delivered
      ? 'OTP sent successfully.'
      : 'OTP generated, but delivery is not fully configured yet. Please check the server logs.',
  });
});


/* =========================================================
   VERIFY OTP
   POST /api/v1/auth/verify-otp
========================================================= */

const verifyOtp = asyncHandler(async (req, res) => {
  const identifier = req.body.identifier?.trim();
  const code = req.body.code?.trim();

  // Required fields
  if (!identifier || !code) {
    res.status(400);
    throw new Error(
      'Email/phone and OTP code are required.'
    );
  }

  // Find OTP
  const entry = await Otp.findOne({
    identifier,
    code,
  }).sort({
    createdAt: -1,
  });

  // Invalid OTP
  if (!entry) {
    res.status(400);
    throw new Error(
      'Invalid or expired OTP.'
    );
  }

  // Expired OTP
  if (entry.expiresAt < new Date()) {
    await Otp.deleteOne({
      _id: entry._id,
    });

    res.status(400);
    throw new Error(
      'OTP has expired.'
    );
  }

  // OTP verified successfully
  await Otp.deleteOne({
    _id: entry._id,
  });

  res.status(200).json({
    success: true,
    message: 'OTP verified successfully.',
  });
});


/* =========================================================
   LOGOUT
   POST /api/v1/auth/logout
========================================================= */

const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

/* =========================================================
   GOOGLE LOGIN
   POST /api/v1/auth/google
========================================================= */

const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    res.status(400);
    throw new Error('Google ID token is required.');
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    res.status(401);
    throw new Error('Invalid Google token.');
  }

  const { sub: googleId, email, name, picture, email_verified } = payload;

  if (!email) {
    res.status(400);
    throw new Error('This Google account has no email associated with it.');
  }

  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (user) {
    // Existing account (maybe originally signed up with email/password) — link Google to it
    if (!user.googleId) {
      user.googleId = googleId;
      if (!user.avatar) user.avatar = picture || '';
      if (email_verified) user.isEmailVerified = true;
      await user.save();
    }
  } else {
    user = await User.create({
      name: name || 'Sanskaar User',
      email,
      googleId,
      avatar: picture || '',
      isEmailVerified: !!email_verified,
      consents: [
        { type: 'terms', version: 'v1', accepted: true, ip: req.ip },
        { type: 'privacy', version: 'v1', accepted: true, ip: req.ip },
      ],
    });
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('Your account has been deactivated.');
  }

  const token = generateToken(user._id);

  res.status(200).json({
    user: user.toSafeObject(),
    token,
  });
});


/* =========================================================
   RESET PASSWORD
   POST /api/v1/auth/reset-password
========================================================= */

const resetPassword = asyncHandler(async (req, res) => {
  const {
    identifier,
    newPassword,
  } = req.body;

  // Required fields
  if (!identifier || !newPassword) {
    res.status(400);
    throw new Error(
      'Email/phone and new password are required.'
    );
  }

  // Password length
  if (newPassword.length < 8) {
    res.status(400);
    throw new Error(
      'Password must be at least 8 characters long.'
    );
  }

  // Find user
  const user = await User.findOne({
    $or: [
      { email: identifier },
      { phone: identifier },
    ],
  });

  // User not found
  if (!user) {
    res.status(404);
    throw new Error(
      'No account was found with this email or phone number.'
    );
  }

  // Update password
  user.password = newPassword;

  // User model pre-save hook should hash password
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successfully.',
  });
});


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  register,
  login,
  otpLogin,
  getMe,
  sendOtp,
  verifyOtp,
  logout,
  resetPassword,
  googleLogin
};

