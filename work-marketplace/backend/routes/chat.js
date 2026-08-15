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

    // Ensure the requesting user is either the poster or assigned worker
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const isParty =
      job.posterId.equals(req.user._id) ||
      (job.assignedWorkerId && job.assignedWorkerId.equals(req.user._id));

    if (!isParty) {
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

module.exports = router;
