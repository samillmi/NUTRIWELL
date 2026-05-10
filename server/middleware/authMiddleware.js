const jwt      = require('jsonwebtoken');
const User     = require('../models/User');
const { sendError } = require('../utils/responseHelper');

/**
 * Verifies the JWT from the Authorization header and attaches
 * the user document to req.user.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Support both Bearer token and httpOnly cookie
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return sendError(res, 401, 'Not authenticated. Please log in.');
    }

    // Verify
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach fresh user (ensures deactivated accounts are caught)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return sendError(res, 401, 'User belonging to this token no longer exists.');
    }

    if (!user.isActive) {
      return sendError(res, 403, 'Your account has been deactivated. Contact support.');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Your session has expired. Please log in again.');
    }
    return sendError(res, 401, 'Invalid token. Please log in again.');
  }
};

module.exports = { protect };
