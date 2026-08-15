const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const PosterProfile = require('../models/PosterProfile');
const verifyUserToken = require('../middleware/verifyUserToken');

const router = express.Router();

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// ─── REGISTER ────────────────────────────────────────────────────────────────
// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Name, phone and password are required' });
    }

    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Phone number already registered' });
    }

    const user = await User.create({ name, phone, passwordHash: password });

    // Create empty profiles for both modes — user can populate them later
    await WorkerProfile.create({ userId: user._id });
    await PosterProfile.create({ userId: user._id });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { token, user },
    });
  } catch (error) {
    next(error);
  }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'Phone and password are required' });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: { token, user },
    });
  } catch (error) {
    next(error);
  }
});

// ─── ADMIN LOGIN ──────────────────────────────────────────────────────────────
// POST /api/auth/admin-login
router.post('/admin-login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (
      email !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    const token = jwt.sign(
      { email, role: 'admin' },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ success: true, data: { token } });
  } catch (error) {
    next(error);
  }
});

// ─── GET CURRENT USER ─────────────────────────────────────────────────────────
// GET /api/auth/me
router.get('/me', verifyUserToken, async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

// ─── SWITCH MODE ──────────────────────────────────────────────────────────────
// PATCH /api/auth/switch-mode
router.patch('/switch-mode', verifyUserToken, async (req, res, next) => {
  try {
    const { mode } = req.body;
    if (!['worker', 'poster'].includes(mode)) {
      return res.status(400).json({ success: false, message: 'Mode must be "worker" or "poster"' });
    }

    await User.findByIdAndUpdate(req.user._id, { currentMode: mode });
    res.json({ success: true, message: `Switched to ${mode} mode` });
  } catch (error) {
    next(error);
  }
});

// ─── REGISTER FCM TOKEN ───────────────────────────────────────────────────────
// PATCH /api/auth/fcm-token
router.patch('/fcm-token', verifyUserToken, async (req, res, next) => {
  try {
    const { token } = req.body;
    await User.findByIdAndUpdate(req.user._id, { fcmToken: token });
    res.json({ success: true, message: 'FCM token saved' });
  } catch (error) {
    next(error);
  }
});

// ─── UPLOAD PROFILE PHOTO ─────────────────────────────────────────────────────
// POST /api/auth/profile-photo
const { uploadPublic } = require('../services/cloudinaryService');

router.post('/profile-photo', verifyUserToken, uploadPublic.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No photo provided for upload' });
    }

    const photoUrl = req.file.path || req.file.secure_url || req.file.url;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePhotoUrl: photoUrl },
      { new: true }
    ).select('-passwordHash');

    res.json({
      success: true,
      message: 'Profile photo updated successfully',
      data: { photoUrl, user },
    });
  } catch (error) {
    console.error('Profile photo upload error:', error);
    next(error);
  }
});

module.exports = router;
