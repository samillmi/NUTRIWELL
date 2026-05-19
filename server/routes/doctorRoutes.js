const express = require('express');
const router  = express.Router();
const { protect }   = require('../middleware/authMiddleware');
const { doctorOrAdmin, verifiedDoctor } = require('../middleware/rbacMiddleware');
const { sendSuccess } = require('../utils/responseHelper');
const User     = require('../models/User');

// GET /api/doctors/public — get all doctors for marketplace (Public)
router.get('/public', async (req, res) => {
  const doctors = await User.find({ 
    role: 'doctor',
    'doctorProfile.isVerified': true 
  })
    .select('-password -emailVerifyToken -passwordResetToken')
    .populate('doctorProfile.reviews.patient', 'firstName lastName avatar')
    .sort({ 'doctorProfile.rating': -1 });
  return sendSuccess(res, 200, 'Verified doctors fetched.', { doctors });
});

// GET /api/doctors/patients  — list patients assigned to this doctor
router.get('/patients', protect, verifiedDoctor, async (req, res) => {
  const Booking = require('../models/Booking');
  const bookings = await Booking.find({ 
    doctor: req.user._id, 
    status: 'confirmed' 
  }).select('patient');
  const patientIdsFromBookings = bookings.map(b => b.patient);

  const patients = await User.find({
    role: 'patient',
    'subscription.status': 'active', // Only show active subscriptions
    $or: [
      { assignedDoctor: req.user._id },
      { _id: { $in: patientIdsFromBookings } }
    ]
  }).select('firstName lastName email currentMetrics healthMetrics dietaryGoals focusAreas allergies medicalConditions createdAt consultationDate avatar');
  
  const doctor = await User.findById(req.user._id).select('doctorProfile.reviews');
  const reviews = doctor?.doctorProfile?.reviews || [];

  const patientsWithReviews = patients.map(p => {
    const review = reviews.find(r => r.patient.toString() === p._id.toString());
    return { ...p.toObject(), review };
  });

  const DietPlan = require('../models/DietPlan');
  const activePlansCount = await DietPlan.countDocuments({ doctor: req.user._id, status: 'active' });

  return sendSuccess(res, 200, 'Patients fetched.', { patients: patientsWithReviews, activePlansCount });
});

// GET /api/doctors/profile
router.get('/profile', protect, doctorOrAdmin, (req, res) => {
  return sendSuccess(res, 200, 'Doctor profile.', { user: req.user });
});

const { uploadSingle } = require('../middleware/uploadMiddleware');
const cloudinary = require('../config/cloudinary');

// PATCH /api/doctors/profile
router.patch('/profile', protect, doctorOrAdmin, uploadSingle(), async (req, res) => {
  if (req.body.doctorProfile && typeof req.body.doctorProfile === 'string') {
    try {
      req.body.doctorProfile = JSON.parse(req.body.doctorProfile);
    } catch (e) {
      console.error('Failed to parse doctorProfile string:', e);
    }
  }

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

// GET /api/doctors/:id — get a specific doctor by ID
router.get('/:id', protect, async (req, res) => {
  const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' })
    .select('-password -emailVerifyToken -passwordResetToken');
  if (!doctor) return sendError(res, 404, 'Doctor not found.');
  return sendSuccess(res, 200, 'Doctor fetched.', { doctor });
});

// POST /api/doctors/:id/reviews — patients rate a doctor
router.post('/:id/reviews', protect, async (req, res) => {
  const { rating, feedback } = req.body;
  const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' });
  if (!doctor) return sendError(res, 404, 'Doctor not found.');
  
  // Check if patient already reviewed this doctor (commented out for testing)
  // const existing = doctor.doctorProfile.reviews.find(r => r.patient.toString() === req.user._id.toString());
  // if (existing) return sendError(res, 400, 'You have already reviewed this doctor.');
  
  doctor.doctorProfile.reviews.push({
    patient: req.user._id,
    rating,
    feedback
  });
  
  // Recalculate average rating
  const totalRating = doctor.doctorProfile.reviews.reduce((sum, r) => sum + r.rating, 0);
  doctor.doctorProfile.rating = parseFloat((totalRating / doctor.doctorProfile.reviews.length).toFixed(1));
  doctor.doctorProfile.totalReviews = doctor.doctorProfile.reviews.length;
  
  await doctor.save();
  return sendSuccess(res, 200, 'Review submitted successfully.', { doctor });
});

module.exports = router;
