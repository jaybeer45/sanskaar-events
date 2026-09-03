const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  if (!token) {
    res.status(401);
    throw new Error('Not authenticated. Token missing.');
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user || !req.user.isActive) {
      res.status(401);
      throw new Error('User no longer exists or is inactive.');
    }
    next();
  } catch (err) {
    res.status(401);
    throw new Error('Not authenticated. Invalid or expired token.');
  }
});

const authorize = (...allowedRoles) => (req, res, next) => {
  const userRoles = req.user?.roles || [];
  const hasAccess = allowedRoles.some((r) => userRoles.includes(r));
  if (!req.user || !hasAccess) {
    res.status(403);
    throw new Error(`None of your roles (${userRoles.join(', ') || 'none'}) are authorized for this action.`);
  }
  next();
};

module.exports = { protect, authorize };