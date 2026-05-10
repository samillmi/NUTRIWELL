const express = require('express');
const router  = express.Router();
const { protect }    = require('../middleware/authMiddleware');
const { patientOnly } = require('../middleware/rbacMiddleware');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const User = require('../models/User');

// GET /api/patients/profile
router.get('/profile', protect, patientOnly, (req, res) => {
  return sendSuccess(res, 200, 'Profile fetched.', { user: req.user });
});

const { uploadSingle } = require('../middleware/uploadMiddleware');
const cloudinary = require('../config/cloudinary');

// PATCH /api/patients/profile
router.patch('/profile', protect, patientOnly, uploadSingle(), async (req, res) => {
  const allowed = ['firstName', 'lastName', 'phone', 'avatar', 'dietaryGoals',
                   'allergies', 'medicalConditions', 'dateOfBirth', 'gender', 'email'];
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
  if (!weight || !height) return sendError(res, 400, 'weight and height required.');
  const bmi = +(weight / ((height / 100) ** 2)).toFixed(1);
  
  const snap = { weight, height, bmi, recordedAt: new Date() };
  if (targetWeight) snap.targetWeight = targetWeight;

  await User.findByIdAndUpdate(req.user._id, {
    $push: { healthMetrics: snap },
    $set:  { currentMetrics: snap },
  });
  return sendSuccess(res, 201, 'Metrics logged.', { metrics: snap });
});

module.exports = router;
