const express = require('express');
const router  = express.Router();
const { protect }       = require('../middleware/authMiddleware');
const { doctorOrAdmin, anyAuthenticated, verifiedDoctor } = require('../middleware/rbacMiddleware');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const DietPlan = require('../models/DietPlan');

// GET /api/diet  — list plans (doctor sees their own; patient sees assigned)
router.get('/', protect, anyAuthenticated, async (req, res) => {
  const filter = req.user.role === 'doctor'
    ? { doctor: req.user._id }
    : { patient: req.user._id };
  const plans = await DietPlan.find(filter)
    .populate('doctor',  'firstName lastName')
    .populate('patient', 'firstName lastName')
    .sort({ createdAt: -1 });
  return sendSuccess(res, 200, 'Diet plans fetched.', { plans });
});

// GET /api/diet/public — list public templates
router.get('/public', protect, async (req, res) => {
  const plans = await DietPlan.find({ isPublic: true })
    .populate({
      path: 'doctor',
      match: { 'doctorProfile.isVerified': true },
      select: 'firstName lastName avatar doctorProfile.specialization doctorProfile.rating'
    })
    .sort({ createdAt: -1 });

  // Filter out plans from unverified doctors
  const verifiedPlans = plans.filter(p => p.doctor !== null);

  // Filter out plans already purchased by this patient
  let finalPlans = verifiedPlans;
  if (req.user && req.user.role === 'patient') {
    const purchasedPlans = await DietPlan.find({ patient: req.user._id, parentTemplate: { $ne: null } }).select('parentTemplate');
    const purchasedIds = purchasedPlans.map(p => p.parentTemplate.toString());
    finalPlans = verifiedPlans.filter(p => !purchasedIds.includes(p._id.toString()));
  }

  // Calculate rating for each public plan from its copies
  const plansWithRatings = await Promise.all(finalPlans.map(async (plan) => {
    const copies = await DietPlan.find({ parentTemplate: plan._id, patientRating: { $gt: 0 } });
    const totalRating = copies.reduce((sum, p) => sum + p.patientRating, 0);
    const avgRating = copies.length > 0 ? totalRating / copies.length : 5.0;
    const totalReviews = copies.length;
    
    return {
      ...plan.toJSON(),
      rating: parseFloat(avgRating.toFixed(1)),
      totalReviews
    };
  }));

  return sendSuccess(res, 200, 'Public diet plans fetched.', { plans: plansWithRatings });
});

// GET /api/diet/:id
router.get('/:id', protect, anyAuthenticated, async (req, res) => {
  const plan = await DietPlan.findById(req.params.id)
    .populate('doctor',  'firstName lastName avatar')
    .populate('patient', 'firstName lastName avatar');
  if (!plan) return sendError(res, 404, 'Plan not found.');
  return sendSuccess(res, 200, 'Plan fetched.', { plan });
});

// POST /api/diet  — doctors create plans
router.post('/', protect, verifiedDoctor, async (req, res) => {
  const plan = await DietPlan.create({ ...req.body, doctor: req.user._id });
  return sendSuccess(res, 201, 'Diet plan created.', { plan });
});

// PUT /api/diet/:id
router.put('/:id', protect, verifiedDoctor, async (req, res) => {
  const plan = await DietPlan.findOneAndUpdate(
    { _id: req.params.id, doctor: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!plan) return sendError(res, 404, 'Plan not found or unauthorized.');
  return sendSuccess(res, 200, 'Plan updated.', { plan });
});

// DELETE /api/diet/:id
router.delete('/:id', protect, verifiedDoctor, async (req, res) => {
  const plan = await DietPlan.findOneAndDelete({ _id: req.params.id, doctor: req.user._id });
  if (!plan) return sendError(res, 404, 'Plan not found or unauthorized.');
  return sendSuccess(res, 200, 'Plan deleted.');
});

// PATCH /api/diet/:id/feedback — patients submit feedback
router.patch('/:id/feedback', protect, async (req, res) => {
  const { patientRating, doctorRating, patientFeedback } = req.body;
  const plan = await DietPlan.findOneAndUpdate(
    { _id: req.params.id, patient: req.user._id },
    { patientRating, doctorRating, patientFeedback },
    { new: true, runValidators: true }
  );
  if (!plan) return sendError(res, 404, 'Plan not found or unauthorized.');

  // Calculate average rating for the doctor
  const User = require('../models/User');
  const doctorId = plan.doctor;
  
  // Fetch all plans for this doctor that have doctorRating
  const plans = await DietPlan.find({ doctor: doctorId, doctorRating: { $gt: 0 } });
  
  const totalRating = plans.reduce((sum, p) => sum + p.doctorRating, 0);
  const avgRating = plans.length > 0 ? totalRating / plans.length : 5.0;
  const totalReviews = plans.length;
  
  // Update doctor profile
  await User.findByIdAndUpdate(doctorId, {
    'doctorProfile.rating': parseFloat(avgRating.toFixed(1)),
    'doctorProfile.totalReviews': totalReviews
  });

  return sendSuccess(res, 200, 'Feedback submitted.', { plan });
});

module.exports = router;
