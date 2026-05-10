/**
 * socket/chatHandler.js
 *
 * Real-time text chat between Doctor ↔ Patient using Socket.io.
 * Messages are persisted to MongoDB so history survives reconnects.
 */

const ChatMessage = require('../models/ChatMessage');

const chatHandler = (io, socket, onlineUsers) => {
  const senderId = socket.user._id.toString();

  // ── send:message ──────────────────────────────────────────────────────────
  socket.on('send:message', async (payload, ack) => {
    try {
      const { receiverId, content, messageType = 'text', replyToId } = payload;

      if (!receiverId || (!content && messageType === 'text')) {
        return ack?.({ success: false, error: 'receiverId and content are required.' });
      }

      const conversationId = ChatMessage.makeConversationId(senderId, receiverId);

      const message = await ChatMessage.create({
        conversationId,
        sender:      senderId,
        receiver:    receiverId,
        messageType,
        content:     content?.trim() ?? '',
        replyTo:     replyToId || undefined,
      });

      const populated = await message.populate([
        { path: 'sender',   select: 'firstName lastName avatar role' },
        { path: 'receiver', select: 'firstName lastName avatar role' },
        { path: 'replyTo',  select: 'content sender createdAt' },
      ]);

      // Emit to receiver's personal room (works even if on a different server with Redis adapter)
      io.to(receiverId).emit('receive:message', populated);

      // Confirm to sender
      ack?.({ success: true, message: populated });

    } catch (err) {
      console.error('[Chat] send:message error:', err);
      ack?.({ success: false, error: 'Message delivery failed.' });
    }
  });

  // ── message:read ──────────────────────────────────────────────────────────
  socket.on('message:read', async ({ messageIds }) => {
    try {
      await ChatMessage.updateMany(
        { _id: { $in: messageIds }, receiver: senderId },
        { $addToSet: { readBy: { userId: senderId, readAt: new Date() } } }
      );
      // Notify the other party that messages were read
      // (they will update their UI tick indicators)
      socket.broadcast.emit('messages:read:ack', { messageIds, readBy: senderId });
    } catch (err) {
      console.error('[Chat] message:read error:', err);
    }
  });

  // ── typing:start / typing:stop ────────────────────────────────────────────
  socket.on('typing:start', ({ receiverId }) => {
    io.to(receiverId).emit('typing:start', { senderId });
  });

  socket.on('typing:stop', ({ receiverId }) => {
    io.to(receiverId).emit('typing:stop', { senderId });
  });
};

module.exports = chatHandler;
