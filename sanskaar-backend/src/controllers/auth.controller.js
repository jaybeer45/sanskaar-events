const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Otp = require('../models/Otp');
const generateToken = require('../utils/generateToken');

// @route POST /api/v1/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, acceptedTerms, termsVersion, acceptedPrivacy, privacyVersion } = req.body;

  if (!name || !email || !phone || !password) {
    res.status(400);
    throw new Error('Name, email, phone aur password sab required hain.');
  }

  if (!acceptedTerms || !acceptedPrivacy) {
    res.status(400);
    throw new Error('Terms aur Privacy Policy accept karna zaroori hai.');
  }

  const existing = await User.findOne({ $or: [{ email }, { phone }] });
  if (existing) {
    res.status(400);
    throw new Error('Is email/phone se account pehle se maujood hai.');
  }

  const consents = [
    { type: 'terms', version: termsVersion || 'v1', accepted: true, ip: req.ip },
    { type: 'privacy', version: privacyVersion || 'v1', accepted: true, ip: req.ip },
  ];

  const user = await User.create({ name, email, phone, password, consents });
  const token = generateToken(user._id);

  res.status(201).json({ user: user.toSafeObject(), token });
});

// @route POST /api/v1/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email/phone aur password dono required hain.');
  }

  const user = await User.findOne({ $or: [{ email }, { phone: email }] }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid credentials.');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('Account deactivated hai.');
  }

  const token = generateToken(user._id);
  res.status(200).json({ user: user.toSafeObject(), token });
});

// @route GET /api/v1/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(req.user.toSafeObject());
});

// @route POST /api/v1/auth/send-otp
const sendOtp = asyncHandler(async (req, res) => {
  const { identifier, purpose } = req.body;
  if (!identifier) {
    res.status(400);
    throw new Error('Identifier (email/phone) required hai.');
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await Otp.create({ identifier, code, purpose: purpose || 'signup', expiresAt });

  console.log(`[DEV OTP] ${identifier} -> ${code}`);   // abhi console me dikhega, baad me SMS/email gateway lagega

  res.status(200).json({ success: true, message: 'OTP bhej diya gaya hai.' });
});

// @route POST /api/v1/auth/verify-otp
const verifyOtp = asyncHandler(async (req, res) => {
  const { identifier, code } = req.body;
  if (!identifier || !code) {
    res.status(400);
    throw new Error('Identifier aur code dono required hain.');
  }

  const entry = await Otp.findOne({ identifier, code }).sort({ createdAt: -1 });
  if (!entry) {
    res.status(400);
    throw new Error('Galat ya expired OTP.');
  }
  if (entry.expiresAt < new Date()) {
    res.status(400);
    throw new Error('OTP expire ho chuka hai.');
  }

  await Otp.deleteOne({ _id: entry._id });
  res.status(200).json({ success: true });
});

// @route POST /api/v1/auth/logout
const logout = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true });
});

// @route POST /api/v1/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { identifier, newPassword } = req.body;
  if (!identifier || !newPassword) {
    res.status(400);
    throw new Error('Identifier aur newPassword dono required hain.');
  }

  const user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] });
  if (!user) {
    res.status(404);
    throw new Error('Is email/phone se koi account nahi mila.');
  }

  user.password = newPassword;   // User model ka pre('save') hook automatically hash kar dega
  await user.save();

  res.status(200).json({ success: true });
});

module.exports = { register, login, getMe, sendOtp, verifyOtp, logout, resetPassword };