/**
 * server.js — HTTP server + Socket.io bootstrap
 */

require('dotenv').config();
const http      = require('http');
const app       = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./socket');

const PORT = process.env.PORT || 5000;

const start = async () => {
  // Connect to MongoDB before accepting connections
  await connectDB();

  const httpServer = http.createServer(app);

  // Mount Socket.io (returns the io instance for use elsewhere if needed)
  const io = initSocket(httpServer);

  // Make io accessible in controllers via app.locals
  app.locals.io = io;

  httpServer.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║  🥦 Dietary Platform API                 ║
║  Environment : ${(process.env.NODE_ENV || 'development').padEnd(26)}║
║  Port        : ${String(PORT).padEnd(26)}║
╚══════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
    httpServer.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
};

start().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
