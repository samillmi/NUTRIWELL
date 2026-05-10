const express = require('express');
const router  = express.Router();
const { protect }    = require('../middleware/authMiddleware');
const { adminOnly, anyAuthenticated }  = require('../middleware/rbacMiddleware');
const { sendSuccess } = require('../utils/responseHelper');
const User     = require('../models/User');
const FoodScan = require('../models/FoodScan');
const Payment  = require('../models/Payment');
const Booking  = require('../models/Booking');

// GET /api/admin/stats
router.get('/stats', protect, adminOnly, async (req, res) => {
  const [totalUsers, totalDoctors, totalPatients] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'doctor' }),
    User.countDocuments({ role: 'patient' }),
  ]);
  return sendSuccess(res, 200, 'Stats fetched.', {
    totalUsers, totalDoctors, totalPatients,
    revenue: 106500, profit: 43200,          // mock financial data
  });
});

// GET /api/admin/finance
router.get('/finance', protect, adminOnly, async (req, res) => {
  const bookings = await Booking.find({ status: 'confirmed' });
  
  const totalRevenue = bookings.reduce((sum, b) => {
    if (b.type === 'scanner') return sum + 19;
    if (b.type === 'chatbot') return sum + 9;
    if (b.type === 'consultation') return sum + 29;
    return sum;
  }, 0);
  
  // Aggregate by type
  const byType = {
    scanner: 0,
    chatbot: 0,
    consultation: 0
  };
  
  bookings.forEach(b => {
    if (b.type === 'scanner') byType.scanner += 19;
    if (b.type === 'chatbot') byType.chatbot += 9;
    if (b.type === 'consultation') byType.consultation += 29;
  });

  return sendSuccess(res, 200, 'Finance data fetched.', {
    totalRevenue,
    byType,
    recentTransactions: await Booking.find().sort({ createdAt: -1 }).limit(10).populate('patient', 'firstName lastName')
  });
});

// GET /api/admin/users
router.get('/users', protect, adminOnly, async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 }).limit(50);
  return sendSuccess(res, 200, 'Users fetched.', { users });
});

// PATCH /api/admin/doctors/:id/verify
router.patch('/doctors/:id/verify', protect, adminOnly, async (req, res) => {
  const doc = await User.findByIdAndUpdate(
    req.params.id,
    { 'doctorProfile.isVerified': true, 'doctorProfile.verifiedAt': new Date(), 'doctorProfile.verifiedBy': req.user._id },
    { new: true }
  );
  return sendSuccess(res, 200, 'Doctor verified.', { doctor: doc });
});


// POST /api/admin/assign  — pair a doctor with a patient
router.post('/assign', protect, adminOnly, async (req, res) => {
  const { patientId, doctorId } = req.body;
  if (!patientId || !doctorId) return sendSuccess(res, 400, 'patientId and doctorId required.');
  const patient = await User.findByIdAndUpdate(
    patientId,
    { assignedDoctor: doctorId },
    { new: true }
  ).select('-password');
  return sendSuccess(res, 200, 'Patient assigned to doctor.', { patient });
});

// PATCH /api/admin/users/:id — toggle active / deactivate
router.patch('/users/:id', protect, adminOnly, async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
  return sendSuccess(res, 200, 'User updated.', { user });
});

module.exports = router;
