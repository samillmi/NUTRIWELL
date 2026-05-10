const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const Payment = require('../models/Payment');
const User = require('../models/User');

// POST /api/payments/checkout
// Simulate a payment processing and record it
router.post('/checkout', protect, async (req, res) => {
  try {
    const { amount, type, description, doctorId, planId, consultationDate } = req.body;

    if (amount === undefined || !type) {
      return sendError(res, 400, 'Amount and payment type are required.');
    }

    if (type === 'consultation_booking' && doctorId && consultationDate) {
      const newDate = new Date(consultationDate);
      const minDate = new Date(newDate.getTime() - 30 * 60000);
      const maxDate = new Date(newDate.getTime() + 30 * 60000);

      const existingBooking = await User.findOne({
        assignedDoctor: doctorId,
        consultationDate: { $gte: minDate, $lte: maxDate }
      });

      if (existingBooking) {
        return sendError(res, 400, 'This time slot is already booked. Please choose another time.');
      }
    }

    // Simulate Stripe Payment Processing (1 second delay)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create payment record
    const payment = await Payment.create({
      user: req.user._id,
      amount,
      type,
      description,
      doctor: doctorId || undefined,
      dietPlan: planId || undefined,
      consultationDate: consultationDate || undefined,
      stripePaymentId: `sim_txn_${Math.random().toString(36).substring(7)}`,
      status: 'completed'
    });

    // If it's a subscription upgrade, update the user
    if (type === 'subscription') {
      await User.findByIdAndUpdate(req.user._id, {
        'subscription.plan': 'premium',
        'subscription.status': 'active',
        'subscription.startDate': new Date()
      });
    }

    // If it's a consultation booking, assign the doctor to the patient so they can chat
    if (type === 'consultation_booking' && doctorId) {
      await User.findByIdAndUpdate(req.user._id, {
        assignedDoctor: doctorId,
        consultationDate: consultationDate || undefined
      });
    }

    return sendSuccess(res, 201, 'Payment processed successfully.', { payment });
  } catch (error) {
    console.error('Payment Error:', error);
    return sendError(res, 500, 'Failed to process payment.');
  }
});

module.exports = router;
