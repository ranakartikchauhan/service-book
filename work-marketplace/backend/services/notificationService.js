const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');
const User = require('../models/User');
const { sendPushNotification } = require('./fcmService');

/**
 * Checks if current time is within user's configured quiet hours
 */
function isQuietHours(startStr, endStr) {
  if (!startStr || !endStr) return false;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = startStr.split(':').map(Number);
  const [endH, endM] = endStr.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }
  // Quiet hours spans across midnight (e.g. 22:00 to 07:00)
  return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
}

/**
 * Dispatch a notification to a user with preference and quiet-hours checking
 */
async function dispatchNotification({
  userId,
  category = 'system',
  title,
  body,
  data = {},
  urgent = false,
}) {
  try {
    // 1. Get or create notification preferences
    let pref = await NotificationPreference.findOne({ userId });
    if (!pref) {
      pref = await NotificationPreference.create({ userId });
    }

    const categorySetting = pref.categories[category] || 'instant';

    // 2. Always create in-app notification record
    const notification = await Notification.create({
      userId,
      category,
      title,
      body,
      data,
      urgent,
      channel: categorySetting !== 'off' ? 'push' : 'in_app',
      status: 'sent',
    });

    // 3. If category is off or daily digest, skip immediate push
    if (categorySetting === 'off' || categorySetting === 'daily_digest') {
      return notification;
    }

    // 4. Check quiet hours (unless marked urgent)
    if (!urgent && pref.quietHours?.enabled) {
      if (isQuietHours(pref.quietHours.start, pref.quietHours.end)) {
        return notification;
      }
    }

    // 5. Send FCM Push Notification if user has token
    const user = await User.findById(userId);
    if (user && user.fcmToken) {
      await sendPushNotification(user.fcmToken, {
        title,
        body,
        data: {
          ...data,
          notificationId: notification._id.toString(),
          category,
        },
      });
    }

    return notification;
  } catch (err) {
    console.error('Error dispatching notification:', err);
  }
}

module.exports = {
  dispatchNotification,
  isQuietHours,
};
