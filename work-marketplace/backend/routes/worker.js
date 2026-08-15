const express = require('express');
const WorkerProfile = require('../models/WorkerProfile');
const verifyUserToken = require('../middleware/verifyUserToken');
const { uploadPublic, uploadPrivate, getSignedUrl } = require('../services/cloudinaryService');
const { VERIFICATION_STATUS } = require('../config/constants');

const router = express.Router();

// All worker routes require auth
router.use(verifyUserToken);

// ─── GET WORKER PROFILE ───────────────────────────────────────────────────────
// GET /api/worker/profile
router.get('/profile', async (req, res, next) => {
  try {
    const profile = await WorkerProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Worker profile not found' });
    }
    res.json({ success: true, data: { profile } });
  } catch (error) {
    next(error);
  }
});

// ─── GET ANY WORKER PROFILE (for poster to view applicant) ───────────────────
// GET /api/worker/profile/:userId
router.get('/profile/:userId', async (req, res, next) => {
  try {
    const profile = await WorkerProfile.findOne({ userId: req.params.userId })
      .populate('userId', 'name profilePhotoUrl');

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Worker profile not found' });
    }

    // Strip sensitive payout details from public view
    const publicProfile = profile.toObject();
    delete publicProfile.payoutDetails;

    res.json({ success: true, data: { profile: publicProfile } });
  } catch (error) {
    next(error);
  }
});

// ─── UPDATE WORKER PROFILE ────────────────────────────────────────────────────
// PUT /api/worker/profile
router.put('/profile', async (req, res, next) => {
  try {
    const allowedFields = [
      'skills', 'bio', 'experienceYears', 'hourlyRateRange',
      'availability', 'serviceRadius', 'homeLocation',
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const profile = await WorkerProfile.findOneAndUpdate(
      { userId: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Worker profile not found' });
    }

    res.json({ success: true, data: { profile } });
  } catch (error) {
    next(error);
  }
});

// ─── UPLOAD PROFILE PHOTO ─────────────────────────────────────────────────────
// POST /api/worker/profile/photo
router.post('/profile/photo', uploadPublic.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No photo uploaded' });
    }

    const { path: photoUrl } = req.file;
    const { User } = require('../models/User');
    await require('../models/User').findByIdAndUpdate(req.user._id, { profilePhotoUrl: photoUrl });

    res.json({ success: true, data: { photoUrl } });
  } catch (error) {
    next(error);
  }
});

// ─── SUBMIT ID VERIFICATION ───────────────────────────────────────────────────
// POST /api/worker/verification/submit
router.post(
  '/verification/submit',
  uploadPrivate.single('idDoc'), // stored with authenticated access
  async (req, res, next) => {
    try {
      const { idType } = req.body;

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'ID document is required' });
      }
      if (!idType) {
        return res.status(400).json({ success: false, message: 'ID type is required' });
      }

      const profile = await WorkerProfile.findOneAndUpdate(
        { userId: req.user._id },
        {
          'verification.status': VERIFICATION_STATUS.PENDING,
          'verification.idDocUrl': req.file.path,
          'verification.idType': idType,
          'verification.submittedAt': new Date(),
        },
        { new: true }
      );

      res.json({
        success: true,
        message: 'Verification documents submitted. Admin will review within 24-48 hours.',
        data: { verificationStatus: profile.verification.status },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── GET WORKER EARNINGS ──────────────────────────────────────────────────────
// GET /api/worker/earnings
router.get('/earnings', async (req, res, next) => {
  try {
    const Transaction = require('../models/Transaction');

    const transactions = await Transaction.find({
      workerId: req.user._id,
      status: 'released',
    })
      .populate('jobId', 'title scheduledDate')
      .sort({ releasedAt: -1 });

    const profile = await WorkerProfile.findOne({ userId: req.user._id });

    res.json({
      success: true,
      data: {
        earningsTotal: profile?.earningsTotal || 0,
        transactions,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── UPDATE PAYOUT DETAILS ────────────────────────────────────────────────────
// PUT /api/worker/payout-details
router.put('/payout-details', async (req, res, next) => {
  try {
    const { bankAccountNumber, ifscCode, upiId } = req.body;

    const profile = await WorkerProfile.findOneAndUpdate(
      { userId: req.user._id },
      { payoutDetails: { bankAccountNumber, ifscCode, upiId } },
      { new: true }
    );

    res.json({ success: true, message: 'Payout details updated' });
  } catch (error) {
    next(error);
  }
});

// ─── AVAILABILITY TOGGLE ("Available Now" - V2) ──────────────────────────────
// PUT /api/worker/availability-toggle
router.put('/availability-toggle', async (req, res, next) => {
  try {
    const { isAvailableNow, longitude, latitude } = req.body;
    const updates = {};
    if (isAvailableNow !== undefined) updates.isAvailableNow = Boolean(isAvailableNow);
    if (longitude !== undefined && latitude !== undefined) {
      updates.liveLocation = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        updatedAt: new Date(),
      };
    }

    const profile = await WorkerProfile.findOneAndUpdate(
      { userId: req.user._id },
      updates,
      { new: true }
    );

    res.json({
      success: true,
      message: `Availability updated: ${profile.isAvailableNow ? 'Active' : 'Offline'}`,
      data: { isAvailableNow: profile.isAvailableNow, liveLocation: profile.liveLocation },
    });
  } catch (error) {
    next(error);
  }
});

// ─── SAVED SEARCHES (V2) ──────────────────────────────────────────────────────
const SavedSearch = require('../models/SavedSearch');

// GET /api/worker/saved-searches
router.get('/saved-searches', async (req, res, next) => {
  try {
    const searches = await SavedSearch.find({ workerId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: { searches } });
  } catch (error) {
    next(error);
  }
});

// POST /api/worker/saved-searches
router.post('/saved-searches', async (req, res, next) => {
  try {
    const { title, category, longitude, latitude, addressText, radiusKm, minBudget, pushAlerts } = req.body;
    if (!longitude || !latitude) {
      return res.status(400).json({ success: false, message: 'Location coordinates are required' });
    }

    const savedSearch = await SavedSearch.create({
      workerId: req.user._id,
      title: title || 'Nearby Job Alert',
      category: category || null,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        addressText,
      },
      radiusKm: radiusKm ? parseFloat(radiusKm) : 10,
      minBudget: minBudget ? parseFloat(minBudget) : 0,
      pushAlerts: pushAlerts !== undefined ? Boolean(pushAlerts) : true,
    });

    res.status(201).json({ success: true, message: 'Saved search created', data: { savedSearch } });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/worker/saved-searches/:id
router.delete('/saved-searches/:id', async (req, res, next) => {
  try {
    const deleted = await SavedSearch.findOneAndDelete({
      _id: req.params.id,
      workerId: req.user._id,
    });
    if (!deleted) return res.status(404).json({ success: false, message: 'Saved search not found' });
    res.json({ success: true, message: 'Saved search removed' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
