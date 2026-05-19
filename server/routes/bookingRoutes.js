const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { patientOnly, doctorOrAdmin } = require('../middleware/rbacMiddleware');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const Booking = require('../models/Booking');
const DietPlan = require('../models/DietPlan');

// GET /api/bookings — Get all bookings (Admin only)
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return sendError(res, 403, 'Not authorized.');
    }

    // Auto-fix: find confirmed plan_purchase bookings and confirm their group consultations
    const confirmedPlanBookings = await Booking.find({
      type: 'plan_purchase',
      status: 'confirmed'
    });

    for (const pb of confirmedPlanBookings) {
      const groupMatch = pb.reason?.match(/\[Group: ([a-z0-9]+)\]/i);
      if (groupMatch) {
        const groupId = groupMatch[1];
        await Booking.updateMany(
          { reason: new RegExp(`\\[Group: ${groupId}\\]`), status: 'pending' },
          { status: 'confirmed' }
        );
      }
    }

    const bookings = await Booking.find()
      .populate('patient', 'firstName lastName email')
      .populate('doctor', 'firstName lastName email')
      .sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'All bookings fetched.', { bookings });
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch bookings.');
  }
});

// POST /api/bookings — Create a new booking (Patient only)
router.post('/', protect, patientOnly, async (req, res) => {
  try {
    const { doctor, date, time, reason, type = 'consultation' } = req.body;
    
    if (type === 'consultation' && (!doctor || !date || !time || !reason)) {
      return sendError(res, 400, 'All fields are required for consultation.');
    }

    if (type === 'consultation') {
      const existingBooking = await Booking.findOne({
        doctor,
        date,
        time,
        status: { $ne: 'cancelled' }
      });
      if (existingBooking) {
        return sendError(res, 400, 'This time slot is already booked.');
      }
    }

    const status = 'confirmed';

    const booking = await Booking.create({
      patient: req.user._id,
      doctor,
      date,
      time,
      reason,
      type,
      status
    });

    if (status === 'confirmed') {
      await activateSubscriptionAndFeatures(booking, DietPlan);
    }

    return sendSuccess(res, 201, 'Booking created successfully.', { booking });
  } catch (err) {
    console.error('Failed to create booking:', err);
    return sendError(res, 500, 'Failed to create booking.');
  }
});

// POST /api/bookings/bulk — Create multiple bookings (Patient only)
router.post('/bulk', protect, patientOnly, async (req, res) => {
  try {
    const { doctor, slots, reason, type = 'consultation', plan } = req.body;
    
    if (!doctor || !slots || !Array.isArray(slots) || slots.length === 0 || !reason) {
      return sendError(res, 400, 'Doctor, slots (array), and reason are required.');
    }

    // Check for existing bookings for all slots
    for (const slot of slots) {
      const { date, time } = slot;
      const existingBooking = await Booking.findOne({
        doctor,
        date,
        time,
        status: { $ne: 'cancelled' }
      });
      if (existingBooking) {
        return sendError(res, 400, `Slot on ${new Date(date).toLocaleDateString()} at ${time} is already booked.`);
      }
    }

    // Block same plan repurchase
    if (plan) {
      const User = require('../models/User');
      const existingUser = await User.findById(req.user._id);
      
      let mappedPlan = 'free';
      if (plan === 'plan1' || plan === 'plan2') mappedPlan = 'basic';
      if (plan === 'plan3') mappedPlan = 'premium';
      
      const currentStatus = existingUser?.subscription?.status;
      
      if (currentStatus === 'active') {
        return sendError(res, 400, 'You already have an active subscription. Please cancel it or wait for it to expire before purchasing a new one.');
      }
      if (currentStatus === 'pending') {
        return sendError(res, 400, 'You have a plan purchase pending Admin approval. Please wait.');
      }
    }

    const createdBookings = [];
    const groupId = Math.random().toString(36).substring(2, 9);
    const serverReason = `${reason} [Group: ${groupId}]`;

    for (const slot of slots) {
      const { date, time } = slot;
      const booking = await Booking.create({
        patient: req.user._id,
        doctor,
        date,
        time,
        reason: serverReason,
        type,
        status: 'confirmed'
      });
      createdBookings.push(booking);
    }

    // Update user subscription to pending
    if (plan) {
      const User = require('../models/User');
      const user = await User.findById(req.user._id);
      if (user) {
        let mappedPlan = 'free';
        if (plan === 'plan1' || plan === 'basic') mappedPlan = 'basic';
        if (plan === 'plan2' || plan === 'standard') mappedPlan = 'standard';
        if (plan === 'plan3' || plan === 'premium') mappedPlan = 'premium';

        user.subscription = {
          plan: mappedPlan,
          status: 'pending',
          startDate: null,
          endDate: null
        };
        await user.save();
      }

      const planBooking = await Booking.create({
        patient: req.user._id,
        doctor,
        type: 'plan_purchase',
        status: 'confirmed',
        reason: `Purchase of ${plan} [Group: ${groupId}]`,
        date: new Date(),
        time: '00:00'
      });
      createdBookings.push(planBooking);
      
      await activateSubscriptionAndFeatures(planBooking, DietPlan);
    }

    return sendSuccess(res, 201, 'Bookings created successfully.', { bookings: createdBookings });
  } catch (err) {
    console.error('Failed to create bulk bookings:', err);
    return sendError(res, 500, 'Failed to create bulk bookings.');
  }
});

