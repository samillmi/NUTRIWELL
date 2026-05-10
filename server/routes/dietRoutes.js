const express = require('express');
const router  = express.Router();
const { protect }       = require('../middleware/authMiddleware');
const { doctorOrAdmin, anyAuthenticated } = require('../middleware/rbacMiddleware');
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
    .populate('doctor', 'firstName lastName avatar doctorProfile.specialization')
    .sort({ createdAt: -1 });
  return sendSuccess(res, 200, 'Public diet plans fetched.', { plans });
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
router.post('/', protect, doctorOrAdmin, async (req, res) => {
  const plan = await DietPlan.create({ ...req.body, doctor: req.user._id });
  return sendSuccess(res, 201, 'Diet plan created.', { plan });
});

// PUT /api/diet/:id
router.put('/:id', protect, doctorOrAdmin, async (req, res) => {
  const plan = await DietPlan.findOneAndUpdate(
    { _id: req.params.id, doctor: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!plan) return sendError(res, 404, 'Plan not found or unauthorized.');
  return sendSuccess(res, 200, 'Plan updated.', { plan });
});

// DELETE /api/diet/:id
router.delete('/:id', protect, doctorOrAdmin, async (req, res) => {
  const plan = await DietPlan.findOneAndDelete({ _id: req.params.id, doctor: req.user._id });
  if (!plan) return sendError(res, 404, 'Plan not found or unauthorized.');
  return sendSuccess(res, 200, 'Plan deleted.');
});

module.exports = router;
