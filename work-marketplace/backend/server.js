require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const initChatSocket = require('./sockets/chatSocket');

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const workerRoutes = require('./routes/worker');
const posterRoutes = require('./routes/poster');
const jobsRoutes = require('./routes/jobs');
const chatRoutes = require('./routes/chat');
const paymentsRoutes = require('./routes/payments');
const reviewsRoutes = require('./routes/reviews');
const safetyRoutes = require('./routes/safety');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST'],
  },
});

// Make io accessible to route handlers (e.g., safety.js broadcasts SOS to admin-room)
app.set('io', io);
initChatSocket(io);

// ─── Connect DB ───────────────────────────────────────────────────────────────
connectDB();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  })
);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limit for all API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

// Stricter rate limit for auth endpoints (prevents OTP/password brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts. Please wait 15 minutes.' },
});

// NOTE: Razorpay webhook needs raw body for HMAC verification — mount BEFORE express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/worker', apiLimiter, workerRoutes);
app.use('/api/poster', apiLimiter, posterRoutes);
app.use('/api/jobs', apiLimiter, jobsRoutes);
app.use('/api/chat', apiLimiter, chatRoutes);
app.use('/api/payments', paymentsRoutes); // no rate limit — webhook is sensitive
app.use('/api/reviews', apiLimiter, reviewsRoutes);
app.use('/api/safety', apiLimiter, safetyRoutes);
app.use('/api/admin', adminRoutes); // admin has its own auth layer

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found` });
});

// ─── Global error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`\n🚀 Work Marketplace API running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
  });
}

module.exports = { app, server };
