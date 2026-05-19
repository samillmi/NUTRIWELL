const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminOnly, anyAuthenticated } = require('../middleware/rbacMiddleware');
const { sendSuccess } = require('../utils/responseHelper');
const User = require('../models/User');
const FoodScan = require('../models/FoodScan');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

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

  const DietPlan = require('../models/DietPlan');
  const allPlans = await DietPlan.find().select('_id price title');
  const planPrices = {};
  const planPricesByTitle = {};
  allPlans.forEach(p => {
    planPrices[p._id.toString()] = p.price || 0;
    if (p.title) {
      planPricesByTitle[p.title.toLowerCase().trim()] = p.price || 0;
    }
  });

  const getAmount = (b) => {
    if (b.type === 'plan_purchase') {
      const reason = b.reason || '';

      // Check if it's a public template purchase
      const templateMatch = reason.match(/Purchase of Diet Plan ID: ([a-f\d]{24})/i);
      if (templateMatch && templateMatch[1]) {
        const planId = templateMatch[1];
        if (planPrices[planId] !== undefined) {
          return planPrices[planId];
        }
      }

      // Check if it's a purchase request by title
      const requestMatch = reason.match(/Diet Plan Purchase Request: (.+)/i);
      if (requestMatch && requestMatch[1]) {
        const titleKey = requestMatch[1].toLowerCase().trim();
        if (planPricesByTitle[titleKey] !== undefined) {
          return planPricesByTitle[titleKey];
        }
      }

      // Standard plans
      const reasonLower = reason.toLowerCase();
      if (reasonLower.includes('premium') || reasonLower.includes('plan3')) return 99;
      if (reasonLower.includes('standard') || reasonLower.includes('plan2') || reasonLower.includes('49')) return 49;
      if (reasonLower.includes('basic') || reasonLower.includes('plan1') || reasonLower.includes('29')) return 29;
      return 49; // fallback
    }
    if (b.type === 'scanner' || b.type === 'chatbot') {
      return 29; // Unlock price for standalone features
    }
    return 0; // Consultation is included in the plan
  };

  const totalRevenue = bookings.reduce((sum, b) => sum + getAmount(b), 0);

  // Aggregate by type
  const byType = {
    scanner: 0,
    chatbot: 0,
    consultation: 0,
    plan_purchase: 0
  };

  bookings.forEach(b => {
    const amt = getAmount(b);
    if (b.type === 'scanner') byType.scanner += amt;
    if (b.type === 'chatbot') byType.chatbot += amt;
    if (b.type === 'consultation') byType.consultation += amt;
    if (b.type === 'plan_purchase') byType.plan_purchase += amt;
  });

  // Group by month for charts
  const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = {};

  // Initialize with default months (Jan to Jun) to ensure they always appear
  const defaultMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  defaultMonths.forEach(m => {
    monthlyData[m] = { month: m, revenue: 0, profit: 0, subscriptions: 0 };
  });

  bookings.forEach(b => {
    const date = new Date(b.createdAt);
    const month = date.toLocaleString('default', { month: 'short' });

    if (!monthlyData[month]) {
      monthlyData[month] = { month, revenue: 0, profit: 0, subscriptions: 0 };
    }

    const amount = getAmount(b);

    monthlyData[month].revenue += amount;
    monthlyData[month].profit += Math.round(amount * 0.7); // Assume 70% profit margin
    monthlyData[month].subscriptions += 1;
  });

  const chartData = Object.values(monthlyData).sort((a, b) => monthsOrder.indexOf(a.month) - monthsOrder.indexOf(b.month));

  const recent = await Booking.find({ type: 'plan_purchase' }).sort({ createdAt: -1 }).limit(10).populate('patient', 'firstName lastName');
  const recentTransactions = recent.map(r => ({
    ...r.toObject(),
    amount: getAmount(r)
  }));

  return sendSuccess(res, 200, 'Finance data fetched.', {
    totalRevenue,
    byType,
    chartData,
    recentTransactions
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

// GET /api/admin/notifications
router.get('/notifications', protect, adminOnly, async (req, res) => {
  try {
    const [pendingBlogs, unverifiedDoctors, pendingBookings] = await Promise.all([
      require('../models/Blog').countDocuments({ status: 'pending' }),
      User.countDocuments({ role: 'doctor', 'doctorProfile.isVerified': false }),
      require('../models/Booking').countDocuments({ status: 'pending', type: 'plan_purchase' })
    ]);

    const notifications = [];
    if (pendingBlogs > 0) {
      notifications.push({
        id: 'blogs',
        text: `You have ${pendingBlogs} pending blogs to review.`,
        link: '/admin/blogs'
      });
    }
    if (pendingBookings > 0) {
      notifications.push({
        id: 'bookings',
        text: `You have ${pendingBookings} pending bookings to review.`,
        link: '/admin/payments'
      });
    }
    if (unverifiedDoctors > 0) {
      notifications.push({
        id: 'doctors',
        text: `You have ${unverifiedDoctors} unverified doctors.`,
        link: '/admin/users'
      });
    }

    return sendSuccess(res, 200, 'Notifications fetched.', { notifications });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
