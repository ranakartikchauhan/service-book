const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        'newMatchingJob',
        'applicationUpdates',
        'messages',
        'paymentUpdates',
        'jobReminders',
        'noApplicantsNudge',
        'subscriptionBilling',
        'marketing',
        'safety',
        'system',
      ],
      default: 'system',
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    channel: {
      type: String,
      enum: ['push', 'in_app', 'sms'],
      default: 'in_app',
    },
    status: {
      type: String,
      enum: ['queued', 'sent', 'failed', 'read'],
      default: 'sent',
    },
    urgent: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
