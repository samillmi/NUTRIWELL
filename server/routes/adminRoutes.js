const express = require('express');
const router  = express.Router();
const { protect }    = require('../middleware/authMiddleware');
const { adminOnly, anyAuthenticated }  = require('../middleware/rbacMiddleware');
const { sendSuccess } = require('../utils/responseHelper');
const User     = require('../models/User');
const FoodScan = require('../models/FoodScan');
const Payment  = require('../models/Payment');

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
  const payments = await Payment.find({ status: 'completed' });
  
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  
  // Aggregate by type
  const byType = {
    plan_purchase: 0,
    consultation_booking: 0,
    subscription: 0
  };
  
  payments.forEach(p => {
    if (byType[p.type] !== undefined) {
      byType[p.type] += p.amount;
    }
  });

  return sendSuccess(res, 200, 'Finance data fetched.', {
    totalRevenue,
    byType,
    recentTransactions: await Payment.find().sort({ createdAt: -1 }).limit(10).populate('user', 'firstName lastName')
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
