const mongoose = require('mongoose');

const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    categories: {
      newMatchingJob: {
        type: String,
        enum: ['instant', 'daily_digest', 'off'],
        default: 'instant',
      },
      applicationUpdates: {
        type: String,
        enum: ['instant', 'off'],
        default: 'instant',
      },
      messages: {
        type: String,
        enum: ['instant', 'off'],
        default: 'instant',
      },
      paymentUpdates: {
        type: String,
        enum: ['instant', 'off'],
        default: 'instant',
      },
      jobReminders: {
        type: String,
        enum: ['instant', 'off'],
        default: 'instant',
      },
      noApplicantsNudge: {
        type: String,
        enum: ['instant', 'off'],
        default: 'instant',
      },
      subscriptionBilling: {
        type: String,
        enum: ['instant', 'off'],
        default: 'instant',
      },
      marketing: {
        type: String,
        enum: ['instant', 'weekly_digest', 'off'],
        default: 'off',
      },
    },
    quietHours: {
      enabled: { type: Boolean, default: false },
      start: { type: String, default: '22:00' }, // 10 PM
      end: { type: String, default: '07:00' },   // 7 AM
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('NotificationPreference', notificationPreferenceSchema);
