const jwt = require('jsonwebtoken');
const ChatMessage = require('../models/ChatMessage');
const Job = require('../models/Job');
const { notifyNewMessage } = require('../services/fcmService');
const User = require('../models/User');

/**
 * Initialize Socket.io chat on the HTTP server.
 * Call this in server.js after creating the http server.
 */
const initChatSocket = (io) => {
  // Authenticate socket connections with user JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: user ${socket.userId}`);

    // ─── JOIN JOB ROOM ─────────────────────────────────────────────────────
    socket.on('chat:join', async ({ jobId }) => {
      // Verify user is a participant in this job before letting them join the room
      const job = await Job.findById(jobId);
      if (!job) return socket.emit('error', { message: 'Job not found' });

      const isParty =
        job.posterId.equals(socket.userId) ||
        (job.assignedWorkerId && job.assignedWorkerId.equals(socket.userId));

      if (!isParty) return socket.emit('error', { message: 'Not authorized for this chat' });

      socket.join(`job:${jobId}`);
      socket.currentJobId = jobId;
    });

    // ─── SEND MESSAGE ──────────────────────────────────────────────────────
    socket.on('chat:message', async ({ jobId, text }) => {
      if (!text?.trim()) return;

      try {
        const job = await Job.findById(jobId);
        if (!job) return socket.emit('error', { message: 'Job not found' });

        const isParty =
          job.posterId.equals(socket.userId) ||
          (job.assignedWorkerId && job.assignedWorkerId.equals(socket.userId));
        if (!isParty) return;

        // Save to DB
        const message = await ChatMessage.create({
          jobId,
          senderId: socket.userId,
          text: text.trim(),
        });

        const populated = await message.populate('senderId', 'name profilePhotoUrl');

        // Broadcast to everyone in the job room (including sender, for consistency)
        io.to(`job:${jobId}`).emit('chat:message', populated);

        // Push notification to the OTHER party (if they're not in the socket room)
        const recipientId = job.posterId.equals(socket.userId)
          ? job.assignedWorkerId
          : job.posterId;

        if (recipientId) {
          const recipient = await User.findById(recipientId);
          const sockets = await io.in(`job:${jobId}`).fetchSockets();
          const recipientOnline = sockets.some((s) => s.userId === recipientId.toString());

          // Only push notify if recipient isn't actively in the chat socket room
          if (!recipientOnline && recipient?.fcmToken) {
            const sender = await User.findById(socket.userId);
            notifyNewMessage(recipient.fcmToken, sender?.name || 'Someone');
          }
        }
      } catch (error) {
        console.error('chat:message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ─── TYPING INDICATOR ──────────────────────────────────────────────────
    socket.on('chat:typing', ({ jobId }) => {
      socket.to(`job:${jobId}`).emit('chat:typing', { userId: socket.userId });
    });

    // ─── ADMIN ROOM (for real-time SOS events) ─────────────────────────────
    socket.on('admin:join', ({ adminToken }) => {
      try {
        const decoded = jwt.verify(adminToken, process.env.ADMIN_JWT_SECRET);
        if (decoded.role === 'admin') {
          socket.join('admin-room');
        }
      } catch {
        socket.emit('error', { message: 'Invalid admin token' });
      }
    });

    // ─── DISCONNECT ────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: user ${socket.userId}`);
    });
  });
};

module.exports = initChatSocket;
