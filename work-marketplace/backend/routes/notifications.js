const express = require('express');
const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');
const User = require('../models/User');
const verifyUserToken = require('../middleware/verifyUserToken');

const router = express.Router();
router.use(verifyUserToken);

// ─── GET IN-APP NOTIFICATIONS ────────────────────────────────────────────────
// GET /api/notifications?page=&limit=
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments({ userId: req.user._id }),
      Notification.countDocuments({ userId: req.user._id, readAt: null }),
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        total,
        unreadCount,
        page: parseInt(page),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── MARK SINGLE NOTIFICATION AS READ ─────────────────────────────────────────
// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { readAt: new Date(), status: 'read' },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, data: { notification } });
  } catch (error) {
    next(error);
  }
});

// ─── MARK ALL NOTIFICATIONS AS READ ───────────────────────────────────────────
// PATCH /api/notifications/read-all
router.patch('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, readAt: null },
      { readAt: new Date(), status: 'read' }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

// ─── GET NOTIFICATION PREFERENCES ─────────────────────────────────────────────
// GET /api/notifications/preferences
router.get('/preferences', async (req, res, next) => {
  try {
    let pref = await NotificationPreference.findOne({ userId: req.user._id });
    if (!pref) {
      pref = await NotificationPreference.create({ userId: req.user._id });
    }
    res.json({ success: true, data: { preferences: pref } });
  } catch (error) {
    next(error);
  }
});

// ─── UPDATE NOTIFICATION PREFERENCES ──────────────────────────────────────────
// PUT /api/notifications/preferences
router.put('/preferences', async (req, res, next) => {
  try {
    const { categories, quietHours } = req.body;
    const updates = {};
    if (categories) updates.categories = categories;
    if (quietHours) updates.quietHours = quietHours;

    const pref = await NotificationPreference.findOneAndUpdate(
      { userId: req.user._id },
      updates,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, message: 'Preferences updated', data: { preferences: pref } });
  } catch (error) {
    next(error);
  }
});

// ─── REGISTER FCM DEVICE TOKEN ────────────────────────────────────────────────
// POST /api/notifications/register-device
router.post('/register-device', async (req, res, next) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) {
      return res.status(400).json({ success: false, message: 'fcmToken is required' });
    }

    await User.findByIdAndUpdate(req.user._id, { fcmToken });
    res.json({ success: true, message: 'Device token registered' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
