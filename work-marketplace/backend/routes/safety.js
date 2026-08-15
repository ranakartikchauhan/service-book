const express = require('express');
const SafetyEvent = require('../models/SafetyEvent');
const EmergencyContact = require('../models/EmergencyContact');
const Job = require('../models/Job');
const WorkerProfile = require('../models/WorkerProfile');
const verifyUserToken = require('../middleware/verifyUserToken');
const { SAFETY_STATUS, JOB_STATUS } = require('../config/constants');
const { dispatchNotification } = require('../services/notificationService');

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

    if (![JOB_STATUS.ASSIGNED, JOB_STATUS.IN_PROGRESS].includes(job.status)) {
      return res.status(400).json({ success: false, message: 'SOS can only be triggered during an active job session' });
    }

    const emergencyContact = await EmergencyContact.findOne({ userId: req.user._id });

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
        userPhone: req.user.phone,
        emergencyContact,
        jobId,
        jobTitle: job.title,
        location: safetyEvent.location,
        triggeredAt: safetyEvent.triggeredAt,
      });
    }

    // Dispatch urgent in-app and push notification record
    await dispatchNotification({
      userId: req.user._id,
      category: 'safety',
      title: '🚨 Emergency SOS Dispatched',
      body: 'Our 24/7 Safety Team has received your alert with your live GPS location. Help is on the way.',
      data: { safetyEventId: safetyEvent._id.toString(), jobId: jobId.toString() },
      urgent: true,
    });

    res.status(201).json({
      success: true,
      message: 'SOS alert triggered. Our team and emergency contacts have been notified.',
      data: { safetyEventId: safetyEvent._id, emergencyContact },
    });
  } catch (error) {
    next(error);
  }
});

// ─── EMERGENCY CONTACT MANAGEMENT ─────────────────────────────────────────────
// GET /api/safety/emergency-contact
router.get('/emergency-contact', async (req, res, next) => {
  try {
    const contact = await EmergencyContact.findOne({ userId: req.user._id });
    res.json({ success: true, data: { contact } });
  } catch (error) {
    next(error);
  }
});

// PUT /api/safety/emergency-contact
router.put('/emergency-contact', async (req, res, next) => {
  try {
    const { name, phone, relationship } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone number are required' });
    }

    const contact = await EmergencyContact.findOneAndUpdate(
      { userId: req.user._id },
      { name, phone, relationship: relationship || 'Family/Friend' },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, message: 'Emergency contact saved', data: { contact } });
  } catch (error) {
    next(error);
  }
});

// ─── LIVE LOCATION SHARING (During Active Job Session) ────────────────────────
// PUT /api/safety/live-location
router.put('/live-location', async (req, res, next) => {
  try {
    const { jobId, longitude, latitude } = req.body;
    if (!jobId || longitude === undefined || latitude === undefined) {
      return res.status(400).json({ success: false, message: 'jobId, longitude, and latitude are required' });
    }

    const job = await Job.findOne({
      _id: jobId,
      assignedWorkerId: req.user._id,
      status: { $in: [JOB_STATUS.ASSIGNED, JOB_STATUS.IN_PROGRESS] },
    });

    if (!job) {
      return res.status(400).json({ success: false, message: 'No active job found for live location sharing' });
    }

    await WorkerProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        liveLocation: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
          updatedAt: new Date(),
        },
      }
    );

    // Broadcast location update to the poster via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`job:${jobId}`).emit('worker:location_update', {
        jobId,
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        timestamp: new Date(),
      });
    }

    res.json({ success: true, message: 'Location updated' });
  } catch (error) {
    next(error);
  }
});

// GET /api/safety/live-location/:jobId
router.get('/live-location/:jobId', async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    // Allow poster or assigned worker
    const isAuthorized = job.posterId.equals(req.user._id) || (job.assignedWorkerId && job.assignedWorkerId.equals(req.user._id));
    if (!isAuthorized) return res.status(403).json({ success: false, message: 'Unauthorized' });

    if (!job.assignedWorkerId) {
      return res.status(400).json({ success: false, message: 'No worker assigned yet' });
    }

    const workerProfile = await WorkerProfile.findOne({ userId: job.assignedWorkerId })
      .populate('userId', 'name phone profilePhotoUrl');

    res.json({
      success: true,
      data: {
        worker: workerProfile?.userId,
        liveLocation: workerProfile?.liveLocation || null,
        jobLocation: job.location,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET USER'S SAFETY EVENTS ─────────────────────────────────────────────────
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
