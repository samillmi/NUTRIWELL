/**
 * app.js — Express application factory
 * Kept separate from server.js so it can be imported by tests without binding a port.
 */

require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const mongoSanitize= require('express-mongo-sanitize');

// ── Route modules ─────────────────────────────────────────────────────────────
const authRoutes    = require('./routes/authRoutes');
const adminRoutes   = require('./routes/adminRoutes');
const doctorRoutes  = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const dietRoutes    = require('./routes/dietRoutes');
const consultationRoutes = require('./routes/consultationRoutes');
const chatRoutes    = require('./routes/chatRoutes');
const aiRoutes      = require('./routes/aiRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const { sendError } = require('./utils/responseHelper');

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(mongoSanitize());               // Prevent NoSQL injection
app.use(cors({
  origin:      [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5173'],
  credentials: true,
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests, please slow down.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  message: { success: false, message: 'Too many auth attempts. Try again in 15 minutes.' },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,          // 1 minute
  max: 10,                       // 10 AI requests per minute per IP
  message: { success: false, message: 'AI rate limit exceeded. Please wait a moment.' },
});

app.use(globalLimiter);

// ── Parsing ────────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Logging ────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is healthy.', env: process.env.NODE_ENV });
});

// ── API routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',     authLimiter, authRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/doctors',  doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/diet',     dietRoutes);
app.use('/api/chat',     chatRoutes);
app.use('/api/ai',       aiLimiter, aiRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/bookings', bookingRoutes);

// ── 404 handler ────────────────────────────────────────────────────────────────
app.use((req, res) => {
  sendError(res, 404, `Route ${req.method} ${req.originalUrl} not found.`);
});

// ── Global error handler ───────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);

  const statusCode = err.statusCode || 500;
  const message    = process.env.NODE_ENV === 'production'
    ? 'An internal server error occurred.'
    : err.message;

  sendError(res, statusCode, message);
});

module.exports = app;
