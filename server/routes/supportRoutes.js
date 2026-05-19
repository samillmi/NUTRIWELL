const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/rbacMiddleware');
const SupportMessage = require('../models/SupportMessage');
const { sendSuccess, sendError } = require('../utils/responseHelper');

// GET /api/support/my — Get user's own messages
router.get('/my', protect, async (req, res) => {
  try {
    const messages = await SupportMessage.find({ sender: req.user.id }).sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Your support messages fetched.', { messages });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
});

// POST /api/support — Send message to admin
router.post('/', protect, async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) {
      return sendError(res, 400, 'Please provide subject and message.');
    }
    const supportMessage = await SupportMessage.create({
      sender: req.user.id,
      subject,
      message
    });
    return sendSuccess(res, 201, 'Message sent to admin.', { supportMessage });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
});

// GET /api/support — Get all messages for admin
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const messages = await SupportMessage.find()
      .populate('sender', 'firstName lastName email role')
      .sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Support messages fetched.', { messages });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
});

// PUT /api/support/:id — Update message status or reply (Admin)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { status, reply } = req.body;
    const updateData = {};
    
    if (status) {
      if (!['pending', 'resolved'].includes(status)) {
        return sendError(res, 400, 'Invalid status.');
      }
      updateData.status = status;
    }
    
    if (reply !== undefined) {
      updateData.reply = reply;
      updateData.repliedAt = Date.now();
      updateData.status = 'resolved'; // Auto resolve when replying
    }
    
    const message = await SupportMessage.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!message) {
      return sendError(res, 404, 'Message not found.');
    }
    return sendSuccess(res, 200, 'Message updated.', { message });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
});

module.exports = router;
