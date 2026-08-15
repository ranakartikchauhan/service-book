require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

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
const subscriptionsRoutes = require('./routes/subscriptions');
const notificationsRoutes = require('./routes/notifications');

const app = express();
const server = http.createServer(app);

// ─── Socket.io (Initialized only when not in serverless mode) ────────────────
if (!process.env.VERCEL) {
  const { Server } = require('socket.io');
  const initChatSocket = require('./sockets/chatSocket');

  const io = new Server(server, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      methods: ['GET', 'POST'],
    },
  });

  app.set('io', io);
  initChatSocket(io);
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  })
);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Ensure DB is connected before processing requests in serverless environments
app.use(async (req, res, next) => {
  // Allow health checks to pass even during cold start
  if (req.path === '/' || req.path === '/api/health') {
    return next();
  }
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed. Please ensure MONGO_URI environment variable is configured in Vercel.',
      error: err.message,
    });
  }
});

// Rate limit for all API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Too many auth attempts. Please wait 15 minutes.' },
});

// Razorpay webhook needs raw body for HMAC verification — mount BEFORE express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Root & Health Check ──────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'Work Marketplace REST API',
    status: 'online',
    version: '3.0.0',
    environment: process.env.NODE_ENV || 'production',
    health: '/api/health',
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/worker', apiLimiter, workerRoutes);
app.use('/api/poster', apiLimiter, posterRoutes);
app.use('/api/jobs', apiLimiter, jobsRoutes);
app.use('/api/chat', apiLimiter, chatRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/reviews', apiLimiter, reviewsRoutes);
app.use('/api/safety', apiLimiter, safetyRoutes);
app.use('/api/subscriptions', apiLimiter, subscriptionsRoutes);
app.use('/api/notifications', apiLimiter, notificationsRoutes);
app.use('/api/admin', adminRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found` });
});

// ─── Global error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

// ─── Start server for local development or traditional host ──────────────────
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .catch((err) => console.warn('⚠️ MongoDB not connected on boot:', err.message))
    .finally(() => {
      server.listen(PORT, () => {
        console.log(`\n🚀 Work Marketplace API running on port ${PORT}`);
        console.log(`   Environment: ${process.env.NODE_ENV}`);
        console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
      });
    });
}

module.exports = { app, server };
