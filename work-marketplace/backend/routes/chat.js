const express = require('express');
const ChatMessage = require('../models/ChatMessage');
const Job = require('../models/Job');
const verifyUserToken = require('../middleware/verifyUserToken');

const router = express.Router();
router.use(verifyUserToken);

// ─── GET MESSAGES FOR A JOB ───────────────────────────────────────────────────
// GET /api/chat/:jobId/messages?page=1&limit=50
router.get('/:jobId/messages', async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    // Ensure the requesting user is either the poster, assigned worker, or applicant
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const posterIdStr = (job.posterId?._id || job.posterId)?.toString();
    const assignedWorkerIdStr = (job.assignedWorkerId?._id || job.assignedWorkerId)?.toString();
    const userIdStr = req.user._id?.toString();

    const isPoster = posterIdStr === userIdStr;
    const isAssignedWorker = assignedWorkerIdStr === userIdStr;
    const isApplicant = await require('../models/Application').exists({
      jobId: job._id,
      workerId: req.user._id,
    });

    if (!isPoster && !isAssignedWorker && !isApplicant && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this chat' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await ChatMessage.find({ jobId: req.params.jobId })
      .populate('senderId', 'name profilePhotoUrl')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Mark all messages from the other party as read
    await ChatMessage.updateMany(
      {
        jobId: req.params.jobId,
        senderId: { $ne: req.user._id },
        readAt: null,
      },
      { readAt: new Date() }
    );

    res.json({ success: true, data: { messages, page: parseInt(page) } });
  } catch (error) {
    next(error);
  }
});

// ─── SEND MESSAGE ─────────────────────────────────────────────────────────────
// POST /api/chat/:jobId/messages
router.post('/:jobId/messages', async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const posterIdStr = (job.posterId?._id || job.posterId)?.toString();
    const assignedWorkerIdStr = (job.assignedWorkerId?._id || job.assignedWorkerId)?.toString();
    const userIdStr = req.user._id?.toString();

    const isPoster = posterIdStr === userIdStr;
    const isAssignedWorker = assignedWorkerIdStr === userIdStr;
    const isApplicant = await require('../models/Application').exists({
      jobId: job._id,
      workerId: req.user._id,
    });

    if (!isPoster && !isAssignedWorker && !isApplicant && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to send messages in this chat' });
    }

    let recipientId = req.body.recipientId || null;
    if (!recipientId) {
      if (isPoster) {
        recipientId = job.assignedWorkerId;
        if (!recipientId) {
          const firstApp = await require('../models/Application').findOne({ jobId: job._id }).sort({ createdAt: 1 });
          if (firstApp) recipientId = firstApp.workerId;
        }
      } else {
        recipientId = job.posterId;
      }
    }

    const message = await ChatMessage.create({
      jobId: job._id,
      senderId: req.user._id,
      recipientId,
      text: text.trim(),
    });

    const populated = await ChatMessage.findById(message._id)
      .populate('senderId', 'name profilePhotoUrl');

    const io = req.app.get('io');
    if (io) {
      io.to(`job:${job._id}`).emit('chat:message', populated);
    }

    // Send push notification if recipient has FCM token
    if (recipientId) {
      const recipient = await require('../models/User').findById(recipientId);
      if (recipient?.fcmToken) {
        const { notifyNewMessage } = require('../services/fcmService');
        notifyNewMessage(recipient.fcmToken, req.user.name);
      }
    }

    res.status(201).json({ success: true, data: { message: populated } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
