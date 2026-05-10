const express = require('express');
const router  = express.Router();
const { protect }   = require('../middleware/authMiddleware');
const { doctorOrAdmin } = require('../middleware/rbacMiddleware');
const { sendSuccess } = require('../utils/responseHelper');
const User     = require('../models/User');

// GET /api/doctors/public — get all doctors for marketplace
router.get('/public', protect, async (req, res) => {
  const doctors = await User.find({ role: 'doctor' })
    .select('-password -emailVerifyToken -passwordResetToken')
    .sort({ 'doctorProfile.rating': -1 });
  return sendSuccess(res, 200, 'Verified doctors fetched.', { doctors });
});

// GET /api/doctors/patients  — list patients assigned to this doctor
router.get('/patients', protect, doctorOrAdmin, async (req, res) => {
  const patients = await User.find({ role: 'patient', assignedDoctor: req.user._id })
    .select('firstName lastName email currentMetrics dietaryGoals createdAt consultationDate avatar');
  
  const DietPlan = require('../models/DietPlan');
  const activePlansCount = await DietPlan.countDocuments({ doctor: req.user._id, status: 'active' });

  return sendSuccess(res, 200, 'Patients fetched.', { patients, activePlansCount });
});

// GET /api/doctors/profile
router.get('/profile', protect, doctorOrAdmin, (req, res) => {
  return sendSuccess(res, 200, 'Doctor profile.', { user: req.user });
});

const { uploadSingle } = require('../middleware/uploadMiddleware');
const cloudinary = require('../config/cloudinary');

// PATCH /api/doctors/profile
router.patch('/profile', protect, doctorOrAdmin, uploadSingle(), async (req, res) => {
  const allowed = ['doctorProfile', 'phone', 'avatar', 'firstName', 'lastName', 'email'];
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

module.exports = router;
