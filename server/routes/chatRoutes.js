const express = require('express');
const router  = express.Router();
const { protect }          = require('../middleware/authMiddleware');
const { anyAuthenticated } = require('../middleware/rbacMiddleware');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const ChatMessage = require('../models/ChatMessage');
// GET /api/chat/unread/count
router.get('/unread/count', protect, anyAuthenticated, async (req, res) => {
  try {
    const count = await ChatMessage.countDocuments({
      receiver: req.user._id,
      'readBy.userId': { $ne: req.user._id },
      isDeleted: false
    });
    return sendSuccess(res, 200, 'Unread count fetched.', { count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return sendError(res, 500, 'Failed to fetch unread count.');
  }
});

// GET /api/chat/:partnerId  — fetch conversation history
router.get('/:partnerId', protect, anyAuthenticated, async (req, res) => {
  const { partnerId }  = req.params;
  const { limit = 30, before } = req.query;
  const conversationId = ChatMessage.makeConversationId(req.user._id, partnerId);

  const messages = await ChatMessage.getConversation(conversationId, {
    limit: Number(limit),
    before,
  });
  return sendSuccess(res, 200, 'Messages fetched.', { messages: messages.reverse() });
});

// DELETE /api/chat/message/:id  — soft-delete
router.delete('/message/:id', protect, anyAuthenticated, async (req, res) => {
  const msg = await ChatMessage.findOne({ _id: req.params.id, sender: req.user._id });
  if (!msg) return sendError(res, 404, 'Message not found.');
  msg.isDeleted = true;
  msg.deletedAt = new Date();
  msg.deletedBy = req.user._id;
  await msg.save();
  return sendSuccess(res, 200, 'Message deleted.');
});

module.exports = router;
