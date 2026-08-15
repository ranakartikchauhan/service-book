require('dotenv').config();
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const ChatMessage = require('./models/ChatMessage');
const Job = require('./models/Job');
const User = require('./models/User');
const WorkerProfile = require('./models/WorkerProfile');
const SafetyEvent = require('./models/SafetyEvent');
const EmergencyContact = require('./models/EmergencyContact');
const { notifyNewMessage } = require('./services/fcmService');
const { dispatchNotification } = require('./services/notificationService');

const app = express();
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' }));
app.use(express.json());

// ─── HTTP Health Check for Render ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'WorkMarket WebSocket Gateway',
    connections: io.engine?.clientsCount || 0,
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'WorkMarket Real-Time WebSocket Gateway',
    version: '3.0.0',
    status: 'online',
  });
});

const server = http.createServer(app);

// ─── Socket.io Gateway ────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

// ─── Auth Middleware ──────────────────────────────────────────────────────────
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    // Check if it's admin connecting
    const adminToken = socket.handshake.auth?.adminToken;
    if (adminToken) {
      try {
        const decodedAdmin = jwt.verify(adminToken, process.env.ADMIN_JWT_SECRET);
        socket.isAdmin = true;
        socket.userId = decodedAdmin.id || 'admin';
        return next();
      } catch {
        return next(new Error('Invalid admin token'));
      }
    }
    return next(new Error('Authentication token required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error('Invalid or expired authentication token'));
  }
});

// ─── Real-Time Event Handlers ─────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 [Socket Connected] User: ${socket.userId} (Admin: ${Boolean(socket.isAdmin)})`);

  // If authenticated as admin, automatically join the high-priority admin-room
  if (socket.isAdmin) {
    socket.join('admin-room');
    console.log(`🛡️ [Admin Joined] Admin listening to safety alerts`);
  }

  // ─── 1. JOIN JOB ROOM ───────────────────────────────────────────────────────
  socket.on('chat:join', async ({ jobId }) => {
    try {
      if (!jobId) return;
      const job = await Job.findById(jobId);
      if (!job) return socket.emit('error', { message: 'Job not found' });

      const isParty =
        socket.isAdmin ||
        job.posterId.equals(socket.userId) ||
        (job.assignedWorkerId && job.assignedWorkerId.equals(socket.userId));

      if (!isParty) return socket.emit('error', { message: 'Not authorized for this chat' });

      socket.join(`job:${jobId}`);
      console.log(`💬 User ${socket.userId} joined room job:${jobId}`);
    } catch (err) {
      console.error('chat:join error:', err);
    }
  });

  // ─── 2. CHAT MESSAGE EVENT ──────────────────────────────────────────────────
  socket.on('chat:message', async ({ jobId, text }) => {
    if (!text?.trim() || !jobId) return;

    try {
      const job = await Job.findById(jobId);
      if (!job) return socket.emit('error', { message: 'Job not found' });

      const isParty =
        job.posterId.equals(socket.userId) ||
        (job.assignedWorkerId && job.assignedWorkerId.equals(socket.userId));
      if (!isParty) return;

      const recipientId = job.posterId.equals(socket.userId)
        ? job.assignedWorkerId
        : job.posterId;

      const message = await ChatMessage.create({
        jobId,
        senderId: socket.userId,
        recipientId,
        text: text.trim(),
      });

      const populated = await message.populate('senderId', 'name profilePhotoUrl');

      // Broadcast to room
      io.to(`job:${jobId}`).emit('chat:message', populated);

      // Check if recipient is active in room, otherwise send push
      if (recipientId) {
        const sockets = await io.in(`job:${jobId}`).fetchSockets();
        const isRecipientActive = sockets.some((s) => s.userId === recipientId.toString());

        if (!isRecipientActive) {
          const sender = await User.findById(socket.userId);
          await dispatchNotification({
            userId: recipientId,
            category: 'messages',
            title: `New message from ${sender?.name || 'Someone'}`,
            body: text.trim(),
            data: { jobId: jobId.toString(), type: 'chat' },
          });
        }
      }
    } catch (err) {
      console.error('chat:message error:', err);
    }
  });

  // ─── 3. LIVE GPS LOCATION STREAMING (Worker Approaching Tracker) ────────────
  socket.on('worker:location_update', async ({ jobId, longitude, latitude }) => {
    if (!jobId || longitude === undefined || latitude === undefined) return;

    try {
      // Broadcast live coordinates to poster watching this job
      io.to(`job:${jobId}`).emit('worker:location_update', {
        jobId,
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        timestamp: new Date(),
      });

      // Update worker live location in database
      await WorkerProfile.findOneAndUpdate(
        { userId: socket.userId },
        {
          liveLocation: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
            updatedAt: new Date(),
          },
        }
      );
    } catch (err) {
      console.error('worker:location_update error:', err);
    }
  });

  // ─── 4. EMERGENCY SOS TRIGGER BROADCAST ────────────────────────────────────
  socket.on('safety:sos', async ({ jobId, longitude, latitude }) => {
    try {
      const user = await User.findById(socket.userId);
      const emergencyContact = await EmergencyContact.findOne({ userId: socket.userId });
      const job = await Job.findById(jobId);

      const safetyEvent = await SafetyEvent.create({
        userId: socket.userId,
        jobId,
        location: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
      });

      // Broadcast to admin dashboard monitor room
      io.to('admin-room').emit('safety:sos', {
        safetyEventId: safetyEvent._id,
        userId: socket.userId,
        userName: user?.name,
        userPhone: user?.phone,
        emergencyContact,
        jobId,
        jobTitle: job?.title,
        location: safetyEvent.location,
        triggeredAt: safetyEvent.triggeredAt,
      });

      console.log(`🚨 [SOS BROADCAST] Dispatched for user ${socket.userId}`);
    } catch (err) {
      console.error('safety:sos socket error:', err);
    }
  });

  // ─── 5. DISCONNECT ──────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`🔌 [Socket Disconnected] User: ${socket.userId}`);
  });
});

// ─── Start Standalone Gateway ─────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`⚡ WorkMarket WebSocket Gateway running on port ${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
    console.log(`======================================================\n`);
  });
});
