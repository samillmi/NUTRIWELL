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

    const booking = await Booking.create({
      patient: req.user._id,
      doctor,
      date,
      time,
      reason,
      type
    });

    return sendSuccess(res, 201, 'Booking created successfully.', { booking });
  } catch (err) {
    console.error('Failed to create booking:', err);
    return sendError(res, 500, 'Failed to create booking.');
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
    const bookings = await Booking.find({ doctor: req.user._id, status: 'confirmed' })
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

    // Check permissions
    const isPatient = booking.patient ? booking.patient.toString() === req.user._id.toString() : false;
    const isDoctor = booking.doctor ? booking.doctor.toString() === req.user._id.toString() : false;

    if (!isPatient && !isDoctor && req.user.role !== 'admin') {
      return sendError(res, 403, 'Not authorized.');
    }

    booking.status = status;
    await booking.save();

    // If payment is confirmed and it's a plan purchase, copy the template to the patient
    if (status === 'confirmed' && booking.type === 'plan_purchase') {
      const reason = booking.reason || '';
      const match = reason.match(/Purchase of Diet Plan ID: ([a-f\d]{24})/i);
      
      if (match) {
        const planId = match[1];
        const templatePlan = await DietPlan.findById(planId);
        
        if (templatePlan) {
          // Create a new plan for the patient based on the template
          await DietPlan.create({
            doctor: templatePlan.doctor,
            patient: booking.patient,
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

    return sendSuccess(res, 200, `Booking ${status}.`, { booking });
  } catch (err) {
    return sendError(res, 500, 'Failed to update booking.');
  }
});

module.exports = router;
