/**
 * socket/videoHandler.js
 *
 * WebRTC signalling relay for Doctor ↔ Patient video consultations.
 * The server acts as a pure signalling server — no media passes through it.
 * SDP offers/answers and ICE candidates are relayed between peers.
 */

const videoHandler = (io, socket, onlineUsers) => {
  const callerId = socket.user._id.toString();

  // ── call:initiate ─────────────────────────────────────────────────────────
  // Caller sends an offer to a specific user
  socket.on('call:initiate', ({ calleeId, offer, callType = 'video' }) => {
    const calleeSocketId = onlineUsers.get(calleeId);

    if (!calleeSocketId) {
      return socket.emit('call:user-offline', { calleeId });
    }

    io.to(calleeId).emit('call:incoming', {
      callerId,
      callerName:   `${socket.user.firstName} ${socket.user.lastName}`,
      callerAvatar: socket.user.avatar,
      callerRole:   socket.user.role,
      offer,
      callType,
    });
  });

  // ── call:answer ───────────────────────────────────────────────────────────
  socket.on('call:answer', ({ callerId: targetCallerId, answer }) => {
    io.to(targetCallerId).emit('call:answered', { answer });
  });

  // ── call:reject ───────────────────────────────────────────────────────────
  socket.on('call:reject', ({ callerId: targetCallerId }) => {
    io.to(targetCallerId).emit('call:rejected', { by: callerId });
  });

  // ── call:end ───────────────────────────────────────────────────────────────
  socket.on('call:end', ({ peerId }) => {
    io.to(peerId).emit('call:ended', { by: callerId });
  });

  // ── ice:candidate ─────────────────────────────────────────────────────────
  // Relay ICE candidates between peers for NAT traversal
  socket.on('ice:candidate', ({ peerId, candidate }) => {
    io.to(peerId).emit('ice:candidate', { from: callerId, candidate });
  });
};

module.exports = videoHandler;
