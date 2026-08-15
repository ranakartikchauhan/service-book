const express = require('express');
const SafetyEvent = require('../models/SafetyEvent');
const Job = require('../models/Job');
const verifyUserToken = require('../middleware/verifyUserToken');
const { SAFETY_STATUS, JOB_STATUS } = require('../config/constants');

const router = express.Router();
router.use(verifyUserToken);

// ─── TRIGGER SOS ──────────────────────────────────────────────────────────────
// POST /api/safety/sos
router.post('/sos', async (req, res, next) => {
  try {
    const { jobId, longitude, latitude } = req.body;

    if (!jobId || longitude === undefined || latitude === undefined) {
      return res.status(400).json({ success: false, message: 'jobId, longitude, and latitude are required' });
    }

    // Verify the user is actually an active participant in this job
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const isParty =
      job.posterId.equals(req.user._id) ||
      (job.assignedWorkerId && job.assignedWorkerId.equals(req.user._id));

    if (!isParty) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (job.status !== JOB_STATUS.IN_PROGRESS) {
      return res.status(400).json({ success: false, message: 'SOS can only be triggered during an active job' });
    }

    const safetyEvent = await SafetyEvent.create({
      userId: req.user._id,
      jobId,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
    });

    // Broadcast to admin via Socket.io (admin room)
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('safety:sos', {
        safetyEventId: safetyEvent._id,
        userId: req.user._id,
        userName: req.user.name,
        jobId,
        location: safetyEvent.location,
        triggeredAt: safetyEvent.triggeredAt,
      });
    }

    res.status(201).json({
      success: true,
      message: 'SOS alert triggered. Our team has been notified.',
      data: { safetyEventId: safetyEvent._id },
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET ACTIVE SAFETY EVENTS (admin-callable, but accessible from user side too) ─
// Worker/poster can check their own active events
// GET /api/safety/my-events
router.get('/my-events', async (req, res, next) => {
  try {
    const events = await SafetyEvent.find({ userId: req.user._id })
      .populate('jobId', 'title')
      .sort({ triggeredAt: -1 });

    res.json({ success: true, data: { events } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
