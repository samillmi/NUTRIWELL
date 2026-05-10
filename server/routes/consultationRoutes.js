const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const User = require('../models/User');

// GET /api/consultations/doctor/:doctorId
// Fetch all booked consultation dates for a specific doctor
router.get('/doctor/:doctorId', protect, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const mongoose = require('mongoose');

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return sendSuccess(res, 200, 'Booked slots fetched (invalid ID).', { bookedSlots: [] });
    }

    const patients = await User.find({
      role: 'patient',
      assignedDoctor: doctorId,
      consultationDate: { $exists: true, $ne: null }
    }).select('firstName lastName consultationDate');

    const bookedSlots = patients.map(p => ({
      patientId: p._id,
      patientName: `${p.firstName} ${p.lastName}`,
      date: p.consultationDate
    }));

    return sendSuccess(res, 200, 'Booked slots fetched.', { bookedSlots });
  } catch (error) {
    console.error('Error fetching booked slots:', error);
    return sendError(res, 500, 'Failed to fetch booked slots.');
  }
});

module.exports = router;
