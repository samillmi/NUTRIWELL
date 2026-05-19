const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/rbacMiddleware');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const Plan = require('../models/Plan');

// GET /api/plans — Get all plans (Public)
router.get('/', async (req, res) => {
  try {
    const plans = await Plan.find().sort({ price: 1 });
    return sendSuccess(res, 200, 'Plans fetched successfully.', { plans });
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch plans.');
  }
});

// POST /api/plans — Create a plan (Admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, price, consultations, features, gradient, popular } = req.body;
    const plan = await Plan.create({ name, price, consultations, features, gradient, popular });
    return sendSuccess(res, 201, 'Plan created successfully.', { plan });
  } catch (err) {
    return sendError(res, 500, 'Failed to create plan.');
  }
});

// PATCH /api/plans/:id — Update a plan (Admin only)
router.patch('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name, price, consultations, features, gradient, popular } = req.body;
    const plan = await Plan.findByIdAndUpdate(req.params.id, {
      name, price, consultations, features, gradient, popular
    }, { new: true });
    
    if (!plan) return sendError(res, 404, 'Plan not found.');
    
    return sendSuccess(res, 200, 'Plan updated successfully.', { plan });
  } catch (err) {
    return sendError(res, 500, 'Failed to update plan.');
  }
});

// DELETE /api/plans/:id — Delete a plan (Admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);
    if (!plan) return sendError(res, 404, 'Plan not found.');
    return sendSuccess(res, 200, 'Plan deleted successfully.');
  } catch (err) {
    return sendError(res, 500, 'Failed to delete plan.');
  }
});

module.exports = router;
