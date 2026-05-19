const express = require('express');
const router  = express.Router();
const { protect }          = require('../middleware/authMiddleware');
const { anyAuthenticated } = require('../middleware/rbacMiddleware');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { checkSubscription } = require('../middleware/subscriptionMiddleware');
const ChatMessage = require('../models/ChatMessage');
// GET /api/chat/unread/count
router.get('/unread/count', protect, anyAuthenticated, checkSubscription('basic'), async (req, res) => {
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
router.get('/:partnerId', protect, anyAuthenticated, checkSubscription('basic'), async (req, res) => {
  const { partnerId }  = req.params;
  const { limit = 30, before } = req.query;
  const conversationId = ChatMessage.makeConversationId(req.user._id, partnerId);

  const messages = await ChatMessage.getConversation(conversationId, {
    limit: Number(limit),
    before,
  });

  // Mark messages as read for the receiver
  await ChatMessage.updateMany(
    { conversationId, receiver: req.user._id, 'readBy.userId': { $ne: req.user._id } },
    { $addToSet: { readBy: { userId: req.user._id, readAt: new Date() } } }
  );

  return sendSuccess(res, 200, 'Messages fetched.', { messages: messages.reverse() });
});

// DELETE /api/chat/message/:id  — soft-delete
router.delete('/message/:id', protect, anyAuthenticated, checkSubscription('basic'), async (req, res) => {
  const msg = await ChatMessage.findOne({ _id: req.params.id, sender: req.user._id });
  if (!msg) return sendError(res, 404, 'Message not found.');
  msg.isDeleted = true;
  msg.deletedAt = new Date();
  msg.deletedBy = req.user._id;
  await msg.save();
  return sendSuccess(res, 200, 'Message deleted.');
});

const { uploadSingle } = require('../middleware/uploadMiddleware');
const cloudinary = require('../config/cloudinary');

// POST /api/chat/upload
router.post('/upload', protect, anyAuthenticated, checkSubscription('basic'), uploadSingle(), async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'No file uploaded.');
    }

    const uploadToCloudinary = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'chat_attachments' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(buffer);
      });
    };

    const result = await uploadToCloudinary(req.file.buffer);
    return sendSuccess(res, 200, 'File uploaded successfully.', { url: result.secure_url });
  } catch (error) {
    console.error('Chat attachment upload error:', error);
    return sendError(res, 500, 'Failed to upload chat attachment.');
  }
});

module.exports = router;
