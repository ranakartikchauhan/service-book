const express = require('express');
const PosterProfile = require('../models/PosterProfile');
const verifyUserToken = require('../middleware/verifyUserToken');

const router = express.Router();

router.use(verifyUserToken);

// ─── GET POSTER PROFILE ───────────────────────────────────────────────────────
// GET /api/poster/profile
router.get('/profile', async (req, res, next) => {
  try {
    const profile = await PosterProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Poster profile not found' });
    }
    res.json({ success: true, data: { profile } });
  } catch (error) {
    next(error);
  }
});

// ─── GET ANY POSTER PROFILE (for workers to view job poster) ─────────────────
// GET /api/poster/profile/:userId
router.get('/profile/:userId', async (req, res, next) => {
  try {
    const profile = await PosterProfile.findOne({ userId: req.params.userId })
      .populate('userId', 'name profilePhotoUrl');
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Poster profile not found' });
    }
    res.json({ success: true, data: { profile } });
  } catch (error) {
    next(error);
  }
});

// ─── UPDATE POSTER PROFILE ────────────────────────────────────────────────────
// PUT /api/poster/profile
router.put('/profile', async (req, res, next) => {
  try {
    const { savedAddresses } = req.body;

    const profile = await PosterProfile.findOneAndUpdate(
      { userId: req.user._id },
      { savedAddresses },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Poster profile not found' });
    }

    res.json({ success: true, data: { profile } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
