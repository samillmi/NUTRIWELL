/**
 * socket/index.js
 *
 * Bootstraps Socket.io on the HTTP server.
 * Mounts the chat and WebRTC signalling handlers.
 */

const { Server }      = require('socket.io');
const jwt             = require('jsonwebtoken');
const User            = require('../models/User');
const chatHandler     = require('./chatHandler');
const videoHandler    = require('./videoHandler');

// Map of userId → socketId for presence tracking
const onlineUsers = new Map();

const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin:      [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5173'],
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout:  60000,
    pingInterval: 25000,
  });

  // ── JWT auth middleware for Socket.io ─────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) throw new Error('No token provided');

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findById(decoded.id).select('-password');
      if (!user || !user.isActive) throw new Error('User not found or inactive');

      socket.user = user;
      next();
    } catch (err) {
      next(new Error(`Authentication failed: ${err.message}`));
    }
  });

  // ── Connection handler ────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    onlineUsers.set(userId, socket.id);

    // Join personal room for targeted events
    socket.join(userId);

    // Broadcast online status
    io.emit('user:online', { userId, role: socket.user.role });
    socket.emit('online:users', Array.from(onlineUsers.keys()));

    console.log(`[Socket] Connected: ${socket.user.fullName} (${socket.user.role}) — ${socket.id}`);

    // Mount feature handlers
    chatHandler(io, socket, onlineUsers);
    videoHandler(io, socket, onlineUsers);

    // ── Disconnect ─────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('user:offline', { userId });
      console.log(`[Socket] Disconnected: ${socket.user.fullName} — ${socket.id}`);
    });
  });

  // ── Consultation Reminder Interval ─────────────────────────────────────────
  setInterval(async () => {
    try {
      const now = new Date();
      const currentHour = String(now.getHours()).padStart(2, '0');
      const currentMinute = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${currentHour}:${currentMinute}`;
      
      const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
      
      const Booking = require('../models/Booking');
      const activeBookings = await Booking.find({
        date: today,
        time: currentTime,
        status: 'confirmed'
      }).populate('patient doctor');
      
      activeBookings.forEach(booking => {
        if (!booking.patient || !booking.doctor) return;
        
        const patientId = booking.patient._id.toString();
        const doctorId = booking.doctor._id.toString();
        
        // Emit to both
        io.to(patientId).emit('consultation:start', { booking });
        io.to(doctorId).emit('consultation:start', { booking });
        
        console.log(`[Socket] Consultation starting for ${booking.patient.firstName} and Dr. ${booking.doctor.firstName}`);
      });
    } catch (err) {
      console.error('[Socket] Error checking consultations:', err);
    }
  }, 60000); // Every minute

  return io;
};

module.exports = { initSocket, onlineUsers };
