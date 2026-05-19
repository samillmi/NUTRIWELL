const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { patientOnly } = require('../middleware/rbacMiddleware');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const User = require('../models/User');

// GET /api/patients/profile
router.get('/profile', protect, patientOnly, async (req, res) => {
  const user = await User.findById(req.user._id).populate('assignedDoctor');
  return sendSuccess(res, 200, 'Profile fetched.', { user });
});

const { uploadSingle } = require('../middleware/uploadMiddleware');
const cloudinary = require('../config/cloudinary');

// PATCH /api/patients/profile
router.patch('/profile', protect, patientOnly, uploadSingle(), async (req, res) => {
  const allowed = ['firstName', 'lastName', 'phone', 'avatar', 'dietaryGoals',
    'allergies', 'medicalConditions', 'focusAreas', 'dateOfBirth', 'gender', 'email'];
  const updates = {};
  allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

  if (req.body.email) {
    const existing = await User.findOne({ email: req.body.email, _id: { $ne: req.user._id } });
    if (existing) return sendError(res, 400, 'Email already in use.');
  }

  if (req.file) {
    const uploadToCloudinary = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'avatars' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(buffer);
      });
    };
    try {
      const result = await uploadToCloudinary(req.file.buffer);
      updates.avatar = result.secure_url;
    } catch (err) {
      console.error('Cloudinary failed, saving locally...', err);
      const fs = require('fs');
      const path = require('path');
      const fileName = `${req.user._id}-${Date.now()}.png`;
      const uploadsDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      fs.writeFileSync(path.join(uploadsDir, fileName), req.file.buffer);
      updates.avatar = `http://localhost:5002/uploads/${fileName}`;
    }
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
  return sendSuccess(res, 200, 'Profile updated.', { user });
});

// POST /api/patients/metrics  — log a new weight/BMI snapshot
router.post('/metrics', protect, patientOnly, async (req, res) => {
  const { weight, height, targetWeight } = req.body;
  if (!weight) return sendError(res, 400, 'weight is required.');

  const user = await User.findById(req.user._id);
  const finalHeight = height || user.currentMetrics?.height;
  const finalTargetWeight = targetWeight || user.currentMetrics?.targetWeight;

  if (!finalHeight) return sendError(res, 400, 'Height is required for the first time.');

  const bmi = +(weight / ((finalHeight / 100) ** 2)).toFixed(1);

  const snap = {
    weight,
    height: finalHeight,
    bmi,
    recordedAt: new Date()
  };
  if (finalTargetWeight) snap.targetWeight = finalTargetWeight;

  await User.findByIdAndUpdate(req.user._id, {
    $push: { healthMetrics: snap },
    $set: { currentMetrics: snap },
  });
  return sendSuccess(res, 201, 'Metrics logged.', { metrics: snap });
});

// POST /api/patients/cancel-subscription
router.post('/cancel-subscription', protect, patientOnly, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return sendError(res, 404, 'User not found.');

    // Update user state
    user.subscription = {
      plan: 'free',
      status: 'cancelled',
      startDate: user.subscription?.startDate,
      endDate: new Date() // Expire immediately
    };
    user.assignedDoctor = undefined; // Remove from doctor's list

    await user.save();

    // Also cancel all future bookings
    const Booking = require('../models/Booking');
    await Booking.updateMany(
      {
        patient: req.user._id,
        type: 'consultation',
        status: { $in: ['pending', 'confirmed'] },
        date: { $gte: new Date().setHours(0, 0, 0, 0) } // Today onwards
      },
      { status: 'cancelled' }
    );

    return sendSuccess(res, 200, 'Subscription cancelled successfully.', { user });
  } catch (err) {
    console.error('Cancel subscription error:', err);
    return sendError(res, 500, 'Failed to cancel subscription.');
  }
});

module.exports = router;
