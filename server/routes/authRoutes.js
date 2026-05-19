const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/emailHelper');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role = 'patient' } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return sendError(res, 400, 'All fields are required.');
    }

    const exists = await User.findOne({ email });
    if (exists) return sendError(res, 409, 'Email already registered.');

    const user = await User.create({ firstName, lastName, email, password, role });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    return sendSuccess(res, 201, 'Account created successfully.', {
      user: user.toSafeObject(),
      token,
    });
  } catch (err) {
    console.error('[Auth] register error:', err);
    return sendError(res, 500, err.message);
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return sendError(res, 400, 'Email and password required.');

    const user = await User.findByEmail(email);
    if (!user) return sendError(res, 401, 'Invalid email or password.');

    const match = await user.comparePassword(password);
    if (!match) return sendError(res, 401, 'Invalid email or password.');

    if (!user.isActive) return sendError(res, 403, 'Account deactivated.');

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.cookie('accessToken', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });

    return sendSuccess(res, 200, 'Login successful.', {
      user: user.toSafeObject(),
      token,
    });
  } catch (err) {
    console.error('[Auth] login error:', err);
    return sendError(res, 500, err.message);
  }
});

// ── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('accessToken');
  return sendSuccess(res, 200, 'Logged out successfully.');
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', protect, (req, res) => {
  return sendSuccess(res, 200, 'User fetched.', { user: req.user.toSafeObject() });
});

// ── POST /api/auth/google ────────────────────────────────────────────────────
router.post('/google', async (req, res) => {
  const { token } = req.body;
  if (!token) return sendError(res, 400, 'Token is required.');

  try {
    let email, firstName, lastName;

    // If Google Client ID is set, verify the real token
    if (process.env.GOOGLE_CLIENT_ID) {
      const ticket = await googleClient.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      firstName = payload.given_name || 'Google';
      lastName = payload.family_name || 'User';
    } else {
      // Fallback to simulation if no Client ID is configured
      console.warn('GOOGLE_CLIENT_ID not set. Using simulated Google login.');
      email = 'googleuser@example.com';
      firstName = 'Google';
      lastName = 'User';
    }

    // Find or create user
    let user = await User.findOne({ email });
    
    if (!user) {
      user = await User.create({
        firstName,
        lastName,
        email,
        password: Math.random().toString(36).slice(-10), // random password
        role: 'patient',
        isActive: true,
        isEmailVerified: true
      });
    }

    // Generate JWT token
    const jwtToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    
    // Set cookie
    res.cookie('accessToken', jwtToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    return sendSuccess(res, 200, 'Logged in with Google successfully.', {
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      },
      token: jwtToken
    });
  } catch (error) {
    console.error('Google login error:', error);
    return sendError(res, 401, 'Invalid Google token or verification failed.');
  }
});

// ── POST /api/auth/forgot-password ──────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, 400, 'Email is required.');

    const user = await User.findOne({ email });
    if (!user) return sendError(res, 404, 'User not found with this email.');

    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save plain text code and expiry (10 mins)
    user.passwordResetToken = resetCode;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    // Send email
    try {
      await sendEmail({
        email: user.email,
        subject: 'NutriWell - Password Reset Code',
        message: `Your password reset code is: ${resetCode}. It will expire in 10 minutes.`,
        html: `<h3>Password Reset Code</h3><p>Your password reset code is: <strong>${resetCode}</strong></p><p>It will expire in 10 minutes.</p>`,
      });
      return sendSuccess(res, 200, 'Reset code sent to email.');
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.error('Email send error:', err);
      return sendError(res, 500, 'Failed to send email. Try again later.');
    }
  } catch (err) {
    return sendError(res, 500, err.message);
  }
});

// ── POST /api/auth/reset-password ───────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return sendError(res, 400, 'Email, code and new password are required.');
    }

    const user = await User.findOne({
      email,
      passwordResetToken: code,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) return sendError(res, 400, 'Invalid code or code expired.');

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return sendSuccess(res, 200, 'Password reset successful.');
  } catch (err) {
    return sendError(res, 500, err.message);
  }
});

module.exports = router;