// GET /api/bookings/patient — Get bookings for patient
router.get('/patient', protect, patientOnly, async (req, res) => {
  try {
    const bookings = await Booking.find({ patient: req.user._id })
      .populate('doctor', 'firstName lastName avatar')
      .sort({ date: 1, time: 1 });
    return sendSuccess(res, 200, 'Bookings fetched.', { bookings });
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch bookings.');
  }
});

// GET /api/bookings/doctor — Get bookings for doctor
router.get('/doctor', protect, doctorOrAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find({ doctor: req.user._id, status: { $in: ['confirmed', 'pending'] } })
      .populate('patient', 'firstName lastName avatar')
      .sort({ date: 1, time: 1 });
    return sendSuccess(res, 200, 'Bookings fetched.', { bookings });
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch bookings.');
  }
});

// GET /api/bookings/available-slots — Get booked slots for a doctor on a date
router.get('/available-slots', protect, async (req, res) => {
  try {
    const { doctor, date } = req.query;
    if (!doctor || !date) {
      return sendError(res, 400, 'Doctor and date are required.');
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await Booking.find({
      doctor,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }
    }).select('time');

    const bookedTimes = bookings.map(b => b.time);

    return sendSuccess(res, 200, 'Booked slots fetched.', { bookedTimes });
  } catch (err) {
    console.error('Failed to fetch available slots:', err);
    return sendError(res, 500, 'Failed to fetch available slots.');
  }
});

async function activateSubscriptionAndFeatures(booking, DietPlan) {
  const User = require('../models/User');
  const user = await User.findById(booking.patient);
  if (user) {
    const reason = booking.reason || '';
    
    // Determine plan type
    let newPlan = 'basic';
    const isPremium = booking.type === 'scanner' || 
                      booking.type === 'chatbot' || 
                      reason.match(/(premium|plan3|scan|bot)/i) ||
                      reason.includes('6a04a14d4ba65031ebca1679'); // Premium Care Plan ID

    const isStandard = reason.match(/(standard|plan2)/i);

    if (isPremium) {
      newPlan = 'premium';
    } else if (isStandard) {
      newPlan = 'standard';
    } else if (reason.match(/(plan1|basic)/i)) {
      newPlan = 'basic';
    }
    
    user.subscription = {
      plan: newPlan,
      status: 'active',
      startDate: user.subscription?.startDate || new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
    if (booking.doctor) {
      user.assignedDoctor = booking.doctor;
    }
    await user.save();
    console.log(`Subscription activated (${newPlan}) for user: ${user._id}`);
  }

  if (booking.type === 'plan_purchase') {
    const match = (booking.reason || '').match(/Purchase of Diet Plan ID: ([a-f\d]{24})/i);
    if (match) {
      const planId = match[1];
      const templatePlan = await DietPlan.findById(planId);
      if (templatePlan) {
        await DietPlan.create({
          doctor: templatePlan.doctor,
          patient: booking.patient,
          parentTemplate: templatePlan._id,
          title: templatePlan.title,
          description: templatePlan.description,
          category: templatePlan.category,
          tags: templatePlan.tags,
          durationWeeks: templatePlan.durationWeeks,
          startDate: new Date(),
          weeklyPlan: templatePlan.weeklyPlan,
          weeklyCalorieTarget: templatePlan.weeklyCalorieTarget,
          restrictions: templatePlan.restrictions,
          status: 'active',
          isPublic: false
        });
      }
    }
  }
}

// PATCH /api/bookings/:id — Update booking status
router.patch('/:id', protect, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'cancelled'].includes(status)) {
      return sendError(res, 400, 'Invalid status.');
    }

    if (status === 'confirmed' && req.user.role !== 'admin') {
      return sendError(res, 403, 'Only Admin can confirm payments.');
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return sendError(res, 404, 'Booking not found.');
    }

    const isPatient = booking.patient ? booking.patient.toString() === req.user._id.toString() : false;
    const isDoctor = booking.doctor ? booking.doctor.toString() === req.user._id.toString() : false;

    if (!isPatient && !isDoctor && req.user.role !== 'admin') {
      return sendError(res, 403, 'Not authorized.');
    }

    booking.status = status;
    await booking.save();

    const groupMatch = booking.reason?.match(/\[Group: ([a-z0-9]+)\]/i);
    if (groupMatch && status === 'confirmed') {
      const groupId = groupMatch[1];
      await Booking.updateMany(
        { reason: new RegExp(`\\[Group: ${groupId}\\]`), status: 'pending' },
        { status: 'confirmed' }
      );
    }

    if (status === 'confirmed' && (booking.type === 'plan_purchase' || booking.type === 'scanner' || booking.type === 'chatbot')) {
      await activateSubscriptionAndFeatures(booking, DietPlan);
    }

    return sendSuccess(res, 200, `Booking ${status}.`, { booking });
  } catch (err) {
    return sendError(res, 500, 'Failed to update booking.');
  }
});

module.exports = router;
